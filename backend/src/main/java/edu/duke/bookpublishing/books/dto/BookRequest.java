package edu.duke.bookpublishing.books.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import edu.duke.bookpublishing.books.validation.ASIN;
import edu.duke.bookpublishing.books.validation.ISBN10;
import edu.duke.bookpublishing.books.validation.ISBN13;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

@Schema(description = "Request body for creating or updating a book")
public record BookRequest(
    @Schema(description = "Book title", example = "The Great Gatsby", requiredMode = REQUIRED)
        @NotBlank(message = "Title is required")
        String title,
    @Schema(description = "Author ID", example = "12345", requiredMode = REQUIRED)
        @NotNull(message = "Author ID is required")
        Long authorId,
    @Schema(description = "ISBN-13 identifier", example = "9780743273565", requiredMode = REQUIRED)
        @NotBlank(message = "ISBN-13 is required")
        @ISBN13
        String isbn13,
    @Schema(description = "ISBN-10 identifier (optional)", example = "0743273567") @ISBN10
        String isbn10,
    @Schema(description = "Publication year", example = "1925", requiredMode = REQUIRED)
        @NotNull(message = "Publication year is required")
        @Min(1900)
        @Max(2100)
        Integer publicationYear,
    @Schema(description = "Publication month (1-12)", example = "4", requiredMode = REQUIRED)
        @NotNull(message = "Publication month is required")
        @Min(1)
        @Max(12)
        Integer publicationMonth,
    @Schema(description = "Distributor author royalty rate (0.0 to 1.0)", example = "0.50")
        @DecimalMin("0.0")
        @DecimalMax("1.0")
        BigDecimal distributorAuthorRoyaltyRate,
    @Schema(description = "Handsold author royalty rate (0.0 to 1.0)", example = "0.20")
        @DecimalMin("0.0")
        @DecimalMax("1.0")
        BigDecimal handsoldAuthorRoyaltyRate,
    @Schema(description = "Series name", example = "Lord of the Rings") String seriesName,
    @Schema(
            description = "Series position (positive integer). Required if series is set.",
            example = "3")
        @Positive
        Integer seriesPosition,
    @Schema(description = "Cover price (USD)", example = "19.99", requiredMode = REQUIRED)
        @NotNull(message = "Cover price is required")
        @DecimalMin("0.00")
        BigDecimal coverPrice,
    @Schema(description = "Print cost (USD)", example = "4.50", requiredMode = REQUIRED)
        @NotNull(message = "Print cost is required")
        @DecimalMin("0.00")
        BigDecimal printCost,
    @Schema(description = "Amazon ASIN Number") @ASIN String amazonEbookAsin,
    @Schema(description = "Whether this book has been released", requiredMode = REQUIRED)
        @NotNull(message = "Released status is required")
        Boolean released,
    @Schema(description = "Kickstarter item tag for ebook edition")
        @Pattern(regexp = "\\S+", message = "Kickstarter item tag must not contain whitespace")
        @Size(max = 128)
        String kickstarterItemTagEbook,
    @Schema(description = "Kickstarter item tag for print edition")
        @Pattern(regexp = "\\S+", message = "Kickstarter item tag must not contain whitespace")
        @Size(max = 128)
        String kickstarterItemTagPrint) {

  @Schema(hidden = true)
  @AssertTrue(message = "Cover price must be greater than print cost")
  public boolean isCoverPriceGreaterThanPrintCost() {
    // @NotNull handles null error reporting
    if (coverPrice == null || printCost == null) {
      return true;
    }
    return coverPrice.compareTo(printCost) >= 0;
  }

  @Schema(hidden = true)
  @AssertTrue(message = "Series position is required when series name is set")
  public boolean isSeriesConsistent() {
    if (seriesName != null && !seriesName.isBlank() && seriesPosition == null) {
      return false;
    }
    if ((seriesName == null || seriesName.isBlank()) && seriesPosition != null) {
      return false;
    }
    return true;
  }
}
