package edu.duke.bookpublishing.books;

import edu.duke.bookpublishing.author.Author;
import edu.duke.bookpublishing.author.AuthorService;
import edu.duke.bookpublishing.author.dto.AuthorResponse;
import edu.duke.bookpublishing.books.dto.BookDetailResponse;
import edu.duke.bookpublishing.books.dto.BookLookupResponse;
import edu.duke.bookpublishing.books.dto.BookRequest;
import edu.duke.bookpublishing.books.dto.BookResponse;
import edu.duke.bookpublishing.books.lookup.BookLookupResult;
import edu.duke.bookpublishing.books.lookup.BookLookupService;
import edu.duke.bookpublishing.common.dto.PagedResponse;
import edu.duke.bookpublishing.sales.BookFinancialSummary;
import edu.duke.bookpublishing.sales.SaleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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
import org.springframework.http.ResponseEntity;
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

  private static final BigDecimal DEFAULT_HAND_SOLD_ROYALTY_RATE = new BigDecimal("0.2");
  private static final BigDecimal DEFAULT_DISTRIBUTOR_ROYALTY_RATE = new BigDecimal("0.5");

  private final BookService bookService;
  private final SaleService saleService;
  private final BookLookupService bookLookupService;
  private final AuthorService authorService;

  // ------- GET MAPPINGS -------

  @Operation(
      operationId = "getAllBooks",
      summary = "Get paginated books with optional search, sort, and filter")
  @GetMapping
  public PagedResponse<BookResponse> getBooks(
      @RequestParam(required = false) Long authorId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int size,
      @RequestParam(defaultValue = "false") boolean showAll,
      @RequestParam(required = false) String query,
      @RequestParam(required = false) List<String> sortField,
      @RequestParam(required = false) List<String> sortDirection) {

    Sort sort;
    if (sortField != null && !sortField.isEmpty()) {
      List<Sort.Order> orders = new java.util.ArrayList<>();
      for (int i = 0; i < sortField.size(); i++) {
        String field = sortField.get(i);
        Sort.Direction dir =
            (sortDirection != null && i < sortDirection.size())
                ? Sort.Direction.fromString(sortDirection.get(i))
                : Sort.Direction.ASC;
        if ("publicationDate".equals(field)) {
          orders.add(new Sort.Order(dir, "publicationYear"));
          orders.add(new Sort.Order(dir, "publicationMonth"));
        } else {
          orders.add(new Sort.Order(dir, field));
        }
      }
      sort = Sort.by(orders);
    } else {
      sort = Sort.by(Sort.Order.asc("author"), Sort.Order.asc("title"));
    }

    if (showAll) {
      List<Book> all = bookService.findAll(query, sort, authorId);
      return PagedResponse.unpaged(
          all, book -> BookResponse.from(book, book.getTotalSalesToDate()));
    }

    Pageable pageable = PageRequest.of(page, size, sort);
    Page<Book> books = bookService.findAll(pageable, query, authorId);
    return PagedResponse.paged(books, book -> BookResponse.from(book, book.getTotalSalesToDate()));
  }

  @Operation(operationId = "searchAuthors", summary = "Search authors for autocomplete")
  @GetMapping("/authors")
  public PagedResponse<AuthorResponse> searchAuthors(
      @RequestParam(required = false) String query,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int size,
      @RequestParam(defaultValue = "false") boolean showAll) {

    Sort sort = Sort.by(Sort.Order.asc("name").ignoreCase());

    if (showAll) {
      List<Author> authors = authorService.findAll(query, sort);
      return PagedResponse.unpaged(authors, AuthorResponse::from);
    }

    Pageable pageable = PageRequest.of(page, size, sort);
    Page<Author> authors = authorService.findAll(pageable, query);
    return PagedResponse.paged(authors, AuthorResponse::from);
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

  @Operation(operationId = "lookupBookByIsbn", summary = "Lookup a book by ISBN")
  @ApiResponses(
      value = {
        @ApiResponse(
            responseCode = "200",
            description = "Book metadata for prefill",
            content = @Content(schema = @Schema(implementation = BookLookupResponse.class))),
        @ApiResponse(
            responseCode = "409",
            description = "Book already exists",
            content = @Content(schema = @Schema(implementation = BookResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid ISBN"),
        @ApiResponse(responseCode = "404", description = "Book not found"),
        @ApiResponse(responseCode = "502", description = "Upstream lookup failed")
      })
  @GetMapping("/lookup")
  public ResponseEntity<?> lookupBookByIsbn(@RequestParam String isbn) {
    try {
      BookLookupResult result = bookLookupService.lookupByIsbn(isbn);
      if (result.existing() != null) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(BookResponse.from(result.existing()));
      }
      return ResponseEntity.ok(result.lookup());
    } catch (IllegalArgumentException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
    } catch (IllegalStateException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage(), ex);
    }
  }

  // ------- POST MAPPINGS -------

  @Operation(operationId = "createBook", summary = "Create a new book")
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public BookResponse createBook(@Valid @RequestBody BookRequest request) {
    Author author =
        authorService
            .findById(request.authorId())
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Author not found"));

    Book book =
        Book.builder()
            .title(request.title())
            .author(author)
            .isbn13(request.isbn13())
            .isbn10(request.isbn10())
            .publicationYear(request.publicationYear())
            .publicationMonth(request.publicationMonth())
            .distributorAuthorRoyaltyRate(
                request.distributorAuthorRoyaltyRate() != null
                    ? request.distributorAuthorRoyaltyRate()
                    : DEFAULT_DISTRIBUTOR_ROYALTY_RATE)
            .handsoldAuthorRoyaltyRate(
                request.handsoldAuthorRoyaltyRate() != null
                    ? request.handsoldAuthorRoyaltyRate()
                    : DEFAULT_HAND_SOLD_ROYALTY_RATE)
            .seriesName(request.seriesName())
            .seriesPosition(request.seriesPosition())
            .coverPrice(request.coverPrice())
            .printCost(request.printCost())
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
    Author author =
        authorService
            .findById(request.authorId())
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Author not found"));
    book.setTitle(request.title());
    book.setAuthor(author);
    book.setIsbn13(request.isbn13());
    book.setIsbn10(request.isbn10());
    book.setPublicationYear(request.publicationYear());
    book.setPublicationMonth(request.publicationMonth());
    book.setDistributorAuthorRoyaltyRate(
        request.distributorAuthorRoyaltyRate() != null
            ? request.distributorAuthorRoyaltyRate()
            : DEFAULT_DISTRIBUTOR_ROYALTY_RATE);
    book.setHandsoldAuthorRoyaltyRate(
        request.handsoldAuthorRoyaltyRate() != null
            ? request.handsoldAuthorRoyaltyRate()
            : DEFAULT_HAND_SOLD_ROYALTY_RATE);
    book.setSeriesName(request.seriesName());
    book.setSeriesPosition(request.seriesPosition());
    book.setCoverPrice(request.coverPrice());
    book.setPrintCost(request.printCost());

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
