package edu.duke.bookpublishing.sales;

import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.books.BookService;
import edu.duke.bookpublishing.common.StringUtils;
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
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
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
      LocalDate startDate, LocalDate endDate, String query) {

    Sort sort =
        Sort.by(
            Sort.Order.asc("book.author").ignoreCase(),
            Sort.Order.desc("saleYear"),
            Sort.Order.desc("saleMonth"));

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

    BigDecimal publisherRevenue = resolvePublisherRevenue(request, book);
    BigDecimal authorRoyaltyRate = resolveAuthorRoyaltyRate(request, book);
    BigDecimal authorRoyalty = computeAuthorRoyalty(publisherRevenue, authorRoyaltyRate);

    boolean hasAuthorBeenPaid = Boolean.TRUE.equals(request.hasAuthorBeenPaid());

    Sale sale =
        Sale.builder()
            .book(book)
            .saleSource(request.saleSource())
            .saleMonth(request.saleMonth())
            .saleYear(request.saleYear())
            .quantitySold(request.quantitySold())
            .publisherRevenue(publisherRevenue)
            .authorRoyalty(authorRoyalty)
            .hasAuthorBeenPaid(hasAuthorBeenPaid)
            .comment(request.comment())
            .build();

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
  public int markAllPaidByAuthor(String author) {
    String normalizedAuthor = StringUtils.normalizeWhitespace(author);
    return saleRepository.markAllPaidByAuthor(normalizedAuthor);
  }

  // Req 2.2.2
  public Long getBookTotalSales(Long bookId) {
    return saleRepository.totalUnitsSoldByBook(bookId);
  }

  public BookFinancialSummary getBookFinancialSummary(Long bookId) {
    return BookFinancialSummary.builder()
        .bookId(bookId)
        .totalUnitsSold(saleRepository.totalUnitsSoldByBook(bookId))
        .revenue(saleRepository.totalPublisherRevenueByBook(bookId))
        .unpaidRoyalty(saleRepository.totalUnpaidAuthorRoyaltyByBook(bookId))
        .paidRoyalty(saleRepository.totalPaidAuthorRoyaltyByBook(bookId))
        .totalRoyalty(saleRepository.totalAuthorRoyaltyByBook(bookId))
        .build();
  }

  // CSV Import
  @Transactional
  public IngramImportResponse importSalesFromCsv(IngramImportRequest ingramImportRequest) {

    ParsedBatch<IngramCsvEntry> parsedBatch = ingramCsvParser.parse(ingramImportRequest.csvFile());

    List<IngramCsvEntry> rows = parsedBatch.records();
    List<ParsingError> csvErrors = parsedBatch.parsingErrors();

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

    if (!csvErrors.isEmpty() || !domainErrors.isEmpty()) {
      return new IngramImportResponse(List.of(), csvErrors, domainErrors);
    }

    // Save if not preview
    if (!ingramImportRequest.isPreview()) {
      saveSalesToRepo(sales);
    }

    List<SaleResponse> saleResponses = sales.stream().map(SaleResponse::from).toList();

    return new IngramImportResponse(saleResponses, parsedBatch.parsingErrors(), domainErrors);
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

    return book.getCoverPrice()
        .subtract(book.getPrintCost())
        .multiply(BigDecimal.valueOf(request.quantitySold()));
  }

  private BigDecimal resolveAuthorRoyaltyRate(SaleRequest request, Book book) {
    return request.saleSource().getRoyaltyRate(book);
  }

  private BigDecimal computeAuthorRoyalty(
      BigDecimal publisherRevenue, BigDecimal authorRoyaltyRate) {
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
        .quantitySold(ingramCsvEntry.getNetQty().intValue())
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
        file.getOriginalFilename(),
        parsedBatch.timestamp());
  }

  private void saveSalesToRepo(List<Sale> sales) {
    for (Sale sale : sales) {
      saleRepository.save(sale);
    }
  }
}
