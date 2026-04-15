package edu.duke.bookpublishing.config;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Branding configuration returned to the frontend so UI elements (title, login banner, dashboard
 * header, royalty report PDF header) can be rebadged for white-label deployments without a code
 * change. See Ev4 §1.15.
 */
@Schema(description = "Branding configuration for white-label display")
public record BrandingResponse(
    @Schema(description = "Publisher display name", example = "Hypothetical Publishing")
        String publisherName,
    @Schema(description = "Short publisher name for compact UI spots", example = "HP")
        String publisherShortName,
    @Schema(description = "Path to the publisher logo asset", example = "/branding/logo.svg")
        String logoUrl) {}
