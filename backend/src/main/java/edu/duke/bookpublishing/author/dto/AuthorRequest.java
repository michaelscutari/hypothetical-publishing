package edu.duke.bookpublishing.author.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request body for creating or updating an author")
public record AuthorRequest(
    @Schema(description = "Author name", example = "Fitzgerald, F. Scott")
        @NotBlank(message = "Author name is required")
        String name,
    @Schema(description = "Author email", example = "fitzgerald@example.com")
        @NotBlank(message = "Author email is required")
        @Email(message = "Must be a valid email address")
        String email) {}
