package edu.duke.bookpublishing.dto;

import edu.duke.bookpublishing.validation.ISBN10;
import edu.duke.bookpublishing.validation.ISBN13;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record BookRequest(
    @NotBlank(message = "Title is required") String title,
    @NotBlank(message = "Author is required") String author,
    @NotBlank(message = "ISBN-13 is required") @ISBN13 String isbn13,
    @ISBN10 String isbn10,
    @NotNull(message = "Publication date is required") LocalDate publicationDate,
    @DecimalMin("0.0") @DecimalMax("1.0") BigDecimal royaltyRate) {}
