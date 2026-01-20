package edu.duke.bookpublishing.controller;

import edu.duke.bookpublishing.dto.BookRequest;
import edu.duke.bookpublishing.dto.BookResponse;
import edu.duke.bookpublishing.model.Book;
import edu.duke.bookpublishing.service.BookService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

  private final BookService bookService;

  @GetMapping
  public List<BookResponse> getBooks(@RequestParam(required = false) String query) {
    return bookService.search(query).stream().map(BookResponse::from).toList();
  }

  @GetMapping("/{id}")
  public BookResponse getBook(@PathVariable Long id) {
    Book book =
        bookService
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
    return BookResponse.from(book);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public BookResponse createBook(@Valid @RequestBody BookRequest request) {
    Book book =
        Book.builder()
            .title(request.title())
            .author(request.author())
            .isbn13(request.isbn13())
            .isbn10(request.isbn10())
            .publicationDate(request.publicationDate())
            .royaltyRate(
                request.royaltyRate() != null ? request.royaltyRate() : new BigDecimal("0.5"))
            .build();
    return BookResponse.from(bookService.save(book));
  }

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
    book.setPublicationDate(request.publicationDate());
    book.setRoyaltyRate(
        request.royaltyRate() != null ? request.royaltyRate() : new BigDecimal("0.5"));

    return BookResponse.from(bookService.save(book));
  }

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
