package edu.duke.bookpublishing.auth.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Password change request")
public record ChangePasswordRequest(
    @Schema(description = "Current password", requiredMode = REQUIRED)
        @NotBlank
        String currentPassword,
    @Schema(description = "New password", requiredMode = REQUIRED) @NotBlank String newPassword,
    @Schema(description = "Confirm new password", requiredMode = REQUIRED)
        @NotBlank
        String confirmPassword) {}
