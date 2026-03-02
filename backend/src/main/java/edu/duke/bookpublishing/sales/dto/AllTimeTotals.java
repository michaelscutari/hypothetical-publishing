package edu.duke.bookpublishing.sales.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "All-time totals section in the royalty report")
public record AllTimeTotals(
    @Schema(description = "Per-book all-time rows") List<ReportBookRow> books,
    @Schema(description = "Grand totals across all books") ReportBookRow totals) {}
