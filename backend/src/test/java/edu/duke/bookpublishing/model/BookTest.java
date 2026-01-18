package edu.duke.bookpublishing.model;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class BookTest {

  @Test
  void normalizeFieldsTrimsWhitespace() {
    Book book =
        Book.builder()
            .title("  Dune  ")
            .author("  Herbert, Frank  ")
            .isbn13("9780441172719")
            .publicationDate(LocalDate.of(1965, 8, 1))
            .royaltyRate(new BigDecimal("0.15"))
            .build();

    book.normalizeFields();

    assertEquals("Dune", book.getTitle());
    assertEquals("Herbert, Frank", book.getAuthor());
  }

  @Test
  void normalizeFieldsStripsDashesIsbn13() {
    Book book =
        Book.builder()
            .title("Test Book")
            .author("Test Author")
            .isbn13("978-0-7432-7356-5")
            .publicationDate(LocalDate.of(2020, 1, 15))
            .royaltyRate(new BigDecimal("0.5"))
            .build();

    book.normalizeFields();

    assertEquals("9780743273565", book.getIsbn13());
  }

  @Test
  void normalizeFieldsStripsDashesIsbn10() {
    Book book =
        Book.builder()
            .title("Test Book")
            .author("Test Author")
            .isbn13("9780743273565")
            .isbn10("0-7432-7356-7")
            .publicationDate(LocalDate.of(2020, 1, 15))
            .royaltyRate(new BigDecimal("0.5"))
            .build();

    book.normalizeFields();

    assertEquals("0743273567", book.getIsbn10());
  }

  @Test
  void normalizeFieldsSetsDateToFirstOfMonth() {
    Book book =
        Book.builder()
            .title("Test Book")
            .author("Test Author")
            .isbn13("9780743273565")
            .publicationDate(LocalDate.of(2024, 1, 15))
            .royaltyRate(new BigDecimal("0.15"))
            .build();

    book.normalizeFields();

    assertEquals(LocalDate.of(2024, 1, 1), book.getPublicationDate());
  }
}
