package edu.duke.bookpublishing.books;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import edu.duke.bookpublishing.exception.custom.AmbiguousLookupException;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

  @Mock private BookRepository bookRepository;

  private BookService bookService;

  @BeforeEach
  void setUp() {
    bookService = new BookService(bookRepository);
  }

  @Test
  void findBookByAmazonEbookAsinReturnsEmptyWhenBlank() {
    assertThat(bookService.findBookByAmazonEbookAsin("  ")).isEmpty();
    verifyNoInteractions(bookRepository);
  }

  @Test
  void findBookByAmazonEbookAsinReturnsSingleMatch() {
    Book book = Book.builder().id(1L).amazonEbookAsin("B012345678").build();
    when(bookRepository.findAllByAmazonEbookAsinIgnoreCase("B012345678")).thenReturn(List.of(book));

    assertThat(bookService.findBookByAmazonEbookAsin("B012345678")).contains(book);
  }

  @Test
  void findBookByAmazonEbookAsinThrowsOnMultipleMatches() {
    Book first = Book.builder().id(1L).amazonEbookAsin("B012345678").build();
    Book second = Book.builder().id(2L).amazonEbookAsin("B012345678").build();
    when(bookRepository.findAllByAmazonEbookAsinIgnoreCase("B012345678"))
        .thenReturn(List.of(first, second));

    assertThrows(
        AmbiguousLookupException.class, () -> bookService.findBookByAmazonEbookAsin("B012345678"));
  }
}
