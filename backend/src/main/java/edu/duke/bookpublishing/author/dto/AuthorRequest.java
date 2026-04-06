package edu.duke.bookpublishing.author.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request body for creating or updating an author")
public record AuthorRequest(
    @Schema(description = "Author name", example = "Fitzgerald, F. Scott", requiredMode = REQUIRED)
        @NotBlank(message = "Author name is required")
        String name,
    @Schema(
            description = "Author email",
            example = "fitzgerald@example.com",
            requiredMode = REQUIRED)
        @NotBlank(message = "Author email is required")
        @Email(message = "Must be a valid email address")
        String email,
    @Schema(description = "Paypal.me account name") String paypalAccount,
    @Schema(description = "Venmo account name") String venmoAccount) {}
