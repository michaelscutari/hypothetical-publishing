package edu.duke.bookpublishing.author;

import edu.duke.bookpublishing.common.StringUtils;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
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

  @Column(name = "paypal_account", length = 128)
  private String paypalAccount;

  @Column(name = "venmo_account", length = 128)
  private String venmoAccount;

  @Formula("(SELECT COUNT(DISTINCT b.id) FROM books b WHERE b.author_id = id)")
  private Long bookCount;

  @Formula(
      "(SELECT COALESCE(SUM(s.author_royalty), 0) FROM sales s JOIN books b ON s.book_id = b.id WHERE b.author_id = id AND b.released = true)")
  private BigDecimal totalRoyalty;

  @Formula(
      "(SELECT COALESCE(SUM(s.author_royalty), 0) FROM sales s JOIN books b ON s.book_id = b.id WHERE b.author_id = id AND b.released = true AND s.has_author_been_paid = true)")
  private BigDecimal paidRoyalty;

  @Formula(
      "(SELECT COALESCE(SUM(s.author_royalty), 0) FROM sales s JOIN books b ON s.book_id = b.id WHERE b.author_id = id AND b.released = true AND s.has_author_been_paid = false)")
  private BigDecimal unpaidRoyalty;

  @PrePersist
  @PreUpdate
  public void normalizeFields() {
    name = StringUtils.normalizeWhitespace(name);
    email = StringUtils.normalizeWhitespace(email);
    if (paypalAccount != null) {
      paypalAccount = paypalAccount.trim();
      if (paypalAccount.isEmpty()) {
        paypalAccount = null;
      }
    }
    if (venmoAccount != null) {
      venmoAccount = venmoAccount.trim();
      if (venmoAccount.isEmpty()) {
        venmoAccount = null;
      }
    }
  }
}
