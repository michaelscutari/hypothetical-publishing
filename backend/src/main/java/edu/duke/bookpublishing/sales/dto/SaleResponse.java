package edu.duke.bookpublishing.sales.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import edu.duke.bookpublishing.sales.Sale;
import edu.duke.bookpublishing.sales.enums.Currency;
import edu.duke.bookpublishing.sales.enums.SaleDistributor;
import edu.duke.bookpublishing.sales.enums.SaleFormat;
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
    @Schema(
            description = "Sale source (distributor, handsold, or kickstarter)",
            requiredMode = REQUIRED)
        SaleSource saleSource,
    @Schema(description = "Distributor of the sale", example = "AMAZON", requiredMode = REQUIRED)
        SaleDistributor distributor,
    @Schema(
            description = "Format of the book that was sold",
            example = "PRINT",
            requiredMode = REQUIRED)
        SaleFormat format,
    @Schema(description = "Author ID of the sold book", requiredMode = REQUIRED) Long authorId,
    @Schema(description = "Month of the sale", requiredMode = REQUIRED) Integer saleMonth,
    @Schema(description = "Year of the sale", requiredMode = REQUIRED) Integer saleYear,
    @Schema(description = "Quantity of books sold") Integer quantitySold,
    @Schema(description = "KENP of the ebooks sold. Only present for ebooks") Integer kenp,
    @Schema(description = "Currency the sale was made in", requiredMode = REQUIRED)
        Currency saleCurrency,
    @Schema(
            description = "Revenue of the publisher in the original sale currency",
            requiredMode = REQUIRED)
        BigDecimal originalPublisherRevenue,
    @Schema(description = "Revenue of the publisher in USD", requiredMode = REQUIRED)
        BigDecimal publisherRevenue,
    @Schema(description = "The amount the author was paid", requiredMode = REQUIRED)
        BigDecimal authorRoyalty,
    @Schema(
            description = "Indicates whether the author has been paid or not",
            requiredMode = REQUIRED)
        boolean hasAuthorBeenPaid,
    @Schema(description = "Optional comment") String comment,
    @Schema(
            description =
                "True if this sale is for an unreleased book (projected/not yet eligible for payment)",
            requiredMode = REQUIRED)
        Boolean isProjected) {

  public static SaleResponse from(Sale sale) {
    return new SaleResponse(
        sale.getId(),
        sale.getBook().getId(),
        sale.getBook().getTitle(),
        sale.getBook().getAuthor().getName(),
        sale.getSaleSource(),
        sale.getDistributor(),
        sale.getFormat(),
        sale.getBook().getAuthor().getId(),
        sale.getSaleMonth(),
        sale.getSaleYear(),
        sale.getQuantitySold(),
        sale.getKenp(),
        sale.getSaleCurrency(),
        sale.getOriginalPublisherRevenue(),
        sale.getPublisherRevenue(),
        sale.getAuthorRoyalty(),
        sale.getHasAuthorBeenPaid(),
        sale.getComment(),
        !sale.getBook().getReleased());
  }
}
