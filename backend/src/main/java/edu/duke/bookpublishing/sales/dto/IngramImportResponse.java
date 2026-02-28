package edu.duke.bookpublishing.sales.dto;

import edu.duke.bookpublishing.sales.parser.ParsingError;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Response after uploading an ingram CSV for either preview or saving.")
public record IngramImportResponse(
    @Schema(description = "List of sales that are going to be or were saved")
        List<SaleResponse> savedSales,
    @Schema(description = "List of errors in the csv file") List<ParsingError> csvErrors,
    @Schema(description = "List of errors when mapping rows to Sale objects")
        List<ParsingError> savingErrors) {}
