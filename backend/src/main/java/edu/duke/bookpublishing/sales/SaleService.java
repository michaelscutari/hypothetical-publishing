package edu.duke.bookpublishing.sales;

import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.exception.custom.NotFoundException;
import edu.duke.bookpublishing.sales.dto.AuthorPaymentGroupResponse;
import edu.duke.bookpublishing.sales.dto.AuthorPaymentSaleResponse;
import edu.duke.bookpublishing.sales.dto.SaleRequest;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

/**
 * Backend service for SaleController. All business logic is handled here.
 *
 * @author Daniel Rodriguez-Florido
 */
@Service
@RequiredArgsConstructor
public class SaleService {

  private static final LocalDate MIN_SALE_START_DATE = LocalDate.of(1900, 1, 1);
  private static final LocalDate MAX_SALE_END_DATE = LocalDate.of(2100, 1, 1);

  private final BookRepository bookRepository;
  private final SaleRepository saleRepository;

  public List<Sale> getAllSales(LocalDate startDate, LocalDate endDate, String query, Sort sort) {
    Specification<Sale> spec = buildSaleSpecification(startDate, endDate, query);
    return saleRepository.findAll(spec, sort);
  }

  public Page<Sale> getPagedSales(
      LocalDate startDate, LocalDate endDate, String query, Pageable pageable) {
    Specification<Sale> spec = buildSaleSpecification(startDate, endDate, query);
    return saleRepository.findAll(spec, pageable);
  }

  private Specification<Sale> buildSaleSpecification(
      LocalDate startDate, LocalDate endDate, String query) {
    Specification<Sale> spec = Specification.where(null);

    if (startDate != null || endDate != null) {
      LocalDate specStartDate = Optional.ofNullable(startDate).orElse(MIN_SALE_START_DATE);
      LocalDate specEndDate = Optional.ofNullable(endDate).orElse(MAX_SALE_END_DATE);
      spec = spec.and(SaleSpecifications.withinDateRange(specStartDate, specEndDate));
    }

    if (query != null && !query.isBlank()) {
      spec = spec.and(SaleSpecifications.matchesQuery(query));
    }

    return spec;
  }

  /**
   * Builds grouped author payments data in the required sort order.
   *
   * <p>Sorting: author ASC, then sale year DESC, then sale month DESC (req 3.2).
   */
  public List<AuthorPaymentGroupResponse> getAuthorPaymentGroups(
      LocalDate startDate, LocalDate endDate) {
    Sort sort =
        Sort.by(
            Sort.Order.asc("book.author"),
            Sort.Order.desc("saleYear"),
            Sort.Order.desc("saleMonth"));

    List<Sale> sales;
    if (startDate == null && endDate == null) {
      sales = saleRepository.findAll(sort);
    } else {
      LocalDate specStartDate = Optional.ofNullable(startDate).orElse(MIN_SALE_START_DATE);
      LocalDate specEndDate = Optional.ofNullable(endDate).orElse(MAX_SALE_END_DATE);
      Specification<Sale> spec = SaleSpecifications.withinDateRange(specStartDate, specEndDate);
      sales = saleRepository.findAll(spec, sort);
    }

    // Group sales by author while preserving the sort order established above.
    Map<String, List<Sale>> grouped = new LinkedHashMap<>();
    for (Sale sale : sales) {
      String author = sale.getBook().getAuthor();
      grouped.computeIfAbsent(author, key -> new ArrayList<>()).add(sale);
    }

    // Build group responses with unpaid totals.
    List<AuthorPaymentGroupResponse> groups = new ArrayList<>();
    for (Map.Entry<String, List<Sale>> entry : grouped.entrySet()) {
      BigDecimal unpaidTotal = BigDecimal.ZERO;
      List<AuthorPaymentSaleResponse> saleRows = new ArrayList<>();

      for (Sale sale : entry.getValue()) {
        saleRows.add(AuthorPaymentSaleResponse.from(sale));
        if (!Boolean.TRUE.equals(sale.getHasAuthorBeenPaid())) {
          unpaidTotal = unpaidTotal.add(sale.getAuthorRoyalty());
        }
      }

      groups.add(new AuthorPaymentGroupResponse(entry.getKey(), unpaidTotal, saleRows));
    }

    return groups;
  }

