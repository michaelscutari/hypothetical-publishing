package edu.duke.bookpublishing.sales.parser;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class IngramCsvParserTest {

  private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

  @Test
  void parseValidIngramCsvBuildsEntries() {
    String csv =
        String.join(
            "\n",
            "ISBN,Title,Author,Format,Gross Qty,Returned Qty,Net Qty,Net Compensation,Sales Market",
            "9781234567897,Sample Book,\"Doe, John\",Paperback,10,0,10,25.50,US ONLINE",
            "9789876543210,Another Book,\"Smith, Jane\",Hardcover,5,0,5,12.00,US WHOLESALE",
            "Totals,,,,,,,",
            "End of Report,,,,,,,");

    MockMultipartFile file =
        new MockMultipartFile(
            "file", "ingram.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

    Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
    IngramCsvParser parser = new IngramCsvParser(validator);
    ParsedBatch<IngramCsvEntry> batch = parser.parse(file);

    assertThat(batch.parsingErrors()).isEmpty();
    assertThat(batch.records()).hasSize(2);

    IngramCsvEntry first = batch.records().get(0);
    assertThat(first.getIsbn()).isEqualTo("9781234567897");
    assertThat(first.getTitle()).isEqualTo("Sample Book");
    assertThat(first.getAuthor()).isEqualTo("Doe, John");
    assertThat(first.getFormat()).isEqualTo("Paperback");
    assertThat(first.getGrossQty()).isEqualTo(10L);
    assertThat(first.getReturnedQty()).isEqualTo(0L);
    assertThat(first.getNetQty()).isEqualTo(10L);
    assertThat(first.getNetCompensation()).isEqualByComparingTo(new BigDecimal("25.50"));
    assertThat(first.getSalesMarket()).isEqualTo("US ONLINE");

    IngramCsvEntry second = batch.records().get(1);
    assertThat(second.getIsbn()).isEqualTo("9789876543210");
    assertThat(second.getTitle()).isEqualTo("Another Book");
    assertThat(second.getAuthor()).isEqualTo("Smith, Jane");
    assertThat(second.getFormat()).isEqualTo("Hardcover");
    assertThat(second.getGrossQty()).isEqualTo(5L);
    assertThat(second.getReturnedQty()).isEqualTo(0L);
    assertThat(second.getNetQty()).isEqualTo(5L);
    assertThat(second.getNetCompensation()).isEqualByComparingTo(new BigDecimal("12.00"));
    assertThat(second.getSalesMarket()).isEqualTo("US WHOLESALE");
  }

  @Test
  void supportsCsvByExtensionOrContentType() {
    Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
    IngramCsvParser parser = new IngramCsvParser(validator);

    assertThat(parser.supports("text/csv", "sales.txt")).isTrue();
    assertThat(parser.supports("text/plain", "ingram.csv")).isTrue();
    assertThat(parser.supports("application/pdf", "report.pdf")).isFalse();
  }

  @Test
  void parseInvalidNumericValueCapturesParsingErrorWithLineInfo() {
    String csv =
        String.join(
            "\n",
            "ISBN,Title,Author,Format,Gross Qty,Returned Qty,Net Qty,Net Compensation,Sales Market",
            "9781234567897,Sample Book,\"Doe, John\",Paperback,NOT_A_NUMBER,0,10,25.50,US ONLINE",
            "Totals,,,,,,,",
            "End of Report,,,,,,,");

    MockMultipartFile file =
        new MockMultipartFile(
            "file", "ingram.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

    Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
    IngramCsvParser parser = new IngramCsvParser(validator);
    ParsedBatch<IngramCsvEntry> batch = parser.parse(file);

    assertThat(batch.records()).isEmpty();
    assertThat(batch.parsingErrors()).hasSize(1);

    ParsingError error = batch.parsingErrors().get(0);
    assertThat(error.rowNumber()).isEqualTo(2);
    assertThat(error.rawLine()).isNotNull();
    assertThat(String.join(",", error.rawLine())).contains("NOT_A_NUMBER");
    assertThat(error.errorMessage()).isNotBlank();
  }

  @Test
  void parsedEntryViolationsMatchJakartaConstraints() {
    String csv =
        String.join(
            "\n",
            "ISBN,Title,Author,Format,Gross Qty,Returned Qty,Net Qty,Net Compensation,Sales Market",
            "9781234567897,Sample Book,John Doe,Paperback,10,1,9,-1.00,us online",
            "Totals,,,,,,,",
            "End of Report,,,,,,,");

    MockMultipartFile file =
        new MockMultipartFile(
            "file", "ingram.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

    Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
    IngramCsvParser parser = new IngramCsvParser(validator);
    ParsedBatch<IngramCsvEntry> batch = parser.parse(file);

    assertThat(batch.parsingErrors()).isNotEmpty();
    assertThat(batch.records()).hasSize(1);

    Set<String> messages =
        batch.parsingErrors().stream().map(ParsingError::errorMessage).collect(Collectors.toSet());

    assertThat(messages)
        .contains("author.invalidFormat", "returnedQty.mustBeZero", "grossQty.mustEqual.netQty");

    assertThat(batch.parsingErrors())
        .allSatisfy(error -> assertThat(error.rowNumber()).isEqualTo(2));
  }

  @Test
  void parseStripsBomFromHeader() {
    String csv =
        "\uFEFFISBN,Title,Author,Format,Gross Qty,Returned Qty,Net Qty,Net Compensation,Sales Market\n"
            + "9780306406157,The Book,\"Doe, John\",Hardcover,1,0,1,10.00,US\n"
            + "Totals,,,,,,,\n"
            + "End of Report,,,,,,,\n";

    IngramCsvParser parser = new IngramCsvParser(validator);
    MockMultipartFile file =
        new MockMultipartFile(
            "file", "ingram.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

    ParsedBatch<IngramCsvEntry> batch = parser.parse(file);

    assertThat(batch.records()).hasSize(1);
    assertThat(batch.parsingErrors()).isEmpty();
  }

  @Test
  void parseSkipsTrailingRows() {
    String csv =
        "ISBN,Title,Author,Format,Gross Qty,Returned Qty,Net Qty,Net Compensation,Sales Market\n"
            + "9780306406157,The Book,\"Doe, John\",Hardcover,1,0,1,10.00,US\n"
            + "9780306406157,Another Book,\"Roe, Jane\",Paperback,2,0,2,20.00,US\n"
            + "9780306406157,Third Book,\"Poe, Jim\",Hardcover,3,0,3,30.00,US\n"
            + "Totals,,,,,,,\n"
            + "End of Report,,,,,,,\n";

    IngramCsvParser parser = new IngramCsvParser(validator);
    MockMultipartFile file =
        new MockMultipartFile(
            "file", "ingram.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

    ParsedBatch<IngramCsvEntry> batch = parser.parse(file);

    assertThat(batch.records()).hasSize(3);
    assertThat(batch.parsingErrors()).isEmpty();
  }
}
