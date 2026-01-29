package edu.duke.bookpublishing.sales;

import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.exception.custom.NotFoundException;
import edu.duke.bookpublishing.sales.dto.SaleRequest;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
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

  public List<Sale> getAllSales(LocalDate startDate, LocalDate endDate, Sort sort) {

    if (startDate == null && endDate == null) {
      return saleRepository.findAll(sort);
    }

    LocalDate specStartDate = Optional.ofNullable(startDate).orElse(MIN_SALE_START_DATE);
    LocalDate specEndDate = Optional.ofNullable(endDate).orElse(MAX_SALE_END_DATE);

    Specification<Sale> spec = SaleSpecifications.withinDateRange(specStartDate, specEndDate);
    return saleRepository.findAll(spec, sort);
  }

  public Page<Sale> getPagedSales(LocalDate startDate, LocalDate endDate, Pageable pageable) {

    if (startDate == null && endDate == null) {
      return saleRepository.findAll(pageable);
    }

    LocalDate specStartDate = Optional.ofNullable(startDate).orElse(MIN_SALE_START_DATE);
    LocalDate specEndDate = Optional.ofNullable(endDate).orElse(MAX_SALE_END_DATE);

    Specification<Sale> spec = SaleSpecifications.withinDateRange(specStartDate, specEndDate);
    return saleRepository.findAll(spec, pageable);
  }

  public Sale getSaleById(Long id) {
    return getOrThrowSaleFromRepoById(id);
  }

  @Transactional
  public Sale createSale(SaleRequest request) {
    Book book = getOrThrowBookFromRepoById(request.bookId());

    // Compute Royalty (Per definition 16)
    BigDecimal authorRoyalty =
        computeAuthorRoyalty(request.publisherRevenue(), book.getRoyaltyRate());

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

    BigDecimal authorRoyalty =
        computeAuthorRoyalty(request.publisherRevenue(), newBook.getRoyaltyRate());

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

  /*
  TODO: Implement markAllPaid(author) API

  Implementation of togglePaid. See SaleController.java Line 89.

  @Transactional
  public Sale togglePaid(Long id) {
      Sale sale = getOrThrowSaleFromRepoById(id);

      boolean currentlyPaid = Boolean.TRUE.equals(sale.getHasAuthorBeenPaid());
      sale.setHasAuthorBeenPaid(!currentlyPaid); // "Not" the current standing

      return saleRepository.save(sale);
  }
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
}
