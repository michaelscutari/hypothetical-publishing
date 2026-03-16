package edu.duke.bookpublishing.sales.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Full author royalty report")
public record RoyaltyReportResponse(
    @Schema(description = "Author name", requiredMode = REQUIRED) String author,
    @Schema(description = "Start quarter (1-4)", requiredMode = REQUIRED) int startQuarter,
    @Schema(description = "Start year", requiredMode = REQUIRED) int startYear,
    @Schema(description = "End quarter (1-4)", requiredMode = REQUIRED) int endQuarter,
    @Schema(description = "End year", requiredMode = REQUIRED) int endYear,
    @Schema(description = "Quarter-by-quarter sections", requiredMode = REQUIRED)
        List<QuarterSection> quarters,
    @Schema(
            description = "All-time totals across all sales for this author",
            requiredMode = REQUIRED)
        AllTimeTotals allTime) {}
