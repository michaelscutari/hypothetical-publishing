package edu.duke.bookpublishing.author;

import edu.duke.bookpublishing.author.dto.AuthorRequest;
import edu.duke.bookpublishing.author.dto.AuthorResponse;
import edu.duke.bookpublishing.common.dto.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/authors")
@RequiredArgsConstructor
@Tag(name = "Authors", description = "Author management endpoints")
public class AuthorController {
  private final AuthorService authorService;

  @Operation(
      operationId = "getAllAuthors",
      summary = "Get paged list of authors (search by name/email)")
  @GetMapping
  public PagedResponse<AuthorResponse> getAuthors(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int size,
      @RequestParam(defaultValue = "false") boolean showAll,
      @RequestParam(required = false) String query,
      @RequestParam(required = false) String sortField,
      @RequestParam(defaultValue = "asc") String sortDirection) {

    Sort sort;
    if (sortField != null) {
      Sort.Direction dir = Sort.Direction.fromString(sortDirection);
      sort = Sort.by(new Sort.Order(dir, sortField));
    } else {
      sort = Sort.by(Sort.Order.asc("name").ignoreCase());
    }

    if (showAll) {
      List<Author> all = authorService.findAll(query, sort);
      return PagedResponse.unpaged(all, AuthorResponse::from);
    }

    Pageable pageable = PageRequest.of(page, size, sort);
    Page<Author> pageResult = authorService.findAll(pageable, query);
    return PagedResponse.paged(pageResult, AuthorResponse::from);
  }

  @Operation(operationId = "getAuthorById", summary = "Get an author by id")
  @GetMapping("/{id}")
  public AuthorResponse getAuthor(@PathVariable Long id) {
    Author author =
        authorService
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Author not found"));
    return AuthorResponse.from(author);
  }

  @Operation(operationId = "createAuthor", summary = "Creates a new author")
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public AuthorResponse createAuthor(@Valid @RequestBody AuthorRequest request) {
    return AuthorResponse.from(authorService.createAuthor(request));
  }

  @Operation(operationId = "updateAuthor", summary = "Update an existing author")
  @PutMapping("/{id}")
  public AuthorResponse updateAuthor(
      @PathVariable Long id, @Valid @RequestBody AuthorRequest request) {
    Author updated = authorService.updateAuthor(id, request);
    return AuthorResponse.from(updated);
  }

  @Operation(operationId = "deleteAuthor", summary = "Delete an author")
  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteAuthor(@PathVariable Long id) {
    authorService.deleteById(id);
  }
}
