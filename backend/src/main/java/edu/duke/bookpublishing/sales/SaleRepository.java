package edu.duke.bookpublishing.sales;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * Repository for Sales
 *
 * @author Daniel Rodriguez-Florido
 */
@Repository
public interface SaleRepository extends JpaRepository<Sale, Long>, JpaSpecificationExecutor<Sale> {

  List<Sale> findSalesByBookId(Long bookId);

  @Query(
      """
            select coalesce(sum(s.quantitySold), 0)
            from Sale s
            where s.book.id = :bookId
            """)
  Integer totalUnitsSoldByBook(Long bookId);

  // ---- Requirement 2.2 Book Detail ----
  // 1) Total Publisher revenue for a book
  @Query(
      """
            select coalesce(sum(s.publisherRevenue), 0)
            from Sale s
            where s.book.id = :bookId
            """)
  BigDecimal totalPublisherRevenueByBook(Long bookId);

  // 2) Total UNPAID author royalty for a book
  @Query(
      """
            select coalesce(sum(s.authorRoyalty), 0)
            from Sale s
            where s.book.id = :bookId
              and s.hasAuthorBeenPaid = false
            """)
  BigDecimal totalUnpaidAuthorRoyaltyByBook(Long bookId);

  // 3) Total PAID author royalty for a book
  @Query(
      """
            select coalesce(sum(s.authorRoyalty), 0)
            from Sale s
            where s.book.id = :bookId
              and s.hasAuthorBeenPaid = true
            """)
  BigDecimal totalPaidAuthorRoyaltyByBook(Long bookId);

  // 4) Total (paid + unpaid) author royalty for a book
  @Query(
      """
            select coalesce(sum(s.authorRoyalty), 0)
            from Sale s
            where s.book.id = :bookId
            """)
  BigDecimal totalAuthorRoyaltyByBook(Long bookId);
}
