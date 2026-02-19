package edu.duke.bookpublishing.books.dto;

import edu.duke.bookpublishing.books.validation.ISBN10;
import edu.duke.bookpublishing.books.validation.ISBN13;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

@Schema(description = "Request body for creating or updating a book")
public record BookRequest(
    @Schema(description = "Book title", example = "The Great Gatsby")
        @NotBlank(message = "Title is required")
        String title,
    @Schema(description = "Author name(s)", example = "Fitzgerald, F. Scott")
        @NotNull(message = "Author ID is required")
        Long authorId,
    @Schema(description = "ISBN-13 identifier", example = "9780743273565")
        @NotBlank(message = "ISBN-13 is required")
        @ISBN13
        String isbn13,
    @Schema(description = "ISBN-10 identifier (optional)", example = "0743273567") @ISBN10
        String isbn10,
    @Schema(description = "Publication year", example = "1925")
        @NotNull(message = "Publication year is required")
        @Min(1900)
        @Max(2100)
        Integer publicationYear,
    @Schema(description = "Publication month (1-12)", example = "4")
        @NotNull(message = "Publication month is required")
        @Min(1)
        @Max(12)
        Integer publicationMonth,
    @Schema(description = "Author royalty rate (0.0 to 1.0)", example = "0.50")
        @DecimalMin("0.0")
        @DecimalMax("1.0")
        BigDecimal royaltyRate) {}
