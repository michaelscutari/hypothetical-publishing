package edu.duke.bookpublishing.sales;

import edu.duke.bookpublishing.author.AuthorRepository;
import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.books.BookService;
import edu.duke.bookpublishing.exception.custom.NotFoundException;
import edu.duke.bookpublishing.sales.dto.AuthorPaymentGroupResponse;
import edu.duke.bookpublishing.sales.dto.AuthorPaymentSaleResponse;
import edu.duke.bookpublishing.sales.dto.IngramImportRequest;
import edu.duke.bookpublishing.sales.dto.IngramImportResponse;
import edu.duke.bookpublishing.sales.dto.SaleRequest;
import edu.duke.bookpublishing.sales.dto.SaleResponse;
import edu.duke.bookpublishing.sales.enums.SaleSource;
import edu.duke.bookpublishing.sales.parser.ImportParser;
import edu.duke.bookpublishing.sales.parser.IngramCsvEntry;
import edu.duke.bookpublishing.sales.parser.ParsedBatch;
import edu.duke.bookpublishing.sales.parser.ParsingError;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import edu.duke.bookpublishing.author.AuthorRepository;
import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.exception.custom.NotFoundException;
import edu.duke.bookpublishing.sales.dto.AuthorPaymentGroupResponse;
import edu.duke.bookpublishing.sales.dto.AuthorPaymentSaleResponse;
import edu.duke.bookpublishing.sales.dto.SaleRequest;
import edu.duke.bookpublishing.sales.enums.SaleSource;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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

  private final BookService bookService;
  private final BookRepository bookRepository;
  private final SaleRepository saleRepository;
  private final ImportParser<IngramCsvEntry> ingramCsvParser;
  private final AuthorRepository authorRepository;

  public List<Sale> getAllSales(LocalDate startDate, LocalDate endDate, Long authorId,
      String saleSource, String query, Sort sort) {
    Specification<Sale> spec =
        buildSaleSpecification(startDate, endDate, authorId, saleSource, query);
    return saleRepository.findAll(spec, sort);
  }

  public Page<Sale> getPagedSales(LocalDate startDate, LocalDate endDate, Long authorId,
      String saleSource, String query, Pageable pageable) {
    Specification<Sale> spec =
        buildSaleSpecification(startDate, endDate, authorId, saleSource, query);
    return saleRepository.findAll(spec, pageable);
  }

  private Specification<Sale> buildSaleSpecification(LocalDate startDate, LocalDate endDate,
      Long authorId, String saleSource, String query) {
    Specification<Sale> spec = Specification.where(null);

    if (startDate != null || endDate != null) {
      LocalDate specStartDate = Optional.ofNullable(startDate).orElse(MIN_SALE_START_DATE);
      LocalDate specEndDate = Optional.ofNullable(endDate).orElse(MAX_SALE_END_DATE);
      spec = spec.and(SaleSpecifications.withinDateRange(specStartDate, specEndDate));
    }

    if (authorId != null) {
      spec = spec.and(SaleSpecifications.byAuthor(authorId));
    }

    if (saleSource != null && !saleSource.isBlank()) {
      try {
        SaleSource source = SaleSource.valueOf(saleSource.toUpperCase());
        spec = spec.and(SaleSpecifications.bySaleSource(source));
      } catch (IllegalArgumentException e) {
        // Ignore invalid sale source values
      }
    }

    if (query != null && !query.isBlank()) {
      spec = spec.and(SaleSpecifications.matchesQuery(query));
    }

    return spec;
  }

  /**
   * Builds grouped author payments data in the required sort order.
   *
   * <p>
   * Sorting: author ASC, then sale year DESC, then sale month DESC (req 3.2).
   */
  public List<AuthorPaymentGroupResponse> getAuthorPaymentGroups(LocalDate startDate,
      LocalDate endDate, String query) {

    Sort sort = Sort.by(Sort.Order.asc("book.author.name").ignoreCase(),
        Sort.Order.desc("saleYear"), Sort.Order.desc("saleMonth"));

    Specification<Sale> spec = Specification.where(null);

    if (startDate != null || endDate != null) {
      LocalDate specStartDate = Optional.ofNullable(startDate).orElse(MIN_SALE_START_DATE);
      LocalDate specEndDate = Optional.ofNullable(endDate).orElse(MAX_SALE_END_DATE);
      spec = spec.and(SaleSpecifications.withinDateRange(specStartDate, specEndDate));
    }

    if (query != null && !query.isBlank()) {
      spec = spec.and(SaleSpecifications.matchesQuery(query));
    }

    List<Sale> sales = saleRepository.findAll(spec, sort);

    // Group sales by author ID while preserving the sort order established above.
    Map<Long, List<Sale>> grouped = new LinkedHashMap<>();
    for (Sale sale : sales) {
      Long authorId = sale.getBook().getAuthor().getId();
      grouped.computeIfAbsent(authorId, key -> new ArrayList<>()).add(sale);
    }

    // Build group responses with unpaid totals.
    List<AuthorPaymentGroupResponse> groups = new ArrayList<>();
    for (Map.Entry<Long, List<Sale>> entry : grouped.entrySet()) {
      BigDecimal unpaidTotal = BigDecimal.ZERO;
      List<AuthorPaymentSaleResponse> saleRows = new ArrayList<>();
      String authorName = null;

      for (Sale sale : entry.getValue()) {
        saleRows.add(AuthorPaymentSaleResponse.from(sale));
        if (authorName == null) {
          authorName = sale.getBook().getAuthor().getName();
        }
        if (!Boolean.TRUE.equals(sale.getHasAuthorBeenPaid())) {
          unpaidTotal = unpaidTotal.add(sale.getAuthorRoyalty());
        }
      }

      groups.add(new AuthorPaymentGroupResponse(entry.getKey(), authorName, unpaidTotal, saleRows));
    }

    return groups;
  }

  public Sale getSaleById(Long id) {
    return getOrThrowSaleFromRepoById(id);
  }

  @Transactional
  public Sale createSale(SaleRequest request) {
    Book book = getOrThrowBookFromRepoById(request.bookId());

    BigDecimal publisherRevenue = resolvePublisherRevenue(request, book);
    BigDecimal authorRoyaltyRate = resolveAuthorRoyaltyRate(request, book);
    BigDecimal authorRoyalty = computeAuthorRoyalty(publisherRevenue, authorRoyaltyRate);

    boolean hasAuthorBeenPaid = Boolean.TRUE.equals(request.hasAuthorBeenPaid());

    Sale sale =
        Sale.builder().book(book).saleSource(request.saleSource()).saleMonth(request.saleMonth())
            .saleYear(request.saleYear()).quantitySold(request.quantitySold())
            .publisherRevenue(publisherRevenue).authorRoyalty(authorRoyalty)
            .hasAuthorBeenPaid(hasAuthorBeenPaid).comment(request.comment()).build();

    return saleRepository.save(sale);
  }

  @Transactional
  public Sale updateSale(Long id, SaleRequest request) {
    Sale sale = getOrThrowSaleFromRepoById(id);
    Book newBook = getOrThrowBookFromRepoById(request.bookId());

    BigDecimal publisherRevenue = resolvePublisherRevenue(request, newBook);
    BigDecimal authorRoyaltyRate = resolveAuthorRoyaltyRate(request, newBook);
    BigDecimal authorRoyalty = computeAuthorRoyalty(publisherRevenue, authorRoyaltyRate);

    sale.setBook(newBook);
    sale.setSaleSource(request.saleSource());
    sale.setSaleMonth(request.saleMonth());
    sale.setSaleYear(request.saleYear());
    sale.setQuantitySold(request.quantitySold());
    sale.setPublisherRevenue(publisherRevenue);
    sale.setAuthorRoyalty(authorRoyalty);
    sale.setComment(request.comment());

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
  public int markAllPaidByAuthorId(Long authorId) {
    authorRepository.findById(authorId)
        .orElseThrow(() -> new IllegalArgumentException("Author not found"));
    return saleRepository.markAllPaidByAuthorId(authorId);
  }

  // Req 2.2.2
  public Long getBookTotalSales(Long bookId) {
    return saleRepository.totalUnitsSoldByBook(bookId);
  }

  public BookFinancialSummary getBookFinancialSummary(Long bookId) {
    return BookFinancialSummary.builder().bookId(bookId)
        .totalUnitsSold(saleRepository.totalUnitsSoldByBook(bookId))
        .revenue(saleRepository.totalPublisherRevenueByBook(bookId))
        .unpaidRoyalty(saleRepository.totalUnpaidAuthorRoyaltyByBook(bookId))
        .paidRoyalty(saleRepository.totalPaidAuthorRoyaltyByBook(bookId))
        .totalRoyalty(saleRepository.totalAuthorRoyaltyByBook(bookId)).build();
  }

  // CSV Import
  @Transactional
  public IngramImportResponse importSalesFromCsv(IngramImportRequest ingramImportRequest) {

    ParsedBatch<IngramCsvEntry> parsedBatch = ingramCsvParser.parse(ingramImportRequest.csvFile());

    List<IngramCsvEntry> rows = parsedBatch.records();
    List<ParsingError> csvErrors = parsedBatch.parsingErrors();

    if (!csvErrors.isEmpty()) {
      return new IngramImportResponse(List.of(), csvErrors, List.of());
    }

    List<Sale> sales = new ArrayList<>();
    List<ParsingError> domainErrors = new ArrayList<>();

    int rowNum = 0;
    for (IngramCsvEntry csvEntry : rows) {
      rowNum++;
      try {
        Sale sale = mapIngramCsvRowToSale(ingramImportRequest, parsedBatch, csvEntry);
        sales.add(sale);
      } catch (NotFoundException e) {
        domainErrors.add(new ParsingError(rowNum, null, "book.notFound"));
      } catch (RuntimeException e) {
        domainErrors.add(new ParsingError(rowNum, null, "sale.mappingFailed"));
      }
    }

    if (!domainErrors.isEmpty()) {
      return new IngramImportResponse(List.of(), List.of(), domainErrors);
    }

    // Save if not preview
    if (!ingramImportRequest.isPreview()) {
      saveSalesToRepo(sales);
    }

    List<SaleResponse> saleResponses = sales.stream().map(SaleResponse::from).toList();

    return new IngramImportResponse(saleResponses, List.of(), List.of());
  }

  private Sale getOrThrowSaleFromRepoById(Long id) {
    return saleRepository.findById(id).orElseThrow(() -> new NotFoundException("Sale not found"));
  }

  private Book getOrThrowBookFromRepoById(Long id) {
    return bookRepository.findById(id).orElseThrow(() -> new NotFoundException("Book not found"));
  }

  private BigDecimal resolvePublisherRevenue(SaleRequest request, Book book) {
    if (request.saleSource() == SaleSource.DISTRIBUTOR) {
      if (request.publisherRevenue() == null) {
        throw new DataIntegrityViolationException(
            "publisherRevenue is required for distributor sales");
      }
      return request.publisherRevenue();
    }

    return book.getCoverPrice().subtract(book.getPrintCost())
        .multiply(BigDecimal.valueOf(request.quantitySold()));
  }

  private BigDecimal resolveAuthorRoyaltyRate(SaleRequest request, Book book) {
    return request.saleSource().getRoyaltyRate(book);
  }

  private BigDecimal computeAuthorRoyalty(BigDecimal publisherRevenue,
      BigDecimal authorRoyaltyRate) {
    if (publisherRevenue == null || authorRoyaltyRate == null) {
      throw new DataIntegrityViolationException(
          "publisherRevenue and authorRoyaltyRate must be non-null");
    }
    return publisherRevenue.multiply(authorRoyaltyRate).setScale(2, RoundingMode.HALF_UP);
  }

  private Sale mapIngramCsvRowToSale(
      IngramImportRequest ingramImportRequest,
      ParsedBatch<IngramCsvEntry> parsedBatch,
      IngramCsvEntry ingramCsvEntry) {

    Book book =
        bookService
            .findBookByIsbn(ingramCsvEntry.getIsbn())
            .orElseThrow(() -> new NotFoundException("Book not found"));

    BigDecimal authorRoyaltyRate = SaleSource.DISTRIBUTOR.getRoyaltyRate(book);
    BigDecimal authorRoyalty =
        computeAuthorRoyalty(ingramCsvEntry.getNetCompensation(), authorRoyaltyRate);

    return Sale.builder()
        .saleSource(SaleSource.DISTRIBUTOR)
        .saleMonth(ingramImportRequest.saleMonth())
        .saleYear(ingramImportRequest.saleYear())
        .book(book)
        .quantitySold(Math.toIntExact(ingramCsvEntry.getNetQty()))
        .publisherRevenue(ingramCsvEntry.getNetCompensation())
        .authorRoyalty(authorRoyalty)
        .hasAuthorBeenPaid(false)
        .comment(getCommentFromCSV(ingramImportRequest.csvFile(), parsedBatch, ingramCsvEntry))
        .build();
  }

  private String getCommentFromCSV(
      MultipartFile file, ParsedBatch<IngramCsvEntry> parsedBatch, IngramCsvEntry ingramCsvEntry) {
    return String.format(
        "Ingram: Format='%s' Market='%s' File='%s' (%s)",
        ingramCsvEntry.getFormat(),
        ingramCsvEntry.getSalesMarket(),
        file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown",
        parsedBatch.timestamp());
  }

  private void saveSalesToRepo(List<Sale> sales) {
    saleRepository.saveAll(sales);
  }
}
