package edu.duke.bookpublishing.sales.parser;

import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class IngramCsvParser implements ImportParser<IngramCsvEntry> {

  @Override
  public boolean supports(String contentType, String filename) {
    String lower = filename.toLowerCase();
    return lower.endsWith(".csv") || "text/csv".equalsIgnoreCase(contentType);
  }

  @Override
  public ParsedBatch<IngramCsvEntry> parse(MultipartFile file) {
    List<IngramCsvEntry> records = new ArrayList<>();
    List<ParsingError> errors = new ArrayList<>();

    try (Reader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {

      CsvToBean<IngramCsvEntry> csvToBean =
          new CsvToBeanBuilder<IngramCsvEntry>(reader)
              .withType(IngramCsvEntry.class)
              .withIgnoreLeadingWhiteSpace(true)
              .withThrowExceptions(false)
              .build();

      records = csvToBean.parse();

      csvToBean
          .getCapturedExceptions()
          .forEach(
              ex -> {
                long lineNumber = ex.getLineNumber();
                String[] rawLine = ex.getLine();
                String message = ex.getMessage();
                errors.add(new ParsingError(lineNumber, rawLine, message));
              });

      return new ParsedBatch<IngramCsvEntry>(LocalDateTime.now(), records, errors);

    } catch (IOException e) {
      errors.add(new ParsingError(-1, null, "Failed to read file: " + e.getMessage()));
      return new ParsedBatch<IngramCsvEntry>(LocalDateTime.now(), List.of(), errors);
    }
  }
}
