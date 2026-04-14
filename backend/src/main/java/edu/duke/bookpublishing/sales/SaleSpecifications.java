package edu.duke.bookpublishing.sales;

import edu.duke.bookpublishing.books.BookSpecifications;
import edu.duke.bookpublishing.sales.enums.SaleDistributor;
import edu.duke.bookpublishing.sales.enums.SaleFormat;
import edu.duke.bookpublishing.sales.enums.SaleSource;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;

/**
 * Specifications for filtering Sale queries.
 *
 * @author Daniel Rodriguez-Florido
 */
public final class SaleSpecifications {

  /** Filters sales where book title, author, or ISBN matches the query terms. */
  public static Specification<Sale> matchesQuery(String query) {
    return (root, q, cb) -> BookSpecifications.buildQueryPredicate(root.get("book"), cb, query);
  }

  /** Filters sales by author ID. */
  public static Specification<Sale> byAuthor(Long authorId) {
    return (root, query, cb) -> cb.equal(root.get("book").get("author").get("id"), authorId);
  }

  /** Filters sales by book ID. */
  public static Specification<Sale> byBook(Long bookId) {
    return (root, query, cb) -> cb.equal(root.get("book").get("id"), bookId);
  }

  /** Filters sales by sale source (DISTRIBUTOR or HAND_SOLD). */
  public static Specification<Sale> bySaleSource(SaleSource saleSource) {
    return (root, query, cb) -> cb.equal(root.get("saleSource"), saleSource);
  }

  /** Filters sales by distributor (INGRAM_SPARK, AMAZON, OTHER). */
  public static Specification<Sale> byDistributor(SaleDistributor distributor) {
    return (root, query, cb) -> cb.equal(root.get("distributor"), distributor);
  }

  /** Filters sales by format (PRINT, EBOOK, KINDLE_UNLIMITED). */
  public static Specification<Sale> byFormat(SaleFormat format) {
    return (root, query, cb) -> cb.equal(root.get("format"), format);
  }

  /** Filters sales by projected status (true = projected/unreleased, false = actual/released). */
  public static Specification<Sale> isProjected(Boolean isProjected) {
    if (isProjected == null) {
      return (root, query, cb) -> cb.conjunction();
    }
    return (root, query, cb) -> cb.equal(root.get("book").get("released"), !isProjected);
  }

  public static Specification<Sale> withinDateRange(LocalDate startDate, LocalDate endDate) {
    return (root, query, cb) -> {
      var predicate = cb.conjunction(); // "true" starting point

      if (startDate != null) {
        int startYear = startDate.getYear();
        int startMonth = startDate.getMonthValue();

        predicate =
            cb.and(
                predicate,
                cb.or(
                    cb.greaterThan(root.get("saleYear"), startYear),
                    cb.and(
                        cb.equal(root.get("saleYear"), startYear),
                        cb.greaterThanOrEqualTo(root.get("saleMonth"), startMonth))));
      }

      if (endDate != null) {
        int endYear = endDate.getYear();
        int endMonth = endDate.getMonthValue();

        predicate =
            cb.and(
                predicate,
                cb.or(
                    cb.lessThan(root.get("saleYear"), endYear),
                    cb.and(
                        cb.equal(root.get("saleYear"), endYear),
                        cb.lessThanOrEqualTo(root.get("saleMonth"), endMonth))));
      }

      return predicate;
    };
  }
}
