package edu.duke.bookpublishing.author;

import edu.duke.bookpublishing.common.StringUtils;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import java.math.BigDecimal;
import lombok.*;
import org.hibernate.annotations.Formula;

@Entity
@Table(name = "authors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Author {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  @Email
  private String email;
  private String paypalAccount;
  private String venmoAccount;

  @Formula("(SELECT COUNT(DISTINCT b.id) FROM books b WHERE b.author_id = id)")
  private Long bookCount;

  @Formula(
      "(SELECT COALESCE(SUM(s.author_royalty), 0) FROM sales s JOIN books b ON s.book_id = b.id WHERE b.author_id = id)")
  private BigDecimal totalRoyalty;

  @Formula(
      "(SELECT COALESCE(SUM(s.author_royalty), 0) FROM sales s JOIN books b ON s.book_id = b.id WHERE b.author_id = id AND s.has_author_been_paid = true)")
  private BigDecimal paidRoyalty;

  @Formula(
      "(SELECT COALESCE(SUM(s.author_royalty), 0) FROM sales s JOIN books b ON s.book_id = b.id WHERE b.author_id = id AND s.has_author_been_paid = false)")
  private BigDecimal unpaidRoyalty;

  @PrePersist
  @PreUpdate
  public void normalizeFields() {
    name = StringUtils.normalizeWhitespace(name);
    email = StringUtils.normalizeWhitespace(email);
    paypalAccount = StringUtils.normalizeWhitespace(paypalAccount);
    venmoAccount = StringUtils.normalizeWhitespace(venmoAccount);
  }
}
