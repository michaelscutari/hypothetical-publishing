package edu.duke.bookpublishing.author;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.duke.bookpublishing.auth.User;
import edu.duke.bookpublishing.auth.UserRepository;
import edu.duke.bookpublishing.author.dto.AuthorRequest;
import edu.duke.bookpublishing.author.dto.AuthorResponse;
import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.sales.Sale;
import edu.duke.bookpublishing.sales.SaleRepository;
import jakarta.servlet.http.Cookie;
import java.math.BigDecimal;
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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthorControllerTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private AuthorRepository authorRepository;
  @Autowired private BookRepository bookRepository;
  @Autowired private SaleRepository saleRepository;
  @Autowired private UserRepository userRepository;
  @Autowired private PasswordEncoder passwordEncoder;

  @BeforeEach
  void setUp() {
    saleRepository.deleteAll();
    bookRepository.deleteAll();
    authorRepository.deleteAll();
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

  private AuthorResponse createAuthor(Cookie token, String name, String email) throws Exception {
    AuthorRequest request = new AuthorRequest(name, email);
    MvcResult result =
        mockMvc
            .perform(
                post("/api/authors")
                    .cookie(token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();
    return objectMapper.readValue(result.getResponse().getContentAsString(), AuthorResponse.class);
  }

  // ---- CREATE ----

  @Test
  void createAuthorReturnsCreatedAuthor() throws Exception {
    Cookie token = login();
    AuthorRequest request = new AuthorRequest("Jane Austen", "jane@austen.com");

    mockMvc
        .perform(
            post("/api/authors")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").isNumber())
        .andExpect(jsonPath("$.name").value("Jane Austen"))
        .andExpect(jsonPath("$.email").value("jane@austen.com"));
  }

  @Test
  void createAuthorNormalizesWhitespace() throws Exception {
    Cookie token = login();
    AuthorRequest request = new AuthorRequest("  Jane   Austen  ", "jane@austen.com");

    mockMvc
        .perform(
            post("/api/authors")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.name").value("Jane Austen"));
  }

  @Test
  void createAuthorValidationErrorMissingName() throws Exception {
    AuthorRequest request = new AuthorRequest("", "jane@austen.com");

    mockMvc
        .perform(
            post("/api/authors")
                .cookie(login())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.name").exists());
  }

  @Test
  void createAuthorValidationErrorMissingEmail() throws Exception {
    AuthorRequest request = new AuthorRequest("Jane Austen", "");

    mockMvc
        .perform(
            post("/api/authors")
                .cookie(login())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.email").exists());
  }

  @Test
  void createAuthorValidationErrorInvalidEmail() throws Exception {
    AuthorRequest request = new AuthorRequest("Jane Austen", "not-an-email");

    mockMvc
        .perform(
            post("/api/authors")
                .cookie(login())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.email").exists());
  }

  // ---- GET BY ID ----

  @Test
  void getAuthorByIdReturnsAuthor() throws Exception {
    Cookie token = login();
    AuthorResponse created = createAuthor(token, "Jane Austen", "jane@austen.com");

    mockMvc
        .perform(get("/api/authors/{id}", created.id()).cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(created.id()))
        .andExpect(jsonPath("$.name").value("Jane Austen"))
        .andExpect(jsonPath("$.email").value("jane@austen.com"));
  }

  @Test
  void getAuthorByIdReturns404WhenNotFound() throws Exception {
    mockMvc
        .perform(get("/api/authors/{id}", 99999).cookie(login()))
        .andExpect(status().isNotFound());
  }

  // ---- GET LIST ----

  @Test
  void getAuthorsReturnsEmptyList() throws Exception {
    mockMvc
        .perform(get("/api/authors").cookie(login()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(0)))
        .andExpect(jsonPath("$.totalElements").value(0));
  }

  @Test
  void getAuthorsReturnsPaginatedResults() throws Exception {
    Cookie token = login();
    for (int i = 1; i <= 30; i++) {
      createAuthor(token, "Author " + i, "author" + i + "@test.com");
    }

    mockMvc
        .perform(get("/api/authors").cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(25)))
        .andExpect(jsonPath("$.pageNumber").value(0))
        .andExpect(jsonPath("$.pageSize").value(25))
        .andExpect(jsonPath("$.totalElements").value(30))
        .andExpect(jsonPath("$.totalPages").value(2));

    mockMvc
        .perform(get("/api/authors").cookie(token).param("page", "1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(5)))
        .andExpect(jsonPath("$.pageNumber").value(1));
  }

  @Test
  void getAuthorsShowAllReturnsAllRecords() throws Exception {
    Cookie token = login();
    for (int i = 1; i <= 30; i++) {
      createAuthor(token, "Author " + i, "author" + i + "@test.com");
    }

    mockMvc
        .perform(get("/api/authors").cookie(token).param("showAll", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(30)))
        .andExpect(jsonPath("$.paged").value(false));
  }

  @Test
  void getAuthorsDefaultSortsByName() throws Exception {
    Cookie token = login();
    createAuthor(token, "Zelda Fitzgerald", "zelda@test.com");
    createAuthor(token, "Anne Bronte", "anne@test.com");
    createAuthor(token, "Mark Twain", "mark@test.com");

    mockMvc
        .perform(get("/api/authors").cookie(token).param("showAll", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].name").value("Anne Bronte"))
        .andExpect(jsonPath("$.content[1].name").value("Mark Twain"))
        .andExpect(jsonPath("$.content[2].name").value("Zelda Fitzgerald"));
  }

  @Test
  void getAuthorsSortsByFieldDescending() throws Exception {
    Cookie token = login();
    createAuthor(token, "Anne Bronte", "zelda@test.com");
    createAuthor(token, "Zelda Fitzgerald", "anne@test.com");

    mockMvc
        .perform(
            get("/api/authors")
                .cookie(token)
                .param("showAll", "true")
                .param("sortField", "email")
                .param("sortDirection", "desc"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].email").value("zelda@test.com"))
        .andExpect(jsonPath("$.content[1].email").value("anne@test.com"));
  }

  @Test
  void getAuthorsFiltersbyNameQuery() throws Exception {
    Cookie token = login();
    createAuthor(token, "Jane Austen", "jane@austen.com");
    createAuthor(token, "Mark Twain", "mark@twain.com");
    createAuthor(token, "Jane Eyre", "jane@eyre.com");

    mockMvc
        .perform(get("/api/authors").cookie(token).param("showAll", "true").param("query", "Jane"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(2)));
  }

  @Test
  void getAuthorsFiltersByEmailQuery() throws Exception {
    Cookie token = login();
    createAuthor(token, "Jane Austen", "jane@austen.com");
    createAuthor(token, "Mark Twain", "mark@twain.com");

    mockMvc
        .perform(get("/api/authors").cookie(token).param("showAll", "true").param("query", "twain"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].name").value("Mark Twain"));
  }

  // ---- UPDATE ----

  @Test
  void updateAuthorUpdatesFields() throws Exception {
    Cookie token = login();
    AuthorResponse created = createAuthor(token, "Old Name", "old@test.com");

    AuthorRequest update = new AuthorRequest("New Name", "new@test.com");

    mockMvc
        .perform(
            put("/api/authors/{id}", created.id())
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("New Name"))
        .andExpect(jsonPath("$.email").value("new@test.com"));

    mockMvc
        .perform(get("/api/authors/{id}", created.id()).cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("New Name"));
  }

  @Test
  void updateAuthorReturns404WhenNotFound() throws Exception {
    AuthorRequest update = new AuthorRequest("Name", "name@test.com");

    mockMvc
        .perform(
            put("/api/authors/{id}", 99999)
                .cookie(login())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
        .andExpect(status().isNotFound());
  }

  @Test
  void updateAuthorValidatesInput() throws Exception {
    Cookie token = login();
    AuthorResponse created = createAuthor(token, "Valid Name", "valid@test.com");

    AuthorRequest badUpdate = new AuthorRequest("", "not-email");

    mockMvc
        .perform(
            put("/api/authors/{id}", created.id())
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(badUpdate)))
        .andExpect(status().isBadRequest());
  }

  // ---- DELETE ----

  @Test
  void deleteAuthorRemovesIt() throws Exception {
    Cookie token = login();
    AuthorResponse created = createAuthor(token, "To Delete", "delete@test.com");

    mockMvc
        .perform(delete("/api/authors/{id}", created.id()).cookie(token))
        .andExpect(status().isNoContent());

    mockMvc
        .perform(get("/api/authors/{id}", created.id()).cookie(token))
        .andExpect(status().isNotFound());
  }

  @Test
  void deleteAuthorReturns404WhenNotFound() throws Exception {
    mockMvc
        .perform(delete("/api/authors/{id}", 99999).cookie(login()))
        .andExpect(status().isNotFound());
  }

  @Test
  void deleteAuthorCascadesDeleteToBooksAndSales() throws Exception {
    Cookie token = login();
    AuthorResponse created = createAuthor(token, "Cascade Test", "cascade@test.com");

    Author author = authorRepository.findById(created.id()).orElseThrow();

    // Create two books for the author
    Book book1 =
        bookRepository.save(
            Book.builder()
                .title("Book One")
                .author(author)
                .isbn13("9780000000001")
                .publicationYear(2024)
                .publicationMonth(1)
                .distributorAuthorRoyaltyRate(new BigDecimal("0.50"))
                .handsoldAuthorRoyaltyRate(new BigDecimal("0.20"))
                .coverPrice(new BigDecimal("20.00"))
                .printCost(new BigDecimal("5.00"))
                .build());

    Book book2 =
        bookRepository.save(
            Book.builder()
                .title("Book Two")
                .author(author)
                .isbn13("9780000000002")
                .publicationYear(2024)
                .publicationMonth(2)
                .distributorAuthorRoyaltyRate(new BigDecimal("0.50"))
                .handsoldAuthorRoyaltyRate(new BigDecimal("0.20"))
                .coverPrice(new BigDecimal("25.00"))
                .printCost(new BigDecimal("6.00"))
                .build());

    // Create sales for both books
    Sale sale1 =
        saleRepository.save(
            Sale.builder()
                .book(book1)
                .saleSource(edu.duke.bookpublishing.sales.enums.SaleSource.DISTRIBUTOR)
                .saleMonth(1)
                .saleYear(2024)
                .quantitySold(10)
                .publisherRevenue(new BigDecimal("100.00"))
                .authorRoyalty(new BigDecimal("50.00"))
                .hasAuthorBeenPaid(false)
                .build());

    Sale sale2 =
        saleRepository.save(
            Sale.builder()
                .book(book2)
                .saleSource(edu.duke.bookpublishing.sales.enums.SaleSource.HAND_SOLD)
                .saleMonth(2)
                .saleYear(2024)
                .quantitySold(5)
                .publisherRevenue(new BigDecimal("75.00"))
                .authorRoyalty(new BigDecimal("25.00"))
                .hasAuthorBeenPaid(false)
                .build());

    // Verify data exists before deletion
    assertTrue(authorRepository.existsById(author.getId()));
    assertTrue(bookRepository.existsById(book1.getId()));
    assertTrue(bookRepository.existsById(book2.getId()));
    assertTrue(saleRepository.existsById(sale1.getId()));
    assertTrue(saleRepository.existsById(sale2.getId()));

    // Delete the author
    mockMvc
        .perform(delete("/api/authors/{id}", created.id()).cookie(token))
        .andExpect(status().isNoContent());

    // Verify cascade delete: author, all books, and all sales should be deleted
    assertFalse(authorRepository.existsById(author.getId()));
    assertFalse(bookRepository.existsById(book1.getId()));
    assertFalse(bookRepository.existsById(book2.getId()));
    assertFalse(saleRepository.existsById(sale1.getId()));
    assertFalse(saleRepository.existsById(sale2.getId()));
  }

  // ---- FINANCIAL SUMMARY (via @Formula) ----

  @Test
  void authorResponseIncludesBookCountAndFinancials() throws Exception {
    Cookie token = login();
    AuthorResponse created = createAuthor(token, "Finance Author", "finance@test.com");

    Author author = authorRepository.findById(created.id()).orElseThrow();

    Book book =
        bookRepository.save(
            Book.builder()
                .title("Finance Book")
                .author(author)
                .isbn13("9780000000001")
                .publicationYear(2024)
                .publicationMonth(1)
                .distributorAuthorRoyaltyRate(new BigDecimal("0.50"))
                .handsoldAuthorRoyaltyRate(new BigDecimal("0.20"))
                .coverPrice(new BigDecimal("20.00"))
                .printCost(new BigDecimal("5.00"))
                .build());

    saleRepository.save(
        Sale.builder()
            .book(book)
            .saleSource(edu.duke.bookpublishing.sales.enums.SaleSource.DISTRIBUTOR)
            .saleMonth(1)
            .saleYear(2024)
            .quantitySold(10)
            .publisherRevenue(new BigDecimal("500.00"))
            .authorRoyalty(new BigDecimal("250.00"))
            .hasAuthorBeenPaid(true)
            .build());

    saleRepository.save(
        Sale.builder()
            .book(book)
            .saleSource(edu.duke.bookpublishing.sales.enums.SaleSource.DISTRIBUTOR)
            .saleMonth(2)
            .saleYear(2024)
            .quantitySold(5)
            .publisherRevenue(new BigDecimal("200.00"))
            .authorRoyalty(new BigDecimal("100.00"))
            .hasAuthorBeenPaid(false)
            .build());

    mockMvc
        .perform(get("/api/authors/{id}", created.id()).cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.bookCount").value(1))
        .andExpect(jsonPath("$.totalRoyalty").value(350.00))
        .andExpect(jsonPath("$.paidRoyalty").value(250.00))
        .andExpect(jsonPath("$.unpaidRoyalty").value(100.00));
  }

  @Test
  void authorWithNoBooksReturnsZeroFinancials() throws Exception {
    Cookie token = login();
    AuthorResponse created = createAuthor(token, "Empty Author", "empty@test.com");

    mockMvc
        .perform(get("/api/authors/{id}", created.id()).cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.bookCount").value(0))
        .andExpect(jsonPath("$.totalRoyalty").value(0))
        .andExpect(jsonPath("$.paidRoyalty").value(0))
        .andExpect(jsonPath("$.unpaidRoyalty").value(0));
  }

  // ---- AUTH ----

  @Test
  void unauthenticatedRequestReturns401() throws Exception {
    mockMvc.perform(get("/api/authors")).andExpect(status().isUnauthorized());
  }
}
