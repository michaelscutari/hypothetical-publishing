package edu.duke.bookpublishing.sales.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import edu.duke.bookpublishing.sales.parser.ParsingError;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Response after importing sales for either preview or saving.")
public record SalesImportResponse(
    @Schema(
            description = "List of sales that are going to be or were saved",
            requiredMode = REQUIRED)
        List<SaleResponse> savedSales,
    @Schema(description = "List of file parsing errors", requiredMode = REQUIRED)
        List<ParsingError> parseErrors,
    @Schema(
            description = "List of validation errors when mapping rows to Sale objects",
            requiredMode = REQUIRED)
        List<ParsingError> validationErrors,
    @Schema(description = "List of non-blocking warnings", requiredMode = REQUIRED)
        List<ParsingError> warnings,
    @Schema(description = "Deduplicated unknown Kickstarter item tags", requiredMode = REQUIRED)
        List<String> unknownItemTags,
    @Schema(description = "Rows with unsuccessful pledge status", requiredMode = REQUIRED)
        List<Long> unsuccessfulPledgeRows) {

  public SalesImportResponse(
      List<SaleResponse> savedSales,
      List<ParsingError> parseErrors,
      List<ParsingError> validationErrors,
      List<ParsingError> warnings) {
    this(savedSales, parseErrors, validationErrors, warnings, List.of(), List.of());
  }
}
