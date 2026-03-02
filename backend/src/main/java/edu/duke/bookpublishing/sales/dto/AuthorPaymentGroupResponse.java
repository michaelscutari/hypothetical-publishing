package edu.duke.bookpublishing.sales.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.List;

/** DTO for grouped author payments data. */
@Schema(description = "Grouped author payments response")
public record AuthorPaymentGroupResponse(
    @Schema(description = "Author ID") Long authorId,
    @Schema(description = "Author name") String author,
    @Schema(description = "Total unpaid author royalty for this author") BigDecimal unpaidTotal,
    @Schema(description = "Sales rows for this author") List<AuthorPaymentSaleResponse> sales) {}
