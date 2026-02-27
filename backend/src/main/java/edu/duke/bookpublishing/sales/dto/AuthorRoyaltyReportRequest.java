package edu.duke.bookpublishing.sales.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request parameters for author royalty report")
public record AuthorRoyaltyReportRequest(
    @NotNull @Schema(description = "Author ID") Long authorId,
    @NotNull @Min(1) @Max(4) @Schema(description = "Start quarter (1-4)") Integer startQuarter,
    @NotNull @Min(1900) @Max(2100) @Schema(description = "Start year") Integer startYear,
    @NotNull @Min(1) @Max(4) @Schema(description = "End quarter (1-4)") Integer endQuarter,
    @NotNull @Min(1900) @Max(2100) @Schema(description = "End year") Integer endYear) {}
