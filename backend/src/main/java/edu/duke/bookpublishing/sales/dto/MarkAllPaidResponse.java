package edu.duke.bookpublishing.sales.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** Response body for marking all unpaid sales for an author as paid. */
@Schema(description = "Response after marking an author's unpaid sales as paid")
public record MarkAllPaidResponse(@Schema(description = "Author name") String author,
        @Schema(description = "Number of sales marked as paid") int updatedCount) {
}
