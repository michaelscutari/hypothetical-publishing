package edu.duke.bookpublishing.sales.parser;

import edu.duke.bookpublishing.sales.enums.Currency;
import edu.duke.bookpublishing.sales.enums.SaleFormat;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
@Slf4j
public class AmazonXlsxParser implements ImportParser<AmazonXlsxEntry> {

  private static final String SHEET_PAPERBACK = "Paperback Royalty";
  private static final String SHEET_HARDCOVER = "Hardcover Royalty";
  private static final String SHEET_EBOOK = "eBook Royalty";
  private static final String SHEET_KENP = "KENP";
  private static final String SHEET_AUDIOBOOK = "Audiobook Royalty";

  private static final Set<String> SUPPORTED_SHEETS =
      Set.of(SHEET_PAPERBACK, SHEET_HARDCOVER, SHEET_EBOOK, SHEET_KENP);

  private static final DateTimeFormatter SALES_PERIOD_FORMATTER =
      DateTimeFormatter.ofPattern("MMMM uuuu", Locale.ENGLISH);

  private final DataFormatter dataFormatter = new DataFormatter(Locale.ENGLISH);

  @Override
  public boolean supports(String contentType, String filename) {
    String lower = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
    return lower.endsWith(".xlsx")
        || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            .equalsIgnoreCase(contentType);
  }

  @Override
  public ParsedBatch<AmazonXlsxEntry> parse(MultipartFile file) {
    List<AmazonXlsxEntry> records = new ArrayList<>();
    List<ParsingError> errors = new ArrayList<>();
    List<ParsingError> warnings = new ArrayList<>();

    try (InputStream inputStream = file.getInputStream();
        Workbook workbook = new XSSFWorkbook(inputStream)) {

      boolean hasSupportedSheet = false;
      for (String sheetName : SUPPORTED_SHEETS) {
        if (workbook.getSheet(sheetName) != null) {
          hasSupportedSheet = true;
          parseSupportedSheet(workbook.getSheet(sheetName), records, errors, warnings);
        }
      }

      if (!hasSupportedSheet) {
        errors.add(new ParsingError(0, null, "import.amazon.supportedSheetMissing"));
      }

      Sheet audiobookSheet = workbook.getSheet(SHEET_AUDIOBOOK);
      if (audiobookSheet != null) {
        maybeAddAudiobookWarning(audiobookSheet, warnings);
      }

      return new ParsedBatch<>(LocalDateTime.now(), records, errors, warnings);
    } catch (IOException e) {
      log.warn("Failed to read Amazon XLSX", e);
      errors.add(new ParsingError(0, null, "import.file.readFailed"));
      return new ParsedBatch<>(LocalDateTime.now(), List.of(), errors, warnings);
    } catch (RuntimeException e) {
      log.warn("Invalid XLSX format", e);
      errors.add(new ParsingError(0, null, "import.file.invalidXlsx"));
      return new ParsedBatch<>(LocalDateTime.now(), List.of(), errors, warnings);
    }
  }

  private void parseSupportedSheet(
      Sheet sheet,
      List<AmazonXlsxEntry> records,
      List<ParsingError> errors,
      List<ParsingError> warnings) {

    SalesPeriod salesPeriod = parseSalesPeriod(sheet, errors);
    if (salesPeriod == null) {
      return;
    }

    Row headerRow = sheet.getRow(1);
    if (headerRow == null) {
      errors.add(new ParsingError(2, null, "import.amazon.header.missing", sheet.getSheetName()));
      return;
    }

    Map<String, Integer> columns = resolveColumns(headerRow);
    Set<String> requiredHeaders = requiredHeadersFor(sheet.getSheetName());
    for (String requiredHeader : requiredHeaders) {
      if (!columns.containsKey(normalizeHeader(requiredHeader))) {
        errors.add(
            new ParsingError(
                2,
                null,
                "import.amazon.header.missingColumn:" + requiredHeader,
                sheet.getSheetName()));
      }
    }
    if (errors.stream()
        .anyMatch(
            error -> sheet.getSheetName().equals(error.sheetName()) && error.rowNumber() == 2)) {
      return;
    }

    for (int rowIdx = 2; rowIdx <= sheet.getLastRowNum(); rowIdx++) {
      Row row = sheet.getRow(rowIdx);
      if (isBlankRow(row)) {
        continue;
      }
      parseDataRow(sheet, row, columns, salesPeriod, records, errors, warnings);
    }
  }

