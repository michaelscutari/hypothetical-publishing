package edu.duke.bookpublishing.author.dto;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import edu.duke.bookpublishing.author.Author;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Response body for an author")
public record AuthorResponse(
    @Schema(description = "Author id", requiredMode = REQUIRED) Long id,
    @Schema(description = "Author name", requiredMode = REQUIRED) String name,
    @Schema(description = "Author email") String email,
    @Schema(description = "Number of books written by the author", requiredMode = REQUIRED)
        Long bookCount,
    @Schema(
            description = "Total royalty earned by the author (both paid and unpaid)",
            requiredMode = REQUIRED)
        BigDecimal totalRoyalty,
    @Schema(description = "Total royalty paid to the author", requiredMode = REQUIRED)
        BigDecimal paidRoyalty,
    @Schema(description = "Total royalty unpaid to the author", requiredMode = REQUIRED)
        BigDecimal unpaidRoyalty,
    @Schema(description = "Paypal.me account name") String paypalAccount,
    @Schema(description = "Venmo account name") String venmoAccount) {

  public static AuthorResponse from(Author author) {
    return new AuthorResponse(
        author.getId(),
        author.getName(),
        author.getEmail(),
        author.getBookCount(),
        author.getTotalRoyalty(),
        author.getPaidRoyalty(),
        author.getUnpaidRoyalty(),
        author.getPaypalAccount(),
        author.getVenmoAccount());
  }
}
