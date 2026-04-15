package edu.duke.bookpublishing.config;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Serves publisher branding (name, short name, logo URL) sourced from environment variables so the
 * deployed instance can be rebadged without a code change (Ev4 §1.15). Public endpoint — branding
 * is needed on the login page before auth is established.
 */
@RestController
@RequestMapping("/api/config")
@Tag(name = "Config", description = "Runtime configuration exposed to the frontend")
public class BrandingController {

  private final String publisherName;
  private final String publisherShortName;
  private final String logoUrl;

  public BrandingController(
      @Value("${app.publisher.name:Hypothetical Publishing}") String publisherName,
      @Value("${app.publisher.short-name:HP}") String publisherShortName,
      @Value("${app.publisher.logo-url:/branding/logo.svg}") String logoUrl) {
    this.publisherName = publisherName;
    this.publisherShortName = publisherShortName;
    this.logoUrl = logoUrl;
  }

  @GetMapping("/branding")
  @Operation(summary = "Get publisher branding for white-label display")
  public BrandingResponse getBranding() {
    return new BrandingResponse(publisherName, publisherShortName, logoUrl);
  }
}
