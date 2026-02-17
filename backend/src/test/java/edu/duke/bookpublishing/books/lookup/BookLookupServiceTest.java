package edu.duke.bookpublishing.books.lookup;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.exception.custom.NotFoundException;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class BookLookupServiceTest {

  private BookRepository bookRepository;
  private OpenLibraryClient openLibraryClient;
  private BookLookupService bookLookupService;
  private ObjectMapper objectMapper;

  @BeforeEach
  void setUp() {
    bookRepository = mock(BookRepository.class);
    openLibraryClient = mock(OpenLibraryClient.class);
    bookLookupService = new BookLookupService(bookRepository, openLibraryClient);
    objectMapper = new ObjectMapper();
  }

  @Test
  void returnsExistingWhenIsbn13AlreadyExists() {
    Book existing =
        Book.builder()
            .id(10L)
            .title("Existing Book")
            .author("Existing Author")
            .isbn13("9780743273565")
            .publicationYear(2020)
            .publicationMonth(1)
            .distributorAuthorRoyaltyRate(new BigDecimal("0.5"))
            .handsoldAuthorRoyaltyRate(new BigDecimal("0.2"))
            .coverPrice(new BigDecimal("15.00"))
            .printCost(new BigDecimal("4.00"))
            .build();

    when(bookRepository.findByIsbn13("9780743273565")).thenReturn(Optional.of(existing));

    BookLookupResult result = bookLookupService.lookupByIsbn("9780743273565");

    assertNotNull(result.existing());
    assertNull(result.lookup());
    assertEquals(10L, result.existing().getId());
    verifyNoInteractions(openLibraryClient);
  }

  @Test
  void returnsLookupDataWhenFound() throws Exception {
    when(bookRepository.findByIsbn13("9780743273565")).thenReturn(Optional.empty());

    JsonNode payload =
        objectMapper.readTree(
            """
            {
              "ISBN:9780743273565": {
                "title": "The Great Gatsby",
                "authors": [{ "name": "F. Scott Fitzgerald" }],
                "identifiers": {
                  "isbn_13": ["9780743273565"],
                  "isbn_10": ["0743273567"]
                },
                "publish_date": "April 10, 1925"
              }
            }
            """);

    when(openLibraryClient.fetchByIsbn("9780743273565")).thenReturn(payload);

    BookLookupResult result = bookLookupService.lookupByIsbn("9780743273565");

    assertNull(result.existing());
    assertNotNull(result.lookup());
    assertEquals("The Great Gatsby", result.lookup().title());
    assertEquals("F. Scott Fitzgerald", result.lookup().author());
    assertEquals("9780743273565", result.lookup().isbn13());
    assertEquals("0743273567", result.lookup().isbn10());
    assertEquals(1925, result.lookup().publicationYear());
    assertEquals(4, result.lookup().publicationMonth());
  }

  @Test
  void returnsExistingWhenLookupIsbn10MatchesStoredIsbn13() throws Exception {
    Book existing =
        Book.builder()
            .id(12L)
            .title("Existing Book")
            .author("Existing Author")
            .isbn13("9780743273565")
            .publicationYear(2020)
            .publicationMonth(1)
            .distributorAuthorRoyaltyRate(new BigDecimal("0.5"))
            .handsoldAuthorRoyaltyRate(new BigDecimal("0.2"))
            .coverPrice(new BigDecimal("15.00"))
            .printCost(new BigDecimal("4.00"))
            .build();

    when(bookRepository.findByIsbn10("0743273567")).thenReturn(Optional.empty());
    when(bookRepository.findByIsbn13("9780743273565")).thenReturn(Optional.of(existing));

    JsonNode payload =
        objectMapper.readTree(
            """
            {
              "ISBN:0743273567": {
                "title": "The Great Gatsby",
                "authors": [{ "name": "F. Scott Fitzgerald" }],
                "identifiers": {
                  "isbn_13": ["9780743273565"],
                  "isbn_10": ["0743273567"]
                },
                "publish_date": "April 10, 1925"
              }
            }
            """);

    when(openLibraryClient.fetchByIsbn("0743273567")).thenReturn(payload);

    BookLookupResult result = bookLookupService.lookupByIsbn("0743273567");

    assertNotNull(result.existing());
    assertNull(result.lookup());
    assertEquals(12L, result.existing().getId());
  }

  @Test
  void throwsNotFoundWhenNoItems() throws Exception {
    when(bookRepository.findByIsbn13("9780743273565")).thenReturn(Optional.empty());

    JsonNode payload = objectMapper.readTree("{}");
    when(openLibraryClient.fetchByIsbn("9780743273565")).thenReturn(payload);

    assertThrows(NotFoundException.class, () -> bookLookupService.lookupByIsbn("9780743273565"));
  }

  @Test
  void throwsForInvalidIsbn() {
    assertThrows(IllegalArgumentException.class, () -> bookLookupService.lookupByIsbn("BAD-ISBN"));
    verifyNoInteractions(bookRepository, openLibraryClient);
  }

  @Test
  void throwsForInvalidIsbnChecksum() {
    assertThrows(
        IllegalArgumentException.class, () -> bookLookupService.lookupByIsbn("9780743273564"));
    verifyNoInteractions(bookRepository, openLibraryClient);
  }

  @Test
  void normalizesHyphenatedIsbn() throws Exception {
    when(bookRepository.findByIsbn13("9780743273565")).thenReturn(Optional.empty());

    JsonNode payload =
        objectMapper.readTree(
            """
            {
              "ISBN:9780743273565": {
                "title": "The Great Gatsby",
                "authors": [{ "name": "F. Scott Fitzgerald" }],
                "identifiers": {
                  "isbn_13": ["9780743273565"],
                  "isbn_10": ["0743273567"]
                },
                "publish_date": "April 10, 1925"
              }
            }
            """);

    when(openLibraryClient.fetchByIsbn("9780743273565")).thenReturn(payload);

    BookLookupResult result = bookLookupService.lookupByIsbn("978-0-7432-7356-5");

    assertNotNull(result.lookup());
    assertEquals("9780743273565", result.lookup().isbn13());
  }

  @Test
  void normalizesIsbnWithSpaces() throws Exception {
    when(bookRepository.findByIsbn13("9780743273565")).thenReturn(Optional.empty());

    JsonNode payload =
        objectMapper.readTree(
            """
            {
              "ISBN:9780743273565": {
                "title": "The Great Gatsby",
                "authors": [{ "name": "F. Scott Fitzgerald" }],
                "identifiers": {
                  "isbn_13": ["9780743273565"],
                  "isbn_10": ["0743273567"]
                },
                "publish_date": "April 10, 1925"
              }
            }
            """);

    when(openLibraryClient.fetchByIsbn("9780743273565")).thenReturn(payload);

    BookLookupResult result = bookLookupService.lookupByIsbn("978 0743273565");

    assertNotNull(result.lookup());
    assertEquals("9780743273565", result.lookup().isbn13());
  }

  @Test
  void throwsForNullIsbn() {
    assertThrows(IllegalArgumentException.class, () -> bookLookupService.lookupByIsbn(null));
    verifyNoInteractions(bookRepository, openLibraryClient);
  }

  @Test
  void throwsForBlankIsbn() {
    assertThrows(IllegalArgumentException.class, () -> bookLookupService.lookupByIsbn("   "));
    verifyNoInteractions(bookRepository, openLibraryClient);
  }

  @Test
  void returnsNullAuthorWhenMissing() throws Exception {
    when(bookRepository.findByIsbn13("9780743273565")).thenReturn(Optional.empty());

    JsonNode payload =
        objectMapper.readTree(
            """
            {
              "ISBN:9780743273565": {
                "title": "The Great Gatsby",
                "identifiers": {
                  "isbn_13": ["9780743273565"]
                },
                "publish_date": "1925"
              }
            }
            """);

    when(openLibraryClient.fetchByIsbn("9780743273565")).thenReturn(payload);

    BookLookupResult result = bookLookupService.lookupByIsbn("9780743273565");

    assertNotNull(result.lookup());
    assertNull(result.lookup().author());
  }

  @Test
  void parsesIsoDateFormat() throws Exception {
    when(bookRepository.findByIsbn13("9780743273565")).thenReturn(Optional.empty());

    JsonNode payload =
        objectMapper.readTree(
            """
            {
              "ISBN:9780743273565": {
                "title": "The Great Gatsby",
                "authors": [{ "name": "F. Scott Fitzgerald" }],
                "identifiers": {
                  "isbn_13": ["9780743273565"]
                },
                "publish_date": "2020-03-15"
              }
            }
            """);

    when(openLibraryClient.fetchByIsbn("9780743273565")).thenReturn(payload);

    BookLookupResult result = bookLookupService.lookupByIsbn("9780743273565");

    assertEquals(2020, result.lookup().publicationYear());
    assertEquals(3, result.lookup().publicationMonth());
  }

  @Test
  void parsesYearOnlyDate() throws Exception {
    when(bookRepository.findByIsbn13("9780743273565")).thenReturn(Optional.empty());

    JsonNode payload =
        objectMapper.readTree(
            """
            {
              "ISBN:9780743273565": {
                "title": "The Great Gatsby",
                "authors": [{ "name": "F. Scott Fitzgerald" }],
                "identifiers": {
                  "isbn_13": ["9780743273565"]
                },
                "publish_date": "1925"
              }
            }
            """);

    when(openLibraryClient.fetchByIsbn("9780743273565")).thenReturn(payload);

    BookLookupResult result = bookLookupService.lookupByIsbn("9780743273565");

    assertEquals(1925, result.lookup().publicationYear());
    assertNull(result.lookup().publicationMonth());
  }
}
