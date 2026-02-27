package edu.duke.bookpublishing.sales.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Book sales data for a specific quarter")
public record QuarterBookData(
    @Schema(description = "Quarter (1-4)") Integer quarter,
    @Schema(description = "Year") Integer year,
    @Schema(description = "Totals for this book in this quarter") TotalReportData totals) {}
