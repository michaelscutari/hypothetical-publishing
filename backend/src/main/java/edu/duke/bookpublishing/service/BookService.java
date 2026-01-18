package edu.duke.bookpublishing.service;

import edu.duke.bookpublishing.model.Book;
import edu.duke.bookpublishing.repository.BookRepository;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookService {

  private final BookRepository bookRepository;

  public List<Book> findAll() {
    return bookRepository.findAll();
  }

  public List<Book> search(String query) {
    if (query == null || query.isBlank()) {
      return findAll();
    }

    String[] terms = query.trim().split("\\s+");
    return bookRepository.findAll().stream().filter(book -> allTermsMatch(book, terms)).toList();
  }

  private boolean allTermsMatch(Book book, String[] terms) {
    String searchable = buildSearchableText(book);
    return Arrays.stream(terms).allMatch(term -> searchable.contains(term.toLowerCase()));
  }

  private String buildSearchableText(Book book) {
    StringBuilder sb = new StringBuilder();
    if (book.getTitle() != null) sb.append(book.getTitle()).append(" ");
    if (book.getAuthor() != null) sb.append(book.getAuthor()).append(" ");
    if (book.getIsbn13() != null) sb.append(book.getIsbn13()).append(" ");
    if (book.getIsbn10() != null) sb.append(book.getIsbn10());
    return sb.toString().toLowerCase();
  }

  public Book save(Book book) {
    return bookRepository.save(book);
  }
}
