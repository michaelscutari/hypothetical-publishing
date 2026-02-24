package edu.duke.bookpublishing.sales.parser;

public record ParsingError(
    long rowNumber,
    String[] rawLine,
    String errorMessage
) {}
