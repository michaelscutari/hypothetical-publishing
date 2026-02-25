package edu.duke.bookpublishing.sales.dto;

import edu.duke.bookpublishing.sales.parser.ParsingError;
import java.util.List;

public record IngramImportResult(
    Integer savedSales, List<ParsingError> csvErrors, List<ParsingError> savingErrors) {}
