package edu.duke.bookpublishing.sales;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import edu.duke.bookpublishing.author.Author;
import edu.duke.bookpublishing.author.AuthorRepository;
import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.books.BookService;
import edu.duke.bookpublishing.currency.CurrencyService;
import edu.duke.bookpublishing.exception.custom.AmbiguousLookupException;
import edu.duke.bookpublishing.exception.custom.NotFoundException;
import edu.duke.bookpublishing.sales.dto.SaleRequest;
import edu.duke.bookpublishing.sales.dto.SalesImportRequest;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

/**
 * Test class for the Sales service
 *
 * @author Daniel Rodriguez-Florido
 */
@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

  @Mock private BookRepository bookRepository;

  @Mock private BookService bookService;

  @Mock private SaleRepository saleRepository;

  @Mock private ImportParser<IngramCsvEntry> ingramCsvParser;

  @Mock private ImportParser<AmazonXlsxEntry> amazonXlsxParser;

  @Mock private AuthorRepository authorRepository;

  @Mock private CurrencyService currencyService;

  private SaleService saleService;

  @Captor private ArgumentCaptor<Sale> saleCaptor;

  private Author author;
  private Book book;

  @BeforeEach
  void setUp() {
    // USD→USD conversion is a pass-through (mirrors CurrencyService.convert short-circuit)
    lenient()
        .when(currencyService.convert(eq("USD"), eq("USD"), any(BigDecimal.class)))
        .thenAnswer(invocation -> invocation.getArgument(2));
    lenient().when(ingramCsvParser.supports(anyString(), anyString())).thenReturn(true);
    lenient().when(amazonXlsxParser.supports(anyString(), anyString())).thenReturn(false);

    saleService =
        new SaleService(
            bookService,
            bookRepository,
            saleRepository,
            ingramCsvParser,
            amazonXlsxParser,
            authorRepository,
            currencyService);
    author = Author.builder().id(1L).name("Test Author").email("test@example.com").build();

    book =
        Book.builder()
            .id(1L)
            .title("Test Book")
            .author(author)
            .isbn13("9780743273565")
            .publicationYear(2020)
            .publicationMonth(1)
            .distributorAuthorRoyaltyRate(new BigDecimal("0.20"))
            .handsoldAuthorRoyaltyRate(new BigDecimal("0.10"))
            .coverPrice(new BigDecimal("20.00"))
            .printCost(new BigDecimal("5.00"))
            .build();
  }

  private SaleRequest saleRequest(
      Long bookId,
      SaleSource source,
      Integer month,
      Integer year,
      Integer quantitySold,
      BigDecimal publisherRevenue,
      Boolean hasAuthorBeenPaid,
      String comment) {
    return new SaleRequest(
        bookId,
        source,
        source == SaleSource.DISTRIBUTOR ? SaleDistributor.OTHER : null,
        SaleFormat.PRINT,
        month,
        year,
        quantitySold,
        null,
        Currency.USD,
        publisherRevenue,
        publisherRevenue,
        hasAuthorBeenPaid,
        comment);
  }

  @Test
  void getAllSalesWithoutFiltersUsesSpecification() {
    Sort sort = Sort.by("saleYear").descending();
    saleService.getAllSales(null, null, null, null, null, null, null, null, sort);
    verify(saleRepository, times(1))
        .findAll(org.mockito.ArgumentMatchers.<Specification<Sale>>any(), any(Sort.class));
  }

  @Test
  void getAllSalesWithDatesUsesSpecification() {
    LocalDate startDate = LocalDate.of(2024, 1, 1);
    LocalDate endDate = LocalDate.of(2024, 12, 31);
    Sort sort = Sort.by("saleYear").descending();
    saleService.getAllSales(startDate, endDate, null, null, null, null, null, null, sort);
    verify(saleRepository, times(1))
        .findAll(org.mockito.ArgumentMatchers.<Specification<Sale>>any(), any(Sort.class));
  }

  @Test
  void getAllSalesWithQueryUsesSpecification() {
    Sort sort = Sort.by("saleYear").descending();
    saleService.getAllSales(null, null, null, null, null, null, null, "test query", sort);
    verify(saleRepository, times(1))
        .findAll(org.mockito.ArgumentMatchers.<Specification<Sale>>any(), any(Sort.class));
  }

  @Test
  void getPagedSalesWithoutFiltersUsesSpecification() {
    Pageable pageable = mock(Pageable.class);
    saleService.getPagedSales(null, null, null, null, null, null, null, null, pageable);
    verify(saleRepository, times(1))
        .findAll(org.mockito.ArgumentMatchers.<Specification<Sale>>any(), any(Pageable.class));
  }

  @Test
  void getPagedSalesWithDatesUsesSpecification() {
    Pageable pageable = mock(Pageable.class);
    LocalDate startDate = LocalDate.of(2024, 1, 1);
    LocalDate endDate = LocalDate.of(2024, 12, 31);
    saleService.getPagedSales(startDate, endDate, null, null, null, null, null, null, pageable);
    verify(saleRepository, times(1))
        .findAll(org.mockito.ArgumentMatchers.<Specification<Sale>>any(), any(Pageable.class));
  }

  @Test
  void getPagedSalesWithQueryUsesSpecification() {
    Pageable pageable = mock(Pageable.class);
    saleService.getPagedSales(null, null, null, null, null, null, null, "test query", pageable);
    verify(saleRepository, times(1))
        .findAll(org.mockito.ArgumentMatchers.<Specification<Sale>>any(), any(Pageable.class));
  }

  @Test
  void getSaleByIdReturnsSaleWhenFound() {
    Sale sale =
        Sale.builder()
            .id(11L)
            .book(book)
            .saleSource(SaleSource.DISTRIBUTOR)
            .distributor(SaleDistributor.OTHER)
            .format(SaleFormat.PRINT)
            .saleMonth(1)
            .saleYear(2024)
            .quantitySold(1)
            .saleCurrency(Currency.USD)
            .originalPublisherRevenue(new BigDecimal("10.00"))
            .publisherRevenue(new BigDecimal("10.00"))
            .authorRoyalty(new BigDecimal("2.00"))
            .hasAuthorBeenPaid(false)
            .build();
    when(saleRepository.findById(11L)).thenReturn(Optional.of(sale));
    Sale result = saleService.getSaleById(11L);
    assertThat(result).isSameAs(sale);
  }

  @Test
  void getSaleByIdThrowsWhenMissing() {
    when(saleRepository.findById(99L)).thenReturn(Optional.empty());
    assertThrows(NotFoundException.class, () -> saleService.getSaleById(99L));
  }

  @Test
  void createSaleComputesRoyaltyAndPersistsSale() {
    when(bookRepository.findById(1L)).thenReturn(Optional.of(book));
    when(saleRepository.save(any(Sale.class)))
        .thenAnswer(invocation -> invocation.getArgument(0, Sale.class));

    SaleRequest request =
        saleRequest(1L, SaleSource.DISTRIBUTOR, 1, 2024, 50, new BigDecimal("100.00"), false, null);

    Sale result = saleService.createSale(request);

    verify(saleRepository).save(saleCaptor.capture());
    Sale saved = saleCaptor.getValue();
    assertThat(saved.getBook()).isSameAs(book);
    assertThat(saved.getSaleMonth()).isEqualTo(1);
    assertThat(saved.getSaleYear()).isEqualTo(2024);
    assertThat(saved.getQuantitySold()).isEqualTo(50);
    assertThat(saved.getPublisherRevenue()).isEqualByComparingTo("100.00");
    assertThat(saved.getAuthorRoyalty()).isEqualByComparingTo("20.00");
    assertThat(saved.getHasAuthorBeenPaid()).isFalse();
    assertThat(saved.getSaleSource()).isEqualTo(SaleSource.DISTRIBUTOR);
    assertThat(result.getAuthorRoyalty()).isEqualByComparingTo("20.00");
  }

  @Test
  void createSaleComputesHandsoldRevenueAndRoyalty() {
    when(bookRepository.findById(1L)).thenReturn(Optional.of(book));
    when(saleRepository.save(any(Sale.class)))
        .thenAnswer(invocation -> invocation.getArgument(0, Sale.class));

    SaleRequest request = saleRequest(1L, SaleSource.HAND_SOLD, 2, 2024, 10, null, false, null);

    Sale result = saleService.createSale(request);

    verify(saleRepository).save(saleCaptor.capture());
    Sale saved = saleCaptor.getValue();
    assertThat(saved.getPublisherRevenue()).isEqualByComparingTo("150.00");
    assertThat(saved.getAuthorRoyalty()).isEqualByComparingTo("15.00");
    assertThat(result.getAuthorRoyalty()).isEqualByComparingTo("15.00");
  }

  @Test
  void createSaleThrowsWhenBookMissing() {
    when(bookRepository.findById(1L)).thenReturn(Optional.empty());

    SaleRequest request =
        saleRequest(1L, SaleSource.DISTRIBUTOR, 1, 2024, 50, new BigDecimal("100.00"), false, null);

    assertThrows(NotFoundException.class, () -> saleService.createSale(request));
  }

  @Test
  void createSaleThrowsWhenPublisherRevenueNull() {
    when(bookRepository.findById(1L)).thenReturn(Optional.of(book));
    SaleRequest request = saleRequest(1L, SaleSource.DISTRIBUTOR, 1, 2024, 50, null, false, null);
    assertThrows(DataIntegrityViolationException.class, () -> saleService.createSale(request));
  }

  @Test
  void updateSaleUpdatesFieldsAndRoyalty() {
    Author newAuthor = Author.builder().id(2L).name("New Author").email("new@example.com").build();

    Book newBook =
        Book.builder()
            .id(2L)
            .title("New Book")
            .author(newAuthor)
            .isbn13("9780743273566")
            .publicationYear(2021)
            .publicationMonth(2)
            .distributorAuthorRoyaltyRate(new BigDecimal("0.25"))
            .handsoldAuthorRoyaltyRate(new BigDecimal("0.10"))
            .coverPrice(new BigDecimal("30.00"))
            .printCost(new BigDecimal("8.00"))
            .build();

    Sale existing =
        Sale.builder()
            .id(10L)
            .book(book)
            .saleSource(SaleSource.DISTRIBUTOR)
            .distributor(SaleDistributor.OTHER)
            .format(SaleFormat.PRINT)
            .saleMonth(1)
            .saleYear(2024)
            .quantitySold(10)
            .saleCurrency(Currency.USD)
            .originalPublisherRevenue(new BigDecimal("50.00"))
            .publisherRevenue(new BigDecimal("50.00"))
            .authorRoyalty(new BigDecimal("10.00"))
            .hasAuthorBeenPaid(false)
            .build();

    when(saleRepository.findById(10L)).thenReturn(Optional.of(existing));
    when(bookRepository.findById(2L)).thenReturn(Optional.of(newBook));
    when(saleRepository.save(any(Sale.class)))
        .thenAnswer(invocation -> invocation.getArgument(0, Sale.class));

    SaleRequest request =
        saleRequest(2L, SaleSource.DISTRIBUTOR, 3, 2024, 25, new BigDecimal("200.00"), true, null);

    Sale result = saleService.updateSale(10L, request);

    assertThat(result.getBook()).isSameAs(newBook);
    assertThat(result.getSaleMonth()).isEqualTo(3);
    assertThat(result.getSaleYear()).isEqualTo(2024);
    assertThat(result.getQuantitySold()).isEqualTo(25);
    assertThat(result.getPublisherRevenue()).isEqualByComparingTo("200.00");
    assertThat(result.getOriginalPublisherRevenue()).isEqualByComparingTo("200.00");
    assertThat(result.getAuthorRoyalty()).isEqualByComparingTo("50.00");
    assertThat(result.getHasAuthorBeenPaid()).isTrue();
  }

  @Test
  void updateSalePreservesExistingImportMetadata() {
    Sale existing =
        Sale.builder()
            .id(10L)
            .book(book)
            .saleSource(SaleSource.DISTRIBUTOR)
            .distributor(SaleDistributor.INGRAM_SPARK)
            .format(SaleFormat.EBOOK)
            .saleMonth(1)
            .saleYear(2024)
            .quantitySold(10)
            .saleCurrency(Currency.GBP)
            .originalPublisherRevenue(new BigDecimal("40.00"))
            .publisherRevenue(new BigDecimal("50.00"))
            .authorRoyalty(new BigDecimal("10.00"))
            .hasAuthorBeenPaid(false)
            .build();

    when(saleRepository.findById(10L)).thenReturn(Optional.of(existing));
    when(bookRepository.findById(1L)).thenReturn(Optional.of(book));
    when(saleRepository.save(any(Sale.class)))
        .thenAnswer(invocation -> invocation.getArgument(0, Sale.class));

    SaleRequest request =
        saleRequest(1L, SaleSource.DISTRIBUTOR, 3, 2024, 25, new BigDecimal("200.00"), true, null);

    Sale result = saleService.updateSale(10L, request);

    assertThat(result.getDistributor()).isEqualTo(SaleDistributor.OTHER);
    assertThat(result.getFormat()).isEqualTo(SaleFormat.PRINT);
    assertThat(result.getSaleCurrency()).isEqualTo(Currency.USD);
    assertThat(result.getOriginalPublisherRevenue()).isEqualByComparingTo("200.00");
    assertThat(result.getPublisherRevenue()).isEqualByComparingTo("200.00");
  }

  @Test
  void updateSaleResetsImportMetadataWhenSourceChanges() {
    Sale existing =
        Sale.builder()
            .id(10L)
            .book(book)
            .saleSource(SaleSource.DISTRIBUTOR)
            .distributor(SaleDistributor.INGRAM_SPARK)
            .format(SaleFormat.EBOOK)
            .saleMonth(1)
            .saleYear(2024)
            .quantitySold(10)
            .saleCurrency(Currency.GBP)
            .originalPublisherRevenue(new BigDecimal("40.00"))
            .publisherRevenue(new BigDecimal("50.00"))
            .authorRoyalty(new BigDecimal("10.00"))
            .hasAuthorBeenPaid(false)
            .build();

    when(saleRepository.findById(10L)).thenReturn(Optional.of(existing));
    when(bookRepository.findById(1L)).thenReturn(Optional.of(book));
    when(saleRepository.save(any(Sale.class)))
        .thenAnswer(invocation -> invocation.getArgument(0, Sale.class));

    SaleRequest request = saleRequest(1L, SaleSource.HAND_SOLD, 3, 2024, 4, null, true, null);

    Sale result = saleService.updateSale(10L, request);

    assertThat(result.getDistributor()).isNull();
    assertThat(result.getFormat()).isEqualTo(SaleFormat.PRINT);
    assertThat(result.getSaleCurrency()).isEqualTo(Currency.USD);
    assertThat(result.getOriginalPublisherRevenue()).isEqualByComparingTo("60.00");
    assertThat(result.getPublisherRevenue()).isEqualByComparingTo("60.00");
  }

  @Test
  void updateSaleBackfillsAllMissingMetadataFields() {
    Sale existing =
        Sale.builder()
            .id(10L)
            .book(book)
            .saleSource(SaleSource.DISTRIBUTOR)
            .saleMonth(1)
            .saleYear(2024)
            .quantitySold(10)
            .publisherRevenue(new BigDecimal("50.00"))
            .authorRoyalty(new BigDecimal("10.00"))
            .hasAuthorBeenPaid(false)
            .build();

    when(saleRepository.findById(10L)).thenReturn(Optional.of(existing));
    when(bookRepository.findById(1L)).thenReturn(Optional.of(book));
    when(saleRepository.save(any(Sale.class)))
        .thenAnswer(invocation -> invocation.getArgument(0, Sale.class));

    SaleRequest request =
        saleRequest(1L, SaleSource.DISTRIBUTOR, 3, 2024, 25, new BigDecimal("200.00"), true, null);

    Sale result = saleService.updateSale(10L, request);

    assertThat(result.getDistributor()).isEqualTo(SaleDistributor.OTHER);
    assertThat(result.getFormat()).isEqualTo(SaleFormat.PRINT);
    assertThat(result.getSaleCurrency()).isEqualTo(Currency.USD);
    assertThat(result.getOriginalPublisherRevenue()).isEqualByComparingTo("200.00");
  }

  @Test
  void deleteByIdDeletesWhenSaleExists() {
    Sale existing =
        Sale.builder()
            .id(7L)
            .book(book)
            .saleSource(SaleSource.DISTRIBUTOR)
            .distributor(SaleDistributor.OTHER)
            .format(SaleFormat.PRINT)
            .saleMonth(1)
            .saleYear(2024)
            .quantitySold(1)
            .saleCurrency(Currency.USD)
            .originalPublisherRevenue(new BigDecimal("10.00"))
            .publisherRevenue(new BigDecimal("10.00"))
            .authorRoyalty(new BigDecimal("2.00"))
            .hasAuthorBeenPaid(false)
            .build();
    when(saleRepository.findById(7L)).thenReturn(Optional.of(existing));

    saleService.deleteById(7L);

    verify(saleRepository, times(1)).deleteById(7L);
  }

  @Test
  void importFromCsvReturnsCsvErrorsWithoutSaving() {
    MultipartFile file = new MockMultipartFile("file", "ingram.csv", "text/csv", "data".getBytes());
    List<ParsingError> csvErrors = List.of(new ParsingError(2, new String[] {"row"}, "invalid"));
    ParsedBatch<IngramCsvEntry> parsedBatch =
        new ParsedBatch<>(LocalDateTime.of(2024, 1, 2, 3, 4), List.of(), csvErrors);

    when(ingramCsvParser.parse(any(MultipartFile.class))).thenReturn(parsedBatch);

    SalesImportRequest request = new SalesImportRequest(1, 2024, file, true, false);
    var result = saleService.importSales(request);

    assertThat(result.savedSales()).isEmpty();
    assertThat(result.parseErrors()).isEqualTo(csvErrors);
    assertThat(result.validationErrors()).isEmpty();
    verify(saleRepository, times(0)).save(any(Sale.class));
  }

  @Test
  void importFromCsvSavesValidRows() {
    MultipartFile file = new MockMultipartFile("file", "ingram.csv", "text/csv", "data".getBytes());
    LocalDateTime timestamp = LocalDateTime.of(2024, 1, 2, 3, 4);

    IngramCsvEntry first = new IngramCsvEntry();
    first.setIsbn("9780743273565");
    first.setNetQty(5L);
    first.setNetCompensation(new BigDecimal("25.50"));
    first.setFormat("Hardcover");
    first.setSalesMarket("US");

    IngramCsvEntry second = new IngramCsvEntry();
    second.setIsbn("9780743273565");
    second.setNetQty(2L);
    second.setNetCompensation(new BigDecimal("10.00"));
    second.setFormat("Paperback");
    second.setSalesMarket("GB (UK)");

    ParsedBatch<IngramCsvEntry> parsedBatch =
        new ParsedBatch<>(timestamp, List.of(first, second), List.of());

    when(ingramCsvParser.parse(any(MultipartFile.class))).thenReturn(parsedBatch);
    when(bookService.findBookByIsbn(anyString())).thenReturn(Optional.of(book));
    when(saleRepository.saveAll(any()))
        .thenAnswer(invocation -> invocation.getArgument(0, List.class));

    SalesImportRequest request = new SalesImportRequest(1, 2024, file, false, false);
    var result = saleService.importSales(request);

    assertThat(result.savedSales()).hasSize(2);
    assertThat(result.parseErrors()).isEmpty();
    assertThat(result.validationErrors()).isEmpty();

    @SuppressWarnings("unchecked")
    ArgumentCaptor<List<Sale>> salesCaptor = ArgumentCaptor.forClass(List.class);
    verify(saleRepository).saveAll(salesCaptor.capture());
    List<Sale> saved = salesCaptor.getValue();

    Sale firstSaved = saved.get(0);
    assertThat(firstSaved.getSaleSource()).isEqualTo(SaleSource.DISTRIBUTOR);
    assertThat(firstSaved.getDistributor()).isEqualTo(SaleDistributor.INGRAM_SPARK);
    assertThat(firstSaved.getFormat()).isEqualTo(SaleFormat.PRINT);
    assertThat(firstSaved.getSaleCurrency()).isEqualTo(Currency.USD);
    assertThat(firstSaved.getQuantitySold()).isEqualTo(5);
    assertThat(firstSaved.getOriginalPublisherRevenue()).isEqualByComparingTo("25.50");
    assertThat(firstSaved.getPublisherRevenue()).isEqualByComparingTo("25.50");
    assertThat(firstSaved.getAuthorRoyalty()).isEqualByComparingTo("5.10");
    assertThat(firstSaved.getHasAuthorBeenPaid()).isFalse();
    assertThat(firstSaved.getComment())
        .isEqualTo(
            "Ingram: Format='Hardcover' Market='US' File='ingram.csv' (2024-01-02 03:04:00)");

    Sale secondSaved = saved.get(1);
    assertThat(secondSaved.getDistributor()).isEqualTo(SaleDistributor.INGRAM_SPARK);
    assertThat(secondSaved.getFormat()).isEqualTo(SaleFormat.PRINT);
    assertThat(secondSaved.getSaleCurrency()).isEqualTo(Currency.USD);
    assertThat(secondSaved.getOriginalPublisherRevenue()).isEqualByComparingTo("10.00");
    assertThat(secondSaved.getQuantitySold()).isEqualTo(2);
    assertThat(secondSaved.getPublisherRevenue()).isEqualByComparingTo("10.00");
    assertThat(secondSaved.getAuthorRoyalty()).isEqualByComparingTo("2.00");
  }

  @Test
  void importFromCsvMapsCurrencyFromVerboseMarketLabel() {
    MultipartFile file = new MockMultipartFile("file", "ingram.csv", "text/csv", "data".getBytes());
    LocalDateTime timestamp = LocalDateTime.of(2024, 1, 2, 3, 4);

    IngramCsvEntry entry = new IngramCsvEntry();
    entry.setIsbn("9780743273565");
    entry.setNetQty(1L);
    entry.setNetCompensation(new BigDecimal("5.00"));
    entry.setFormat("Hardcover");
    entry.setSalesMarket("United Kingdom Marketplace");

    ParsedBatch<IngramCsvEntry> parsedBatch =
        new ParsedBatch<>(timestamp, List.of(entry), List.of());

    when(ingramCsvParser.parse(any(MultipartFile.class))).thenReturn(parsedBatch);
    when(bookService.findBookByIsbn(anyString())).thenReturn(Optional.of(book));
    when(saleRepository.saveAll(any()))
        .thenAnswer(invocation -> invocation.getArgument(0, List.class));

    SalesImportRequest request = new SalesImportRequest(1, 2024, file, false, false);
    var result = saleService.importSales(request);

    assertThat(result.savedSales()).hasSize(1);
    @SuppressWarnings("unchecked")
    ArgumentCaptor<List<Sale>> salesCaptor = ArgumentCaptor.forClass(List.class);
    verify(saleRepository).saveAll(salesCaptor.capture());
    Sale saved = salesCaptor.getValue().get(0);
    assertThat(saved.getSaleCurrency()).isEqualTo(Currency.USD);
  }

  @Test
  void importFromCsvTruncatesCommentFieldsAndCapsCommentLength() {
    String longFileName = "f".repeat(140) + ".csv";
    MultipartFile file = new MockMultipartFile("file", longFileName, "text/csv", "data".getBytes());
    LocalDateTime timestamp = LocalDateTime.of(2024, 1, 2, 15, 6, 7);

    IngramCsvEntry entry = new IngramCsvEntry();
    entry.setIsbn("9780743273565");
    entry.setNetQty(1L);
    entry.setNetCompensation(new BigDecimal("5.00"));
    entry.setFormat("Hardcover-" + "X".repeat(80));
    entry.setSalesMarket("United Kingdom Marketplace-" + "Y".repeat(120));

    ParsedBatch<IngramCsvEntry> parsedBatch =
        new ParsedBatch<>(timestamp, List.of(entry), List.of());

    when(ingramCsvParser.parse(any(MultipartFile.class))).thenReturn(parsedBatch);
    when(bookService.findBookByIsbn(anyString())).thenReturn(Optional.of(book));
    when(saleRepository.saveAll(any()))
        .thenAnswer(invocation -> invocation.getArgument(0, List.class));

    SalesImportRequest request = new SalesImportRequest(1, 2024, file, false, false);
    var result = saleService.importSales(request);

    assertThat(result.savedSales()).hasSize(1);

    @SuppressWarnings("unchecked")
    ArgumentCaptor<List<Sale>> salesCaptor = ArgumentCaptor.forClass(List.class);
    verify(saleRepository).saveAll(salesCaptor.capture());
    Sale saved = salesCaptor.getValue().get(0);

    assertThat(saved.getComment()).hasSizeLessThanOrEqualTo(256);
    assertThat(saved.getComment()).contains("(2024-01-02 15:06:07)");

    String actualFileInComment =
        saved.getComment().replaceFirst(".*File='", "").replaceFirst("'.*", "");
    assertThat(actualFileInComment).hasSizeLessThanOrEqualTo(ImportParser.MAX_FILENAME_LENGTH);
  }

  @Test
  void importFromCsvCollectsDomainErrorsWhenMappingFails() {
    MultipartFile file = new MockMultipartFile("file", "ingram.csv", "text/csv", "data".getBytes());
    LocalDateTime timestamp = LocalDateTime.of(2024, 1, 2, 3, 4);

    IngramCsvEntry badEntry = new IngramCsvEntry();
    badEntry.setIsbn("9780743273565");
    badEntry.setNetQty(null);
    badEntry.setNetCompensation(new BigDecimal("4.00"));
    badEntry.setFormat("Hardcover");
    badEntry.setSalesMarket("US");

    IngramCsvEntry goodEntry = new IngramCsvEntry();
    goodEntry.setIsbn("9780743273565");
    goodEntry.setNetQty(1L);
    goodEntry.setNetCompensation(new BigDecimal("4.00"));
    goodEntry.setFormat("Hardcover");
    goodEntry.setSalesMarket("US");

    ParsedBatch<IngramCsvEntry> parsedBatch =
        new ParsedBatch<>(timestamp, List.of(badEntry, goodEntry), List.of());

    when(ingramCsvParser.parse(any(MultipartFile.class))).thenReturn(parsedBatch);
    when(bookService.findBookByIsbn(anyString())).thenReturn(Optional.of(book));

    SalesImportRequest request = new SalesImportRequest(1, 2024, file, false, false);
    var result = saleService.importSales(request);

    assertThat(result.savedSales()).hasSize(0);
    assertThat(result.parseErrors()).isEmpty();
    assertThat(result.validationErrors()).hasSize(1);
    assertThat(result.validationErrors().get(0).rowNumber()).isEqualTo(1);
    assertThat(result.validationErrors().get(0).errorMessage()).isEqualTo("sale.mappingFailed");
  }

  @Test
  void importAmazonPreviewReturnsWarningsAndMappedSales() {
    MultipartFile file =
        new MockMultipartFile(
            "file",
            "amazon.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "xlsx".getBytes());
    LocalDateTime timestamp = LocalDateTime.of(2024, 1, 2, 3, 4);

    AmazonXlsxEntry row =
        AmazonXlsxEntry.builder()
            .sheetName("eBook Royalty")
            .sourceRowNumber(3)
            .saleMonth(1)
            .saleYear(2024)
            .format(SaleFormat.EBOOK)
            .asin("B012345678")
            .marketplace("Amazon.com")
            .quantitySold(4)
            .currency(Currency.GBP)
            .royalty(new BigDecimal("10.00"))
            .build();

    ParsedBatch<AmazonXlsxEntry> parsedBatch =
        new ParsedBatch<>(
            timestamp,
            List.of(row),
            List.of(),
            List.of(
                new ParsingError(
                    8, null, "import.amazon.audiobook.notSupported", "Audiobook Royalty")));

    when(ingramCsvParser.supports(anyString(), anyString())).thenReturn(false);
    when(amazonXlsxParser.supports(anyString(), anyString())).thenReturn(true);
    when(amazonXlsxParser.parse(any(MultipartFile.class))).thenReturn(parsedBatch);
    when(bookService.findBookByAmazonEbookAsin("B012345678")).thenReturn(Optional.of(book));
    when(currencyService.convert("GBP", "USD", new BigDecimal("10.00")))
        .thenReturn(new BigDecimal("13.00"));

    SalesImportRequest request = new SalesImportRequest(null, null, file, true, false);
    var result = saleService.importSales(request);

    assertThat(result.parseErrors()).isEmpty();
    assertThat(result.validationErrors()).isEmpty();
    assertThat(result.savedSales()).hasSize(1);
    assertThat(result.warnings()).hasSize(1);
    verify(saleRepository, times(0)).saveAll(any());
  }

  @Test
  void importAmazonCommitRequiresWarningAcknowledgement() {
    MultipartFile file =
        new MockMultipartFile(
            "file",
            "amazon.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "xlsx".getBytes());

    AmazonXlsxEntry row =
        AmazonXlsxEntry.builder()
            .sheetName("KENP")
            .sourceRowNumber(4)
            .saleMonth(1)
            .saleYear(2024)
            .format(SaleFormat.KINDLE_UNLIMITED)
            .asin("B012345678")
            .marketplace("Amazon.com")
            .kenp(100)
            .currency(Currency.USD)
            .royalty(new BigDecimal("2.00"))
            .build();

    ParsedBatch<AmazonXlsxEntry> parsedBatch =
        new ParsedBatch<>(
            LocalDateTime.of(2024, 1, 2, 3, 4),
            List.of(row),
            List.of(),
            List.of(new ParsingError(5, null, "import.amazon.kenp.unsupportedAsin", "KENP")));

    when(ingramCsvParser.supports(anyString(), anyString())).thenReturn(false);
    when(amazonXlsxParser.supports(anyString(), anyString())).thenReturn(true);
    when(amazonXlsxParser.parse(any(MultipartFile.class))).thenReturn(parsedBatch);
    when(bookService.findBookByAmazonEbookAsin("B012345678")).thenReturn(Optional.of(book));

    SalesImportRequest request = new SalesImportRequest(null, null, file, false, false);
    var result = saleService.importSales(request);

    assertThat(result.savedSales()).isEmpty();
    assertThat(result.parseErrors()).isEmpty();
    assertThat(result.validationErrors()).hasSize(1);
    assertThat(result.validationErrors().get(0).errorMessage())
        .isEqualTo("import.warnings.mustAcknowledge");
    assertThat(result.warnings()).hasSize(1);
    verify(saleRepository, times(0)).saveAll(any());
  }

  @Test
  void importAmazonReturnsSpecificErrorForAmbiguousAsin() {
    MultipartFile file =
        new MockMultipartFile(
            "file",
            "amazon.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "xlsx".getBytes());

    AmazonXlsxEntry row =
        AmazonXlsxEntry.builder()
            .sheetName("eBook Royalty")
            .sourceRowNumber(3)
            .saleMonth(1)
            .saleYear(2024)
            .format(SaleFormat.EBOOK)
            .asin("B012345678")
            .marketplace("Amazon.com")
            .quantitySold(2)
            .currency(Currency.USD)
            .royalty(new BigDecimal("5.00"))
            .build();

    ParsedBatch<AmazonXlsxEntry> parsedBatch =
        new ParsedBatch<>(LocalDateTime.of(2024, 1, 2, 3, 4), List.of(row), List.of(), List.of());

    when(ingramCsvParser.supports(anyString(), anyString())).thenReturn(false);
    when(amazonXlsxParser.supports(anyString(), anyString())).thenReturn(true);
    when(amazonXlsxParser.parse(any(MultipartFile.class))).thenReturn(parsedBatch);
    when(bookService.findBookByAmazonEbookAsin("B012345678"))
        .thenThrow(new AmbiguousLookupException("Multiple books found"));

    SalesImportRequest request = new SalesImportRequest(null, null, file, true, false);
    var result = saleService.importSales(request);

    assertThat(result.savedSales()).isEmpty();
    assertThat(result.parseErrors()).isEmpty();
    assertThat(result.validationErrors()).hasSize(1);
    assertThat(result.validationErrors().get(0).rowNumber()).isEqualTo(3);
    assertThat(result.validationErrors().get(0).errorMessage())
        .isEqualTo("book.asin.multipleMatches");
    assertThat(result.validationErrors().get(0).sheetName()).isEqualTo("eBook Royalty");
  }

  @Test
  void markAllPaidByAuthorIdMarksUnpaidSales() {
    when(authorRepository.findById(1L)).thenReturn(Optional.of(author));
    when(saleRepository.markAllPaidByAuthorId(1L)).thenReturn(3);

    int count = saleService.markAllPaidByAuthorId(1L);

    assertThat(count).isEqualTo(3);
    verify(saleRepository).markAllPaidByAuthorId(1L);
  }

  @Test
  void markAllPaidByAuthorIdThrowsWhenAuthorNotFound() {
    when(authorRepository.findById(99L)).thenReturn(Optional.empty());

    assertThrows(IllegalArgumentException.class, () -> saleService.markAllPaidByAuthorId(99L));
  }

  @Test
  void createSaleConvertsForeignCurrencyToUsd() {
    when(bookRepository.findById(1L)).thenReturn(Optional.of(book));
    when(saleRepository.save(any(Sale.class)))
        .thenAnswer(invocation -> invocation.getArgument(0, Sale.class));
    when(currencyService.convert("GBP", "USD", new BigDecimal("100.00")))
        .thenReturn(new BigDecimal("133.00"));

    SaleRequest request =
        new SaleRequest(
            1L,
            SaleSource.DISTRIBUTOR,
            SaleDistributor.AMAZON,
            SaleFormat.PRINT,
            1,
            2024,
            50,
            null,
            Currency.GBP,
            new BigDecimal("100.00"),
            new BigDecimal("100.00"),
            false,
            null);

    saleService.createSale(request);

    verify(saleRepository).save(saleCaptor.capture());
    Sale saved = saleCaptor.getValue();
    assertThat(saved.getOriginalPublisherRevenue()).isEqualByComparingTo("100.00");
    assertThat(saved.getPublisherRevenue()).isEqualByComparingTo("133.00");
    assertThat(saved.getSaleCurrency()).isEqualTo(Currency.GBP);
    // author royalty computed from USD publisher revenue: 133.00 * 0.20 = 26.60
    assertThat(saved.getAuthorRoyalty()).isEqualByComparingTo("26.60");
  }

  @Test
  void updateSaleConvertsForeignCurrencyToUsd() {
    Sale existing =
        Sale.builder()
            .id(10L)
            .book(book)
            .saleSource(SaleSource.DISTRIBUTOR)
            .distributor(SaleDistributor.AMAZON)
            .format(SaleFormat.PRINT)
            .saleMonth(1)
            .saleYear(2024)
            .quantitySold(10)
            .saleCurrency(Currency.USD)
            .originalPublisherRevenue(new BigDecimal("50.00"))
            .publisherRevenue(new BigDecimal("50.00"))
            .authorRoyalty(new BigDecimal("10.00"))
            .hasAuthorBeenPaid(false)
            .build();

    when(saleRepository.findById(10L)).thenReturn(Optional.of(existing));
    when(bookRepository.findById(1L)).thenReturn(Optional.of(book));
    when(saleRepository.save(any(Sale.class)))
        .thenAnswer(invocation -> invocation.getArgument(0, Sale.class));
    when(currencyService.convert("EUR", "USD", new BigDecimal("80.00")))
        .thenReturn(new BigDecimal("87.20"));

    SaleRequest request =
        new SaleRequest(
            1L,
            SaleSource.DISTRIBUTOR,
            SaleDistributor.AMAZON,
            SaleFormat.PRINT,
            3,
            2024,
            25,
            null,
            Currency.EUR,
            new BigDecimal("80.00"),
            new BigDecimal("80.00"),
            false,
            null);

    Sale result = saleService.updateSale(10L, request);

    assertThat(result.getOriginalPublisherRevenue()).isEqualByComparingTo("80.00");
    assertThat(result.getPublisherRevenue()).isEqualByComparingTo("87.20");
    assertThat(result.getSaleCurrency()).isEqualTo(Currency.EUR);
    // author royalty computed from USD publisher revenue: 87.20 * 0.20 = 17.44
    assertThat(result.getAuthorRoyalty()).isEqualByComparingTo("17.44");
  }
}
