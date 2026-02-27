package edu.duke.bookpublishing.sales.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Quarter totals across all books")
public record QuarterReportData(
    @Schema(description = "Quarter (1-4)") Integer quarter,
    @Schema(description = "Year") Integer year,
    @Schema(description = "Totals for this quarter") TotalReportData totals) {}
