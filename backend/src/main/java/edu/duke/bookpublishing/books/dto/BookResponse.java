package edu.duke.bookpublishing.books.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import edu.duke.bookpublishing.books.Book;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Book response data")
public record BookResponse(
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
    @Schema(description = "Total sales quantity to date", requiredMode = REQUIRED)
        Long totalSalesToDate,
    @Schema(description = "Whether this book has a cover image", requiredMode = REQUIRED)
        Boolean hasCover,
    @Schema(description = "Amazon ASIN number") String asin) {

  public static BookResponse from(Book book) {
    return from(book, 0L);
  }

  public static BookResponse from(Book book, Long totalSaleToDate) {
    return new BookResponse(
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
        totalSaleToDate,
        book.getCoverImage() != null,
        book.getAmazonEbookAsin());
  }
}
