package edu.duke.bookpublishing.author.dto;

import edu.duke.bookpublishing.author.Author;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Response body for an author")
public record AuthorResponse(
    @Schema(description = "Author id") Long id,
    @Schema(description = "Author name") String name,
    @Schema(description = "Author email") String email,
    @Schema(description = "Number of books written by the author") Long bookCount,
    @Schema(description = "Total royalty earned by the author (both paid and unpaid)")
        BigDecimal totalRoyalty,
    @Schema(description = "Total royalty paid to the author") BigDecimal paidRoyalty,
    @Schema(description = "Total royalty unpaid to the author") BigDecimal unpaidRoyalty) {

  public static AuthorResponse from(Author author) {
    return new AuthorResponse(
        author.getId(),
        author.getName(),
        author.getEmail(),
        author.getBookCount(),
        author.getTotalRoyalty(),
        author.getPaidRoyalty(),
        author.getUnpaidRoyalty());
  }
}
