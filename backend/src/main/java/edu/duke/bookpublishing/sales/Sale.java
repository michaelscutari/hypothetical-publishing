package edu.duke.bookpublishing.sales;

import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.sales.enums.Currency;
import edu.duke.bookpublishing.sales.enums.SaleDistributor;
import edu.duke.bookpublishing.sales.enums.SaleFormat;
import edu.duke.bookpublishing.sales.enums.SaleSource;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * Entity/Database for Sale
 *
 * @author Daniel Rodriguez-Florido
 */
@Entity
@Table(name = "sales")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sale {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "book_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Book book;

  @Enumerated(EnumType.STRING)
  @Column(name = "sale_source", nullable = false)
  private SaleSource saleSource;

  @Enumerated(EnumType.STRING)
  @Column(name = "distributor")
  private SaleDistributor distributor;

  @Enumerated(EnumType.STRING)
  @Column(name = "format", nullable = false)
  private SaleFormat format;

  @Min(1)
  @Max(12)
  @Column(name = "sale_month", nullable = false)
  private Integer saleMonth;

  @Min(1900)
  @Max(2100)
  @Column(name = "sale_year", nullable = false)
  private Integer saleYear;

  @Positive
  @Column(name = "quantity_sold", nullable = true)
  private Integer quantitySold;

  @Positive
  @Column(name = "kindle_kenp")
  private Integer kenp;

  @Enumerated(EnumType.STRING)
  @Column(name = "sale_currency", nullable = false)
  private Currency saleCurrency;

  /*
    Publisher revenue in the original currency in which the sale was made.
  */
  @PositiveOrZero
  @Column(name = "usd_publisher_revenue", nullable = false, precision = 19, scale = 2)
  private BigDecimal originalPublisherRevenue;

  /*
    USD Publisher Revenue, the source of truth for all revenue calculations.
    If sale was made in other currency, this is the converted amount
  */
  @PositiveOrZero
  @Column(name = "publisher_revenue", nullable = false, precision = 19, scale = 2)
  private BigDecimal publisherRevenue;

  @Column(name = "author_royalty", nullable = false, precision = 19, scale = 2)
  private BigDecimal authorRoyalty;

  @Column(name = "has_author_been_paid", nullable = false)
  private Boolean hasAuthorBeenPaid;

  @Column(name = "comment", length = 256)
  private String comment;

  @AssertTrue(
      message = "KINDLE_UNLIMITED requires KENP and no quantity; print/ebook require quantity")
  public boolean isFormatFieldsValid() {
    if (format == null) {
      return true;
    }
    if (format == SaleFormat.KINDLE_UNLIMITED) {
      return kenp != null && quantitySold == null;
    }
    return quantitySold != null && kenp == null;
  }
}
