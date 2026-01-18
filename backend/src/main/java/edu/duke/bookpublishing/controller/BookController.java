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
}
