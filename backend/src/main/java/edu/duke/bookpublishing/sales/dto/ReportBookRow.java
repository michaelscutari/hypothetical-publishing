package edu.duke.bookpublishing.sales.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "A single book row in a royalty report quarter or all-time section")
public record ReportBookRow(
    @Schema(
            description = "Display name — series name (position) or standalone title",
            requiredMode = REQUIRED)
        String displayName,
    @Schema(description = "Book title") String title,
    @Schema(description = "Series name (null if not part of a series)") String seriesName,
    @Schema(description = "Position in series (null if not part of a series)")
        Integer seriesPosition,
    @Schema(description = "Total quantity sold", requiredMode = REQUIRED) int quantity,
    @Schema(description = "Quantity from handsold source", requiredMode = REQUIRED) int handsold,
    @Schema(description = "Quantity from Ingram Spark print sales", requiredMode = REQUIRED)
        int ingramPrint,
    @Schema(description = "Quantity from Amazon print sales", requiredMode = REQUIRED)
        int amazonPrint,
    @Schema(description = "Quantity from Amazon ebook sales", requiredMode = REQUIRED)
        int amazonEbook,
    @Schema(description = "Quantity from Other distributor print sales", requiredMode = REQUIRED)
        int otherPrint,
    @Schema(description = "Quantity from Other distributor ebook sales", requiredMode = REQUIRED)
        int otherEbook,
    @Schema(description = "Total KENP pages read", requiredMode = REQUIRED) int kenpTotal,
    @Schema(description = "Unpaid author royalty", requiredMode = REQUIRED)
        BigDecimal unpaidRoyalty,
    @Schema(description = "Paid author royalty", requiredMode = REQUIRED) BigDecimal paidRoyalty,
    @Schema(description = "Total author royalty (paid + unpaid)", requiredMode = REQUIRED)
        BigDecimal totalRoyalty) {}
