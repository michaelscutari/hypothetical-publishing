package edu.duke.bookpublishing.sales.dto;

import edu.duke.bookpublishing.sales.enums.SaleSource;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.YearMonth;

/**
 * DTO for a Sale Request
 *
 * @author Daniel Rodriguez-Florido
 */
@Schema(description = "Request body for creating or updating a sale")
public record SaleRequest(
    @Schema(description = "The id of the corresponding book that was sold", example = "74398738961")
        @NotNull(message = "Book is required")
        Long bookId,
    @Schema(description = "Sale source (distributor or handsold)", example = "distributor")
        @NotNull(message = "Sale source is required")
        SaleSource saleSource,
    @Schema(description = "The month the sale was made", example = "1")
        @NotNull(message = "Sale Month is required")
        @Min(1)
        @Max(12)
        Integer saleMonth,
    @Schema(description = "The year the sale was made", example = "2024")
        @NotNull(message = "Sale year is required")
        @Min(1900)
        @Max(2100)
        Integer saleYear,
    @Schema(description = "The amount of books sold in this sale", example = "50")
        @NotNull(message = "Quantity is required")
        @PositiveOrZero
        Integer quantitySold,
    @Schema(
            description =
                "Publisher revenue in USD. Required for distributor sales; computed for handsold sales.",
            example = "1000.00")
        @DecimalMin(value = "0.00")
        BigDecimal publisherRevenue,
    @Schema(description = "Indicates whether the author has been paid", example = "true")
        Boolean hasAuthorBeenPaid,
    @Schema(description = "Optional comment", example = "Imported from Ingram Spark")
        @Size(max = 256)
        String comment) {

  // Defaults hasAuthorBeenPaid to false if not specified
  public SaleRequest {
    if (hasAuthorBeenPaid == null) {
      hasAuthorBeenPaid = false;
    }
  }

  @AssertTrue(message = "Sale date must be this month and year or earlier")
  @Schema(hidden = true)
  public boolean isDateInPast() {
    if (saleYear == null || saleMonth == null) return true;
    YearMonth requested = YearMonth.of(saleYear, saleMonth);
    return !requested.isAfter(YearMonth.now());
  }

  @AssertTrue(
      message =
          "Publisher revenue must be provided for distributor sales and omitted for handsold sales")
  @Schema(hidden = true)
  public boolean isPublisherRevenueValidForSource() {
    if (saleSource == null) return true;
    if (saleSource == SaleSource.DISTRIBUTOR) {
      return publisherRevenue != null;
    }
    return publisherRevenue == null;
  }
}
