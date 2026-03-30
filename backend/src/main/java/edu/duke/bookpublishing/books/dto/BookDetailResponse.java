package edu.duke.bookpublishing.books.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.sales.BookFinancialSummary;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Book detail response data - includes book financials")
public record BookDetailResponse(
    @Schema(description = "Unique book identifier", requiredMode = REQUIRED) Long id,
    @Schema(description = "Book title", requiredMode = REQUIRED) String title,
    @Schema(description = "Author name", requiredMode = REQUIRED) String author,
    @Schema(description = "Author Id", requiredMode = REQUIRED) Long authorId,
    @Schema(description = "ISBN-13 identifier", requiredMode = REQUIRED) String isbn13,
    @Schema(description = "ISBN-10 identifier") String isbn10,
    @Schema(description = "Publication year", requiredMode = REQUIRED) Integer publicationYear,
    @Schema(description = "Publication month (1-12)", requiredMode = REQUIRED)
        Integer publicationMonth,
    @Schema(description = "Distributor author royalty rate", requiredMode = REQUIRED)
        BigDecimal distributorAuthorRoyaltyRate,
    @Schema(description = "Handsold author royalty rate", requiredMode = REQUIRED)
        BigDecimal handsoldAuthorRoyaltyRate,
    @Schema(description = "Series name") String seriesName,
    @Schema(description = "Series position") Integer seriesPosition,
    @Schema(description = "Cover price (USD)", requiredMode = REQUIRED) BigDecimal coverPrice,
    @Schema(description = "Print cost (USD)", requiredMode = REQUIRED) BigDecimal printCost,
    @Schema(description = "Amazon Ebook ASIN") String amazonEbookAsin,
    @Schema(description = "Total sales quantity to date", requiredMode = REQUIRED)
        Long totalSalesToDate,
    @Schema(description = "Total publisher revenue earned from this book", requiredMode = REQUIRED)
        BigDecimal revenue,
    @Schema(description = "Total author unpaid royalty from the book", requiredMode = REQUIRED)
        BigDecimal unpaidRoyalty,
    @Schema(description = "Total author paid royalty from the book", requiredMode = REQUIRED)
        BigDecimal paidRoyalty,
    @Schema(
            description = "Total royalty earned by the author (both paid and unpaid)",
            requiredMode = REQUIRED)
        BigDecimal totalRoyalty,
    @Schema(description = "Whether this book has a cover image", requiredMode = REQUIRED)
        Boolean hasCover) {

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
        book.getDistributorAuthorRoyaltyRate(),
        book.getHandsoldAuthorRoyaltyRate(),
        book.getSeriesName(),
        book.getSeriesPosition(),
        book.getCoverPrice(),
        book.getPrintCost(),
        book.getAmazonEbookAsin(),
        financialSummary.totalUnitsSold(),
        financialSummary.revenue(),
        financialSummary.unpaidRoyalty(),
        financialSummary.paidRoyalty(),
        financialSummary.totalRoyalty(),
        book.getCoverImage() != null);
  }
}
