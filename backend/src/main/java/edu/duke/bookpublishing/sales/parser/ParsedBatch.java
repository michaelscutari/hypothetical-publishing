package edu.duke.bookpublishing.sales.parser;

import java.time.LocalDateTime;
import java.util.List;

public record ParsedBatch<T> (
    LocalDateTime timestamp,
    List<T> records,
    List<ParsingError> parsingErrors
) {}
