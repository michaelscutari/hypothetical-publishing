package edu.duke.bookpublishing.books;

import edu.duke.bookpublishing.common.StringUtils;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

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
    return bookRepository.findDistinctAuthors(normalizedQuery);
  }

  public Page<String> findDistinctAuthors(String query, Pageable pageable) {
    String normalizedQuery = StringUtils.normalizeWhitespace(query);
    if (normalizedQuery == null || normalizedQuery.isBlank()) {
      return Page.empty(pageable);
    }
    return bookRepository.findDistinctAuthors(normalizedQuery, pageable);
  }

  public Book save(Book book) {
    return bookRepository.save(book);
  }

  public Optional<Book> findById(Long id) {
    return bookRepository.findById(id);
  }

  public void deleteById(Long id) {
    bookRepository.deleteById(id);
  }
}
