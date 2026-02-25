package edu.duke.bookpublishing.sales;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.books.BookService;
import edu.duke.bookpublishing.exception.custom.NotFoundException;
import edu.duke.bookpublishing.sales.dto.IngramImportRequest;
import edu.duke.bookpublishing.sales.dto.SaleRequest;
import edu.duke.bookpublishing.sales.enums.SaleSource;
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

  private SaleService saleService;

  @Captor private ArgumentCaptor<Sale> saleCaptor;

  private Book book;

  @BeforeEach
  void setUp() {
    saleService = new SaleService(bookService, bookRepository, saleRepository, ingramCsvParser);
    book =
        Book.builder()
            .id(1L)
            .title("Test Book")
            .author("Test Author")
            .isbn13("9780743273565")
            .publicationYear(2020)
            .publicationMonth(1)
            .distributorAuthorRoyaltyRate(new BigDecimal("0.20"))
            .handsoldAuthorRoyaltyRate(new BigDecimal("0.10"))
            .coverPrice(new BigDecimal("20.00"))
            .printCost(new BigDecimal("5.00"))
            .build();
  }

  @Test
  void getAllSalesWithoutFiltersUsesSpecification() {
    Sort sort = Sort.by("saleYear").descending();
    saleService.getAllSales(null, null, null, sort);
    verify(saleRepository, times(1))
        .findAll(org.mockito.ArgumentMatchers.<Specification<Sale>>any(), any(Sort.class));
  }

  @Test
  void getAllSalesWithDatesUsesSpecification() {
    LocalDate startDate = LocalDate.of(2024, 1, 1);
    LocalDate endDate = LocalDate.of(2024, 12, 31);
    Sort sort = Sort.by("saleYear").descending();
    saleService.getAllSales(startDate, endDate, null, sort);
    verify(saleRepository, times(1))
        .findAll(org.mockito.ArgumentMatchers.<Specification<Sale>>any(), any(Sort.class));
  }

  @Test
  void getAllSalesWithQueryUsesSpecification() {
    Sort sort = Sort.by("saleYear").descending();
    saleService.getAllSales(null, null, "test query", sort);
    verify(saleRepository, times(1))
        .findAll(org.mockito.ArgumentMatchers.<Specification<Sale>>any(), any(Sort.class));
  }

  @Test
  void getPagedSalesWithoutFiltersUsesSpecification() {
    Pageable pageable = mock(Pageable.class);
    saleService.getPagedSales(null, null, null, pageable);
    verify(saleRepository, times(1))
        .findAll(org.mockito.ArgumentMatchers.<Specification<Sale>>any(), any(Pageable.class));
  }

  @Test
  void getPagedSalesWithDatesUsesSpecification() {
    Pageable pageable = mock(Pageable.class);
    LocalDate startDate = LocalDate.of(2024, 1, 1);
    LocalDate endDate = LocalDate.of(2024, 12, 31);
    saleService.getPagedSales(startDate, endDate, null, pageable);
    verify(saleRepository, times(1))
        .findAll(org.mockito.ArgumentMatchers.<Specification<Sale>>any(), any(Pageable.class));
  }

  @Test
  void getPagedSalesWithQueryUsesSpecification() {
    Pageable pageable = mock(Pageable.class);
    saleService.getPagedSales(null, null, "test query", pageable);
    verify(saleRepository, times(1))
        .findAll(org.mockito.ArgumentMatchers.<Specification<Sale>>any(), any(Pageable.class));
  }

  @Test
  void getSaleByIdReturnsSaleWhenFound() {
    Sale sale = Sale.builder().id(11L).build();
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
        new SaleRequest(
            1L, SaleSource.DISTRIBUTOR, 1, 2024, 50, new BigDecimal("100.00"), false, null);

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

    SaleRequest request = new SaleRequest(1L, SaleSource.HAND_SOLD, 2, 2024, 10, null, false, null);

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
        new SaleRequest(
            1L, SaleSource.DISTRIBUTOR, 1, 2024, 50, new BigDecimal("100.00"), false, null);

    assertThrows(NotFoundException.class, () -> saleService.createSale(request));
  }

  @Test
  void createSaleThrowsWhenPublisherRevenueNull() {
    when(bookRepository.findById(1L)).thenReturn(Optional.of(book));
    SaleRequest request =
        new SaleRequest(1L, SaleSource.DISTRIBUTOR, 1, 2024, 50, null, false, null);
    assertThrows(DataIntegrityViolationException.class, () -> saleService.createSale(request));
  }

  @Test
  void updateSaleUpdatesFieldsAndRoyalty() {
    Book newBook =
        Book.builder()
            .id(2L)
            .title("New Book")
            .author("New Author")
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
            .saleMonth(1)
            .saleYear(2024)
            .quantitySold(10)
            .publisherRevenue(new BigDecimal("50.00"))
            .authorRoyalty(new BigDecimal("10.00"))
            .hasAuthorBeenPaid(false)
            .build();

    when(saleRepository.findById(10L)).thenReturn(Optional.of(existing));
    when(bookRepository.findById(2L)).thenReturn(Optional.of(newBook));
    when(saleRepository.save(any(Sale.class)))
        .thenAnswer(invocation -> invocation.getArgument(0, Sale.class));

    SaleRequest request =
        new SaleRequest(
            2L, SaleSource.DISTRIBUTOR, 3, 2024, 25, new BigDecimal("200.00"), true, null);

    Sale result = saleService.updateSale(10L, request);

    assertThat(result.getBook()).isSameAs(newBook);
    assertThat(result.getSaleMonth()).isEqualTo(3);
    assertThat(result.getSaleYear()).isEqualTo(2024);
    assertThat(result.getQuantitySold()).isEqualTo(25);
    assertThat(result.getPublisherRevenue()).isEqualByComparingTo("200.00");
    assertThat(result.getAuthorRoyalty()).isEqualByComparingTo("50.00");
    assertThat(result.getHasAuthorBeenPaid()).isTrue();
  }

  @Test
  void deleteByIdDeletesWhenSaleExists() {
    Sale existing = Sale.builder().id(7L).build();
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

    IngramImportRequest request = new IngramImportRequest(1, 2024, file, true);
    var result = saleService.importSalesFromCsv(request);

    assertThat(result.savedSales()).isEmpty();
    assertThat(result.csvErrors()).isEqualTo(csvErrors);
    assertThat(result.savingErrors()).isEmpty();
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
    second.setSalesMarket("GB");

    ParsedBatch<IngramCsvEntry> parsedBatch =
        new ParsedBatch<>(timestamp, List.of(first, second), List.of());

    when(ingramCsvParser.parse(any(MultipartFile.class))).thenReturn(parsedBatch);
    when(bookService.findBookByIsbn(anyString())).thenReturn(Optional.of(book));
    when(saleRepository.save(any(Sale.class)))
        .thenAnswer(invocation -> invocation.getArgument(0, Sale.class));

    IngramImportRequest request = new IngramImportRequest(1, 2024, file, false);
    var result = saleService.importSalesFromCsv(request);

    assertThat(result.savedSales()).hasSize(2);
    assertThat(result.csvErrors()).isEmpty();
    assertThat(result.savingErrors()).isEmpty();

    verify(saleRepository, times(2)).save(saleCaptor.capture());
    List<Sale> saved = saleCaptor.getAllValues();

    Sale firstSaved = saved.get(0);
    assertThat(firstSaved.getSaleSource()).isEqualTo(SaleSource.DISTRIBUTOR);
    assertThat(firstSaved.getQuantitySold()).isEqualTo(5);
    assertThat(firstSaved.getPublisherRevenue()).isEqualByComparingTo("25.50");
    assertThat(firstSaved.getAuthorRoyalty()).isEqualByComparingTo("5.10");
    assertThat(firstSaved.getHasAuthorBeenPaid()).isFalse();
    assertThat(firstSaved.getComment())
        .contains("Ingram: Format='Hardcover' Market='US' File='ingram.csv' (" + timestamp);

    Sale secondSaved = saved.get(1);
    assertThat(secondSaved.getQuantitySold()).isEqualTo(2);
    assertThat(secondSaved.getPublisherRevenue()).isEqualByComparingTo("10.00");
    assertThat(secondSaved.getAuthorRoyalty()).isEqualByComparingTo("2.00");
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

    IngramImportRequest request = new IngramImportRequest(1, 2024, file, false);
    var result = saleService.importSalesFromCsv(request);

    assertThat(result.savedSales()).hasSize(0);
    assertThat(result.csvErrors()).isEmpty();
    assertThat(result.savingErrors()).hasSize(1);
    assertThat(result.savingErrors().get(0).rowNumber()).isEqualTo(1);
    assertThat(result.savingErrors().get(0).errorMessage()).isEqualTo("sale.mappingFailed");
  }
}
