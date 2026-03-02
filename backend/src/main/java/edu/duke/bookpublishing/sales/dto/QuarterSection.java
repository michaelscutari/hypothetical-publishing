package edu.duke.bookpublishing.sales.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "One fiscal quarter in the royalty report")
public record QuarterSection(
    @Schema(description = "Quarter number (1-4)") int quarter,
    @Schema(description = "Year") int year,
    @Schema(description = "Book rows for this quarter") List<ReportBookRow> books,
    @Schema(description = "Totals row for this quarter") ReportBookRow totals) {}
