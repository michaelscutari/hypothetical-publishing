package edu.duke.bookpublishing.books;

import static org.junit.jupiter.api.Assertions.*;

import edu.duke.bookpublishing.author.Author;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class BookTest {

  private Author buildAuthor(String name) {
    return Author.builder().id(1L).name(name).email("test@example.com").build();
  }

  @Test
  void normalizeFieldsTrimsWhitespace() {
    Book book =
        Book.builder()
            .title("  Dune  ")
            .author(buildAuthor("Herbert, Frank"))
            .isbn13("9780441172719")
            .publicationYear(1965)
            .publicationMonth(8)
            .royaltyRate(new BigDecimal("0.15"))
            .build();

    book.normalizeFields();

    assertEquals("Dune", book.getTitle());
  }

  @Test
  void normalizeFieldsStripsDashesIsbn13() {
    Book book =
        Book.builder()
            .title("Test Book")
            .author(buildAuthor("Test Author"))
            .isbn13("978-0-7432-7356-5")
            .publicationYear(2020)
            .publicationMonth(1)
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
            .author(buildAuthor("Test Author"))
            .isbn13("9780743273565")
            .isbn10("0-7432-7356-7")
            .publicationYear(2020)
            .publicationMonth(1)
            .royaltyRate(new BigDecimal("0.5"))
            .build();

    book.normalizeFields();

    assertEquals("0743273567", book.getIsbn10());
  }

  @Test
  void normalizeFieldsHandlesNullOptionalFields() {
    Book book =
        Book.builder()
            .title("Test Book")
            .author(buildAuthor("Test Author"))
            .isbn13("9780743273565")
            .isbn10(null)
            .publicationYear(2024)
            .publicationMonth(1)
            .royaltyRate(new BigDecimal("0.15"))
            .build();

    assertDoesNotThrow(book::normalizeFields);
    assertNull(book.getIsbn10());
  }
}
