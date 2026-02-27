package edu.duke.bookpublishing.sales.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Book data in the royalty report")
public record BookReportData(
    @Schema(description = "Book ID") Long bookId,
    @Schema(description = "Book title") String title,
    @Schema(description = "Series name") String seriesName,
    @Schema(description = "Series position") Integer seriesPosition,
    @Schema(description = "Publication year") Integer publicationYear,
    @Schema(description = "Publication month") Integer publicationMonth,
    @Schema(description = "Quarterly data for this book") List<QuarterBookData> quarters,
    @Schema(description = "All-time totals for this book") TotalReportData totals) {}
