package edu.duke.bookpublishing.sales;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.duke.bookpublishing.auth.User;
import edu.duke.bookpublishing.auth.UserRepository;
import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.sales.dto.SaleRequest;
import edu.duke.bookpublishing.sales.dto.SaleResponse;
import jakarta.servlet.http.Cookie;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

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

  @Autowired private BookRepository bookRepository;

  @Autowired private SaleRepository saleRepository;

  @Autowired private UserRepository userRepository;

  @Autowired private PasswordEncoder passwordEncoder;

  @BeforeEach
  void setUp() {
    saleRepository.deleteAll();
    bookRepository.deleteAll();
    userRepository.deleteAll();
    userRepository.save(
        User.builder().username("admin").password(passwordEncoder.encode("admin")).build());
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
            .author("Test Author")
            .isbn13("9780743273565")
            .publicationYear(2020)
            .publicationMonth(1)
            .royaltyRate(new BigDecimal("0.20"))
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
        new SaleRequest(book.getId(), 1, 2024, 50, new BigDecimal("100.00"), null, true);

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
        .andExpect(jsonPath("$.publisherRevenue").value(100.00))
        .andExpect(jsonPath("$.authorRoyalty").value(20.00))
        .andExpect(jsonPath("$.hasAuthorBeenPaid").value(true));
  }

  @Test
  void createSaleRejectsFutureDate() throws Exception {
    Cookie token = login();
    Book book = createBook();
    YearMonth future = YearMonth.now().plusMonths(1);

    SaleRequest request =
        new SaleRequest(
            book.getId(),
            future.getMonthValue(),
            future.getYear(),
            1,
            new BigDecimal("10.00"),
            null,
            false);

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
            new SaleRequest(book.getId(), 2, 2024, 10, new BigDecimal("50.00"), null, false));

    mockMvc
        .perform(get("/api/sales/{id}", created.id()).cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(created.id()))
        .andExpect(jsonPath("$.bookId").value(book.getId()));
  }

  @Test
  void updateSaleUpdatesFields() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleResponse created =
        createSale(
            token,
            new SaleRequest(book.getId(), 2, 2024, 10, new BigDecimal("50.00"), null, false));

    SaleRequest update =
        new SaleRequest(book.getId(), 3, 2024, 25, new BigDecimal("200.00"), null, true);

    mockMvc
        .perform(
            put("/api/sales/{id}", created.id())
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.saleMonth").value(3))
        .andExpect(jsonPath("$.quantitySold").value(25))
        .andExpect(jsonPath("$.publisherRevenue").value(200.00))
        .andExpect(jsonPath("$.authorRoyalty").value(40.00))
        .andExpect(jsonPath("$.hasAuthorBeenPaid").value(true));
  }

  @Test
  void deleteSaleRemovesIt() throws Exception {
    Cookie token = login();
    Book book = createBook();

    SaleResponse created =
        createSale(
            token,
            new SaleRequest(book.getId(), 2, 2024, 10, new BigDecimal("50.00"), null, false));

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
          token, new SaleRequest(book.getId(), 1, 2024, i, new BigDecimal("10.00"), null, false));
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
          token, new SaleRequest(book.getId(), 1, 2024, i, new BigDecimal("10.00"), null, false));
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
          token, new SaleRequest(book.getId(), 1, 2024, i, new BigDecimal("10.00"), null, false));
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
        token, new SaleRequest(book.getId(), 1, 2024, 5, new BigDecimal("10.00"), null, false));
    createSale(
        token, new SaleRequest(book.getId(), 3, 2024, 5, new BigDecimal("10.00"), null, false));
    createSale(
        token, new SaleRequest(book.getId(), 5, 2024, 5, new BigDecimal("10.00"), null, false));

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
}
