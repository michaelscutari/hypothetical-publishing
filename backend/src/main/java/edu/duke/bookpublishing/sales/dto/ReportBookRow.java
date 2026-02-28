package edu.duke.bookpublishing.sales.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "A single book row in a royalty report quarter or all-time section")
public record ReportBookRow(
    @Schema(description = "Display name — series name (position) or standalone title")
        String displayName,
    @Schema(description = "Book title") String title,
    @Schema(description = "Series name (null if not part of a series)") String seriesName,
    @Schema(description = "Position in series (null if not part of a series)")
        Integer seriesPosition,
    @Schema(description = "Total quantity sold") int quantity,
    @Schema(description = "Quantity from handsold source") int handsold,
    @Schema(description = "Unpaid author royalty") BigDecimal unpaidRoyalty,
    @Schema(description = "Paid author royalty") BigDecimal paidRoyalty,
    @Schema(description = "Total author royalty (paid + unpaid)") BigDecimal totalRoyalty) {}
