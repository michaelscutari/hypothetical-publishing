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

  public Page<Book> findAll(Pageable pageable, String query) {
    if (query == null || query.isBlank()) {
      return bookRepository.findAll(pageable);
    }
    return bookRepository.findAll(buildSearchSpec(query), pageable);
  }

  public List<Book> findAll(String query, Sort sort) {
    if (query == null || query.isBlank()) {
      return bookRepository.findAll(sort);
    }
    return bookRepository.findAll(buildSearchSpec(query), sort);
  }

  public List<Book> findAll() {
    return bookRepository.findAll();
  }

  private Specification<Book> buildSearchSpec(String query) {
    String[] terms = query.trim().split("\\s+");
    Specification<Book> spec = Specification.where(null);

    for (String term : terms) {
      spec = spec.and(termMatchesAnyField(term));
    }
    return spec;
  }

  private Specification<Book> termMatchesAnyField(String term) {
    String lowerTerm = term.toLowerCase();
    // Normalize term for ISBN search by removing dashes (def 12)
    String normalizedTerm = lowerTerm.replaceAll("-", "");

    return (root, cq, cb) ->
        cb.or(
            cb.like(cb.lower(root.get("title")), "%" + lowerTerm + "%"),
            cb.like(cb.lower(root.get("author")), "%" + lowerTerm + "%"),
            cb.like(root.get("isbn13"), "%" + normalizedTerm + "%"),
            cb.like(root.get("isbn10"), "%" + normalizedTerm + "%"));
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
