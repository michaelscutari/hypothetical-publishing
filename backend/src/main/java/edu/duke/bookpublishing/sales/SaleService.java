package edu.duke.bookpublishing.sales;

import edu.duke.bookpublishing.author.Author;
import edu.duke.bookpublishing.author.AuthorRepository;
import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.books.BookService;
import edu.duke.bookpublishing.currency.CurrencyService;
import edu.duke.bookpublishing.exception.custom.AmbiguousLookupException;
import edu.duke.bookpublishing.exception.custom.NotFoundException;
import edu.duke.bookpublishing.sales.dto.AllTimeTotals;
import edu.duke.bookpublishing.sales.dto.AuthorPaymentGroupResponse;
import edu.duke.bookpublishing.sales.dto.AuthorPaymentSaleResponse;
import edu.duke.bookpublishing.sales.dto.FinancialReportFile;
import edu.duke.bookpublishing.sales.dto.QuarterSection;
import edu.duke.bookpublishing.sales.dto.ReportBookRow;
import edu.duke.bookpublishing.sales.dto.RoyaltyReportResponse;
import edu.duke.bookpublishing.sales.dto.SaleRequest;
import edu.duke.bookpublishing.sales.dto.SaleResponse;
import edu.duke.bookpublishing.sales.dto.SalesImportRequest;
import edu.duke.bookpublishing.sales.dto.SalesImportResponse;
import edu.duke.bookpublishing.sales.enums.Currency;
import edu.duke.bookpublishing.sales.enums.SaleDistributor;
import edu.duke.bookpublishing.sales.enums.SaleFormat;
import edu.duke.bookpublishing.sales.enums.SaleSource;
import edu.duke.bookpublishing.sales.parser.AmazonXlsxEntry;
import edu.duke.bookpublishing.sales.parser.ImportParser;
import edu.duke.bookpublishing.sales.parser.IngramCsvEntry;
import edu.duke.bookpublishing.sales.parser.ParsedBatch;
import edu.duke.bookpublishing.sales.parser.ParsingError;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
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
  private static final String XLSX_CONTENT_TYPE =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  private static final DateTimeFormatter FILE_DATE_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM-dd");
  private static final DateTimeFormatter FILE_TIME_FORMATTER =
      DateTimeFormatter.ofPattern("HH:mm:ss");

  private final BookService bookService;
  private final BookRepository bookRepository;
  private final SaleRepository saleRepository;
  private final ImportParser<IngramCsvEntry> ingramCsvParser;
  private final ImportParser<AmazonXlsxEntry> amazonXlsxParser;
  private final AuthorRepository authorRepository;
  private final CurrencyService currencyService;

  public List<Sale> getAllSales(
      LocalDate startDate,
      LocalDate endDate,
      Long authorId,
      Long bookId,
      SaleSource saleSource,
      SaleDistributor distributor,
      SaleFormat format,
      String query,
      Sort sort) {
    Specification<Sale> spec =
        buildSaleSpecification(
            startDate, endDate, authorId, bookId, saleSource, distributor, format, query);
    return saleRepository.findAll(spec, sort);
  }

  public Page<Sale> getPagedSales(
      LocalDate startDate,
      LocalDate endDate,
      Long authorId,
      Long bookId,
      SaleSource saleSource,
      SaleDistributor distributor,
      SaleFormat format,
      String query,
      Pageable pageable) {
    Specification<Sale> spec =
        buildSaleSpecification(
            startDate, endDate, authorId, bookId, saleSource, distributor, format, query);
    return saleRepository.findAll(spec, pageable);
  }

  private Specification<Sale> buildSaleSpecification(
      LocalDate startDate,
      LocalDate endDate,
      Long authorId,
      Long bookId,
      SaleSource saleSource,
      SaleDistributor distributor,
      SaleFormat format,
      String query) {
    Specification<Sale> spec = Specification.where(null);

    if (startDate != null || endDate != null) {
      LocalDate specStartDate = Optional.ofNullable(startDate).orElse(MIN_SALE_START_DATE);
      LocalDate specEndDate = Optional.ofNullable(endDate).orElse(MAX_SALE_END_DATE);
      spec = spec.and(SaleSpecifications.withinDateRange(specStartDate, specEndDate));
    }

    if (authorId != null) {
      spec = spec.and(SaleSpecifications.byAuthor(authorId));
    }

    if (bookId != null) {
      spec = spec.and(SaleSpecifications.byBook(bookId));
    }

    if (saleSource != null) {
      spec = spec.and(SaleSpecifications.bySaleSource(saleSource));
    }

    if (distributor != null) {
      spec = spec.and(SaleSpecifications.byDistributor(distributor));
    }

    if (format != null) {
      spec = spec.and(SaleSpecifications.byFormat(format));
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
            Sort.Order.asc("book.author.name").ignoreCase(),
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

    BigDecimal originalPublisherRevenue = resolvePublisherRevenue(request, book);
    BigDecimal publisherRevenue = convertToUsd(request.saleCurrency(), originalPublisherRevenue);
    BigDecimal authorRoyaltyRate = resolveAuthorRoyaltyRate(request, book);
    BigDecimal authorRoyalty = computeAuthorRoyalty(publisherRevenue, authorRoyaltyRate);

    boolean hasAuthorBeenPaid = Boolean.TRUE.equals(request.hasAuthorBeenPaid());

    Sale sale =
        Sale.builder()
            .book(book)
            .saleSource(request.saleSource())
            .distributor(request.distributor())
            .format(request.format())
            .saleMonth(request.saleMonth())
            .saleYear(request.saleYear())
            .quantitySold(request.quantitySold())
            .kenp(request.kenp())
            .saleCurrency(request.saleCurrency())
            .originalPublisherRevenue(originalPublisherRevenue)
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

    BigDecimal originalPublisherRevenue = resolvePublisherRevenue(request, newBook);
    BigDecimal publisherRevenue = convertToUsd(request.saleCurrency(), originalPublisherRevenue);
    BigDecimal authorRoyaltyRate = resolveAuthorRoyaltyRate(request, newBook);
    BigDecimal authorRoyalty = computeAuthorRoyalty(publisherRevenue, authorRoyaltyRate);

    sale.setBook(newBook);
    sale.setSaleSource(request.saleSource());
    sale.setDistributor(request.distributor());
    sale.setFormat(request.format());
    sale.setSaleMonth(request.saleMonth());
    sale.setSaleYear(request.saleYear());
    sale.setQuantitySold(request.quantitySold());
    sale.setKenp(request.kenp());
    sale.setSaleCurrency(request.saleCurrency());
    sale.setOriginalPublisherRevenue(originalPublisherRevenue);
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
    authorRepository
        .findById(authorId)
        .orElseThrow(() -> new IllegalArgumentException("Author not found"));
    return saleRepository.markAllPaidByAuthorId(authorId);
  }

  @Transactional(readOnly = true)
  public RoyaltyReportResponse generateRoyaltyReport(
      Long authorId,
      int startQuarter,
      int startYear,
      int endQuarter,
      int endYear,
      boolean includeEmptyQuarters) {
    // Get author for display name
    String authorName =
        authorRepository
            .findById(authorId)
            .map(Author::getName)
            .orElseThrow(() -> new NotFoundException("Author not found"));

    // Get all sales for this author
    List<Sale> allSales = saleRepository.findAllByAuthorId(authorId);

    // Generate quarter sections, conditionally including quarters with no sales
    List<QuarterSection> sections = new ArrayList<>();
    int qYear = startYear;
    int qQuarter = startQuarter;
    while (qYear < endYear || (qYear == endYear && qQuarter <= endQuarter)) {
      List<Sale> quarterSales = filterByQuarter(allSales, qQuarter, qYear);
      if (includeEmptyQuarters || !quarterSales.isEmpty()) {
        QuarterSection section = buildQuarterSection(quarterSales, qQuarter, qYear);
        sections.add(section);
      }
      qQuarter++;
      if (qQuarter > 4) {
        qQuarter = 1;
        qYear++;
      }
    }

    // Build all-time totals
    AllTimeTotals allTime = buildAllTimeTotals(allSales);

    return new RoyaltyReportResponse(
        authorName, startQuarter, startYear, endQuarter, endYear, sections, allTime);
  }

  @Transactional(readOnly = true)
  public FinancialReportFile exportAllAuthorsRoyaltyReport(
      int startQuarter, int startYear, int endQuarter, int endYear) {
    validateQuarterRange(startQuarter, startYear, endQuarter, endYear);
    List<QuarterKey> quarterRange = buildQuarterRange(startQuarter, startYear, endQuarter, endYear);

    List<Sale> inRangeSales =
        saleRepository.findAll().stream()
            .filter(this::isHistoricalSale)
            .filter(sale -> quarterRangeContains(quarterRange, sale))
            .toList();

    Map<String, Map<QuarterKey, BigDecimal>> royaltiesByAuthor = new LinkedHashMap<>();
    for (Sale sale : inRangeSales) {
      String authorName = sale.getBook().getAuthor().getName();
      QuarterKey key = quarterOf(sale);
      royaltiesByAuthor
          .computeIfAbsent(authorName, ignored -> new LinkedHashMap<>())
          .merge(key, nvl(sale.getAuthorRoyalty()), BigDecimal::add);
    }

    List<String> sortedAuthors =
        royaltiesByAuthor.keySet().stream().sorted(authorFirstNameComparator()).toList();

    try (Workbook workbook = new XSSFWorkbook()) {
      Sheet sheet = workbook.createSheet("Author Royalties");
      int rowIndex = 0;

      Row header = sheet.createRow(rowIndex++);
      int headerCol = 0;
      header.createCell(headerCol++).setCellValue("Author");
      for (QuarterKey quarterKey : quarterRange) {
        header.createCell(headerCol++).setCellValue(quarterLabel(quarterKey));
      }
      header.createCell(headerCol).setCellValue("Total Royalties");

      List<BigDecimal> totalsPerQuarter = quarterRange.stream().map(q -> BigDecimal.ZERO).toList();
      List<BigDecimal> mutableTotalsPerQuarter = new ArrayList<>(totalsPerQuarter);
      BigDecimal grandTotal = BigDecimal.ZERO;

      for (String authorName : sortedAuthors) {
        Row row = sheet.createRow(rowIndex++);
        int col = 0;
        row.createCell(col++).setCellValue(authorName);

        BigDecimal authorTotal = BigDecimal.ZERO;
        Map<QuarterKey, BigDecimal> authorValues = royaltiesByAuthor.get(authorName);
        for (int i = 0; i < quarterRange.size(); i++) {
          QuarterKey quarterKey = quarterRange.get(i);
          BigDecimal value = nvl(authorValues.get(quarterKey));
          createMoneyCell(row, col++, value);
          authorTotal = authorTotal.add(value);
          mutableTotalsPerQuarter.set(i, mutableTotalsPerQuarter.get(i).add(value));
        }

        createMoneyCell(row, col, authorTotal);
        grandTotal = grandTotal.add(authorTotal);
      }

      Row totalsRow = sheet.createRow(rowIndex);
      int totalCol = 0;
      totalsRow.createCell(totalCol++).setCellValue("Total per Quarter");
      for (BigDecimal total : mutableTotalsPerQuarter) {
        createMoneyCell(totalsRow, totalCol++, total);
      }
      createMoneyCell(totalsRow, totalCol, grandTotal);

      autosizeColumns(sheet, quarterRange.size() + 2);
      return new FinancialReportFile(
          buildFilename("All_Authors_Royalty_Report"),
          XLSX_CONTENT_TYPE,
          workbookToBytes(workbook));
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to generate all authors royalty report", ex);
    }
  }

  @Transactional(readOnly = true)
  public FinancialReportFile exportPublisherProfitReport(
      int startQuarter, int startYear, int endQuarter, int endYear) {
    validateQuarterRange(startQuarter, startYear, endQuarter, endYear);
    List<QuarterKey> quarterRange = buildQuarterRange(startQuarter, startYear, endQuarter, endYear);

    List<Book> books =
        bookRepository.findAll().stream()
            .filter(book -> !isUnreleased(book))
            .sorted(bookComparator())
            .toList();

    Map<Long, Map<QuarterKey, BigDecimal>> profitByBookAndQuarter = new LinkedHashMap<>();
    saleRepository.findAll().stream()
        .filter(this::isHistoricalSale)
        .filter(sale -> quarterRangeContains(quarterRange, sale))
        .forEach(
            sale -> {
              QuarterKey key = quarterOf(sale);
              BigDecimal profit =
                  nvl(sale.getPublisherRevenue()).subtract(nvl(sale.getAuthorRoyalty()));
              profitByBookAndQuarter
                  .computeIfAbsent(sale.getBook().getId(), ignored -> new LinkedHashMap<>())
                  .merge(key, profit, BigDecimal::add);
            });

    try (Workbook workbook = new XSSFWorkbook()) {
      Sheet sheet = workbook.createSheet("Publisher Profit Report");
      int rowIndex = 0;

      Row header = sheet.createRow(rowIndex++);
      int headerCol = 0;
      header.createCell(headerCol++).setCellValue("Author");
      header.createCell(headerCol++).setCellValue("Series");
      header.createCell(headerCol++).setCellValue("Position");
      header.createCell(headerCol++).setCellValue("Title");
      header.createCell(headerCol++).setCellValue("ISBN-13");
      header.createCell(headerCol++).setCellValue("ASIN");
      header.createCell(headerCol++).setCellValue("Cover Price");
      header.createCell(headerCol++).setCellValue("Print Cost");
      for (QuarterKey quarterKey : quarterRange) {
        header.createCell(headerCol++).setCellValue(quarterLabel(quarterKey));
      }
      header.createCell(headerCol).setCellValue("Total Profit per Book");

      List<BigDecimal> totalsPerQuarter =
          new ArrayList<>(quarterRange.stream().map(q -> BigDecimal.ZERO).toList());
      BigDecimal grandTotal = BigDecimal.ZERO;

      for (Book book : books) {
        Row row = sheet.createRow(rowIndex++);
        int col = 0;
        row.createCell(col++).setCellValue(book.getAuthor().getName());
        row.createCell(col++).setCellValue(Optional.ofNullable(book.getSeriesName()).orElse(""));
        createIntegerCell(row, col++, book.getSeriesPosition());
        row.createCell(col++).setCellValue(book.getTitle());
        row.createCell(col++).setCellValue(book.getIsbn13());
        row.createCell(col++)
            .setCellValue(Optional.ofNullable(book.getAmazonEbookAsin()).orElse(""));
        createMoneyCell(row, col++, nvl(book.getCoverPrice()));
        createMoneyCell(row, col++, nvl(book.getPrintCost()));

        BigDecimal rowTotal = BigDecimal.ZERO;
        Map<QuarterKey, BigDecimal> quarterProfits =
            profitByBookAndQuarter.getOrDefault(book.getId(), Map.of());
        for (int i = 0; i < quarterRange.size(); i++) {
          QuarterKey quarterKey = quarterRange.get(i);
          BigDecimal value = nvl(quarterProfits.get(quarterKey));
          createMoneyCell(row, col++, value);
          rowTotal = rowTotal.add(value);
          totalsPerQuarter.set(i, totalsPerQuarter.get(i).add(value));
        }

        createMoneyCell(row, col, rowTotal);
        grandTotal = grandTotal.add(rowTotal);
      }

      Row totalsRow = sheet.createRow(rowIndex);
      int totalCol = 0;
      totalsRow.createCell(totalCol++).setCellValue("Total Profit per Quarter");
      for (int i = 0; i < 7; i++) {
        totalsRow.createCell(totalCol++).setCellValue("");
      }
      for (BigDecimal total : totalsPerQuarter) {
        createMoneyCell(totalsRow, totalCol++, total);
      }
      createMoneyCell(totalsRow, totalCol, grandTotal);

      autosizeColumns(sheet, 9 + quarterRange.size() + 1);
      return new FinancialReportFile(
          buildFilename("Publisher_Profit_Report"), XLSX_CONTENT_TYPE, workbookToBytes(workbook));
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to generate publisher profit report", ex);
    }
  }

  @Transactional(readOnly = true)
  public FinancialReportFile exportAmazonSalesReport() {
    Map<Long, AmazonSalesAccumulator> byBook = new LinkedHashMap<>();

    saleRepository.findAll().stream()
        .filter(this::isHistoricalSale)
        .filter(sale -> sale.getSaleSource() == SaleSource.DISTRIBUTOR)
        .filter(sale -> sale.getDistributor() == SaleDistributor.AMAZON)
        .forEach(
            sale -> {
              Book book = sale.getBook();
              AmazonSalesAccumulator acc =
                  byBook.computeIfAbsent(book.getId(), ignored -> new AmazonSalesAccumulator(book));
              switch (sale.getFormat()) {
                case PRINT -> {
                  acc.printQuantity += quantityOrZero(sale);
                  acc.printRevenue = acc.printRevenue.add(nvl(sale.getPublisherRevenue()));
                }
                case EBOOK -> {
                  acc.ebookQuantity += quantityOrZero(sale);
                  acc.ebookRevenue = acc.ebookRevenue.add(nvl(sale.getPublisherRevenue()));
                }
                case KINDLE_UNLIMITED -> {
                  acc.kenp += Optional.ofNullable(sale.getKenp()).orElse(0);
                  acc.kenpRevenue = acc.kenpRevenue.add(nvl(sale.getPublisherRevenue()));
                }
              }
            });

    List<AmazonSalesAccumulator> rows =
        byBook.values().stream()
            .sorted((a, b) -> bookComparator().compare(a.book, b.book))
            .toList();

    try (Workbook workbook = new XSSFWorkbook()) {
      Sheet sheet = workbook.createSheet("Amazon Sales");
      int rowIndex = 0;

      Row header = sheet.createRow(rowIndex++);
      int col = 0;
      header.createCell(col++).setCellValue("Author");
      header.createCell(col++).setCellValue("Series");
      header.createCell(col++).setCellValue("Position");
      header.createCell(col++).setCellValue("Title");
      header.createCell(col++).setCellValue("ISBN-13");
      header.createCell(col++).setCellValue("ASIN");
      header.createCell(col++).setCellValue("Print Quantity");
      header.createCell(col++).setCellValue("Print Revenue");
      header.createCell(col++).setCellValue("Ebook Quantity");
      header.createCell(col++).setCellValue("Ebook Revenue");
      header.createCell(col++).setCellValue("KENP");
      header.createCell(col).setCellValue("KENP Revenue");

      for (AmazonSalesAccumulator acc : rows) {
        Row row = sheet.createRow(rowIndex++);
        int rowCol = 0;
        row.createCell(rowCol++).setCellValue(acc.book.getAuthor().getName());
        row.createCell(rowCol++)
            .setCellValue(Optional.ofNullable(acc.book.getSeriesName()).orElse(""));
        createIntegerCell(row, rowCol++, acc.book.getSeriesPosition());
        row.createCell(rowCol++).setCellValue(acc.book.getTitle());
        row.createCell(rowCol++).setCellValue(acc.book.getIsbn13());
        row.createCell(rowCol++)
            .setCellValue(Optional.ofNullable(acc.book.getAmazonEbookAsin()).orElse(""));
        createIntegerCell(row, rowCol++, acc.printQuantity);
        createMoneyCell(row, rowCol++, acc.printRevenue);
        createIntegerCell(row, rowCol++, acc.ebookQuantity);
        createMoneyCell(row, rowCol++, acc.ebookRevenue);
        createIntegerCell(row, rowCol++, acc.kenp);
        createMoneyCell(row, rowCol, acc.kenpRevenue);
      }

      autosizeColumns(sheet, 12);
      return new FinancialReportFile(
          buildFilename("Amazon_Sale_Report"), XLSX_CONTENT_TYPE, workbookToBytes(workbook));
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to generate Amazon sales report", ex);
    }
  }

  private List<Sale> filterByQuarter(List<Sale> sales, int quarter, int year) {
    int startMonth = (quarter - 1) * 3 + 1;
    int endMonth = startMonth + 2;
    return sales.stream()
        .filter(
            s ->
                s.getSaleYear() == year
                    && s.getSaleMonth() >= startMonth
                    && s.getSaleMonth() <= endMonth)
        .toList();
  }

  private QuarterSection buildQuarterSection(List<Sale> sales, int quarter, int year) {
    Map<Long, List<Sale>> byBook = groupByBook(sales);
    List<ReportBookRow> rows = buildSortedBookRows(byBook);
    ReportBookRow totals = sumRows(rows);
    return new QuarterSection(quarter, year, rows, totals);
  }

  private AllTimeTotals buildAllTimeTotals(List<Sale> sales) {
    Map<Long, List<Sale>> byBook = groupByBook(sales);
    List<ReportBookRow> rows = buildSortedBookRows(byBook);
    ReportBookRow totals = sumRows(rows);
    return new AllTimeTotals(rows, totals);
  }

  private Map<Long, List<Sale>> groupByBook(List<Sale> sales) {
    Map<Long, List<Sale>> map = new LinkedHashMap<>();
    for (Sale s : sales) {
      map.computeIfAbsent(s.getBook().getId(), k -> new ArrayList<>()).add(s);
    }
    return map;
  }

  private List<ReportBookRow> buildSortedBookRows(Map<Long, List<Sale>> byBook) {
    List<ReportBookRow> rows = new ArrayList<>();
    for (List<Sale> bookSales : byBook.values()) {
      Book book = bookSales.get(0).getBook();
      String displayName = bookDisplayName(book);
      int handsold =
          bookSales.stream()
              .filter(s -> s.getSaleSource() == SaleSource.HAND_SOLD)
              .mapToInt(this::quantityOrZero)
              .sum();
      int ingramPrint =
          bookSales.stream()
              .filter(
                  s ->
                      s.getSaleSource() == SaleSource.DISTRIBUTOR
                          && s.getDistributor() == SaleDistributor.INGRAM_SPARK
                          && s.getFormat() == SaleFormat.PRINT)
              .mapToInt(this::quantityOrZero)
              .sum();
      int amazonPrint =
          bookSales.stream()
              .filter(
                  s ->
                      s.getSaleSource() == SaleSource.DISTRIBUTOR
                          && s.getDistributor() == SaleDistributor.AMAZON
                          && s.getFormat() == SaleFormat.PRINT)
              .mapToInt(this::quantityOrZero)
              .sum();
      int amazonEbook =
          bookSales.stream()
              .filter(
                  s ->
                      s.getSaleSource() == SaleSource.DISTRIBUTOR
                          && s.getDistributor() == SaleDistributor.AMAZON
                          && s.getFormat() == SaleFormat.EBOOK)
              .mapToInt(this::quantityOrZero)
              .sum();
      int otherPrint =
          bookSales.stream()
              .filter(
                  s ->
                      s.getSaleSource() == SaleSource.DISTRIBUTOR
                          && s.getDistributor() == SaleDistributor.OTHER
                          && s.getFormat() == SaleFormat.PRINT)
              .mapToInt(this::quantityOrZero)
              .sum();
      int otherEbook =
          bookSales.stream()
              .filter(
                  s ->
                      s.getSaleSource() == SaleSource.DISTRIBUTOR
                          && s.getDistributor() == SaleDistributor.OTHER
                          && s.getFormat() == SaleFormat.EBOOK)
              .mapToInt(this::quantityOrZero)
              .sum();
      int kenpTotal =
          bookSales.stream()
              .filter(
                  s ->
                      s.getSaleSource() == SaleSource.DISTRIBUTOR
                          && s.getDistributor() == SaleDistributor.AMAZON
                          && s.getFormat() == SaleFormat.KINDLE_UNLIMITED)
              .mapToInt(s -> Optional.ofNullable(s.getKenp()).orElse(0))
              .sum();
      int qty = handsold + ingramPrint + amazonPrint + amazonEbook + otherPrint + otherEbook;
      BigDecimal unpaid =
          bookSales.stream()
              .filter(s -> !Boolean.TRUE.equals(s.getHasAuthorBeenPaid()))
              .map(Sale::getAuthorRoyalty)
              .reduce(BigDecimal.ZERO, BigDecimal::add);
      BigDecimal paid =
          bookSales.stream()
              .filter(s -> Boolean.TRUE.equals(s.getHasAuthorBeenPaid()))
              .map(Sale::getAuthorRoyalty)
              .reduce(BigDecimal.ZERO, BigDecimal::add);
      rows.add(
          new ReportBookRow(
              displayName,
              book.getTitle(),
              book.getSeriesName(),
              book.getSeriesPosition(),
              qty,
              handsold,
              ingramPrint,
              amazonPrint,
              amazonEbook,
              otherPrint,
              otherEbook,
              kenpTotal,
              unpaid,
              paid,
              unpaid.add(paid)));
    }
    rows.sort(
        Comparator.<ReportBookRow, Boolean>comparing(r -> !r.displayName().contains("("))
            .thenComparing(ReportBookRow::displayName, String.CASE_INSENSITIVE_ORDER));
    return rows;
  }

  private ReportBookRow sumRows(List<ReportBookRow> rows) {
    int qty = rows.stream().mapToInt(ReportBookRow::quantity).sum();
    int handsold = rows.stream().mapToInt(ReportBookRow::handsold).sum();
    int ingramPrint = rows.stream().mapToInt(ReportBookRow::ingramPrint).sum();
    int amazonPrint = rows.stream().mapToInt(ReportBookRow::amazonPrint).sum();
    int amazonEbook = rows.stream().mapToInt(ReportBookRow::amazonEbook).sum();
    int otherPrint = rows.stream().mapToInt(ReportBookRow::otherPrint).sum();
    int otherEbook = rows.stream().mapToInt(ReportBookRow::otherEbook).sum();
    int kenpTotal = rows.stream().mapToInt(ReportBookRow::kenpTotal).sum();
    BigDecimal unpaid =
        rows.stream().map(ReportBookRow::unpaidRoyalty).reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal paid =
        rows.stream().map(ReportBookRow::paidRoyalty).reduce(BigDecimal.ZERO, BigDecimal::add);
    return new ReportBookRow(
        "All Books",
        null,
        null,
        null,
        qty,
        handsold,
        ingramPrint,
        amazonPrint,
        amazonEbook,
        otherPrint,
        otherEbook,
        kenpTotal,
        unpaid,
        paid,
        unpaid.add(paid));
  }

  private int quantityOrZero(Sale sale) {
    return Optional.ofNullable(sale.getQuantitySold()).orElse(0);
  }

  private void createMoneyCell(Row row, int cellIndex, BigDecimal value) {
    Cell cell = row.createCell(cellIndex);
    cell.setCellValue(value.setScale(2, RoundingMode.HALF_UP).doubleValue());
  }

  private void createIntegerCell(Row row, int cellIndex, Integer value) {
    Cell cell = row.createCell(cellIndex);
    if (value == null) {
      cell.setCellValue("");
      return;
    }
    cell.setCellValue(value);
  }

  private void autosizeColumns(Sheet sheet, int columnCount) {
    for (int i = 0; i < columnCount; i++) {
      sheet.autoSizeColumn(i);
    }
  }

  private byte[] workbookToBytes(Workbook workbook) throws java.io.IOException {
    try (java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream()) {
      workbook.write(outputStream);
      return outputStream.toByteArray();
    }
  }

  private String buildFilename(String prefix) {
    LocalDateTime now = LocalDateTime.now();
    String date = FILE_DATE_FORMATTER.format(now);
    String timestamp = FILE_TIME_FORMATTER.format(now);
    return prefix + "_" + date + "_" + timestamp + ".xlsx";
  }

  private void validateQuarterRange(int startQuarter, int startYear, int endQuarter, int endYear) {
    if (startQuarter < 1 || startQuarter > 4 || endQuarter < 1 || endQuarter > 4) {
      throw new IllegalArgumentException("Quarter must be in range 1..4");
    }
    if (startYear < 1900 || endYear > 2100) {
      throw new IllegalArgumentException("Year must be in range 1900..2100");
    }
    if (endYear < startYear || (endYear == startYear && endQuarter < startQuarter)) {
      throw new IllegalArgumentException("End quarter must be on or after start quarter");
    }
  }

  private List<QuarterKey> buildQuarterRange(
      int startQuarter, int startYear, int endQuarter, int endYear) {
    List<QuarterKey> quarters = new ArrayList<>();
    int currentYear = startYear;
    int currentQuarter = startQuarter;
    while (currentYear < endYear || (currentYear == endYear && currentQuarter <= endQuarter)) {
      quarters.add(new QuarterKey(currentYear, currentQuarter));
      currentQuarter++;
      if (currentQuarter > 4) {
        currentQuarter = 1;
        currentYear++;
      }
    }
    return quarters;
  }

  private QuarterKey quarterOf(Sale sale) {
    int quarter = ((sale.getSaleMonth() - 1) / 3) + 1;
    return new QuarterKey(sale.getSaleYear(), quarter);
  }

  private boolean quarterRangeContains(List<QuarterKey> range, Sale sale) {
    return range.contains(quarterOf(sale));
  }

  private String quarterLabel(QuarterKey quarterKey) {
    return quarterKey.year + " Q" + quarterKey.quarter;
  }

  private Comparator<String> authorFirstNameComparator() {
    return Comparator.comparing(this::authorFirstName, String.CASE_INSENSITIVE_ORDER)
        .thenComparing(name -> name, String.CASE_INSENSITIVE_ORDER);
  }

  private String authorFirstName(String fullName) {
    String normalized = fullName == null ? "" : fullName.trim();
    if (normalized.isEmpty()) {
      return "";
    }

    // Support both "First Last" and "Last, First" author name formats.
    if (normalized.contains(",")) {
      String[] commaParts = normalized.split(",", 2);
      String firstNamePortion = commaParts.length > 1 ? commaParts[1].trim() : "";
      if (!firstNamePortion.isEmpty()) {
        String[] tokens = firstNamePortion.split("\\s+");
        return tokens[0];
      }
    }

    String[] tokens = normalized.split("\\s+");
    return tokens[0];
  }

  private Comparator<Book> bookComparator() {
    return Comparator.comparing(
            (Book book) -> book.getAuthor().getName(), String.CASE_INSENSITIVE_ORDER)
        .thenComparing(Book::getSeriesName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
        .thenComparing(Book::getSeriesPosition, Comparator.nullsLast(Integer::compareTo))
        .thenComparing(Book::getTitle, String.CASE_INSENSITIVE_ORDER);
  }

  private BigDecimal nvl(BigDecimal value) {
    return value == null ? BigDecimal.ZERO : value;
  }

  private boolean isHistoricalSale(Sale sale) {
    if (sale.getSaleYear() == null || sale.getSaleMonth() == null) {
      return false;
    }
    YearMonth saleMonth = YearMonth.of(sale.getSaleYear(), sale.getSaleMonth());
    return !saleMonth.isAfter(YearMonth.now());
  }

  private boolean isUnreleased(Book book) {
    if (book.getPublicationYear() == null || book.getPublicationMonth() == null) {
      return true;
    }
    YearMonth publication = YearMonth.of(book.getPublicationYear(), book.getPublicationMonth());
    return publication.isAfter(YearMonth.now());
  }

  private String bookDisplayName(Book book) {
    if (book.getSeriesName() != null && book.getSeriesPosition() != null) {
      return book.getSeriesName() + " (" + book.getSeriesPosition() + ")";
    }
    return book.getTitle();
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

  @Transactional
  public SalesImportResponse importSales(SalesImportRequest salesImportRequest) {
    MultipartFile file = salesImportRequest.importFile();
    String contentType = file.getContentType() == null ? "" : file.getContentType();
    String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();

    if (ingramCsvParser.supports(contentType, filename)) {
      return importIngramCsv(salesImportRequest);
    }
    if (amazonXlsxParser.supports(contentType, filename)) {
      return importAmazonXlsx(salesImportRequest);
    }

    return new SalesImportResponse(
        List.of(),
        List.of(new ParsingError(0, null, "import.file.unsupportedType")),
        List.of(),
        List.of());
  }

  private SalesImportResponse importIngramCsv(SalesImportRequest salesImportRequest) {
    List<ParsingError> requiredDateErrors = new ArrayList<>();
    if (salesImportRequest.saleMonth() == null) {
      requiredDateErrors.add(new ParsingError(0, null, "saleMonth.isRequired"));
    }
    if (salesImportRequest.saleYear() == null) {
      requiredDateErrors.add(new ParsingError(0, null, "year.isRequired"));
    }

    if (!requiredDateErrors.isEmpty()) {
      return new SalesImportResponse(List.of(), List.of(), requiredDateErrors, List.of());
    }

    ParsedBatch<IngramCsvEntry> parsedBatch =
        ingramCsvParser.parse(salesImportRequest.importFile());
    List<ParsingError> parseErrors = parsedBatch.parsingErrors();

    if (!parseErrors.isEmpty()) {
      return new SalesImportResponse(List.of(), parseErrors, List.of(), List.of());
    }

    List<Sale> sales = new ArrayList<>();
    List<ParsingError> validationErrors = new ArrayList<>();

    int rowNum = 0;
    for (IngramCsvEntry csvEntry : parsedBatch.records()) {
      rowNum++;
      try {
        Sale sale = mapIngramCsvRowToSale(salesImportRequest, parsedBatch, csvEntry);
        sales.add(sale);
      } catch (NotFoundException e) {
        validationErrors.add(new ParsingError(rowNum, null, "book.notFound"));
      } catch (RuntimeException e) {
        validationErrors.add(new ParsingError(rowNum, null, "sale.mappingFailed"));
      }
    }

    if (!validationErrors.isEmpty()) {
      return new SalesImportResponse(List.of(), List.of(), validationErrors, List.of());
    }

    if (!salesImportRequest.isPreview()) {
      saveSalesToRepo(sales);
    }

    List<SaleResponse> saleResponses = sales.stream().map(SaleResponse::from).toList();
    return new SalesImportResponse(saleResponses, List.of(), List.of(), List.of());
  }

  private SalesImportResponse importAmazonXlsx(SalesImportRequest salesImportRequest) {
    ParsedBatch<AmazonXlsxEntry> parsedBatch =
        amazonXlsxParser.parse(salesImportRequest.importFile());
    List<ParsingError> parseErrors = parsedBatch.parsingErrors();

    if (!parseErrors.isEmpty()) {
      return new SalesImportResponse(
          List.of(), parseErrors, List.of(), parsedBatch.parsingWarnings());
    }

    List<Sale> sales = new ArrayList<>();
    List<ParsingError> validationErrors = new ArrayList<>();

    for (AmazonXlsxEntry row : parsedBatch.records()) {
      try {
        Sale sale =
            mapAmazonXlsxRowToSale(salesImportRequest.importFile(), parsedBatch.timestamp(), row);
        sales.add(sale);
      } catch (AmbiguousLookupException e) {
        validationErrors.add(
            new ParsingError(
                row.sourceRowNumber(), null, "book.asin.multipleMatches", row.sheetName()));
      } catch (NotFoundException e) {
        validationErrors.add(
            new ParsingError(row.sourceRowNumber(), null, "book.notFound", row.sheetName()));
      } catch (RuntimeException e) {
        validationErrors.add(
            new ParsingError(row.sourceRowNumber(), null, "sale.mappingFailed", row.sheetName()));
      }
    }

    if (!validationErrors.isEmpty()) {
      return new SalesImportResponse(
          List.of(), List.of(), validationErrors, parsedBatch.parsingWarnings());
    }

    if (!salesImportRequest.isPreview()
        && !parsedBatch.parsingWarnings().isEmpty()
        && !Boolean.TRUE.equals(salesImportRequest.acknowledgeWarnings())) {
      return new SalesImportResponse(
          List.of(),
          List.of(),
          List.of(new ParsingError(0, null, "import.warnings.mustAcknowledge")),
          parsedBatch.parsingWarnings());
    }

    if (!salesImportRequest.isPreview()) {
      saveSalesToRepo(sales);
    }

    List<SaleResponse> saleResponses = sales.stream().map(SaleResponse::from).toList();
    return new SalesImportResponse(
        saleResponses, List.of(), List.of(), parsedBatch.parsingWarnings());
  }

  private Sale getOrThrowSaleFromRepoById(Long id) {
    return saleRepository.findById(id).orElseThrow(() -> new NotFoundException("Sale not found"));
  }

  private Book getOrThrowBookFromRepoById(Long id) {
    return bookRepository.findById(id).orElseThrow(() -> new NotFoundException("Book not found"));
  }

  private BigDecimal convertToUsd(Currency currency, BigDecimal amount) {
    return currencyService.convert(currency.name(), "USD", amount);
  }

  private BigDecimal resolvePublisherRevenue(SaleRequest request, Book book) {
    SaleSource source = request.saleSource();
    if (source.isRevenueComputed()) {
      return source.computeRevenue(book, request.quantitySold());
    }
    if (request.publisherRevenue() == null) {
      throw new DataIntegrityViolationException(
          "publisherRevenue is required for distributor sales");
    }
    return request.publisherRevenue();
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
      SalesImportRequest salesImportRequest,
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
        .distributor(SaleDistributor.INGRAM_SPARK)
        .format(resolveIngramFormat(ingramCsvEntry.getFormat()))
        .saleMonth(salesImportRequest.saleMonth())
        .saleYear(salesImportRequest.saleYear())
        .book(book)
        .quantitySold(Math.toIntExact(ingramCsvEntry.getNetQty()))
        .saleCurrency(Currency.USD) // CSV Import is always USD Value
        .originalPublisherRevenue(ingramCsvEntry.getNetCompensation())
        .publisherRevenue(ingramCsvEntry.getNetCompensation())
        .authorRoyalty(authorRoyalty)
        .hasAuthorBeenPaid(false)
        .comment(getCommentFromCSV(salesImportRequest.importFile(), parsedBatch, ingramCsvEntry))
        .build();
  }

  private Sale mapAmazonXlsxRowToSale(
      MultipartFile file, LocalDateTime parsedTimestamp, AmazonXlsxEntry row) {
    Book book =
        (row.format() == SaleFormat.PRINT
                ? bookService.findBookByIsbn(row.isbn())
                : bookService.findBookByAmazonEbookAsin(row.asin()))
            .orElseThrow(() -> new NotFoundException("Book not found"));

    BigDecimal publisherRevenueUsd = convertToUsd(row.currency(), row.royalty());
    BigDecimal authorRoyaltyRate = SaleSource.DISTRIBUTOR.getRoyaltyRate(book);
    BigDecimal authorRoyalty = computeAuthorRoyalty(publisherRevenueUsd, authorRoyaltyRate);

    return Sale.builder()
        .saleSource(SaleSource.DISTRIBUTOR)
        .distributor(SaleDistributor.AMAZON)
        .format(row.format())
        .saleMonth(row.saleMonth())
        .saleYear(row.saleYear())
        .book(book)
        .quantitySold(row.quantitySold())
        .kenp(row.kenp())
        .saleCurrency(row.currency())
        .originalPublisherRevenue(row.royalty())
        .publisherRevenue(publisherRevenueUsd)
        .authorRoyalty(authorRoyalty)
        .hasAuthorBeenPaid(false)
        .comment(getCommentFromAmazon(file, parsedTimestamp, row))
        .build();
  }

  private String getCommentFromCSV(
      MultipartFile file, ParsedBatch<IngramCsvEntry> parsedBatch, IngramCsvEntry ingramCsvEntry) {
    String comment =
        String.format(
            "Ingram: Format='%s' Market='%s' File='%s' (%s)",
            ImportParser.truncateField(ingramCsvEntry.getFormat(), ImportParser.MAX_FORMAT_LENGTH),
            ImportParser.truncateField(
                ingramCsvEntry.getSalesMarket(), ImportParser.MAX_MARKET_LENGTH),
            ImportParser.truncateField(
                file.getOriginalFilename(), ImportParser.MAX_FILENAME_LENGTH),
            ImportParser.formatCommentTimestamp(parsedBatch.timestamp()));
    return ImportParser.truncateComment(comment);
  }

  private String getCommentFromAmazon(
      MultipartFile file, LocalDateTime parsedTimestamp, AmazonXlsxEntry row) {
    String comment =
        String.format(
            "Amazon: Market='%s' File='%s' Sheet='%s' (%s)",
            ImportParser.truncateField(row.marketplace(), ImportParser.MAX_MARKET_LENGTH),
            ImportParser.truncateField(
                file.getOriginalFilename(), ImportParser.MAX_FILENAME_LENGTH),
            ImportParser.truncateField(row.sheetName(), ImportParser.MAX_SHEET_LENGTH),
            ImportParser.formatCommentTimestamp(parsedTimestamp));
    return ImportParser.truncateComment(comment);
  }

  private void saveSalesToRepo(List<Sale> sales) {
    saleRepository.saveAll(sales);
  }

  private SaleFormat resolveIngramFormat(String formatRaw) {
    if (formatRaw == null) {
      return SaleFormat.PRINT;
    }
    String normalized = formatRaw.trim().toLowerCase();
    if (normalized.contains("ebook")) {
      return SaleFormat.EBOOK;
    }
    return SaleFormat.PRINT;
  }

  private record QuarterKey(int year, int quarter) {}

  private static final class AmazonSalesAccumulator {
    private final Book book;
    private int printQuantity;
    private BigDecimal printRevenue = BigDecimal.ZERO;
    private int ebookQuantity;
    private BigDecimal ebookRevenue = BigDecimal.ZERO;
    private int kenp;
    private BigDecimal kenpRevenue = BigDecimal.ZERO;

    private AmazonSalesAccumulator(Book book) {
      this.book = book;
    }
  }
}
