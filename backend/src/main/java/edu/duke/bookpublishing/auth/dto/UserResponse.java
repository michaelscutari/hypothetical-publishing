package edu.duke.bookpublishing.auth.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Current user info")
public record UserResponse(
    @Schema(description = "Username", requiredMode = REQUIRED) String username) {}
