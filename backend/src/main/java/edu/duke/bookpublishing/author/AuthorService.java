package edu.duke.bookpublishing.author;

import edu.duke.bookpublishing.author.dto.AuthorRequest;
import edu.duke.bookpublishing.exception.custom.NotFoundException;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthorService {
  private final AuthorRepository authorRepository;

  public Author createAuthor(AuthorRequest request) {
    Author author = Author.builder().name(request.name()).email(request.email()).build();
    return authorRepository.save(author);
  }

  public Author updateAuthor(Long id, AuthorRequest request) {
    Author author =
        authorRepository.findById(id).orElseThrow(() -> new NotFoundException("Author not found"));

    author.setName(request.name());
    author.setEmail(request.email());

    return authorRepository.save(author);
  }

  public Optional<Author> findById(Long id) {
    return authorRepository.findById(id);
  }

  public void deleteById(Long id) {
    if (!authorRepository.existsById(id)) {
      throw new NotFoundException("Author not found");
    }
    authorRepository.deleteById(id);
  }

  public List<Author> findAll() {
    return authorRepository.findAll();
  }

  public List<Author> findAll(String query, Sort sort) {
    if (query == null || query.isBlank()) {
      return authorRepository.findAll(sort);
    }
    String q = query.trim();
    return authorRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(q, q, sort);
  }

  public Page<Author> findAll(Pageable pageable, String query) {
    if (query == null || query.isBlank()) {
      return authorRepository.findAll(pageable);
    }
    String q = query.trim();
    return authorRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
        q, q, pageable);
  }
}
