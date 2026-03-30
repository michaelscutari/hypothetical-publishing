package edu.duke.bookpublishing.sales.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;

@Schema(description = "Request object for sales import")
public record SalesImportRequest(
    @Schema(description = "The month in which the sale was made (required for CSV)")
        @Min(1)
        @Max(12)
        Integer saleMonth,
    @Schema(description = "The year in which the sale was made (required for CSV)")
        @Min(1900)
        @Max(2100)
        Integer saleYear,
    @Schema(description = "The file to import", requiredMode = REQUIRED)
        @NotNull(message = "importFile.isRequired")
        MultipartFile importFile,
    @Schema(description = "Indicates if it is a preview request or not", requiredMode = REQUIRED)
        @NotNull(message = "isPreview.isRequired")
        Boolean isPreview,
    @Schema(description = "Required to commit when non-blocking warnings are present")
        Boolean acknowledgeWarnings) {

  public SalesImportRequest {
    if (acknowledgeWarnings == null) {
      acknowledgeWarnings = false;
    }
  }
}
