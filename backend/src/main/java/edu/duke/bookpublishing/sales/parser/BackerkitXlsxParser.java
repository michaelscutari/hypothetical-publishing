package edu.duke.bookpublishing.sales.parser;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
@Slf4j
public class BackerkitXlsxParser implements ImportParser<BackerkitXlsxEntry> {

  private static final String HEADER_PLEDGE_STATUS = "Pledge Status";
  private static final String HEADER_ORDER_PLACED = "Order Placed";
  private static final Pattern ITEM_HEADER_PATTERN = Pattern.compile("^item(\\d+)$");
  private static final DateTimeFormatter ORDER_DATE_FORMATTER =
      DateTimeFormatter.ofPattern("MM/dd/uu", Locale.ENGLISH);

  private final DataFormatter dataFormatter = new DataFormatter(Locale.ENGLISH);

  @Override
  public boolean supports(String contentType, String filename) {
    String lower = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
    return lower.endsWith(".xlsx")
        || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            .equalsIgnoreCase(contentType);
  }

  @Override
  public ParsedBatch<BackerkitXlsxEntry> parse(MultipartFile file) {
    List<BackerkitXlsxEntry> records = new ArrayList<>();
    List<ParsingError> errors = new ArrayList<>();
    List<ParsingError> warnings = new ArrayList<>();

    try (InputStream inputStream = file.getInputStream();
        Workbook workbook = new XSSFWorkbook(inputStream)) {

      if (workbook.getNumberOfSheets() != 1) {
        errors.add(new ParsingError(0, null, "import.backerkit.workbook.mustHaveSingleSheet"));
        return new ParsedBatch<>(LocalDateTime.now(), List.of(), errors, warnings);
      }

      Sheet sheet = workbook.getSheetAt(0);
      Row headerRow = sheet.getRow(0);
      if (headerRow == null) {
        errors.add(
            new ParsingError(1, null, "import.backerkit.header.missing", sheet.getSheetName()));
        return new ParsedBatch<>(LocalDateTime.now(), List.of(), errors, warnings);
      }

      Map<String, Integer> columns = resolveColumns(headerRow);
      Integer pledgeStatusCol = columns.get(normalizeHeader(HEADER_PLEDGE_STATUS));
      Integer orderPlacedCol = columns.get(normalizeHeader(HEADER_ORDER_PLACED));

      if (pledgeStatusCol == null) {
        errors.add(
            new ParsingError(
                1,
                null,
                "import.backerkit.header.missingColumn:" + HEADER_PLEDGE_STATUS,
                sheet.getSheetName()));
      }
      if (orderPlacedCol == null) {
        errors.add(
            new ParsingError(
                1,
                null,
                "import.backerkit.header.missingColumn:" + HEADER_ORDER_PLACED,
                sheet.getSheetName()));
      }

      Map<Integer, Integer> itemColumns = resolveIndexedColumns(columns, ITEM_HEADER_PATTERN);
      if (itemColumns.isEmpty()) {
        errors.add(
            new ParsingError(
                1, null, "import.backerkit.header.itemColumnsMissing", sheet.getSheetName()));
      }
      Map<Integer, Integer> qtyColumns =
          resolveIndexedColumns(columns, Pattern.compile("^qty(\\d+)$"));
      for (Integer index : itemColumns.keySet()) {
        if (!qtyColumns.containsKey(index)) {
          errors.add(
              new ParsingError(
                  1,
                  null,
                  "import.backerkit.header.missingColumn:qty" + index,
                  sheet.getSheetName()));
        }
      }

      if (!errors.isEmpty()) {
        return new ParsedBatch<>(LocalDateTime.now(), List.of(), errors, warnings);
      }

      for (int rowIdx = 1; rowIdx <= sheet.getLastRowNum(); rowIdx++) {
        Row row = sheet.getRow(rowIdx);
        if (isBlankRow(row)) {
          continue;
        }
        parseRow(
            sheet,
            row,
            pledgeStatusCol,
            orderPlacedCol,
            itemColumns,
            qtyColumns,
            records,
            errors,
            warnings);
      }

      return new ParsedBatch<>(LocalDateTime.now(), records, errors, warnings);
    } catch (IOException e) {
      log.warn("Failed to read Backerkit XLSX", e);
      errors.add(new ParsingError(0, null, "import.file.readFailed"));
      return new ParsedBatch<>(LocalDateTime.now(), List.of(), errors, warnings);
    } catch (RuntimeException e) {
      log.warn("Invalid Backerkit XLSX format", e);
      errors.add(new ParsingError(0, null, "import.file.invalidXlsx"));
      return new ParsedBatch<>(LocalDateTime.now(), List.of(), errors, warnings);
    }
  }

