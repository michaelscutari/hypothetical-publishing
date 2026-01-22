package edu.duke.bookpublishing.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Current user info")
public record UserResponse(@Schema(description = "Username") String username) {}
