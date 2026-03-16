package edu.duke.bookpublishing.sales.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "One fiscal quarter in the royalty report")
public record QuarterSection(
    @Schema(description = "Quarter number (1-4)", requiredMode = REQUIRED) int quarter,
    @Schema(description = "Year", requiredMode = REQUIRED) int year,
    @Schema(description = "Book rows for this quarter", requiredMode = REQUIRED)
        List<ReportBookRow> books,
    @Schema(description = "Totals row for this quarter", requiredMode = REQUIRED)
        ReportBookRow totals) {}
