package edu.duke.bookpublishing.books;

import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookService {

  private final BookRepository bookRepository;

  public Page<Book> findAll(Pageable pageable, String query, Long authorId) {
    Specification<Book> spec = buildSpecification(query, authorId);
    return bookRepository.findAll(spec, pageable);
  }

  public List<Book> findAll(String query, Sort sort, Long authorId) {
    Specification<Book> spec = buildSpecification(query, authorId);
    if (spec == null) {
      return bookRepository.findAll(sort);
    }
    return bookRepository.findAll(spec, sort);
  }

  private Specification<Book> buildSpecification(String query, Long authorId) {
    Specification<Book> spec = Specification.where(null);
    boolean hasFilter = false;

    if (query != null && !query.isBlank()) {
      spec = spec.and(BookSpecifications.matchesQuery(query));
      hasFilter = true;
    }
    if (authorId != null) {
      spec = spec.and(BookSpecifications.hasAuthorId(authorId));
      hasFilter = true;
    }

    return hasFilter ? spec : null;
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
