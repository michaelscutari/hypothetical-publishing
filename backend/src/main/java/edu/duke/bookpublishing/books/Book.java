package edu.duke.bookpublishing.books;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.*;
import org.hibernate.annotations.Formula;

@Entity
@Table(name = "books")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private String author;

  @Column(name = "isbn_13", nullable = false, unique = true, length = 13)
  private String isbn13;

  @Column(name = "isbn_10", unique = true, length = 10)
  private String isbn10;

  @Column(name = "publication_year", nullable = false)
  private Integer publicationYear;

  @Column(name = "publication_month", nullable = false)
  private Integer publicationMonth;

  @Column(name = "royalty_rate", nullable = false, precision = 5, scale = 4)
  private BigDecimal royaltyRate;

  @Formula("(SELECT COALESCE(SUM(s.quantity_sold), 0) FROM sales s WHERE s.book_id = id)")
  private Long totalSalesToDate;

  @PrePersist
  @PreUpdate
  public void normalizeFields() {
    if (title != null) {
      title = title.trim();
    }
    // Whitespace normalization for author (def 17)
    if (author != null) {
      author = String.join(" ", author.trim().split("\\s+"));
    }
    if (isbn13 != null) {
      isbn13 = isbn13.replaceAll("-", "");
    }
    if (isbn10 != null) {
      isbn10 = isbn10.replaceAll("-", "");
    }
  }
}
