package edu.duke.bookpublishing.sales.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.List;

/** DTO for grouped author payments data. */
@Schema(description = "Grouped author payments response")
public record AuthorPaymentGroupResponse(
    @Schema(description = "Author ID", requiredMode = REQUIRED) Long authorId,
    @Schema(description = "Author name", requiredMode = REQUIRED) String author,
    @Schema(description = "Author's paypal.me username") String paypalAccount,
    @Schema(description = "Author's Venmo username") String venmoAccount,
    @Schema(description = "Total unpaid author royalty for this author", requiredMode = REQUIRED)
        BigDecimal unpaidTotal,
    @Schema(description = "Sales rows for this author", requiredMode = REQUIRED)
        List<AuthorPaymentSaleResponse> sales) {}
