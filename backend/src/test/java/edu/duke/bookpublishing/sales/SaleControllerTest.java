package edu.duke.bookpublishing.sales;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.duke.bookpublishing.auth.User;
import edu.duke.bookpublishing.auth.UserRepository;
import edu.duke.bookpublishing.author.Author;
import edu.duke.bookpublishing.author.AuthorRepository;
import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.sales.dto.SaleRequest;
import edu.duke.bookpublishing.sales.dto.SaleResponse;
import edu.duke.bookpublishing.sales.enums.Currency;
import edu.duke.bookpublishing.sales.enums.SaleDistributor;
import edu.duke.bookpublishing.sales.enums.SaleFormat;
import edu.duke.bookpublishing.sales.enums.SaleSource;
import jakarta.servlet.http.Cookie;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

/**
 * Test class for SaleController.
 *
 * @author Daniel Rodriguez-Florido
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SaleControllerTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Autowired private AuthorRepository authorRepository;

  @Autowired private BookRepository bookRepository;

  @Autowired private SaleRepository saleRepository;

  @Autowired private UserRepository userRepository;

  @Autowired private PasswordEncoder passwordEncoder;

  private Author defaultAuthor;

  @BeforeEach
  void setUp() {
    saleRepository.deleteAll();
    bookRepository.deleteAll();
    authorRepository.deleteAll();
    userRepository.deleteAll();
    userRepository.save(
        User.builder().username("admin").password(passwordEncoder.encode("admin")).build());
    defaultAuthor =
        authorRepository.save(
            Author.builder().name("Test Author").email("test@example.com").build());
  }

  private Cookie login() throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"admin\",\"password\":\"admin\"}"))
            .andReturn();
    return result.getResponse().getCookie("token");
  }

  private Book createBook() {
    return bookRepository.save(
        Book.builder()
            .title("Test Book")
            .author(defaultAuthor)
            .isbn13("9780743273565")
            .publicationYear(2020)
            .publicationMonth(1)
            .distributorAuthorRoyaltyRate(new BigDecimal("0.20"))
            .handsoldAuthorRoyaltyRate(new BigDecimal("0.10"))
            .coverPrice(new BigDecimal("20.00"))
            .printCost(new BigDecimal("5.00"))
            .build());
  }

  private Book createBook(String title, String authorName, String isbn13) {
    Author author =
        authorRepository.save(
            Author.builder()
                .name(authorName)
                .email(authorName.toLowerCase().replaceAll("[^a-z]", "") + "@test.com")
                .build());
    return bookRepository.save(
        Book.builder()
            .title(title)
            .author(author)
            .isbn13(isbn13)
            .publicationYear(2020)
            .publicationMonth(1)
            .distributorAuthorRoyaltyRate(new BigDecimal("0.20"))
            .handsoldAuthorRoyaltyRate(new BigDecimal("0.10"))
            .coverPrice(new BigDecimal("20.00"))
            .printCost(new BigDecimal("5.00"))
            .build());
  }

  private SaleResponse createSale(Cookie token, SaleRequest request) throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/api/sales")
                    .cookie(token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andReturn();

    return objectMapper.readValue(result.getResponse().getContentAsString(), SaleResponse.class);
  }

  private SaleRequest saleRequest(
      Long bookId,
      SaleSource saleSource,
      Integer saleMonth,
      Integer saleYear,
      Integer quantitySold,
      BigDecimal publisherRevenue,
      Boolean hasAuthorBeenPaid,
      String comment) {
    return new SaleRequest(
        bookId,
        saleSource,
        saleSource == SaleSource.DISTRIBUTOR ? SaleDistributor.OTHER : null,
        SaleFormat.PRINT,
        saleMonth,
        saleYear,
        quantitySold,
        null,
        Currency.USD,
        publisherRevenue,
        publisherRevenue,
        hasAuthorBeenPaid,
        comment);
  }

  private void createSaleRecord(
      Book book,
      SaleSource saleSource,
      SaleDistributor distributor,
      SaleFormat format,
      int saleMonth,
      int saleYear,
      Integer quantitySold,
      Integer kenp,
      Currency saleCurrency,
      String originalPublisherRevenue,
      String publisherRevenue,
      String authorRoyalty,
      boolean hasAuthorBeenPaid) {
    Integer normalizedQuantity = format == SaleFormat.KINDLE_UNLIMITED ? null : quantitySold;
    Integer normalizedKenp = format == SaleFormat.KINDLE_UNLIMITED ? kenp : null;

    saleRepository.save(
        Sale.builder()
            .book(book)
            .saleSource(saleSource)
            .distributor(distributor)
            .format(format)
            .saleMonth(saleMonth)
            .saleYear(saleYear)
            .quantitySold(normalizedQuantity)
            .kenp(normalizedKenp)
            .saleCurrency(saleCurrency)
            .originalPublisherRevenue(new BigDecimal(originalPublisherRevenue))
            .publisherRevenue(new BigDecimal(publisherRevenue))
            .authorRoyalty(new BigDecimal(authorRoyalty))
            .hasAuthorBeenPaid(hasAuthorBeenPaid)
            .build());
  }

  @Test
  void getAllSalesReturnsEmptyList() throws Exception {
    mockMvc
        .perform(get("/api/sales").cookie(login()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(0)))
        .andExpect(jsonPath("$.totalElements").value(0));
  }

  @Test
  void createSaleReturnsCreatedSale() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleRequest request =
        saleRequest(
            book.getId(),
            SaleSource.DISTRIBUTOR,
            1,
            2024,
            50,
            new BigDecimal("100.00"),
            true,
            "Imported from Ingram Spark");

    mockMvc
        .perform(
            post("/api/sales")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").isNumber())
        .andExpect(jsonPath("$.bookId").value(book.getId()))
        .andExpect(jsonPath("$.saleMonth").value(1))
        .andExpect(jsonPath("$.saleYear").value(2024))
        .andExpect(jsonPath("$.quantitySold").value(50))
        .andExpect(jsonPath("$.kenp", nullValue()))
        .andExpect(jsonPath("$.distributor").value("OTHER"))
        .andExpect(jsonPath("$.format").value("PRINT"))
        .andExpect(jsonPath("$.saleCurrency").value("USD"))
        .andExpect(jsonPath("$.originalPublisherRevenue").value(100.00))
        .andExpect(jsonPath("$.publisherRevenue").value(100.00))
        .andExpect(jsonPath("$.authorRoyalty").value(20.00))
        .andExpect(jsonPath("$.hasAuthorBeenPaid").value(true))
        .andExpect(jsonPath("$.saleSource").value("DISTRIBUTOR"))
        .andExpect(jsonPath("$.comment").value("Imported from Ingram Spark"));
  }

  @Test
  void createSaleRejectsFutureDate() throws Exception {
    Cookie token = login();
    Book book = createBook();
    YearMonth future = YearMonth.now().plusMonths(1);

    SaleRequest request =
        saleRequest(
            book.getId(),
            SaleSource.DISTRIBUTOR,
            future.getMonthValue(),
            future.getYear(),
            1,
            new BigDecimal("10.00"),
            false,
            null);

    mockMvc
        .perform(
            post("/api/sales")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void createHandsoldSaleSucceeds() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleRequest request =
        saleRequest(book.getId(), SaleSource.HAND_SOLD, 2, 2024, 10, null, false, "Handsale");

    mockMvc
        .perform(
            post("/api/sales")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.saleSource").value("HAND_SOLD"))
        .andExpect(jsonPath("$.distributor", nullValue()));
  }

  @Test
  void createHandsoldSaleRejectsNonNullDistributor() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleRequest request =
        new SaleRequest(
            book.getId(),
            SaleSource.HAND_SOLD,
            SaleDistributor.AMAZON,
            SaleFormat.PRINT,
            2,
            2024,
            10,
            null,
            Currency.USD,
            null,
            null,
            false,
            "Handsale");

    mockMvc
        .perform(
            post("/api/sales")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void createDistributorSaleRejectsNullDistributor() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleRequest request =
        new SaleRequest(
            book.getId(),
            SaleSource.DISTRIBUTOR,
            null,
            SaleFormat.PRINT,
            2,
            2024,
            10,
            null,
            Currency.USD,
            new BigDecimal("50.00"),
            new BigDecimal("50.00"),
            false,
            null);

    mockMvc
        .perform(
            post("/api/sales")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void createKindleUnlimitedSaleSucceeds() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleRequest request =
        new SaleRequest(
            book.getId(),
            SaleSource.DISTRIBUTOR,
            SaleDistributor.AMAZON,
            SaleFormat.KINDLE_UNLIMITED,
            2,
            2024,
            null,
            500,
            Currency.USD,
            new BigDecimal("50.00"),
            new BigDecimal("50.00"),
            false,
            null);

    mockMvc
        .perform(
            post("/api/sales")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.format").value("KINDLE_UNLIMITED"))
        .andExpect(jsonPath("$.kenp").value(500))
        .andExpect(jsonPath("$.quantitySold", nullValue()));
  }

  @Test
  void createHandsoldSaleRejectsEbookFormat() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleRequest request =
        new SaleRequest(
            book.getId(),
            SaleSource.HAND_SOLD,
            null,
            SaleFormat.EBOOK,
            2,
            2024,
            10,
            null,
            Currency.USD,
            null,
            null,
            false,
            null);

    mockMvc
        .perform(
            post("/api/sales")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void createSaleRejectsInvalidFormatForDistributor() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleRequest request =
        new SaleRequest(
            book.getId(),
            SaleSource.DISTRIBUTOR,
            SaleDistributor.INGRAM_SPARK,
            SaleFormat.EBOOK,
            2,
            2024,
            10,
            null,
            Currency.USD,
            new BigDecimal("50.00"),
            new BigDecimal("50.00"),
            false,
            null);

    mockMvc
        .perform(
            post("/api/sales")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void createKindleUnlimitedSaleRejectsQuantitySold() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleRequest request =
        new SaleRequest(
            book.getId(),
            SaleSource.DISTRIBUTOR,
            SaleDistributor.AMAZON,
            SaleFormat.KINDLE_UNLIMITED,
            2,
            2024,
            10,
            500,
            Currency.USD,
            new BigDecimal("50.00"),
            new BigDecimal("50.00"),
            false,
            null);

    mockMvc
        .perform(
            post("/api/sales")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void createPrintSaleRejectsNullQuantitySold() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleRequest request =
        new SaleRequest(
            book.getId(),
            SaleSource.DISTRIBUTOR,
            SaleDistributor.OTHER,
            SaleFormat.PRINT,
            2,
            2024,
            null,
            null,
            Currency.USD,
            new BigDecimal("50.00"),
            new BigDecimal("50.00"),
            false,
            null);

    mockMvc
        .perform(
            post("/api/sales")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void createEbookSaleSucceeds() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleRequest request =
        new SaleRequest(
            book.getId(),
            SaleSource.DISTRIBUTOR,
            SaleDistributor.AMAZON,
            SaleFormat.EBOOK,
            2,
            2024,
            10,
            null,
            Currency.USD,
            new BigDecimal("50.00"),
            new BigDecimal("50.00"),
            false,
            null);

    mockMvc
        .perform(
            post("/api/sales")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.format").value("EBOOK"))
        .andExpect(jsonPath("$.distributor").value("AMAZON"));
  }

  @Test
  void createHandsoldSaleRejectsNonUsdCurrency() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleRequest request =
        new SaleRequest(
            book.getId(),
            SaleSource.HAND_SOLD,
            null,
            SaleFormat.PRINT,
            2,
            2024,
            10,
            null,
            Currency.GBP,
            null,
            null,
            false,
            null);

    mockMvc
        .perform(
            post("/api/sales")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void createKindleUnlimitedSaleRejectsNullKenp() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleRequest request =
        new SaleRequest(
            book.getId(),
            SaleSource.DISTRIBUTOR,
            SaleDistributor.AMAZON,
            SaleFormat.KINDLE_UNLIMITED,
            2,
            2024,
            null,
            null,
            Currency.USD,
            new BigDecimal("50.00"),
            new BigDecimal("50.00"),
            false,
            null);

    mockMvc
        .perform(
            post("/api/sales")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void getSaleByIdReturnsSale() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleResponse created =
        createSale(
            token,
            saleRequest(
                book.getId(),
                SaleSource.DISTRIBUTOR,
                2,
                2024,
                10,
                new BigDecimal("50.00"),
                false,
                "Initial import"));

    mockMvc
        .perform(get("/api/sales/{id}", created.id()).cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(created.id()))
        .andExpect(jsonPath("$.bookId").value(book.getId()))
        .andExpect(jsonPath("$.saleSource").value("DISTRIBUTOR"))
        .andExpect(jsonPath("$.distributor").value("OTHER"))
        .andExpect(jsonPath("$.format").value("PRINT"))
        .andExpect(jsonPath("$.saleCurrency").value("USD"))
        .andExpect(jsonPath("$.originalPublisherRevenue").value(50.00))
        .andExpect(jsonPath("$.kenp", nullValue()))
        .andExpect(jsonPath("$.comment").value("Initial import"));
  }

  @Test
  void updateSaleUpdatesFields() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleResponse created =
        createSale(
            token,
            saleRequest(
                book.getId(),
                SaleSource.DISTRIBUTOR,
                2,
                2024,
                10,
                new BigDecimal("50.00"),
                false,
                null));

    SaleRequest update =
        saleRequest(
            book.getId(),
            SaleSource.DISTRIBUTOR,
            3,
            2024,
            25,
            new BigDecimal("200.00"),
            true,
            "Corrected batch");

    mockMvc
        .perform(
            put("/api/sales/{id}", created.id())
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.saleMonth").value(3))
        .andExpect(jsonPath("$.quantitySold").value(25))
        .andExpect(jsonPath("$.distributor").value("OTHER"))
        .andExpect(jsonPath("$.format").value("PRINT"))
        .andExpect(jsonPath("$.saleCurrency").value("USD"))
        .andExpect(jsonPath("$.originalPublisherRevenue").value(200.00))
        .andExpect(jsonPath("$.kenp", nullValue()))
        .andExpect(jsonPath("$.publisherRevenue").value(200.00))
        .andExpect(jsonPath("$.authorRoyalty").value(40.00))
        .andExpect(jsonPath("$.hasAuthorBeenPaid").value(true))
        .andExpect(jsonPath("$.saleSource").value("DISTRIBUTOR"))
        .andExpect(jsonPath("$.comment").value("Corrected batch"));
  }

  @Test
  void deleteSaleRemovesIt() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleResponse created =
        createSale(
            token,
            saleRequest(
                book.getId(),
                SaleSource.DISTRIBUTOR,
                2,
                2024,
                10,
                new BigDecimal("50.00"),
                false,
                null));

    mockMvc
        .perform(delete("/api/sales/{id}", created.id()).cookie(token))
        .andExpect(status().isNoContent());

    mockMvc
        .perform(get("/api/sales/{id}", created.id()).cookie(token))
        .andExpect(status().isNotFound());
  }

  @Test
  void getAllSalesShowAllReturnsAllRecords() throws Exception {
    Cookie token = login();
    Book book = createBook();

    for (int i = 1; i <= 30; i++) {
      createSale(
          token,
          saleRequest(
              book.getId(),
              SaleSource.DISTRIBUTOR,
              1,
              2024,
              i,
              new BigDecimal("10.00"),
              false,
              null));
    }

    mockMvc
        .perform(get("/api/sales").cookie(token).param("showAll", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(30)))
        .andExpect(jsonPath("$.paged").value(false));
  }

  @Test
  void getAllSalesReturnsPaginatedResults() throws Exception {
    Cookie token = login();
    Book book = createBook();

    for (int i = 1; i <= 30; i++) {
      createSale(
          token,
          saleRequest(
              book.getId(),
              SaleSource.DISTRIBUTOR,
              1,
              2024,
              i,
              new BigDecimal("10.00"),
              false,
              null));
    }

    mockMvc
        .perform(get("/api/sales").cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(25)))
        .andExpect(jsonPath("$.pageNumber").value(0))
        .andExpect(jsonPath("$.pageSize").value(25))
        .andExpect(jsonPath("$.totalElements").value(30))
        .andExpect(jsonPath("$.totalPages").value(2));

    mockMvc
        .perform(get("/api/sales").cookie(token).param("page", "1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(5)))
        .andExpect(jsonPath("$.pageNumber").value(1));
  }

  @Test
  void getAllSalesRespectsCustomPageSize() throws Exception {
    Cookie token = login();
    Book book = createBook();

    for (int i = 1; i <= 21; i++) {
      createSale(
          token,
          saleRequest(
              book.getId(),
              SaleSource.DISTRIBUTOR,
              1,
              2024,
              i,
              new BigDecimal("10.00"),
              false,
              null));
    }

    mockMvc
        .perform(get("/api/sales").cookie(token).param("size", "10").param("page", "1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(10)))
        .andExpect(jsonPath("$.pageNumber").value(1))
        .andExpect(jsonPath("$.pageSize").value(10))
        .andExpect(jsonPath("$.totalElements").value(21))
        .andExpect(jsonPath("$.totalPages").value(3));

    mockMvc
        .perform(get("/api/sales").cookie(token).param("size", "10").param("page", "2"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.pageNumber").value(2));
  }

  @Test
  void getAllSalesFiltersByDateRange() throws Exception {
    Cookie token = login();
    Book book = createBook();

    createSale(
        token,
        saleRequest(
            book.getId(),
            SaleSource.DISTRIBUTOR,
            1,
            2024,
            5,
            new BigDecimal("10.00"),
            false,
            null));
    createSale(
        token,
        saleRequest(
            book.getId(),
            SaleSource.DISTRIBUTOR,
            3,
            2024,
            5,
            new BigDecimal("10.00"),
            false,
            null));
    createSale(
        token,
        saleRequest(
            book.getId(),
            SaleSource.DISTRIBUTOR,
            5,
            2024,
            5,
            new BigDecimal("10.00"),
            false,
            null));

    LocalDate start = LocalDate.of(2024, 3, 1);
    LocalDate end = LocalDate.of(2024, 4, 30);

    mockMvc
        .perform(
            get("/api/sales")
                .cookie(token)
                .param("showAll", "true")
                .param("startDate", start.toString())
                .param("endDate", end.toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].saleMonth").value(3));
  }

  @Test
  void getAllSalesFiltersByBookId() throws Exception {
    Cookie token = login();
    Book bookA = createBook("Book A", "Author A", "9780000000010");
    Book bookB = createBook("Book B", "Author B", "9780000000011");
    createSale(
        token,
        saleRequest(
            bookA.getId(),
            SaleSource.DISTRIBUTOR,
            1,
            2024,
            5,
            new BigDecimal("10.00"),
            false,
            null));
    createSale(
        token,
        saleRequest(
            bookA.getId(),
            SaleSource.DISTRIBUTOR,
            2,
            2024,
            5,
            new BigDecimal("10.00"),
            false,
            null));
    createSale(
        token,
        saleRequest(
            bookB.getId(),
            SaleSource.DISTRIBUTOR,
            1,
            2024,
            5,
            new BigDecimal("10.00"),
            false,
            null));

    mockMvc
        .perform(
            get("/api/sales")
                .cookie(token)
                .param("showAll", "true")
                .param("bookId", String.valueOf(bookA.getId())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(2)))
        .andExpect(jsonPath("$.content[0].bookId").value(bookA.getId()));
  }

  @Test
  void getAuthorPaymentsGroupsByAuthorAndTotalsUnpaid() throws Exception {
    Cookie token = login();
    Book alpha = createBook("Alpha Book", "Author Alpha", "9780000000001");
    Book beta = createBook("Beta Book", "Author Beta", "9780000000002");

    createSale(
        token,
        saleRequest(
            alpha.getId(),
            SaleSource.DISTRIBUTOR,
            1,
            2024,
            5,
            new BigDecimal("100.00"),
            false,
            null));
    createSale(
        token,
        saleRequest(
            alpha.getId(),
            SaleSource.DISTRIBUTOR,
            3,
            2024,
            5,
            new BigDecimal("50.00"),
            true,
            null));

    createSale(
        token,
        saleRequest(
            beta.getId(),
            SaleSource.DISTRIBUTOR,
            2,
            2024,
            5,
            new BigDecimal("80.00"),
            false,
            null));

    mockMvc
        .perform(get("/api/sales/author-payments").cookie(token).param("showAll", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(2)))
        .andExpect(jsonPath("$.content[0].author").value("Author Alpha"))
        .andExpect(jsonPath("$.content[0].authorId").value(alpha.getAuthor().getId()))
        .andExpect(jsonPath("$.content[0].unpaidTotal").value(20.00))
        .andExpect(jsonPath("$.content[0].sales[0].saleMonth").value(3))
        .andExpect(jsonPath("$.content[0].sales[0].bookTitle").value("Alpha Book"))
        .andExpect(jsonPath("$.content[1].author").value("Author Beta"))
        .andExpect(jsonPath("$.content[1].unpaidTotal").value(16.00));
  }

  @Test
  void markAuthorPaymentsPaidMarksOnlyUnpaidForAuthor() throws Exception {
    Cookie token = login();
    Book alpha = createBook("Alpha Book", "Author Alpha", "9780000000003");
    Book beta = createBook("Beta Book", "Author Beta", "9780000000004");

    createSale(
        token,
        saleRequest(
            alpha.getId(),
            SaleSource.DISTRIBUTOR,
            1,
            2024,
            5,
            new BigDecimal("100.00"),
            false,
            null));
    createSale(
        token,
        saleRequest(
            alpha.getId(),
            SaleSource.DISTRIBUTOR,
            2,
            2024,
            5,
            new BigDecimal("100.00"),
            false,
            null));
    createSale(
        token,
        saleRequest(
            alpha.getId(),
            SaleSource.DISTRIBUTOR,
            3,
            2024,
            5,
            new BigDecimal("100.00"),
            true,
            null));
    createSale(
        token,
        saleRequest(
            beta.getId(),
            SaleSource.DISTRIBUTOR,
            1,
            2024,
            5,
            new BigDecimal("100.00"),
            false,
            null));

    Long alphaAuthorId = alpha.getAuthor().getId();

    mockMvc
        .perform(
            put("/api/sales/author-payments/mark-paid")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"authorId\":" + alphaAuthorId + "}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.updatedCount").value(2));

    mockMvc
        .perform(get("/api/sales/author-payments").cookie(token).param("showAll", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].sales[0].hasAuthorBeenPaid").value(true))
        .andExpect(jsonPath("$.content[0].sales[1].hasAuthorBeenPaid").value(true))
        .andExpect(jsonPath("$.content[0].sales[2].hasAuthorBeenPaid").value(true))
        .andExpect(jsonPath("$.content[1].sales[0].hasAuthorBeenPaid").value(false));
  }

  @Test
  void markAuthorPaymentsPaidReturnsAuthorId() throws Exception {
    Cookie token = login();
    Book alpha = createBook("Alpha Book", "Author Alpha", "9780000000005");

    createSale(
        token,
        saleRequest(
            alpha.getId(),
            SaleSource.DISTRIBUTOR,
            1,
            2024,
            5,
            new BigDecimal("100.00"),
            false,
            null));

    Long alphaAuthorId = alpha.getAuthor().getId();

    mockMvc
        .perform(
            put("/api/sales/author-payments/mark-paid")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"authorId\":" + alphaAuthorId + "}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.authorId").value(alphaAuthorId))
        .andExpect(jsonPath("$.updatedCount").value(1));
  }

  @Test
  void importSalesCsvAddsSales() throws Exception {
    Cookie token = login();

    List.of(
            new String[] {
              "The Long Way to a Small, Angry Planet", "Chambers, Becky", "9781473619814"
            },
            new String[] {"A Closed and Common Orbit", "Chambers, Becky", "9780062569400"},
            new String[] {"Record of a Spaceborn Few", "Chambers, Becky", "9780062699220"},
            new String[] {"The Galaxy, and the Ground Within", "Chambers, Becky", "9780062936042"},
            new String[] {"All Systems Red", "Wells, Martha", "9780765397539"},
            new String[] {"Artificial Condition", "Wells, Martha", "9781250186928"},
            new String[] {"Ancillary Justice", "Leckie, Ann", "9781250191786"},
            new String[] {"Ancillary Justice", "Leckie, Ann", "9780316565172"})
        .forEach(values -> createBook(values[0], values[1], values[2]));

    ClassPathResource csvResource = new ClassPathResource("testfiles/Ingram 202509.csv");
    MockMultipartFile csvFile =
        new MockMultipartFile(
            "importFile",
            "Ingram 202509.csv",
            "text/csv",
            csvResource.getInputStream().readAllBytes());

    mockMvc
        .perform(
            MockMvcRequestBuilders.multipart("/api/sales/import")
                .file(csvFile)
                .param("saleMonth", "9")
                .param("saleYear", "2025")
                .param("isPreview", "false")
                .cookie(token)
                .characterEncoding(StandardCharsets.UTF_8.name()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.savedSales", hasSize(9)))
        .andExpect(jsonPath("$.parseErrors", hasSize(0)))
        .andExpect(jsonPath("$.validationErrors", hasSize(0)))
        .andExpect(jsonPath("$.warnings", hasSize(0)));

    assertThat(saleRepository.count()).isEqualTo(9L);
  }

  @Test
  void getAuthorPaymentsPaginatesByAuthorGroup() throws Exception {
    Cookie token = login();
    Book alpha = createBook("Alpha Book", "Author Alpha", "9780000000006");
    Book beta = createBook("Beta Book", "Author Beta", "9780000000007");

    createSale(
        token,
        saleRequest(
            alpha.getId(),
            SaleSource.DISTRIBUTOR,
            1,
            2024,
            5,
            new BigDecimal("100.00"),
            false,
            null));
    createSale(
        token,
        saleRequest(
            beta.getId(),
            SaleSource.DISTRIBUTOR,
            1,
            2024,
            5,
            new BigDecimal("100.00"),
            false,
            null));

    mockMvc
        .perform(
            get("/api/sales/author-payments").cookie(token).param("size", "1").param("page", "0"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.pageNumber").value(0))
        .andExpect(jsonPath("$.pageSize").value(1))
        .andExpect(jsonPath("$.totalElements").value(2))
        .andExpect(jsonPath("$.totalPages").value(2))
        .andExpect(jsonPath("$.paged").value(true));
  }

  @Test
  void getRoyaltyReportBreaksOutSourceQuantitiesAndKenpWithMixedCurrencies() throws Exception {
    Cookie token = login();
    Book reportBook = createBook("Report Book", "Report Author", "9780000000099");

    createSaleRecord(
        reportBook,
        SaleSource.HAND_SOLD,
        SaleDistributor.OTHER,
        SaleFormat.PRINT,
        1,
        2024,
        6,
        null,
        Currency.USD,
        "90.00",
        "90.00",
        "9.00",
        true);
    createSaleRecord(
        reportBook,
        SaleSource.DISTRIBUTOR,
        SaleDistributor.INGRAM_SPARK,
        SaleFormat.PRINT,
        1,
        2024,
        5,
        null,
        Currency.EUR,
        "120.00",
        "130.00",
        "10.00",
        false);
    createSaleRecord(
        reportBook,
        SaleSource.DISTRIBUTOR,
        SaleDistributor.AMAZON,
        SaleFormat.PRINT,
        2,
        2024,
        4,
        null,
        Currency.GBP,
        "90.00",
        "110.00",
        "8.00",
        true);
    createSaleRecord(
        reportBook,
        SaleSource.DISTRIBUTOR,
        SaleDistributor.AMAZON,
        SaleFormat.EBOOK,
        2,
        2024,
        3,
        null,
        Currency.USD,
        "40.00",
        "40.00",
        "6.00",
        false);
    createSaleRecord(
        reportBook,
        SaleSource.DISTRIBUTOR,
        SaleDistributor.AMAZON,
        SaleFormat.KINDLE_UNLIMITED,
        3,
        2024,
        1,
        1200,
        Currency.JPY,
        "30.00",
        "28.00",
        "4.00",
        false);
    createSaleRecord(
        reportBook,
        SaleSource.DISTRIBUTOR,
        SaleDistributor.OTHER,
        SaleFormat.PRINT,
        3,
        2024,
        2,
        null,
        Currency.CAD,
        "25.00",
        "22.00",
        "3.00",
        true);
    createSaleRecord(
        reportBook,
        SaleSource.DISTRIBUTOR,
        SaleDistributor.OTHER,
        SaleFormat.EBOOK,
        3,
        2024,
        7,
        null,
        Currency.EUR,
        "75.00",
        "80.00",
        "14.00",
        false);

    Long authorId = reportBook.getAuthor().getId();

    mockMvc
        .perform(
            get("/api/sales/royalty-report")
                .cookie(token)
                .param("authorId", String.valueOf(authorId))
                .param("startQuarter", "1")
                .param("startYear", "2024")
                .param("endQuarter", "1")
                .param("endYear", "2024"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.quarters", hasSize(1)))
        .andExpect(jsonPath("$.quarters[0].totals.quantity").value(27))
        .andExpect(jsonPath("$.quarters[0].totals.handsold").value(6))
        .andExpect(jsonPath("$.quarters[0].totals.ingramPrint").value(5))
        .andExpect(jsonPath("$.quarters[0].totals.amazonPrint").value(4))
        .andExpect(jsonPath("$.quarters[0].totals.amazonEbook").value(3))
        .andExpect(jsonPath("$.quarters[0].totals.otherPrint").value(2))
        .andExpect(jsonPath("$.quarters[0].totals.otherEbook").value(7))
        .andExpect(jsonPath("$.quarters[0].totals.kenpTotal").value(1200))
        .andExpect(jsonPath("$.quarters[0].totals.unpaidRoyalty").value(34.00))
        .andExpect(jsonPath("$.quarters[0].totals.paidRoyalty").value(20.00))
        .andExpect(jsonPath("$.quarters[0].totals.totalRoyalty").value(54.00))
        .andExpect(jsonPath("$.allTime.totals.quantity").value(27))
        .andExpect(jsonPath("$.allTime.totals.kenpTotal").value(1200))
        .andExpect(jsonPath("$.allTime.totals.totalRoyalty").value(54.00));
  }

  // ------- CSV Export Tests -------

  @Test
  void exportCsvReturnsHeadersWhenNoSales() throws Exception {
    Cookie token = login();

    MvcResult result =
        mockMvc
            .perform(get("/api/sales/export").cookie(token))
            .andExpect(status().isOk())
            .andReturn();

    String csv = result.getResponse().getContentAsString();
    assertThat(csv).contains("Date");
    assertThat(csv).contains("Pub. Revenue (Original)");
    assertThat(csv).contains("Royalty Status");
    assertThat(result.getResponse().getContentType()).startsWith("text/csv");
    // BOM check
    byte[] bytes = result.getResponse().getContentAsByteArray();
    assertThat(bytes[0]).isEqualTo((byte) 0xEF);
    assertThat(bytes[1]).isEqualTo((byte) 0xBB);
    assertThat(bytes[2]).isEqualTo((byte) 0xBF);
  }

  @Test
  void exportCsvContainsSaleData() throws Exception {
    Cookie token = login();
    Book book = createBook();

    createSale(
        token,
        saleRequest(
            book.getId(),
            SaleSource.DISTRIBUTOR,
            3,
            2024,
            10,
            new BigDecimal("100.00"),
            false,
            "test comment"));

    MvcResult result =
        mockMvc
            .perform(get("/api/sales/export").cookie(token))
            .andExpect(status().isOk())
            .andReturn();

    String csv = result.getResponse().getContentAsString();
    String[] lines = csv.split("\n");
    assertThat(lines).hasSize(2); // header + 1 row
    assertThat(lines[1]).contains("2024-03");
    assertThat(lines[1]).contains("Test Book");
    assertThat(lines[1]).contains("Test Author");
    assertThat(lines[1]).contains("Distributor");
    assertThat(lines[1]).contains("Other");
    assertThat(lines[1]).contains("Print");
    assertThat(lines[1]).contains("Unpaid");
    assertThat(lines[1]).contains("test comment");
  }

  @Test
  void exportCsvHandsoldShowsNADistributor() throws Exception {
    Cookie token = login();
    Book book = createBook();

    saleRepository.save(
        Sale.builder()
            .book(book)
            .saleSource(SaleSource.HAND_SOLD)
            .distributor(SaleDistributor.OTHER)
            .format(SaleFormat.PRINT)
            .saleMonth(6)
            .saleYear(2024)
            .quantitySold(5)
            .saleCurrency(Currency.USD)
            .publisherRevenue(new BigDecimal("50.00"))
            .originalPublisherRevenue(new BigDecimal("50.00"))
            .authorRoyalty(new BigDecimal("5.00"))
            .hasAuthorBeenPaid(false)
            .build());

    MvcResult result =
        mockMvc
            .perform(get("/api/sales/export").cookie(token))
            .andExpect(status().isOk())
            .andReturn();

    String csv = result.getResponse().getContentAsString();
    String[] lines = csv.split("\n");
    assertThat(lines[1]).contains("Handsold");
    assertThat(lines[1]).contains("\"N/A\"");
  }

  @Test
  void exportCsvRespectsFilters() throws Exception {
    Cookie token = login();
    Book book = createBook();

    createSale(
        token,
        saleRequest(
            book.getId(),
            SaleSource.DISTRIBUTOR,
            1,
            2024,
            10,
            new BigDecimal("100.00"),
            false,
            null));
    saleRepository.save(
        Sale.builder()
            .book(book)
            .saleSource(SaleSource.HAND_SOLD)
            .distributor(SaleDistributor.OTHER)
            .format(SaleFormat.PRINT)
            .saleMonth(2)
            .saleYear(2024)
            .quantitySold(5)
            .saleCurrency(Currency.USD)
            .publisherRevenue(new BigDecimal("50.00"))
            .originalPublisherRevenue(new BigDecimal("50.00"))
            .authorRoyalty(new BigDecimal("5.00"))
            .hasAuthorBeenPaid(false)
            .build());

    MvcResult result =
        mockMvc
            .perform(get("/api/sales/export").cookie(token).param("saleSource", "DISTRIBUTOR"))
            .andExpect(status().isOk())
            .andReturn();

    String csv = result.getResponse().getContentAsString();
    String[] lines = csv.split("\n");
    assertThat(lines).hasSize(2); // header + 1 filtered row
    assertThat(lines[1]).contains("Distributor");
    assertThat(lines[1]).doesNotContain("Handsold");
  }

  @Test
  void exportCsvRejectsInvalidSaleSource() throws Exception {
    Cookie token = login();

    mockMvc
        .perform(get("/api/sales/export").cookie(token).param("saleSource", "INVALID"))
        .andExpect(status().isBadRequest());
  }
}
