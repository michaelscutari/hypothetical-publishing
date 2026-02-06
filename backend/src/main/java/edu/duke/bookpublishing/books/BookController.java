package edu.duke.bookpublishing.books;

import edu.duke.bookpublishing.books.dto.BookDetailResponse;
import edu.duke.bookpublishing.books.dto.BookRequest;
import edu.duke.bookpublishing.books.dto.BookResponse;
import edu.duke.bookpublishing.common.dto.PagedResponse;
import edu.duke.bookpublishing.sales.BookFinancialSummary;
import edu.duke.bookpublishing.sales.SaleService;
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
@RequestMapping("/api/books")
@RequiredArgsConstructor
@Tag(name = "Books", description = "Book management endpoints")
public class BookController {

  private final BookService bookService;
  private final SaleService saleService;

  // ------- GET MAPPINGS -------

  @Operation(
      operationId = "getAllBooks",
      summary = "Get paginated books with optional search, sort, and filter")
  @GetMapping
  public PagedResponse<BookResponse> getBooks(
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
      return PagedResponse.unpaged(
          all, book -> BookResponse.from(book, saleService.getBookTotalSales(book.getId())));
    }

    Pageable pageable = PageRequest.of(page, size, sort);
    Page<Book> books = bookService.findAll(pageable, query);
    return PagedResponse.paged(
        books, book -> BookResponse.from(book, saleService.getBookTotalSales(book.getId())));
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

  @Operation(operationId = "getBookById", summary = "Get a book by ID (includes financials)")
  @GetMapping("/{id}")
  public BookDetailResponse getBook(@PathVariable Long id) {
    Book book =
        bookService
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));

    BookFinancialSummary summary = saleService.getBookFinancialSummary(id);

    return BookDetailResponse.from(book, summary);
  }

  // ------- POST MAPPINGS -------

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

  // ------- PUT MAPPINGS -------

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

  // ------- DELETE MAPPINGS -------

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
