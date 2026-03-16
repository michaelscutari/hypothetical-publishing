package edu.duke.bookpublishing.sales.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import edu.duke.bookpublishing.sales.Sale;
import edu.duke.bookpublishing.sales.enums.SaleSource;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

/**
 * DTO For a Sale Response
 *
 * @author Daniel Rodriguez-Florido
 */
@Schema(description = "Sale response data")
public record SaleResponse(
    @Schema(description = "Unique sale identifier id", requiredMode = REQUIRED) Long id,
    @Schema(description = "Unique identifier for the sold book", requiredMode = REQUIRED)
        Long bookId,
    @Schema(description = "Title of the sold book", requiredMode = REQUIRED) String bookTitle,
    @Schema(description = "Author of the sold book", requiredMode = REQUIRED) String bookAuthor,
    @Schema(description = "Sale source (distributor or handsold)", requiredMode = REQUIRED)
        SaleSource saleSource,
    @Schema(description = "Author ID of the sold book", requiredMode = REQUIRED) Long authorId,
    @Schema(description = "Month of the sale", requiredMode = REQUIRED) Integer saleMonth,
    @Schema(description = "Year of the sale", requiredMode = REQUIRED) Integer saleYear,
    @Schema(description = "Quantity of books sold", requiredMode = REQUIRED) Integer quantitySold,
    @Schema(description = "Revenue of the publisher", requiredMode = REQUIRED)
        BigDecimal publisherRevenue,
    @Schema(description = "The amount the author was paid", requiredMode = REQUIRED)
        BigDecimal authorRoyalty,
    @Schema(
            description = "Indicates whether the author has been paid or not",
            requiredMode = REQUIRED)
        boolean hasAuthorBeenPaid,
    @Schema(description = "Optional comment") String comment) {

  public static SaleResponse from(Sale sale) {
    return new SaleResponse(
        sale.getId(),
        sale.getBook().getId(),
        sale.getBook().getTitle(),
        sale.getBook().getAuthor().getName(),
        sale.getSaleSource(),
        sale.getBook().getAuthor().getId(),
        sale.getSaleMonth(),
        sale.getSaleYear(),
        sale.getQuantitySold(),
        sale.getPublisherRevenue(),
        sale.getAuthorRoyalty(),
        sale.getHasAuthorBeenPaid(),
        sale.getComment());
  }
}
