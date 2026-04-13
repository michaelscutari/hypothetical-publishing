package edu.duke.bookpublishing.author;

import edu.duke.bookpublishing.author.dto.AuthorRequest;
import edu.duke.bookpublishing.common.StringUtils;
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
    Author author =
        Author.builder()
            .name(request.name())
            .email(request.email())
            .paypalAccount(request.paypalAccount())
            .venmoAccount(request.venmoAccount())
            .build();
    return authorRepository.save(author);
  }

  public Author updateAuthor(Long id, AuthorRequest request) {
    Author author =
        authorRepository.findById(id).orElseThrow(() -> new NotFoundException("Author not found"));

    author.setName(request.name());
    author.setEmail(request.email());
    author.setPaypalAccount(request.paypalAccount());
    author.setVenmoAccount(request.venmoAccount());

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
    String q = StringUtils.normalizeWhitespace(query);
    if (q == null || q.isBlank()) {
      return authorRepository.findAll(sort);
    }
    if (StringUtils.containsAuthorPunctuation(q)) {
      return authorRepository.findByNameLiteral(q, sort);
    }
    return authorRepository.findByNameLenient(q, sort);
  }

  public Page<Author> findAll(Pageable pageable, String query) {
    String q = StringUtils.normalizeWhitespace(query);
    if (q == null || q.isBlank()) {
      return authorRepository.findAll(pageable);
    }
    if (StringUtils.containsAuthorPunctuation(q)) {
      return authorRepository.findByNameLiteral(q, pageable);
    }
    return authorRepository.findByNameLenient(q, pageable);
  }
}
