package edu.duke.bookpublishing.sales.dto;

import edu.duke.bookpublishing.sales.Sale;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

/**
 * DTO For a Sale Response
 *
 * @author Daniel Rodriguez-Florido
 */
@Schema(description = "Sale response data")
public record SaleResponse(
    @Schema(description = "Unique sale identifier id") Long id,
    @Schema(description = "Unique identifier for the sold book") Long bookId,
    @Schema(description = "Title of the sold book") String bookTitle,
    @Schema(description = "Author of the sold book") String bookAuthor,
    @Schema(description = "Month of the sale") Integer saleMonth,
    @Schema(description = "Year of the sale") Integer saleYear,
    @Schema(description = "Quantity of books sold") Integer quantitySold,
    @Schema(description = "Revenue of the publisher") BigDecimal publisherRevenue,
    @Schema(description = "The amount the author was paid") BigDecimal authorRoyalty,
    @Schema(description = "Indicates whether the author has been paid or not")
        boolean hasAuthorBeenPaid) {

  public static SaleResponse from(Sale sale) {
    return new SaleResponse(
        sale.getId(),
        sale.getBook().getId(),
        sale.getBook().getTitle(),
        sale.getBook().getAuthor(),
        sale.getSaleMonth(),
        sale.getSaleYear(),
        sale.getQuantitySold(),
        sale.getPublisherRevenue(),
        sale.getAuthorRoyalty(),
        sale.getHasAuthorBeenPaid());
  }
}
