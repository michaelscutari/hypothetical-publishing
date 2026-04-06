package edu.duke.bookpublishing.sales.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import edu.duke.bookpublishing.sales.enums.Currency;
import edu.duke.bookpublishing.sales.enums.SaleDistributor;
import edu.duke.bookpublishing.sales.enums.SaleFormat;
import edu.duke.bookpublishing.sales.enums.SaleSource;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
    @Schema(
            description = "The id of the corresponding book that was sold",
            example = "74398738961",
            requiredMode = REQUIRED)
        @NotNull(message = "Book is required")
        Long bookId,
    @Schema(
            description = "Sale source (distributor, handsold, or kickstarter)",
            example = "distributor",
            requiredMode = REQUIRED)
        @NotNull(message = "Sale source is required")
        SaleSource saleSource,
    @Schema(description = "The distributor through which the sale was made", example = "AMAZON")
        SaleDistributor distributor,
    @Schema(
            description = "The format of the book that was sold",
            example = "PRINT",
            requiredMode = REQUIRED)
        @NotNull(message = "Sale format is required")
        SaleFormat format,
    @Schema(description = "The month the sale was made", example = "1", requiredMode = REQUIRED)
        @NotNull(message = "Sale Month is required")
        @Min(1)
        @Max(12)
        Integer saleMonth,
    @Schema(description = "The year the sale was made", example = "2024", requiredMode = REQUIRED)
        @NotNull(message = "Sale year is required")
        @Min(1900)
        @Max(2100)
        Integer saleYear,
    @Schema(description = "The amount of books sold in this sale", example = "50") @Positive
        Integer quantitySold,
    @Schema(
            description = "The KENP pages read in this sale, required for handsold sales",
            example = "200")
        @Positive
        Integer kenp,
    @Schema(
            description = "The currency that the sale was originally made in",
            example = "USD",
            requiredMode = REQUIRED)
        @NotNull(message = "Sale Currency is required")
        Currency saleCurrency,
    @Schema(
            description =
                "Publisher revenue in the original currency of the sale. Required for distributor sales",
            example = "USD",
            requiredMode = REQUIRED)
        @DecimalMin(value = "0.00")
        BigDecimal originalPublisherRevenue,
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

  @AssertTrue(message = "Invalid fields for sale source")
  @Schema(hidden = true)
  public boolean isValidForSource() {
    if (saleSource == null) return true;
    if (saleSource.requiresDistributor()) {
      return distributor != null
          && publisherRevenue != null
          && (format == null || distributor.allowsFormat(format));
    }
    // HAND_SOLD / KICKSTARTER: no distributor, no revenue input, USD only
    if (distributor != null || publisherRevenue != null) return false;
    if (saleCurrency != null && saleCurrency != Currency.USD) return false;
    if (format == null) return true;
    if (saleSource == SaleSource.HAND_SOLD) return format == SaleFormat.PRINT;
    if (saleSource == SaleSource.KICKSTARTER)
      return format == SaleFormat.PRINT || format == SaleFormat.EBOOK;
    return false;
  }

  @AssertTrue(
      message =
          "KINDLE_UNLIMITED requires KENP and no quantity; other formats require quantity and no"
              + " KENP")
  @Schema(hidden = true)
  public boolean isFormatFieldsValid() {
    if (format == null) return true;
    if (format == SaleFormat.KINDLE_UNLIMITED) {
      return kenp != null && quantitySold == null;
    }
    return quantitySold != null && kenp == null;
  }
}
