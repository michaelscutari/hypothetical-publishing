package edu.duke.bookpublishing.sales.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;

@Schema(description = "Request object for CSV import")
public record IngramImportRequest(
    @Schema(description = "The month in which the sale was made")
        @NotNull(message = "saleMonth.isRequired")
        @Min(1)
        @Max(12)
        Integer saleMonth,
    @Schema(description = "The year in which the sale was made")
        @NotNull(message = "year.isRequired")
        @Min(1900)
        @Max(2100)
        Integer saleYear,
    @Schema(description = "The CSV file that we wish to import")
        @NotNull(message = "csvFile.isRequired")
        MultipartFile csvFile,
    @Schema(description = "Indicates if it is a preview request or not")
        @NotNull(message = "isPreview.isRequired")
        Boolean isPreview) {}
