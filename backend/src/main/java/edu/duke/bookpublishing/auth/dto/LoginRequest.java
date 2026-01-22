package edu.duke.bookpublishing.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Login credentials")
public record LoginRequest(
    @Schema(description = "Username", example = "admin") @NotBlank String username,
    @Schema(description = "Password", example = "password") @NotBlank String password) {}
