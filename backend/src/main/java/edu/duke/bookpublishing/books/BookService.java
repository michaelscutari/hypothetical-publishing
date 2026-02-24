package edu.duke.bookpublishing.books;

import edu.duke.bookpublishing.common.StringUtils;
import edu.duke.bookpublishing.exception.custom.NotFoundException;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookService {

  private final BookRepository bookRepository;

  public Page<Book> findAll(Pageable pageable, String query) {
    if (query == null || query.isBlank()) {
      return bookRepository.findAll(pageable);
    }
    return bookRepository.findAll(BookSpecifications.matchesQuery(query), pageable);
  }

  public List<Book> findAll(String query, Sort sort) {
    if (query == null || query.isBlank()) {
      return bookRepository.findAll(sort);
    }
    return bookRepository.findAll(BookSpecifications.matchesQuery(query), sort);
  }

  public List<Book> findAll() {
    return bookRepository.findAll();
  }

  // Distinct author search for autocomplete.
  public List<String> findDistinctAuthors(String query) {
    String normalizedQuery = StringUtils.normalizeWhitespace(query);
    if (normalizedQuery == null || normalizedQuery.isBlank()) {
      return List.of();
    }
    if (BookSpecifications.containsAuthorPunctuation(normalizedQuery)) {
      return bookRepository.findDistinctAuthorsLiteral(normalizedQuery);
    }
    return bookRepository.findDistinctAuthors(normalizedQuery);
  }

  public Page<String> findDistinctAuthors(String query, Pageable pageable) {
    String normalizedQuery = StringUtils.normalizeWhitespace(query);
    if (normalizedQuery == null || normalizedQuery.isBlank()) {
      return Page.empty(pageable);
    }
    if (BookSpecifications.containsAuthorPunctuation(normalizedQuery)) {
      return bookRepository.findDistinctAuthorsLiteral(normalizedQuery, pageable);
    }
    return bookRepository.findDistinctAuthors(normalizedQuery, pageable);
  }

  // Series name autocomplete
  public List<String> findDistinctSeriesNames(String query) {
    if (query == null || query.isBlank()) {
      return bookRepository.findAllDistinctSeriesNames();
    }
    return bookRepository.findDistinctSeriesNames(query);
  }

  @Transactional
  public Book createBook(Book book) {
    if (book.getSeriesName() != null && book.getSeriesPosition() != null) {
      String normalizedName = StringUtils.normalizeWhitespace(book.getSeriesName());
      int targetPosition = book.getSeriesPosition();
      List<Book> booksInSeries =
          bookRepository.findBySeriesNameIgnoreCaseOrderBySeriesPositionAsc(normalizedName);
      int maxPosition = booksInSeries.size() + 1;

      if (targetPosition < 1 || targetPosition > maxPosition) {
        throw new IllegalArgumentException("Series position must be between 1 and " + maxPosition);
      }

      makeRoom(normalizedName, targetPosition, null);
    }
    return bookRepository.save(book);
  }

  @Transactional
  public Book updateBook(Book book, String oldSeriesName, Integer oldSeriesPosition) {
    String newSeriesName =
        book.getSeriesName() != null ? StringUtils.normalizeWhitespace(book.getSeriesName()) : null;
    Integer newPosition = book.getSeriesPosition();

    boolean hadSeries = oldSeriesName != null && oldSeriesPosition != null;
    boolean hasSeries = newSeriesName != null && newPosition != null;

    boolean sameSeries = hadSeries && hasSeries && oldSeriesName.equalsIgnoreCase(newSeriesName);

    if (sameSeries && oldSeriesPosition.equals(newPosition)) {
      // No series change
      return bookRepository.save(book);
    }

    if (sameSeries) {
      // Move within same series: validate bounds then remove-and-insert
      List<Book> booksInSeries =
          bookRepository.findBySeriesNameIgnoreCaseOrderBySeriesPositionAsc(newSeriesName);
      long othersCount =
          booksInSeries.stream().filter(b -> !b.getId().equals(book.getId())).count();
      int maxPosition = (int) othersCount + 1;
      if (newPosition < 1 || newPosition > maxPosition) {
        throw new IllegalArgumentException("Series position must be between 1 and " + maxPosition);
      }
      closeGap(oldSeriesName, oldSeriesPosition, book.getId());
      bookRepository.flush();
      makeRoom(newSeriesName, newPosition, book.getId());
    } else {
      if (hadSeries) {
        closeGap(oldSeriesName, oldSeriesPosition, book.getId());
      }
      if (hasSeries) {
        List<Book> booksInSeries =
            bookRepository.findBySeriesNameIgnoreCaseOrderBySeriesPositionAsc(newSeriesName);
        // Exclude self from count (in case series name match is case-insensitive)
        long othersCount =
            booksInSeries.stream().filter(b -> !b.getId().equals(book.getId())).count();
        int maxPosition = (int) othersCount + 1;

        if (newPosition < 1 || newPosition > maxPosition) {
          throw new IllegalArgumentException(
              "Series position must be between 1 and " + maxPosition);
        }

        makeRoom(newSeriesName, newPosition, book.getId());
      }
    }

    return bookRepository.save(book);
  }

  @Transactional
  public void deleteBook(Long id) {
    Book book =
        bookRepository.findById(id).orElseThrow(() -> new NotFoundException("Book not found"));

    if (book.getSeriesName() != null && book.getSeriesPosition() != null) {
      bookRepository.deleteById(id);
      bookRepository.flush();
      closeGap(book.getSeriesName(), book.getSeriesPosition(), null);
    } else {
      bookRepository.deleteById(id);
    }
  }

  public Book save(Book book) {
    return bookRepository.save(book);
  }

  public Optional<Book> findById(Long id) {
    return bookRepository.findById(id);
  }

  private void closeGap(String seriesName, int removedPosition, Long excludeId) {
    List<Book> booksInSeries =
        bookRepository.findBySeriesNameIgnoreCaseOrderBySeriesPositionAsc(seriesName);
    for (Book b : booksInSeries) {
      if (excludeId != null && b.getId().equals(excludeId)) {
        continue;
      }
      if (b.getSeriesPosition() > removedPosition) {
        b.setSeriesPosition(b.getSeriesPosition() - 1);
        bookRepository.save(b);
      }
    }
  }

  private void makeRoom(String seriesName, int targetPosition, Long excludeId) {
    List<Book> booksInSeries =
        bookRepository.findBySeriesNameIgnoreCaseOrderBySeriesPositionAsc(seriesName);
    // Iterate in reverse to avoid unique constraint violations
    for (int i = booksInSeries.size() - 1; i >= 0; i--) {
      Book b = booksInSeries.get(i);
      if (excludeId != null && b.getId().equals(excludeId)) {
        continue;
      }
      if (b.getSeriesPosition() >= targetPosition) {
        b.setSeriesPosition(b.getSeriesPosition() + 1);
        bookRepository.save(b);
      }
    }
  }
}
