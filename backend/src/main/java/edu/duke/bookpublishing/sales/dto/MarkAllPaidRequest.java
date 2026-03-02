package edu.duke.bookpublishing.sales.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/** Request body for marking all unpaid sales for an author as paid. */
@Schema(description = "Request to mark all unpaid sales for an author as paid")
public record MarkAllPaidRequest(
    @Schema(description = "Author id to mark payments as paid", example = "42")
        @NotNull(message = "authorId is required")
        Long authorId) {}
