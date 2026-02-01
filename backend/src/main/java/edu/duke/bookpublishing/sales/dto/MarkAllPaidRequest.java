package edu.duke.bookpublishing.sales.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/** Request body for marking all unpaid sales for an author as paid. */
@Schema(description = "Request to mark all unpaid sales for an author as paid")
public record MarkAllPaidRequest(@Schema(description = "Author name to mark paid",
        example = "F. Scott Fitzgerald") @NotBlank(message = "Author is required") String author) {
}
