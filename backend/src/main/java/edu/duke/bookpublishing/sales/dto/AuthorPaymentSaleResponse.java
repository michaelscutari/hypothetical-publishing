package edu.duke.bookpublishing.sales.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import edu.duke.bookpublishing.sales.Sale;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

/** DTO for a sale row in the author payments view. */
@Schema(description = "Sale row for author payments view")
public record AuthorPaymentSaleResponse(
    @Schema(description = "Unique sale identifier", requiredMode = REQUIRED) Long id,
    @Schema(description = "Unique identifier for the sold book", requiredMode = REQUIRED)
        Long bookId,
    @Schema(description = "Book title", requiredMode = REQUIRED) String bookTitle,
    @Schema(description = "Book author", requiredMode = REQUIRED) String bookAuthor,
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
        boolean hasAuthorBeenPaid) {

  public static AuthorPaymentSaleResponse from(Sale sale) {
    return new AuthorPaymentSaleResponse(
        sale.getId(),
        sale.getBook().getId(),
        sale.getBook().getTitle(),
        sale.getBook().getAuthor().getName(),
        sale.getSaleMonth(),
        sale.getSaleYear(),
        sale.getQuantitySold(),
        sale.getPublisherRevenue(),
        sale.getAuthorRoyalty(),
        sale.getHasAuthorBeenPaid());
  }
}
