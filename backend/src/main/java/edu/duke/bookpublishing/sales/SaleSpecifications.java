package edu.duke.bookpublishing.sales;

import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;

/**
 * Spec to filter Sale queries by date.
 *
 * @author Daniel Rodriguez-Florido
 */
public final class SaleSpecifications {

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
