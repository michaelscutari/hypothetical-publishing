package edu.duke.bookpublishing.books;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.duke.bookpublishing.auth.User;
import edu.duke.bookpublishing.auth.UserRepository;
import edu.duke.bookpublishing.books.dto.BookRequest;
import edu.duke.bookpublishing.books.dto.BookResponse;
import edu.duke.bookpublishing.sales.SaleRepository;
import edu.duke.bookpublishing.sales.dto.SaleRequest;
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
class BookControllerTest {

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

  @Test
  void getAllBooksReturnsEmptyList() throws Exception {
    mockMvc
        .perform(get("/api/books").cookie(login()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(0)))
        .andExpect(jsonPath("$.totalElements").value(0));
  }

  @Test
  void getAllBooksReturnsBooks() throws Exception {
    Cookie token = login();
    BookRequest request =
        new BookRequest(
            "Test Book", "Test Author", "9780743273565", null, 2020, 1, new BigDecimal("0.5"));

    mockMvc.perform(
        post("/api/books")
            .cookie(token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)));

    mockMvc
        .perform(get("/api/books").cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].title").value("Test Book"))
        .andExpect(jsonPath("$.totalElements").value(1));
  }

  @Test
  void getAllBooksReturnsPaginatedResults() throws Exception {
    Cookie token = login();
    // Create multiple books
    for (int i = 1; i <= 30; i++) {
      String isbn13 = String.format("978074327%04d", i);
      mockMvc.perform(
          post("/api/books")
              .cookie(token)
              .contentType(MediaType.APPLICATION_JSON)
              .content(
                  objectMapper.writeValueAsString(
                      new BookRequest(
                          "Book " + i,
                          "Author " + i,
                          isbn13,
                          null,
                          2020,
                          1,
                          new BigDecimal("0.5")))));
    }

    // Test default pagination (page 0, size 25)
    mockMvc
        .perform(get("/api/books").cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(25)))
        .andExpect(jsonPath("$.pageNumber").value(0))
        .andExpect(jsonPath("$.pageSize").value(25))
        .andExpect(jsonPath("$.totalElements").value(30))
        .andExpect(jsonPath("$.totalPages").value(2));

    // Test second page
    mockMvc
        .perform(get("/api/books").cookie(token).param("page", "1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(5)))
        .andExpect(jsonPath("$.pageNumber").value(1));
  }

  @Test
  void getAllBooksShowAllReturnsAllRecords() throws Exception {
    Cookie token = login();
    // Create multiple books
    for (int i = 1; i <= 30; i++) {
      String isbn13 = String.format("978074327%04d", i);
      mockMvc.perform(
          post("/api/books")
              .cookie(token)
              .contentType(MediaType.APPLICATION_JSON)
              .content(
                  objectMapper.writeValueAsString(
                      new BookRequest(
                          "Book " + i,
                          "Author " + i,
                          isbn13,
                          null,
                          2020,
                          1,
                          new BigDecimal("0.5")))));
    }

    // Test showAll parameter
    mockMvc
        .perform(get("/api/books").cookie(token).param("showAll", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(30)))
        .andExpect(jsonPath("$.paged").value(false));
  }

  @Test
  void getBooksReturnsMonthYearFormat() throws Exception {
    Cookie token = login();
    BookRequest request =
        new BookRequest(
            "Test Book", "Test Author", "9780743273565", null, 2024, 6, new BigDecimal("0.5"));

    mockMvc.perform(
        post("/api/books")
            .cookie(token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)));

    mockMvc
        .perform(get("/api/books").cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].publicationYear").value(2024))
        .andExpect(jsonPath("$.content[0].publicationMonth").value(6));
  }

  @Test
  void searchBooksReturnsFilteredResults() throws Exception {
    Cookie token = login();
    // Create multiple books
    mockMvc.perform(
        post("/api/books")
            .cookie(token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                objectMapper.writeValueAsString(
                    new BookRequest(
                        "Harry Potter and the Sorcerer's Stone",
                        "Rowling, J.K.",
                        "9780590353427",
                        null,
                        1997,
                        6,
                        new BigDecimal("0.15")))));

    mockMvc.perform(
        post("/api/books")
            .cookie(token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                objectMapper.writeValueAsString(
                    new BookRequest(
                        "The Great Gatsby",
                        "Fitzgerald, F. Scott",
                        "9780743273565",
                        null,
                        1925,
                        4,
                        new BigDecimal("0.12")))));

    mockMvc.perform(
        post("/api/books")
            .cookie(token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                objectMapper.writeValueAsString(
                    new BookRequest(
                        "Harry Potter and the Chamber of Secrets",
                        "Rowling, J.K.",
                        "9780439064873",
                        null,
                        1998,
                        7,
                        new BigDecimal("0.15")))));

    // Search with reversed word order - should still find Harry Potter books
    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "Stone Harry"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].title").value("Harry Potter and the Sorcerer's Stone"));

    // Search by author - should find both Harry Potter books
    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "Rowling"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(2)));

    // Search with no matches
    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "Tolkien"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(0)));
  }

  @Test
  void searchBooksIgnoresIsbnDashes() throws Exception {
    Cookie token = login();
    mockMvc.perform(
        post("/api/books")
            .cookie(token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                objectMapper.writeValueAsString(
                    new BookRequest(
                        "Test Book",
                        "Test Author",
                        "9780743273565",
                        null,
                        2020,
                        1,
                        new BigDecimal("0.5")))));

    // Search with dashes in ISBN - should find the book
    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "978-0-7432-7356-5"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)));

    // Search without dashes - should also find the book
    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "9780743273565"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)));
  }

  @Test
  void searchAuthorsReturnsDistinctSortedResults() throws Exception {
    Cookie token = login();
    mockMvc.perform(
        post("/api/books")
            .cookie(token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                objectMapper.writeValueAsString(
                    new BookRequest(
                        "Book One",
                        "Author One",
                        "9780743273565",
                        null,
                        2020,
                        1,
                        new BigDecimal("0.5")))));

    mockMvc.perform(
        post("/api/books")
            .cookie(token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                objectMapper.writeValueAsString(
                    new BookRequest(
                        "Book Two",
                        "Author Two",
                        "9780743273566",
                        null,
                        2020,
                        2,
                        new BigDecimal("0.5")))));

    mockMvc.perform(
        post("/api/books")
            .cookie(token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                objectMapper.writeValueAsString(
                    new BookRequest(
                        "Book Three",
                        "Author One",
                        "9780743273567",
                        null,
                        2020,
                        3,
                        new BigDecimal("0.5")))));

    mockMvc
        .perform(
            get("/api/books/authors")
                .cookie(token)
                .param("query", "Author")
                .param("showAll", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(2)))
        .andExpect(jsonPath("$.content[0]").value("Author One"))
        .andExpect(jsonPath("$.content[1]").value("Author Two"))
        .andExpect(jsonPath("$.paged").value(false));
  }

  @Test
  void createBookReturnsCreatedBook() throws Exception {
    BookRequest request =
        new BookRequest(
            "The Great Gatsby",
            "Fitzgerald, F. Scott",
            "978-0-7432-7356-5",
            "0-7432-7356-7",
            1925,
            4,
            new BigDecimal("0.15"));

    mockMvc
        .perform(
            post("/api/books")
                .cookie(login())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").isNumber())
        .andExpect(jsonPath("$.title").value("The Great Gatsby"))
        .andExpect(jsonPath("$.author").value("Fitzgerald, F. Scott"))
        .andExpect(jsonPath("$.isbn13").value("9780743273565"))
        .andExpect(jsonPath("$.isbn10").value("0743273567"))
        .andExpect(jsonPath("$.publicationYear").value(1925))
        .andExpect(jsonPath("$.publicationMonth").value(4))
        .andExpect(jsonPath("$.royaltyRate").value(0.15));
  }

  @Test
  void createBookNormalizesAuthorWhitespace() throws Exception {
    BookRequest request =
        new BookRequest(
            "Test Book",
            "  Author   with   spaces  ",
            "9780743273565",
            null,
            2020,
            1,
            new BigDecimal("0.5"));

    mockMvc
        .perform(
            post("/api/books")
                .cookie(login())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.author").value("Author with spaces"));
  }

  @Test
  void createBookUsesDefaultRoyaltyRate() throws Exception {
    BookRequest request =
        new BookRequest("Test Book", "Test Author", "9780743273565", null, 2020, 1, null);

    mockMvc
        .perform(
            post("/api/books")
                .cookie(login())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.royaltyRate").value(0.5));
  }

  @Test
  void createBookValidationErrorMissingTitle() throws Exception {
    BookRequest request =
        new BookRequest(null, "Test Author", "9780743273565", null, 2020, 1, new BigDecimal("0.5"));

    mockMvc
        .perform(
            post("/api/books")
                .cookie(login())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.title").value("Title is required"));
  }

  @Test
  void createBookValidationErrorInvalidIsbn() throws Exception {
    BookRequest request =
        new BookRequest(
            "Test Book", "Test Author", "978074327356X", null, 2020, 1, new BigDecimal("0.5"));

    mockMvc
        .perform(
            post("/api/books")
                .cookie(login())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.isbn13").value("Invalid ISBN-13 format"));
  }

  @Test
  void createBookValidationErrorInvalidMonth() throws Exception {
    BookRequest request =
        new BookRequest(
            "Test Book", "Test Author", "9780743273565", null, 2020, 13, new BigDecimal("0.5"));

    mockMvc
        .perform(
            post("/api/books")
                .cookie(login())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.publicationMonth").exists());
  }

  @Test
  void createBookDuplicateIsbnReturns409() throws Exception {
    Cookie token = login();
    BookRequest request =
        new BookRequest(
            "Book One", "Author One", "9780743273565", null, 2020, 1, new BigDecimal("0.5"));

    mockMvc
        .perform(
            post("/api/books")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated());

    BookRequest duplicateRequest =
        new BookRequest(
            "Book Two", "Author Two", "9780743273565", null, 2021, 5, new BigDecimal("0.3"));

    mockMvc
        .perform(
            post("/api/books")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicateRequest)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.isbn13").exists());
  }

  @Test
  void getBookByIdReturnsBook() throws Exception {
    Cookie token = login();
    Long bookId =
        createBook(
            token,
            new BookRequest(
                "Test Book", "Test Author", "9780743273565", null, 2020, 1, new BigDecimal("0.5")));

    mockMvc
        .perform(get("/api/books/{id}", bookId).cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(bookId))
        .andExpect(jsonPath("$.title").value("Test Book"));
  }

  @Test
  void getBookByIdReturnsTotalSalesToDate() throws Exception {
    Cookie token = login();
    Long bookId =
        createBook(
            token,
            new BookRequest(
                "Test Book", "Test Author", "9780743273565", null, 2020, 1, new BigDecimal("0.5")));

    mockMvc
        .perform(get("/api/books/{id}", bookId).cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalSalesToDate").value(0));
  }

  @Test
  void updateBookUpdatesFields() throws Exception {
    Cookie token = login();
    Long bookId =
        createBook(
            token,
            new BookRequest(
                "Old Title", "Old Author", "9780743273565", null, 2020, 1, new BigDecimal("0.5")));

    BookRequest updateRequest =
        new BookRequest(
            "New Title",
            "New Author",
            "9780743273565",
            "0743273567",
            2021,
            5,
            new BigDecimal("0.75"));

    mockMvc
        .perform(
            put("/api/books/{id}", bookId)
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("New Title"))
        .andExpect(jsonPath("$.author").value("New Author"))
        .andExpect(jsonPath("$.isbn10").value("0743273567"))
        .andExpect(jsonPath("$.publicationYear").value(2021))
        .andExpect(jsonPath("$.publicationMonth").value(5))
        .andExpect(jsonPath("$.royaltyRate").value(0.75));
  }

  @Test
  void deleteBookRemovesIt() throws Exception {
    Cookie token = login();
    Long bookId =
        createBook(
            token,
            new BookRequest(
                "Test Book", "Test Author", "9780743273565", null, 2020, 1, new BigDecimal("0.5")));

    mockMvc
        .perform(delete("/api/books/{id}", bookId).cookie(token))
        .andExpect(status().isNoContent());

    mockMvc.perform(get("/api/books/{id}", bookId).cookie(token)).andExpect(status().isNotFound());
  }

  @Test
  void getBookByIdMissingReturns404() throws Exception {
    mockMvc.perform(get("/api/books/{id}", 9999).cookie(login())).andExpect(status().isNotFound());
  }

  @Test
  void getBookDetailByIdReturnsBookAndFinancials() throws Exception {
    Cookie token = login();
    Long bookId =
        createBook(
            token,
            new BookRequest(
                "Detail Book",
                "Detail Author",
                "9780743279999",
                null,
                2020,
                1,
                new BigDecimal("0.5")));

    createSale(
        token,
        new SaleRequest(
            bookId, 1, 2025, 10, new BigDecimal("1000.00"), new BigDecimal("100.00"), true));

    createSale(
        token,
        new SaleRequest(
            bookId, 2, 2025, 5, new BigDecimal("250.00"), new BigDecimal("50.00"), false));

    mockMvc
        .perform(get("/api/books/bookdetail/{id}", bookId).cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(bookId))
        .andExpect(jsonPath("$.title").value("Detail Book"))
        .andExpect(jsonPath("$.author").value("Detail Author"))
        .andExpect(jsonPath("$.totalSalesToDate").value(15))
        .andExpect(jsonPath("$.revenue").value(1250.00))
        .andExpect(jsonPath("$.paidRoyalty").value(100.00))
        .andExpect(jsonPath("$.unpaidRoyalty").value(50.00))
        .andExpect(jsonPath("$.totalRoyalty").value(150.00));
  }

  @Test
  void getBookDetailByIdMissingReturns404() throws Exception {
    mockMvc
        .perform(get("/api/books/bookdetail/{id}", 9999).cookie(login()))
        .andExpect(status().isNotFound());
  }

  @Test
  void searchBooksFindsIsbn10WithUppercaseXUsingLowercaseQuery() throws Exception {
    Cookie token = login();
    // ISBN-10 080442957X has check digit X (valid ISBN for "The Elements of Style")
    mockMvc.perform(
        post("/api/books")
            .cookie(token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                objectMapper.writeValueAsString(
                    new BookRequest(
                        "The Elements of Style",
                        "Strunk, William",
                        "9780205309023",
                        "080442957X",
                        1999,
                        1,
                        new BigDecimal("0.10")))));

    // Search with lowercase x - should find the book
    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "080442957x"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].isbn10").value("080442957X"));

    // Search with uppercase X - should also find the book
    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "080442957X"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)));
  }

  private Long createBook(Cookie token, BookRequest request) throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/api/books")
                    .cookie(token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();

    BookResponse response =
        objectMapper.readValue(result.getResponse().getContentAsString(), BookResponse.class);
    return response.id();
  }

  private void createSale(Cookie token, SaleRequest request) throws Exception {
    mockMvc
        .perform(
            post("/api/sales")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk());
  }
}
