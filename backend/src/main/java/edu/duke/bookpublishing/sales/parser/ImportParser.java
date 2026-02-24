package edu.duke.bookpublishing.sales.parser;

import org.springframework.web.multipart.MultipartFile;

public interface ImportParser<T> {

    /**
     * Returns true if this parser can handle a file with the given content type / name.
     */
    boolean supports(String contentType, String filename);

    /**
     * Parses the given file into a batch of typed records plus any row-level errors.
     */
    ParsedBatch<T> parse(MultipartFile file);

}
