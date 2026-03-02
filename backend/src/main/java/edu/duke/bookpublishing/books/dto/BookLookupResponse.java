package edu.duke.bookpublishing.books.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Prefill response for book lookup by ISBN")
// Lookup-only payload (not persisted), unlike BookResponse which represents stored books.
public record BookLookupResponse(
    @Schema(description = "Book title") String title,
    @Schema(description = "Author name(s)") String author,
    @Schema(description = "ISBN-13 identifier") String isbn13,
    @Schema(description = "ISBN-10 identifier") String isbn10,
    @Schema(description = "Publication year") Integer publicationYear,
    @Schema(description = "Publication month (1-12)") Integer publicationMonth,
    @Schema(description = "Cover image URL") String coverImage) {}