  public Sale getSaleById(Long id) {
    return getOrThrowSaleFromRepoById(id);
  }

  @Transactional
  public Sale createSale(SaleRequest request) {
    Book book = getOrThrowBookFromRepoById(request.bookId());

    // want to use override if provided, otherwise compute --> so depends on if
    // request got
    BigDecimal authorRoyalty =
        request.authorRoyalty() != null
            ? request.authorRoyalty().setScale(2, RoundingMode.HALF_UP)
            : computeAuthorRoyalty(request.publisherRevenue(), book.getRoyaltyRate());

    boolean hasAuthorBeenPaid = Boolean.TRUE.equals(request.hasAuthorBeenPaid());

    Sale sale =
        Sale.builder()
            .book(book)
            .saleMonth(request.saleMonth())
            .saleYear(request.saleYear())
            .quantitySold(request.quantitySold())
            .publisherRevenue(request.publisherRevenue())
            .authorRoyalty(authorRoyalty)
            .hasAuthorBeenPaid(hasAuthorBeenPaid)
            .build();

    return saleRepository.save(sale);
  }

  @Transactional
  public Sale updateSale(Long id, SaleRequest request) {
    Sale sale = getOrThrowSaleFromRepoById(id);
    Book newBook = getOrThrowBookFromRepoById(request.bookId());

    // if the client doesnt get an input then default, if client does use the
    // clients
    BigDecimal authorRoyalty =
        request.authorRoyalty() != null
            ? request.authorRoyalty().setScale(2, RoundingMode.HALF_UP)
            : computeAuthorRoyalty(request.publisherRevenue(), newBook.getRoyaltyRate());

    sale.setBook(newBook);
    sale.setSaleMonth(request.saleMonth());
    sale.setSaleYear(request.saleYear());
    sale.setQuantitySold(request.quantitySold());
    sale.setPublisherRevenue(request.publisherRevenue());
    sale.setAuthorRoyalty(authorRoyalty);

    if (request.hasAuthorBeenPaid() != null) {
      sale.setHasAuthorBeenPaid(request.hasAuthorBeenPaid());
    }

    return saleRepository.save(sale);
  }

  @Transactional
  public void deleteById(Long id) {
    getOrThrowSaleFromRepoById(id);
    saleRepository.deleteById(id);
  }

  /**
   * Marks all unpaid sales for a given author as paid.
   *
   * @return number of sales updated
   */
  @Transactional
  public int markAllPaidByAuthor(String author) {
    String normalizedAuthor = normalizeWhitespace(author);
    return saleRepository.markAllPaidByAuthor(normalizedAuthor);
  }

  /*
   * TODO: Implement markAllPaid(author) API
   *
   * Implementation of togglePaid. See SaleController.java Line 89.
   *
   * @Transactional
   * public Sale togglePaid(Long id) {
   * Sale sale = getOrThrowSaleFromRepoById(id);
   *
   * boolean currentlyPaid = Boolean.TRUE.equals(sale.getHasAuthorBeenPaid());
   * sale.setHasAuthorBeenPaid(!currentlyPaid); // "Not" the current standing
   *
   * return saleRepository.save(sale);
   * }
   */

  private Sale getOrThrowSaleFromRepoById(Long id) {
    return saleRepository.findById(id).orElseThrow(() -> new NotFoundException("Sale not found"));
  }

  private Book getOrThrowBookFromRepoById(Long id) {
    return bookRepository.findById(id).orElseThrow(() -> new NotFoundException("Book not found"));
  }

  private BigDecimal computeAuthorRoyalty(BigDecimal publisherRevenue, BigDecimal bookRoyaltyRate) {
    if (publisherRevenue == null || bookRoyaltyRate == null) {
      throw new DataIntegrityViolationException(
          "publisherRevenue and bookRoyaltyRate must be non-null");
    }
    return publisherRevenue.multiply(bookRoyaltyRate).setScale(2, RoundingMode.HALF_UP);
  }

  // Mirrors Book.normalizeFields() whitespace normalization (def 17).
  private String normalizeWhitespace(String value) {
    if (value == null) {
      return null;
    }
    return String.join(" ", value.trim().split("\\s+"));
  }
}