  private void parseDataRow(
      Sheet sheet,
      Row row,
      Map<String, Integer> columns,
      SalesPeriod salesPeriod,
      List<AmazonXlsxEntry> records,
      List<ParsingError> errors,
      List<ParsingError> warnings) {
    String sheetName = sheet.getSheetName();
    int rowNumber = row.getRowNum() + 1;

    if (SHEET_PAPERBACK.equals(sheetName) || SHEET_HARDCOVER.equals(sheetName)) {
      String isbn = readString(row, columns, "ISBN");
      Integer unitsSold = readInteger(row, columns, "Units Sold", errors, rowNumber, sheetName);
      Integer unitsRefunded =
          readInteger(row, columns, "Units Refunded", errors, rowNumber, sheetName);
      Currency currency = readCurrency(row, columns, "Currency", errors, rowNumber, sheetName);
      BigDecimal royalty = readDecimal(row, columns, "Royalty", errors, rowNumber, sheetName);

      if (unitsRefunded != null && unitsRefunded != 0) {
        errors.add(new ParsingError(rowNumber, null, "returnedQty.mustBeZero", sheetName));
      }

      if (isbn == null || isbn.isBlank()) {
        errors.add(new ParsingError(rowNumber, null, "isbn.isRequired", sheetName));
      }

      if (unitsSold != null
          && unitsSold > 0
          && unitsRefunded != null
          && unitsRefunded == 0
          && currency != null
          && royalty != null
          && isbn != null
          && !isbn.isBlank()) {
        records.add(
            AmazonXlsxEntry.builder()
                .sheetName(sheetName)
                .sourceRowNumber(rowNumber)
                .saleMonth(salesPeriod.month())
                .saleYear(salesPeriod.year())
                .format(SaleFormat.PRINT)
                .isbn(isbn)
                .marketplace(readString(row, columns, "Marketplace"))
                .quantitySold(unitsSold)
                .currency(currency)
                .royalty(royalty)
                .build());
      }
      return;
    }

    if (SHEET_EBOOK.equals(sheetName)) {
      String asin = readString(row, columns, "ASIN");
      Integer unitsSold = readInteger(row, columns, "Units Sold", errors, rowNumber, sheetName);
      Integer unitsRefunded =
          readInteger(row, columns, "Units Refunded", errors, rowNumber, sheetName);
      Integer netUnitsSold =
          readInteger(row, columns, "Net Units Sold", errors, rowNumber, sheetName);
      Currency currency = readCurrency(row, columns, "Currency", errors, rowNumber, sheetName);
      BigDecimal royalty = readDecimal(row, columns, "Royalty", errors, rowNumber, sheetName);

      if (unitsRefunded != null && unitsRefunded != 0) {
        errors.add(new ParsingError(rowNumber, null, "returnedQty.mustBeZero", sheetName));
      }
      if (unitsSold != null && netUnitsSold != null && !unitsSold.equals(netUnitsSold)) {
        errors.add(new ParsingError(rowNumber, null, "grossQty.mustEqual.netQty", sheetName));
      }
      if (asin == null || asin.isBlank()) {
        errors.add(new ParsingError(rowNumber, null, "asin.isRequired", sheetName));
      }

      if (asin != null
          && !asin.isBlank()
          && unitsSold != null
          && unitsSold > 0
          && unitsRefunded != null
          && unitsRefunded == 0
          && netUnitsSold != null
          && unitsSold.equals(netUnitsSold)
          && currency != null
          && royalty != null) {
        records.add(
            AmazonXlsxEntry.builder()
                .sheetName(sheetName)
                .sourceRowNumber(rowNumber)
                .saleMonth(salesPeriod.month())
                .saleYear(salesPeriod.year())
                .format(SaleFormat.EBOOK)
                .asin(asin)
                .marketplace(readString(row, columns, "Marketplace"))
                .quantitySold(unitsSold)
                .currency(currency)
                .royalty(royalty)
                .build());
      }
      return;
    }

    if (SHEET_KENP.equals(sheetName)) {
      String ebookAsin = readString(row, columns, "eBook ASIN");
      if ("N/A".equalsIgnoreCase(ebookAsin)) {
        warnings.add(
            new ParsingError(rowNumber, null, "import.amazon.kenp.unsupportedAsin", sheetName));
        return;
      }

      Integer kenp =
          readInteger(
              row, columns, "Kindle Edition Normalized Pages (KENP)", errors, rowNumber, sheetName);
      Currency currency = readCurrency(row, columns, "Currency", errors, rowNumber, sheetName);
      BigDecimal royalty = readDecimal(row, columns, "Royalty", errors, rowNumber, sheetName);

      if (ebookAsin == null || ebookAsin.isBlank()) {
        errors.add(new ParsingError(rowNumber, null, "asin.isRequired", sheetName));
      }

      if (ebookAsin != null
          && !ebookAsin.isBlank()
          && kenp != null
          && kenp > 0
          && currency != null
          && royalty != null) {
        records.add(
            AmazonXlsxEntry.builder()
                .sheetName(sheetName)
                .sourceRowNumber(rowNumber)
                .saleMonth(salesPeriod.month())
                .saleYear(salesPeriod.year())
                .format(SaleFormat.KINDLE_UNLIMITED)
                .asin(ebookAsin)
                .marketplace(readString(row, columns, "Marketplace"))
                .kenp(kenp)
                .currency(currency)
                .royalty(royalty)
                .build());
      }
    }
  }

