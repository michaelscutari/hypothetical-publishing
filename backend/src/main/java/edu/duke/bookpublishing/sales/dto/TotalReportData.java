package edu.duke.bookpublishing.sales.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Aggregated sales data")
public record TotalReportData(
    @Schema(description = "Total quantity sold") Integer quantitySold,
    @Schema(description = "Total quantity handsold (subset of quantitySold)")
        Integer quantityHandsold,
    @Schema(description = "Unpaid author royalty") BigDecimal authorRoyaltyUnpaid,
    @Schema(description = "Paid author royalty") BigDecimal authorRoyaltyPaid,
    @Schema(description = "Total author royalty (paid + unpaid)") BigDecimal authorRoyaltyTotal) {}
