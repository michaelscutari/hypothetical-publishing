package edu.duke.bookpublishing.sales.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "All-time totals section in the royalty report")
public record AllTimeTotals(
    @Schema(description = "Per-book all-time rows", requiredMode = REQUIRED)
        List<ReportBookRow> books,
    @Schema(description = "Grand totals across all books", requiredMode = REQUIRED)
        ReportBookRow totals) {}
