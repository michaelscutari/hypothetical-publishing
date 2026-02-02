package edu.duke.bookpublishing.books;

import edu.duke.bookpublishing.books.dto.BookRequest;
import edu.duke.bookpublishing.books.dto.BookResponse;
import edu.duke.bookpublishing.books.dto.PagedBookResponse;
import edu.duke.bookpublishing.common.dto.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@Tag(name = "Books", description = "Book management endpoints")
public class BookController {

  private final BookService bookService;

  @Operation(
      operationId = "getAllBooks",
      summary = "Get paginated books with optional search, sort, and filter")
  @GetMapping
  public PagedBookResponse getBooks(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int size,
      @RequestParam(defaultValue = "false") boolean showAll,
      @RequestParam(required = false) String query,
      @RequestParam(required = false) String sortField,
      @RequestParam(defaultValue = "asc") String sortDirection) {

    Sort sort =
        sortField != null
            ? Sort.by(Sort.Direction.fromString(sortDirection), sortField)
            : Sort.unsorted();

    if (showAll) {
      List<Book> all = bookService.findAll(query, sort);
      return PagedBookResponse.unpaged(all);
    }

    Pageable pageable = PageRequest.of(page, size, sort);
    Page<Book> books = bookService.findAll(pageable, query);
    return PagedBookResponse.from(books);
  }

  @Operation(operationId = "searchAuthors", summary = "Search distinct author names")
  @GetMapping("/authors")
  public PagedResponse<String> searchAuthors(
      @RequestParam(required = false) String query,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int size,
      @RequestParam(defaultValue = "false") boolean showAll) {

    if (showAll) {
      List<String> authors = bookService.findDistinctAuthors(query);
      return PagedResponse.unpaged(authors);
    }

    Pageable pageable = PageRequest.of(page, size);
    return PagedResponse.paged(bookService.findDistinctAuthors(query, pageable));
  }

  @Operation(operationId = "getBookById", summary = "Get a book by ID")
  @GetMapping("/{id}")
  public BookResponse getBook(@PathVariable Long id) {
    Book book =
        bookService
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
    return BookResponse.from(book);
  }

  @Operation(operationId = "createBook", summary = "Create a new book")
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public BookResponse createBook(@Valid @RequestBody BookRequest request) {
    Book book =
        Book.builder()
            .title(request.title())
            .author(request.author())
            .isbn13(request.isbn13())
            .isbn10(request.isbn10())
            .publicationYear(request.publicationYear())
            .publicationMonth(request.publicationMonth())
            .royaltyRate(
                request.royaltyRate() != null ? request.royaltyRate() : new BigDecimal("0.5"))
            .build();
    return BookResponse.from(bookService.save(book));
  }

  @Operation(operationId = "updateBook", summary = "Update an existing book")
  @PutMapping("/{id}")
  public BookResponse updateBook(@PathVariable Long id, @Valid @RequestBody BookRequest request) {
    Book book =
        bookService
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));

    book.setTitle(request.title());
    book.setAuthor(request.author());
    book.setIsbn13(request.isbn13());
    book.setIsbn10(request.isbn10());
    book.setPublicationYear(request.publicationYear());
    book.setPublicationMonth(request.publicationMonth());
    book.setRoyaltyRate(
        request.royaltyRate() != null ? request.royaltyRate() : new BigDecimal("0.5"));

    return BookResponse.from(bookService.save(book));
  }

  @Operation(operationId = "deleteBook", summary = "Delete a book")
  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteBook(@PathVariable Long id) {
    Book book =
        bookService
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
    bookService.deleteById(book.getId());
  }
}
