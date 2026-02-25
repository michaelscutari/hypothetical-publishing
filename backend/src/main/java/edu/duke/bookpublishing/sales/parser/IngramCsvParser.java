package edu.duke.bookpublishing.sales.parser;

import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringReader;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
@RequiredArgsConstructor
public class IngramCsvParser implements ImportParser<IngramCsvEntry> {

  private final Validator validator;

  @Override
  public boolean supports(String contentType, String filename) {
    String lower = filename.toLowerCase();
    return lower.endsWith(".csv") || "text/csv".equalsIgnoreCase(contentType);
  }

  @Override
  public ParsedBatch<IngramCsvEntry> parse(MultipartFile file) {
    List<IngramCsvEntry> records = new ArrayList<>();
    List<ParsingError> errors = new ArrayList<>();

    try (BufferedReader bufferedReader =
        new BufferedReader(new InputStreamReader(file.getInputStream()))) {
      List<String> lines = readAllLines(bufferedReader);
      stripBomIfPresent(lines);
      Reader reader = buildCsvReaderExcludingTrailingRows(lines, 2);

      CsvToBean<IngramCsvEntry> csvToBean = buildCsvToBean(reader);
      records = csvToBean.parse();

      collectParseErrors(csvToBean, errors);
      validateRecords(records, errors);

      return new ParsedBatch<IngramCsvEntry>(LocalDateTime.now(), records, errors);

    } catch (IOException e) {
      errors.add(new ParsingError(-1, null, "Failed to read file: " + e.getMessage()));
      return new ParsedBatch<IngramCsvEntry>(LocalDateTime.now(), List.of(), errors);
    }
  }

  private static List<String> readAllLines(BufferedReader bufferedReader) throws IOException {
    List<String> lines = new ArrayList<>();
    String line;
    while ((line = bufferedReader.readLine()) != null) {
      lines.add(line);
    }
    return lines;
  }

  private static void stripBomIfPresent(List<String> lines) {
    if (lines.isEmpty()) {
      return;
    }
    String firstLine = lines.get(0);
    if (!firstLine.isEmpty() && firstLine.charAt(0) == '\uFEFF') {
      lines.set(0, firstLine.substring(1));
    }
  }

  private static Reader buildCsvReaderExcludingTrailingRows(List<String> lines, int rowsToSkip) {
    int endIndex = Math.max(0, lines.size() - Math.max(0, rowsToSkip));
    StringBuilder csvBuilder = new StringBuilder();
    for (int i = 0; i < endIndex; i++) {
      if (i > 0) {
        csvBuilder.append('\n');
      }
      csvBuilder.append(lines.get(i));
    }
    return new StringReader(csvBuilder.toString());
  }

  private static CsvToBean<IngramCsvEntry> buildCsvToBean(Reader reader) {
    return new CsvToBeanBuilder<IngramCsvEntry>(reader)
        .withType(IngramCsvEntry.class)
        .withIgnoreLeadingWhiteSpace(true)
        .withThrowExceptions(false)
        .build();
  }

  private static void collectParseErrors(
      CsvToBean<IngramCsvEntry> csvToBean, List<ParsingError> errors) {
    csvToBean
        .getCapturedExceptions()
        .forEach(
            ex -> {
              long lineNumber = ex.getLineNumber() - 1;
              String[] rawLine = ex.getLine();
              String message = ex.getMessage();
              errors.add(new ParsingError(lineNumber, rawLine, message));
            });
  }

  private void validateRecords(List<IngramCsvEntry> records, List<ParsingError> errors) {
    if (records.isEmpty()) {
      return;
    }
    int rowNum = 0;
    for (IngramCsvEntry record : records) {
      rowNum++;
      Set<ConstraintViolation<IngramCsvEntry>> violations = validator.validate(record);
      if (!violations.isEmpty()) {
        for (ConstraintViolation<IngramCsvEntry> violation : violations) {
          errors.add(new ParsingError(rowNum, null, violation.getMessage()));
        }
      }
    }
  }
}
