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

  public Book save(Book book) {
    return bookRepository.save(book);
  }

  public Optional<Book> findById(Long id) {
    return bookRepository.findById(id);
  }

  public void deleteById(Long id) {
    bookRepository.deleteById(id);
  }

  public Optional<Book> findBookByIsbn(String isbn) {
    if (isbn == null || isbn.isBlank()) {
      return Optional.empty();
    }

    String normalized = isbn.replace("-", "").replaceAll("\\s+", "");
    if (normalized.length() == 13) {
      return bookRepository.findByIsbn13(normalized);
    }
    if (normalized.length() == 10) {
      return bookRepository.findByIsbn10(normalized);
    }

    Optional<Book> byIsbn13 = bookRepository.findByIsbn13(normalized);
    if (byIsbn13.isPresent()) {
      return byIsbn13;
    }
    return bookRepository.findByIsbn10(normalized);
  }
}
