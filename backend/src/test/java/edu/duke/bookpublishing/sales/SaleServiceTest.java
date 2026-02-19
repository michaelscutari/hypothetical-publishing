package edu.duke.bookpublishing.sales;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import edu.duke.bookpublishing.author.Author;
import edu.duke.bookpublishing.author.AuthorRepository;
import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.exception.custom.NotFoundException;
import edu.duke.bookpublishing.sales.dto.SaleRequest;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

/**
 * Test class for the Sales service
 *
 * @author Daniel Rodriguez-Florido
 */
@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

  @Mock private BookRepository bookRepository;

  @Mock private SaleRepository saleRepository;

  @Mock private AuthorRepository authorRepository;

  @InjectMocks private SaleService saleService;

  @Captor private ArgumentCaptor<Sale> saleCaptor;

  private Author author;
  private Book book;

  @BeforeEach
  void setUp() {
    author = Author.builder().id(1L).name("Test Author").email("test@example.com").build();

    book =
        Book.builder()
            .id(1L)
            .title("Test Book")
            .author(author)
            .isbn13("9780743273565")
            .publicationYear(2020)
            .publicationMonth(1)
            .royaltyRate(new BigDecimal("0.20"))
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

    SaleRequest request = new SaleRequest(1L, 1, 2024, 50, new BigDecimal("100.00"), null, false);

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
    assertThat(result.getAuthorRoyalty()).isEqualByComparingTo("20.00");
  }

  @Test
  void createSaleThrowsWhenBookMissing() {
    when(bookRepository.findById(1L)).thenReturn(Optional.empty());

    SaleRequest request = new SaleRequest(1L, 1, 2024, 50, new BigDecimal("100.00"), null, false);

    assertThrows(NotFoundException.class, () -> saleService.createSale(request));
  }

  @Test
  void createSaleThrowsWhenPublisherRevenueNull() {
    when(bookRepository.findById(1L)).thenReturn(Optional.of(book));
    SaleRequest request = new SaleRequest(1L, 1, 2024, 50, null, null, false);
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
            .royaltyRate(new BigDecimal("0.25"))
            .build();

    Sale existing =
        Sale.builder()
            .id(10L)
            .book(book)
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

    SaleRequest request = new SaleRequest(2L, 3, 2024, 25, new BigDecimal("200.00"), null, true);

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
}
