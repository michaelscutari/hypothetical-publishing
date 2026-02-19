package edu.duke.bookpublishing.sales;

import java.math.BigDecimal;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import edu.duke.bookpublishing.books.Book;
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
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

  @Min(1)
  @Max(12)
  @Column(name = "sale_month", nullable = false)
  private Integer saleMonth;

  @Min(1900)
  @Max(2100)
  @Column(name = "sale_year", nullable = false)
  private Integer saleYear;

  @Positive
  @Column(name = "quantity_sold", nullable = false)
  private Integer quantitySold;

  @Positive
  @Column(name = "publisher_revenue", nullable = false, precision = 19, scale = 2)
  private BigDecimal publisherRevenue;

  @Column(name = "author_royalty", nullable = false, precision = 19, scale = 2)
  private BigDecimal authorRoyalty;

  @Column(name = "has_author_been_paid", nullable = false)
  private Boolean hasAuthorBeenPaid;

  @Column(name = "comment", length = 256)
  private String comment;
}
