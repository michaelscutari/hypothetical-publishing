package edu.duke.bookpublishing.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Password change request")
public record ChangePasswordRequest(
    @Schema(description = "Current password") @NotBlank String currentPassword,
    @Schema(description = "New password") @NotBlank String newPassword,
    @Schema(description = "Confirm new password") @NotBlank String confirmPassword) {}
