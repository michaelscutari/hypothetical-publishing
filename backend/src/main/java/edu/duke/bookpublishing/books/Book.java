package edu.duke.bookpublishing.books;

import edu.duke.bookpublishing.common.StringUtils;
import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
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

  // TODO: Map as foreign key to author table once it is available
  @Column(nullable = false)
  private String author;

  @Column(name = "isbn_13", nullable = false, unique = true, length = 13)
  private String isbn13;

  @Column(name = "isbn_10", unique = true, length = 10)
  private String isbn10;

  @Min(1900)
  @Column(name = "publication_year", nullable = false)
  private Integer publicationYear;

  @Min(1)
  @Max(12)
  @Column(name = "publication_month", nullable = false)
  private Integer publicationMonth;

  @DecimalMin("0.0")
  @DecimalMax("1.0")
  @Column(name = "distributor_author_royalty_rate", nullable = false, precision = 5, scale = 4)
  private BigDecimal distributorAuthorRoyaltyRate;

  @DecimalMin("0.0")
  @DecimalMax("1.0")
  @Column(name = "handsold_author_royalty_rate", nullable = false, precision = 5, scale = 4)
  private BigDecimal handsoldAuthorRoyaltyRate;

  @Column(name = "series_name", length = 256)
  private String seriesName;

  @Positive
  @Column(name = "series_position")
  private Integer seriesPosition;

  @PositiveOrZero
  @Column(name = "cover_price", nullable = false, precision = 19, scale = 2)
  private BigDecimal coverPrice;

  @PositiveOrZero
  @Column(name = "print_cost", nullable = false, precision = 19, scale = 2)
  private BigDecimal printCost;

  @Lob
  @Column(name = "cover_image")
  @Basic(fetch = FetchType.LAZY)
  private byte[] coverImage;

  @Lob
  @Column(name = "cover_thumbnail")
  @Basic(fetch = FetchType.LAZY)
  private byte[] coverThumbnail;

  @Column(name = "cover_content_type")
  private String coverContentType;

  @Formula("(SELECT COALESCE(SUM(s.quantity_sold), 0) FROM sales s WHERE s.book_id = id)")
  private Long totalSalesToDate;

  @PrePersist
  @PreUpdate
  public void normalizeFields() {
    if (title != null) {
      title = title.trim();
    }
    author = StringUtils.normalizeWhitespace(author);
    if (isbn13 != null) {
      isbn13 = isbn13.replaceAll("-", "");
    }
    if (isbn10 != null) {
      isbn10 = isbn10.replaceAll("-", "");
    }
  }
}