  private void parseRow(
      Sheet sheet,
      Row row,
      int pledgeStatusCol,
      int orderPlacedCol,
      Map<Integer, Integer> itemColumns,
      Map<Integer, Integer> qtyColumns,
      List<BackerkitXlsxEntry> records,
      List<ParsingError> errors,
      List<ParsingError> warnings) {

    int rowNumber = row.getRowNum() + 1;
    String sheetName = sheet.getSheetName();
    String pledgeStatus = getCellText(row.getCell(pledgeStatusCol));

    if (pledgeStatus.isBlank()) {
      errors.add(
          new ParsingError(
              rowNumber, null, "import.backerkit.value.required:Pledge Status", sheetName));
      return;
    }

    if (!isSuccessfulPledge(pledgeStatus)) {
      records.add(
          BackerkitXlsxEntry.builder()
              .sheetName(sheetName)
              .sourceRowNumber(rowNumber)
              .successfulPledge(false)
              .requestedItems(List.of())
              .build());
      return;
    }

    LocalDate orderPlaced = parseOrderPlacedDate(row, orderPlacedCol, rowNumber, sheetName, errors);
    if (orderPlaced == null) {
      return;
    }

    List<BackerkitXlsxEntry.RequestedItem> items = new ArrayList<>();
    boolean hasAtLeastOneItemTag = false;

    for (Map.Entry<Integer, Integer> entry : itemColumns.entrySet()) {
      Integer idx = entry.getKey();
      String itemTag = getCellText(row.getCell(entry.getValue()));
      if (itemTag.isBlank()) {
        continue;
      }
      hasAtLeastOneItemTag = true;
      Integer qtyCol = qtyColumns.get(idx);
      Integer quantity =
          parseQuantity(row, qtyCol, rowNumber, sheetName, "qty" + idx, errors, itemTag);
      if (quantity == null) {
        continue;
      }
      items.add(
          BackerkitXlsxEntry.RequestedItem.builder().itemTag(itemTag).quantity(quantity).build());
    }

    if (!hasAtLeastOneItemTag) {
      warnings.add(new ParsingError(rowNumber, null, "import.backerkit.row.noItems", sheetName));
    }

    if (errors.stream()
        .anyMatch(err -> err.rowNumber() == rowNumber && sheetName.equals(err.sheetName()))) {
      return;
    }

    records.add(
        BackerkitXlsxEntry.builder()
            .sheetName(sheetName)
            .sourceRowNumber(rowNumber)
            .successfulPledge(true)
            .saleMonth(orderPlaced.getMonthValue())
            .saleYear(orderPlaced.getYear())
            .requestedItems(items)
            .build());
  }

  private LocalDate parseOrderPlacedDate(
      Row row, int column, int rowNumber, String sheetName, List<ParsingError> errors) {
    Cell cell = row.getCell(column);
    if (cell == null) {
      errors.add(
          new ParsingError(
              rowNumber, null, "import.backerkit.value.required:Order Placed", sheetName));
      return null;
    }

    if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
      return cell.getLocalDateTimeCellValue().toLocalDate();
    }

    String raw = getCellText(cell);
    if (raw.isBlank()) {
      errors.add(
          new ParsingError(
              rowNumber, null, "import.backerkit.value.required:Order Placed", sheetName));
      return null;
    }
    try {
      return LocalDate.parse(raw, ORDER_DATE_FORMATTER);
    } catch (DateTimeParseException ignored) {
      errors.add(
          new ParsingError(
              rowNumber, null, "import.backerkit.value.invalidDate:Order Placed", sheetName));
      return null;
    }
  }

  private Integer parseQuantity(
      Row row,
      Integer column,
      int rowNumber,
      String sheetName,
      String qtyHeader,
      List<ParsingError> errors,
      String itemTag) {
    if (column == null) {
      errors.add(
          new ParsingError(
              rowNumber, null, "import.backerkit.value.required:" + qtyHeader, sheetName));
      return null;
    }

    Cell cell = row.getCell(column);
    String raw = getCellText(cell);
    if (raw.isBlank()) {
      errors.add(
          new ParsingError(
              rowNumber,
              null,
              "import.backerkit.value.required:" + qtyHeader + "(" + itemTag + ")",
              sheetName));
      return null;
    }

    try {
      if (cell != null && cell.getCellType() == CellType.NUMERIC) {
        double value = cell.getNumericCellValue();
        if (value != Math.rint(value) || value < 0) {
          throw new NumberFormatException("invalid quantity");
        }
        return (int) value;
      }

      String normalized = raw.trim();
      if (!normalized.matches("\\d+")) {
        throw new NumberFormatException("invalid quantity");
      }
      return Integer.parseInt(normalized);
    } catch (RuntimeException ex) {
      errors.add(
          new ParsingError(
              rowNumber,
              null,
              "import.backerkit.value.invalidInteger:" + qtyHeader + "(" + itemTag + ")",
              sheetName));
      return null;
    }
  }

  private Map<Integer, Integer> resolveIndexedColumns(
      Map<String, Integer> columns, Pattern pattern) {
    Map<Integer, Integer> resolved = new HashMap<>();
    for (Map.Entry<String, Integer> entry : columns.entrySet()) {
      Matcher matcher = pattern.matcher(entry.getKey());
      if (!matcher.matches()) {
        continue;
      }
      int index = Integer.parseInt(matcher.group(1));
      resolved.put(index, entry.getValue());
    }
    return resolved;
  }

  private Map<String, Integer> resolveColumns(Row headerRow) {
    Map<String, Integer> columns = new HashMap<>();
    for (Cell cell : headerRow) {
      String header = normalizeHeader(getCellText(cell));
      if (!header.isBlank()) {
        columns.putIfAbsent(header, cell.getColumnIndex());
      }
    }
    return columns;
  }

  private String normalizeHeader(String value) {
    if (value == null) {
      return "";
    }
    return value.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
  }

  private boolean isSuccessfulPledge(String status) {
    String normalized = status.trim().toLowerCase(Locale.ROOT);
    return "collected".equals(normalized) || "imported".equals(normalized);
  }

  private String getCellText(Cell cell) {
    if (cell == null) {
      return "";
    }
    return dataFormatter.formatCellValue(cell).trim();
  }

  private boolean isBlankRow(Row row) {
    if (row == null) {
      return true;
    }
    for (Cell cell : row) {
      if (!getCellText(cell).isBlank()) {
        return false;
      }
    }
    return true;
  }
}
