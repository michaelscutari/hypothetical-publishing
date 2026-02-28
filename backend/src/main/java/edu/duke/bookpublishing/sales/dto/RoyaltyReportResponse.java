package edu.duke.bookpublishing.sales.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Full author royalty report")
public record RoyaltyReportResponse(
    @Schema(description = "Author name") String author,
    @Schema(description = "Start quarter (1-4)") int startQuarter,
    @Schema(description = "Start year") int startYear,
    @Schema(description = "End quarter (1-4)") int endQuarter,
    @Schema(description = "End year") int endYear,
    @Schema(description = "Quarter-by-quarter sections") List<QuarterSection> quarters,
    @Schema(description = "All-time totals across all sales for this author")
        AllTimeTotals allTime) {}
