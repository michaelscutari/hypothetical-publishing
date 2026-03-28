package edu.duke.bookpublishing.sales.parser;

import static org.assertj.core.api.Assertions.assertThat;

import edu.duke.bookpublishing.sales.enums.SaleFormat;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class AmazonXlsxParserTest {

  @Test
  void parseValidWorkbookBuildsRecordsAndWarnings() throws Exception {
    byte[] bytes;
    try (XSSFWorkbook workbook = new XSSFWorkbook();
        ByteArrayOutputStream output = new ByteArrayOutputStream()) {
      Sheet paperback = workbook.createSheet("Paperback Royalty");
      Row period = paperback.createRow(0);
      period.createCell(0).setCellValue("Sales Period");
      period.createCell(1).setCellValue("June 2025");
      Row header = paperback.createRow(1);
      header.createCell(0).setCellValue("Title");
      header.createCell(1).setCellValue("Author");
      header.createCell(2).setCellValue("ISBN");
      header.createCell(3).setCellValue("Marketplace");
      header.createCell(4).setCellValue("Units Sold");
      header.createCell(5).setCellValue("Units Refunded");
      header.createCell(6).setCellValue("Currency");
      header.createCell(7).setCellValue("Royalty");
      Row data = paperback.createRow(2);
      data.createCell(0).setCellValue("Book A");
      data.createCell(1).setCellValue("Doe, Jane");
      data.createCell(2).setCellValue("9780743273565");
      data.createCell(3).setCellValue("Amazon.com");
      data.createCell(4).setCellValue(10);
      data.createCell(5).setCellValue(0);
      data.createCell(6).setCellValue("USD");
      data.createCell(7).setCellValue(12.50);

      Sheet kenp = workbook.createSheet("KENP");
      Row kPeriod = kenp.createRow(0);
      kPeriod.createCell(0).setCellValue("Sales Period");
      kPeriod.createCell(1).setCellValue("June 2025");
      Row kHeader = kenp.createRow(1);
      kHeader.createCell(0).setCellValue("Title");
      kHeader.createCell(1).setCellValue("Author");
      kHeader.createCell(2).setCellValue("eBook ASIN");
      kHeader.createCell(3).setCellValue("Marketplace");
      kHeader.createCell(4).setCellValue("Kindle Edition Normalized Pages (KENP)");
      kHeader.createCell(5).setCellValue("Currency");
      kHeader.createCell(6).setCellValue("Royalty");
      Row kData = kenp.createRow(2);
      kData.createCell(0).setCellValue("Book B");
      kData.createCell(1).setCellValue("Doe, Jane");
      kData.createCell(2).setCellValue("N/A");
      kData.createCell(3).setCellValue("Amazon.com");
      kData.createCell(4).setCellValue(100);
      kData.createCell(5).setCellValue("USD");
      kData.createCell(6).setCellValue(1.25);

      Sheet audiobook = workbook.createSheet("Audiobook Royalty");
      Row aPeriod = audiobook.createRow(0);
      aPeriod.createCell(0).setCellValue("Sales Period");
      aPeriod.createCell(1).setCellValue("June 2025");
      Row aHeader = audiobook.createRow(1);
      aHeader.createCell(0).setCellValue("Title");
      Row aData = audiobook.createRow(2);
      aData.createCell(0).setCellValue("Unsupported Audio");

      workbook.write(output);
      bytes = output.toByteArray();
    }

    MockMultipartFile file =
        new MockMultipartFile(
            "file",
            "amazon.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            bytes);

    AmazonXlsxParser parser = new AmazonXlsxParser();
    ParsedBatch<AmazonXlsxEntry> result = parser.parse(file);

    assertThat(result.parsingErrors()).isEmpty();
    assertThat(result.records()).hasSize(1);
    assertThat(result.parsingWarnings()).hasSize(2);

    AmazonXlsxEntry entry = result.records().get(0);
    assertThat(entry.sheetName()).isEqualTo("Paperback Royalty");
    assertThat(entry.saleMonth()).isEqualTo(6);
    assertThat(entry.saleYear()).isEqualTo(2025);
    assertThat(entry.format()).isEqualTo(SaleFormat.PRINT);
    assertThat(entry.isbn()).isEqualTo("9780743273565");
    assertThat(entry.quantitySold()).isEqualTo(10);
    assertThat(entry.royalty()).isEqualByComparingTo(new BigDecimal("12.5"));
  }

  @Test
  void parseWorkbookWithoutSupportedSheetsReturnsError() throws Exception {
    byte[] bytes;
    try (XSSFWorkbook workbook = new XSSFWorkbook();
        ByteArrayOutputStream output = new ByteArrayOutputStream()) {
      workbook.createSheet("Summary");
      workbook.write(output);
      bytes = output.toByteArray();
    }

    MockMultipartFile file =
        new MockMultipartFile(
            "file",
            "amazon.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            bytes);

    AmazonXlsxParser parser = new AmazonXlsxParser();
    ParsedBatch<AmazonXlsxEntry> result = parser.parse(file);

    assertThat(result.records()).isEmpty();
    assertThat(result.parsingErrors()).hasSize(1);
    assertThat(result.parsingErrors().get(0).errorMessage())
        .isEqualTo("import.amazon.supportedSheetMissing");
  }

  @Test
  void parseWorkbookWithCommaDecimalRoyaltyParsesCorrectly() throws Exception {
    byte[] bytes;
    try (XSSFWorkbook workbook = new XSSFWorkbook();
        ByteArrayOutputStream output = new ByteArrayOutputStream()) {
      Sheet paperback = workbook.createSheet("Paperback Royalty");
      Row period = paperback.createRow(0);
      period.createCell(0).setCellValue("Sales Period");
      period.createCell(1).setCellValue("June 2025");
      Row header = paperback.createRow(1);
      header.createCell(0).setCellValue("Title");
      header.createCell(1).setCellValue("Author");
      header.createCell(2).setCellValue("ISBN");
      header.createCell(3).setCellValue("Marketplace");
      header.createCell(4).setCellValue("Units Sold");
      header.createCell(5).setCellValue("Units Refunded");
      header.createCell(6).setCellValue("Currency");
      header.createCell(7).setCellValue("Royalty");
      Row data = paperback.createRow(2);
      data.createCell(0).setCellValue("Book A");
      data.createCell(1).setCellValue("Doe, Jane");
      data.createCell(2).setCellValue("9780743273565");
      data.createCell(3).setCellValue("Amazon.com");
      data.createCell(4).setCellValue(3);
      data.createCell(5).setCellValue(0);
      data.createCell(6).setCellValue("USD");
      data.createCell(7).setCellValue("1,25");

      workbook.write(output);
      bytes = output.toByteArray();
    }

    MockMultipartFile file =
        new MockMultipartFile(
            "file",
            "amazon.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            bytes);

    AmazonXlsxParser parser = new AmazonXlsxParser();
    ParsedBatch<AmazonXlsxEntry> result = parser.parse(file);

    assertThat(result.parsingErrors()).isEmpty();
    assertThat(result.records()).hasSize(1);
    assertThat(result.records().get(0).royalty()).isEqualByComparingTo("1.25");
  }

  @Test
  void parseWorkbookWithCommaDecimalUnitsSoldReturnsInvalidIntegerError() throws Exception {
    byte[] bytes;
    try (XSSFWorkbook workbook = new XSSFWorkbook();
        ByteArrayOutputStream output = new ByteArrayOutputStream()) {
      Sheet paperback = workbook.createSheet("Paperback Royalty");
      Row period = paperback.createRow(0);
      period.createCell(0).setCellValue("Sales Period");
      period.createCell(1).setCellValue("June 2025");
      Row header = paperback.createRow(1);
      header.createCell(0).setCellValue("Title");
      header.createCell(1).setCellValue("Author");
      header.createCell(2).setCellValue("ISBN");
      header.createCell(3).setCellValue("Marketplace");
      header.createCell(4).setCellValue("Units Sold");
      header.createCell(5).setCellValue("Units Refunded");
      header.createCell(6).setCellValue("Currency");
      header.createCell(7).setCellValue("Royalty");
      Row data = paperback.createRow(2);
      data.createCell(0).setCellValue("Book A");
      data.createCell(1).setCellValue("Doe, Jane");
      data.createCell(2).setCellValue("9780743273565");
      data.createCell(3).setCellValue("Amazon.com");
      data.createCell(4).setCellValue("1,25");
      data.createCell(5).setCellValue(0);
      data.createCell(6).setCellValue("USD");
      data.createCell(7).setCellValue(2.25);

      workbook.write(output);
      bytes = output.toByteArray();
    }

    MockMultipartFile file =
        new MockMultipartFile(
            "file",
            "amazon.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            bytes);

    AmazonXlsxParser parser = new AmazonXlsxParser();
    ParsedBatch<AmazonXlsxEntry> result = parser.parse(file);

    assertThat(result.records()).isEmpty();
    assertThat(result.parsingErrors()).hasSize(1);
    assertThat(result.parsingErrors().get(0).errorMessage())
        .isEqualTo("import.amazon.value.invalidInteger:Units Sold");
  }
}
