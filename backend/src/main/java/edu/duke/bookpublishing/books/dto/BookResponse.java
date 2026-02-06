package edu.duke.bookpublishing.books.dto;

import edu.duke.bookpublishing.books.Book;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Book response data")
public record BookResponse(
    @Schema(description = "Unique book identifier") Long id,
    @Schema(description = "Book title") String title,
    @Schema(description = "Author name(s)") String author,
    @Schema(description = "ISBN-13 identifier") String isbn13,
    @Schema(description = "ISBN-10 identifier") String isbn10,
    @Schema(description = "Publication year") Integer publicationYear,
    @Schema(description = "Publication month (1-12)") Integer publicationMonth,
    @Schema(description = "Author royalty rate") BigDecimal royaltyRate,
    @Schema(description = "Total sales quantity to date") Long totalSalesToDate) {

  public static BookResponse from(Book book) {
    return from(book, 0L);
  }

  public static BookResponse from(Book book, Long totalSaleToDate) {
    return new BookResponse(
        book.getId(),
        book.getTitle(),
        book.getAuthor(),
        book.getIsbn13(),
        book.getIsbn10(),
        book.getPublicationYear(),
        book.getPublicationMonth(),
        book.getRoyaltyRate(),
        totalSaleToDate);
  }
}
