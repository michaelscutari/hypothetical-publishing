package edu.duke.bookpublishing.sales.parser;

import java.time.LocalDateTime;
import java.util.List;

public record ParsedBatch<T>(
    LocalDateTime timestamp,
    List<T> records,
    List<ParsingError> parsingErrors,
    List<ParsingError> parsingWarnings) {

  public ParsedBatch(LocalDateTime timestamp, List<T> records, List<ParsingError> parsingErrors) {
    this(timestamp, records, parsingErrors, List.of());
  }
}
