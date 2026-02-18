package edu.duke.bookpublishing.author;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import edu.duke.bookpublishing.author.dto.AuthorRequest;
import edu.duke.bookpublishing.common.StringUtils;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthorService {
    private final AuthorRepository authorRepository;

    public Author createAuthor(AuthorRequest request) {
        String normalized = StringUtils.normalizeWhitespace(request.name());
        Author author = Author.builder().name(normalized).email(request.email()).build();
        return authorRepository.save(author);
        
    }

    public Author updateAuthor(Long id, AuthorRequest request) {
        Author author = authorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Author not found"));

        author.setName(StringUtils.normalizeWhitespace(request.name()));
        author.setEmail(request.email());

        return authorRepository.save(author);
    }

    public Optional<Author> findById(Long id) {
        return authorRepository.findById(id);
    }

    public void deleteById(Long id) {
        authorRepository.deleteById(id);
    }

    public List<Author> findAll() {
        return authorRepository.findAll();
    }

    public Page<Author> findAll(Pageable pageable, String query) {
    if (query == null || query.isBlank()) {
      return authorRepository.findAll(pageable);
    }
    String q = query.trim();
    return authorRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(q, q, pageable);
  }


    
}