  private void maybeAddAudiobookWarning(Sheet sheet, List<ParsingError> warnings) {
    for (int rowIdx = 2; rowIdx <= sheet.getLastRowNum(); rowIdx++) {
      Row row = sheet.getRow(rowIdx);
      if (!isBlankRow(row)) {
        warnings.add(
            new ParsingError(
                rowIdx + 1, null, "import.amazon.audiobook.notSupported", sheet.getSheetName()));
        return;
      }
    }
  }

  private SalesPeriod parseSalesPeriod(Sheet sheet, List<ParsingError> errors) {
    Row periodRow = sheet.getRow(0);
    if (periodRow == null) {
      errors.add(
          new ParsingError(1, null, "import.amazon.salesPeriod.missing", sheet.getSheetName()));
      return null;
    }

    String label = getCellText(periodRow.getCell(0));
    String periodValue = getCellText(periodRow.getCell(1));
    if (!"sales period".equalsIgnoreCase(normalizeHeader(label)) || periodValue.isBlank()) {
      errors.add(
          new ParsingError(1, null, "import.amazon.salesPeriod.invalid", sheet.getSheetName()));
      return null;
    }

    try {
      LocalDateTime parsed =
          LocalDateTime.parse(
              periodValue + " 00:00",
              DateTimeFormatter.ofPattern("MMMM uuuu HH:mm", Locale.ENGLISH));
      return new SalesPeriod(parsed.getMonthValue(), parsed.getYear());
    } catch (DateTimeParseException ignored) {
      try {
        var parsedMonth = java.time.YearMonth.parse(periodValue, SALES_PERIOD_FORMATTER);
        return new SalesPeriod(parsedMonth.getMonthValue(), parsedMonth.getYear());
      } catch (DateTimeParseException ex) {
        errors.add(
            new ParsingError(1, null, "import.amazon.salesPeriod.invalid", sheet.getSheetName()));
        return null;
      }
    }
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

  private Set<String> requiredHeadersFor(String sheetName) {
    if (SHEET_PAPERBACK.equals(sheetName) || SHEET_HARDCOVER.equals(sheetName)) {
      return Set.of(
          "Title",
          "Author",
          "ISBN",
          "Marketplace",
          "Units Sold",
          "Units Refunded",
          "Currency",
          "Royalty");
    }
    if (SHEET_EBOOK.equals(sheetName)) {
      return Set.of(
          "Title",
          "Author",
          "ASIN",
          "Marketplace",
          "Units Sold",
          "Units Refunded",
          "Net Units Sold",
          "Currency",
          "Royalty");
    }
    return Set.of(
        "Title",
        "Author",
        "eBook ASIN",
        "Marketplace",
        "Kindle Edition Normalized Pages (KENP)",
        "Currency",
        "Royalty");
  }

  private String readString(Row row, Map<String, Integer> columns, String header) {
    Integer idx = columns.get(normalizeHeader(header));
    if (idx == null) {
      return "";
    }
    return getCellText(row.getCell(idx));
  }

  private Integer readInteger(
      Row row,
      Map<String, Integer> columns,
      String header,
      List<ParsingError> errors,
      int rowNumber,
      String sheetName) {
    Integer idx = columns.get(normalizeHeader(header));
    if (idx == null) {
      return null;
    }

    Cell cell = row.getCell(idx);
    String value = getCellText(cell);
    if (value.isBlank()) {
      errors.add(
          new ParsingError(rowNumber, null, "import.amazon.value.required:" + header, sheetName));
      return null;
    }

    try {
      if (cell != null && cell.getCellType() == CellType.NUMERIC) {
        double numericValue = cell.getNumericCellValue();
        if (numericValue != Math.rint(numericValue)) {
          throw new NumberFormatException("not an integer");
        }
        return (int) numericValue;
      }
      return parseIntegerText(value);
    } catch (RuntimeException ex) {
      errors.add(
          new ParsingError(
              rowNumber, null, "import.amazon.value.invalidInteger:" + header, sheetName));
      return null;
    }
  }

  private BigDecimal readDecimal(
      Row row,
      Map<String, Integer> columns,
      String header,
      List<ParsingError> errors,
      int rowNumber,
      String sheetName) {
    Integer idx = columns.get(normalizeHeader(header));
    if (idx == null) {
      return null;
    }

    Cell cell = row.getCell(idx);
    String value = getCellText(cell);
    if (value.isBlank()) {
      errors.add(
          new ParsingError(rowNumber, null, "import.amazon.value.required:" + header, sheetName));
      return null;
    }

    try {
      if (cell != null && cell.getCellType() == CellType.NUMERIC) {
        return BigDecimal.valueOf(cell.getNumericCellValue());
      }
      return parseDecimalText(value);
    } catch (RuntimeException ex) {
      errors.add(
          new ParsingError(
              rowNumber, null, "import.amazon.value.invalidDecimal:" + header, sheetName));
      return null;
    }
  }

  private Integer parseIntegerText(String value) {
    String normalized = normalizeNumericText(value);

    if (normalized.matches("[+-]?\\d+")) {
      return Integer.parseInt(normalized);
    }
    if (normalized.matches("[+-]?\\d{1,3}(,\\d{3})+")) {
      return Integer.parseInt(normalized.replace(",", ""));
    }
    if (normalized.matches("[+-]?\\d{1,3}(\\.\\d{3})+")) {
      return Integer.parseInt(normalized.replace(".", ""));
    }

    throw new NumberFormatException("invalid integer format");
  }

  private BigDecimal parseDecimalText(String value) {
    String normalized = normalizeNumericText(value);

    if (normalized.matches("[+-]?\\d{1,3}(,\\d{3})+(\\.\\d+)?")) {
      return new BigDecimal(normalized.replace(",", ""));
    }
    if (normalized.matches("[+-]?\\d{1,3}(\\.\\d{3})+,\\d+")) {
      return new BigDecimal(normalized.replace(".", "").replace(',', '.'));
    }
    if (normalized.matches("[+-]?\\d+,\\d+")) {
      return new BigDecimal(normalized.replace(',', '.'));
    }
    if (normalized.matches("[+-]?\\d{1,3}(\\.\\d{3}){2,}")) {
      return new BigDecimal(normalized.replace(".", ""));
    }
    if (normalized.matches("[+-]?\\d+(\\.\\d+)?")) {
      return new BigDecimal(normalized);
    }

    throw new NumberFormatException("invalid decimal format");
  }

  private String normalizeNumericText(String value) {
    return value.replaceAll("[\\s\\u00A0\\u202F'\\u2019]", "");
  }

  private Currency readCurrency(
      Row row,
      Map<String, Integer> columns,
      String header,
      List<ParsingError> errors,
      int rowNumber,
      String sheetName) {
    String raw = readString(row, columns, header);
    if (raw.isBlank()) {
      errors.add(
          new ParsingError(rowNumber, null, "import.amazon.value.required:" + header, sheetName));
      return null;
    }
    try {
      return Currency.valueOf(raw.trim().toUpperCase(Locale.ROOT));
    } catch (IllegalArgumentException ex) {
      errors.add(
          new ParsingError(rowNumber, null, "import.amazon.value.invalidCurrency", sheetName));
      return null;
    }
  }

  private String getCellText(Cell cell) {
    if (cell == null) {
      return "";
    }
    return dataFormatter.formatCellValue(cell).trim();
  }

  private String normalizeHeader(String value) {
    if (value == null) {
      return "";
    }
    return value.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
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

  private record SalesPeriod(int month, int year) {}
}
