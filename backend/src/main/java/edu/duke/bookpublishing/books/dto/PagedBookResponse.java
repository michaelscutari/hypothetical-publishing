package edu.duke.bookpublishing.books.dto;

import edu.duke.bookpublishing.books.Book;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import org.springframework.data.domain.Page;

@Schema(description = "Paginated book response")
public record PagedBookResponse(
    @Schema(description = "List of books") List<BookResponse> content,
    @Schema(description = "Current page number (0-indexed)") int page,
    @Schema(description = "Page size") int size,
    @Schema(description = "Total number of elements") long totalElements,
    @Schema(description = "Total number of pages") int totalPages,
    @Schema(description = "Whether this is an unpaged (show all) response") boolean unpaged) {

  public static PagedBookResponse from(Page<Book> page) {
    return new PagedBookResponse(
        page.getContent().stream().map(BookResponse::from).toList(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        false);
  }

  public static PagedBookResponse unpaged(List<Book> books) {
    return new PagedBookResponse(
        books.stream().map(BookResponse::from).toList(), 0, books.size(), books.size(), 1, true);
  }
}
