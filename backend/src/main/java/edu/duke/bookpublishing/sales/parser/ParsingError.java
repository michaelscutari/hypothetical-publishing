package edu.duke.bookpublishing.sales.parser;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import io.swagger.v3.oas.annotations.media.Schema;

public record ParsingError(
    @Schema(requiredMode = REQUIRED) long rowNumber,
    @Schema(requiredMode = REQUIRED) String[] rawLine,
    @Schema(requiredMode = REQUIRED) String errorMessage) {}
