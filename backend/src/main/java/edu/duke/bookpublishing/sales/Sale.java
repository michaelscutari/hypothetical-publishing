package edu.duke.bookpublishing.sales;

import edu.duke.bookpublishing.books.Book;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
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

  @Min(1)
  @Max(12)
  @Column(nullable = false)
  private Integer saleMonth;

  @Min(1900)
  @Max(2100)
  @Column(nullable = false)
  private Integer saleYear;

  @PositiveOrZero
  @Column(nullable = false)
  private Integer quantitySold;

  @PositiveOrZero
  @Column(nullable = false, precision = 19, scale = 2)
  private BigDecimal publisherRevenue;

  @PositiveOrZero
  @Column(nullable = false, precision = 19, scale = 2)
  private BigDecimal authorRoyalty;

  @Column(nullable = false)
  private Boolean hasAuthorBeenPaid;
}
