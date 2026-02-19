package edu.duke.bookpublishing.books.dto;

import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.sales.BookFinancialSummary;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Book detail response data - includes book financials")
public record BookDetailResponse(
    @Schema(description = "Unique book identifier") Long id,
    @Schema(description = "Book title") String title,
    @Schema(description = "Author name") String author,
    @Schema(description = "Author Id") Long authorId,
    @Schema(description = "ISBN-13 identifier") String isbn13,
    @Schema(description = "ISBN-10 identifier") String isbn10,
    @Schema(description = "Publication year") Integer publicationYear,
    @Schema(description = "Publication month (1-12)") Integer publicationMonth,
    @Schema(description = "Author royalty rate") BigDecimal royaltyRate,
    @Schema(description = "Total sales quantity to date") Long totalSalesToDate,
    @Schema(description = "Total publisher revenue earned from this book") BigDecimal revenue,
    @Schema(description = "Total author unpaid royalty from the book") BigDecimal unpaidRoyalty,
    @Schema(description = "Total author paid royalty from the book") BigDecimal paidRoyalty,
    @Schema(description = "Total royalty earned by the author (both paid and unpaid)")
        BigDecimal totalRoyalty) {

  public static BookDetailResponse from(Book book, BookFinancialSummary financialSummary) {
    return new BookDetailResponse(
        book.getId(),
        book.getTitle(),
        book.getAuthor().getName(),
        book.getAuthor().getId(),
        book.getIsbn13(),
        book.getIsbn10(),
        book.getPublicationYear(),
        book.getPublicationMonth(),
        book.getRoyaltyRate(),
        financialSummary.totalUnitsSold(),
        financialSummary.revenue(),
        financialSummary.unpaidRoyalty(),
        financialSummary.paidRoyalty(),
        financialSummary.totalRoyalty());
  }
}
