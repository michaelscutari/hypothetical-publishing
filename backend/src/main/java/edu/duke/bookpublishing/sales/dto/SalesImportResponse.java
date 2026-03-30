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
        List<ParsingError> warnings) {}
