package edu.duke.bookpublishing.auth.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Login credentials")
public record LoginRequest(
    @Schema(description = "Username", example = "admin", requiredMode = REQUIRED)
        @NotBlank
        String username,
    @Schema(description = "Password", example = "password", requiredMode = REQUIRED)
        @NotBlank
        String password) {}
