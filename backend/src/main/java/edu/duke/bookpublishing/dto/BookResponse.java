package edu.duke.bookpublishing.dto;

import edu.duke.bookpublishing.model.Book;
import java.math.BigDecimal;
import java.time.LocalDate;

public record BookResponse(
    Long id,
    String title,
    String author,
    String isbn13,
    String isbn10,
    LocalDate publicationDate,
    BigDecimal royaltyRate) {

  public static BookResponse from(Book book) {
    return new BookResponse(
        book.getId(),
        book.getTitle(),
        book.getAuthor(),
        book.getIsbn13(),
        book.getIsbn10(),
        book.getPublicationDate(),
        book.getRoyaltyRate());
  }
}
