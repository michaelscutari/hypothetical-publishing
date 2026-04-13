package edu.duke.bookpublishing.sales.parser;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class BackerkitXlsxParserTest {

  @Test
  void parseValidWorkbookBuildsRows() throws Exception {
    byte[] bytes;
    try (XSSFWorkbook workbook = new XSSFWorkbook();
        ByteArrayOutputStream output = new ByteArrayOutputStream()) {
      Sheet sheet = workbook.createSheet("Backerkit");
      Row header = sheet.createRow(0);
      header.createCell(0).setCellValue("Pledge Status");
      header.createCell(1).setCellValue("Order Placed");
      header.createCell(2).setCellValue("item1");
      header.createCell(3).setCellValue("qty1");
      header.createCell(4).setCellValue("price1");
      header.createCell(5).setCellValue("item2");
      header.createCell(6).setCellValue("qty2");

      Row row1 = sheet.createRow(1);
      row1.createCell(0).setCellValue("imported");
      row1.createCell(1).setCellValue("12/08/25");
      row1.createCell(2).setCellValue("ebook-the-hobbit");
      row1.createCell(3).setCellValue(1);
      row1.createCell(5).setCellValue("ebook-the-two-towers");
      row1.createCell(6).setCellValue(2);

      Row row2 = sheet.createRow(2);
      row2.createCell(0).setCellValue("failed");
      row2.createCell(1).setCellValue("12/08/25");
      row2.createCell(2).setCellValue("ebook-the-hobbit");
      row2.createCell(3).setCellValue(3);

      workbook.write(output);
      bytes = output.toByteArray();
    }

    MockMultipartFile file =
        new MockMultipartFile(
            "file",
            "backerkit.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            bytes);

    BackerkitXlsxParser parser = new BackerkitXlsxParser();
    ParsedBatch<BackerkitXlsxEntry> result = parser.parse(file);

    assertThat(result.parsingErrors()).isEmpty();
    assertThat(result.records()).hasSize(2);
    assertThat(result.records().get(0).successfulPledge()).isTrue();
    assertThat(result.records().get(0).saleMonth()).isEqualTo(12);
    assertThat(result.records().get(0).saleYear()).isEqualTo(2025);
    assertThat(result.records().get(0).requestedItems()).hasSize(2);
    assertThat(result.records().get(1).successfulPledge()).isFalse();
  }

  @Test
  void parseWorkbookWithMultipleSheetsReturnsError() throws Exception {
    byte[] bytes;
    try (XSSFWorkbook workbook = new XSSFWorkbook();
        ByteArrayOutputStream output = new ByteArrayOutputStream()) {
      workbook.createSheet("Backerkit");
      workbook.createSheet("Other");
      workbook.write(output);
      bytes = output.toByteArray();
    }

    MockMultipartFile file =
        new MockMultipartFile(
            "file",
            "backerkit.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            bytes);

    BackerkitXlsxParser parser = new BackerkitXlsxParser();
    ParsedBatch<BackerkitXlsxEntry> result = parser.parse(file);

    assertThat(result.records()).isEmpty();
    assertThat(result.parsingErrors()).hasSize(1);
    assertThat(result.parsingErrors().get(0).errorMessage())
        .isEqualTo("import.backerkit.workbook.mustHaveSingleSheet");
  }

  @Test
  void parseSuccessfulRowWithNoItemsAddsWarningNotError() throws Exception {
    byte[] bytes;
    try (XSSFWorkbook workbook = new XSSFWorkbook();
        ByteArrayOutputStream output = new ByteArrayOutputStream()) {
      Sheet sheet = workbook.createSheet("Backerkit");
      Row header = sheet.createRow(0);
      header.createCell(0).setCellValue("Pledge Status");
      header.createCell(1).setCellValue("Order Placed");
      header.createCell(2).setCellValue("item1");
      header.createCell(3).setCellValue("qty1");

      Row row = sheet.createRow(1);
      row.createCell(0).setCellValue("imported");
      row.createCell(1).setCellValue("12/08/25");

      workbook.write(output);
      bytes = output.toByteArray();
    }

    MockMultipartFile file =
        new MockMultipartFile(
            "file",
            "backerkit.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            bytes);

    BackerkitXlsxParser parser = new BackerkitXlsxParser();
    ParsedBatch<BackerkitXlsxEntry> result = parser.parse(file);

    assertThat(result.parsingErrors()).isEmpty();
    assertThat(result.parsingWarnings()).hasSize(1);
    assertThat(result.parsingWarnings().get(0).errorMessage())
        .isEqualTo("import.backerkit.row.noItems");
    assertThat(result.records()).hasSize(1);
    assertThat(result.records().get(0).requestedItems()).isEmpty();
  }
}
