package edu.duke.bookpublishing.sales.dto;

import java.util.List;
import edu.duke.bookpublishing.sales.parser.ParsingError;

public record IngramImportResult(
    Integer savedSales, 
    List<ParsingError> csvErrors,
    List<ParsingError> savingErrors
) {}
