package edu.duke.bookpublishing.sales.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Author royalty report data")
public record AuthorRoyaltyReportResponse(
    @Schema(description = "Author ID") Long authorId,
    @Schema(description = "Author name") String authorName,
    @Schema(description = "Author email") String authorEmail,
    @Schema(description = "Report generation date") String generatedDate,
    @Schema(description = "Start quarter (1-4)") Integer startQuarter,
    @Schema(description = "Start year") Integer startYear,
    @Schema(description = "End quarter (1-4)") Integer endQuarter,
    @Schema(description = "End year") Integer endYear,
    @Schema(description = "Books in the report") List<BookReportData> books,
    @Schema(description = "Quarterly breakdowns") List<QuarterReportData> quarters,
    @Schema(description = "All-time totals") TotalReportData allTimeTotals) {}
