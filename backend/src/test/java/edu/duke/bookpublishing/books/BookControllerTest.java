package edu.duke.bookpublishing.books;

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
import edu.duke.bookpublishing.books.dto.BookRequest;
import edu.duke.bookpublishing.books.dto.BookResponse;
import edu.duke.bookpublishing.sales.SaleRepository;
import edu.duke.bookpublishing.sales.dto.SaleRequest;
import edu.duke.bookpublishing.sales.enums.Currency;
import edu.duke.bookpublishing.sales.enums.SaleDistributor;
import edu.duke.bookpublishing.sales.enums.SaleFormat;
import edu.duke.bookpublishing.sales.enums.SaleSource;
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

  private BookRequest buildBookRequest(
      String title,
      Long authorId,
      String isbn13,
      String isbn10,
      Integer publicationYear,
      Integer publicationMonth,
      BigDecimal distributorAuthorRoyaltyRate) {
    return new BookRequest(
        title,
        authorId,
        isbn13,
        isbn10,
        publicationYear,
        publicationMonth,
        distributorAuthorRoyaltyRate,
        new BigDecimal("0.2"),
        null,
        null,
        new BigDecimal("20.00"),
        new BigDecimal("5.00"),
        null);
  }

  private BookRequest buildSeriesBookRequest(
      String title, Long authorId, String isbn13, String seriesName, Integer seriesPosition) {
    return new BookRequest(
        title,
        authorId,
        isbn13,
        null,
        2020,
        1,
        new BigDecimal("0.5"),
        new BigDecimal("0.2"),
        seriesName,
        seriesPosition,
        new BigDecimal("20.00"),
        new BigDecimal("5.00"),
        null);
  }

  private Author createAuthor(String name) {
    return authorRepository.save(
        Author.builder()
            .name(name)
            .email(name.toLowerCase().replaceAll("[^a-z]", "") + "@test.com")
            .build());
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
            "Test Book",
            defaultAuthor.getId(),
            "9780743273565",
            null,
            2020,
            1,
            new BigDecimal("0.5"),
            new BigDecimal("0.2"),
            null,
            null,
            new BigDecimal("20.00"),
            new BigDecimal("5.00"),
            null);

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
    for (int i = 1; i <= 30; i++) {
      String isbn13 = String.format("978074327%04d", i);
      mockMvc.perform(
          post("/api/books")
              .cookie(token)
              .contentType(MediaType.APPLICATION_JSON)
              .content(
                  objectMapper.writeValueAsString(
                      buildBookRequest(
                          "Book " + i,
                          defaultAuthor.getId(),
                          isbn13,
                          null,
                          2020,
                          1,
                          new BigDecimal("0.5")))));
    }

    mockMvc
        .perform(get("/api/books").cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(25)))
        .andExpect(jsonPath("$.pageNumber").value(0))
        .andExpect(jsonPath("$.pageSize").value(25))
        .andExpect(jsonPath("$.totalElements").value(30))
        .andExpect(jsonPath("$.totalPages").value(2));

    mockMvc
        .perform(get("/api/books").cookie(token).param("page", "1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(5)))
        .andExpect(jsonPath("$.pageNumber").value(1));
  }

  @Test
  void getAllBooksShowAllReturnsAllRecords() throws Exception {
    Cookie token = login();
    for (int i = 1; i <= 30; i++) {
      String isbn13 = String.format("978074327%04d", i);
      mockMvc.perform(
          post("/api/books")
              .cookie(token)
              .contentType(MediaType.APPLICATION_JSON)
              .content(
                  objectMapper.writeValueAsString(
                      buildBookRequest(
                          "Book " + i,
                          defaultAuthor.getId(),
                          isbn13,
                          null,
                          2020,
                          1,
                          new BigDecimal("0.5")))));
    }

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
            "Test Book",
            defaultAuthor.getId(),
            "9780743273565",
            null,
            2024,
            6,
            new BigDecimal("0.5"),
            new BigDecimal("0.2"),
            null,
            null,
            new BigDecimal("20.00"),
            new BigDecimal("5.00"),
            null);

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
    Author rowling = createAuthor("Rowling, J.K.");
    Author fitzgerald = createAuthor("Fitzgerald, F. Scott");

    mockMvc.perform(
        post("/api/books")
            .cookie(token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                objectMapper.writeValueAsString(
                    buildBookRequest(
                        "Harry Potter and the Sorcerer's Stone",
                        rowling.getId(),
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
                    buildBookRequest(
                        "The Great Gatsby",
                        fitzgerald.getId(),
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
                    buildBookRequest(
                        "Harry Potter and the Chamber of Secrets",
                        rowling.getId(),
                        "9780439064873",
                        null,
                        1998,
                        7,
                        new BigDecimal("0.15")))));

    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "Stone Harry"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].title").value("Harry Potter and the Sorcerer's Stone"));

    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "Rowling"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(2)));

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
                    buildBookRequest(
                        "Test Book",
                        defaultAuthor.getId(),
                        "9780743273565",
                        null,
                        2020,
                        1,
                        new BigDecimal("0.5")))));

    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "978-0-7432-7356-5"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)));

    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "9780743273565"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)));
  }

  @Test
  void searchAuthorsReturnsSortedAuthorResults() throws Exception {
    Cookie token = login();
    Author authorOne = createAuthor("Author One");
    Author authorTwo = createAuthor("Author Two");

    mockMvc.perform(
        post("/api/books")
            .cookie(token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                objectMapper.writeValueAsString(
                    buildBookRequest(
                        "Book One",
                        authorOne.getId(),
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
                    buildBookRequest(
                        "Book Two",
                        authorTwo.getId(),
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
                    buildBookRequest(
                        "Book Three",
                        authorOne.getId(),
                        "9780743273567",
                        null,
                        2020,
                        3,
                        new BigDecimal("0.5")))));
    createAuthor("Zara Writer");
    createAuthor("Amy Novelist");

    mockMvc
        .perform(
            get("/api/books/authors")
                .cookie(token)
                .param("query", "Novelist")
                .param("showAll", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].name").value("Amy Novelist"))
        .andExpect(jsonPath("$.content[0].id").isNumber())
        .andExpect(jsonPath("$.paged").value(false));

    mockMvc
        .perform(get("/api/books/authors").cookie(token).param("showAll", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(5)))
        .andExpect(jsonPath("$.content[0].name").value("Amy Novelist"))
        .andExpect(jsonPath("$.content[1].name").value("Author One"))
        .andExpect(jsonPath("$.content[2].name").value("Author Two"))
        .andExpect(jsonPath("$.content[3].name").value("Test Author"))
        .andExpect(jsonPath("$.content[4].name").value("Zara Writer"))
        .andExpect(jsonPath("$.paged").value(false));
  }

  @Test
  void createBookReturnsCreatedBook() throws Exception {
    Author fitzgerald = createAuthor("Fitzgerald, F. Scott");
    BookRequest request =
        buildBookRequest(
            "The Great Gatsby",
            fitzgerald.getId(),
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
        .andExpect(jsonPath("$.authorId").value(fitzgerald.getId()))
        .andExpect(jsonPath("$.isbn13").value("9780743273565"))
        .andExpect(jsonPath("$.isbn10").value("0743273567"))
        .andExpect(jsonPath("$.publicationYear").value(1925))
        .andExpect(jsonPath("$.publicationMonth").value(4))
        .andExpect(jsonPath("$.distributorAuthorRoyaltyRate").value(0.15))
        .andExpect(jsonPath("$.handsoldAuthorRoyaltyRate").value(0.2));
  }

  @Test
  void createBookPersistsAsin() throws Exception {
    Cookie token = login();
    BookRequest request =
        new BookRequest(
            "ASIN Book",
            defaultAuthor.getId(),
            "9780743273565",
            null,
            2020,
            1,
            new BigDecimal("0.5"),
            new BigDecimal("0.2"),
            null,
            null,
            new BigDecimal("20.00"),
            new BigDecimal("5.00"),
            "B0ABC12345");

    mockMvc
        .perform(
            post("/api/books")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.asin").value("B0ABC12345"));
  }

  @Test
  void createBookNormalizesAuthorWhitespace() throws Exception {
    Author authorWithSpaces = createAuthor("  Author   with   spaces  ");
    BookRequest request =
        buildBookRequest(
            "Test Book",
            authorWithSpaces.getId(),
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
        new BookRequest(
            "Test Book",
            defaultAuthor.getId(),
            "9780743273565",
            null,
            2020,
            1,
            null,
            null,
            null,
            null,
            new BigDecimal("20.00"),
            new BigDecimal("5.00"),
            null);

    mockMvc
        .perform(
            post("/api/books")
                .cookie(login())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.distributorAuthorRoyaltyRate").value(0.5))
        .andExpect(jsonPath("$.handsoldAuthorRoyaltyRate").value(0.2));
  }

  @Test
  void createBookValidationErrorMissingTitle() throws Exception {
    BookRequest request =
        new BookRequest(
            null,
            defaultAuthor.getId(),
            "9780743273565",
            null,
            2020,
            1,
            new BigDecimal("0.5"),
            new BigDecimal("0.2"),
            null,
            null,
            new BigDecimal("20.00"),
            new BigDecimal("5.00"),
            null);

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
            "Test Book",
            defaultAuthor.getId(),
            "978074327356X",
            null,
            2020,
            1,
            new BigDecimal("0.5"),
            new BigDecimal("0.2"),
            null,
            null,
            new BigDecimal("20.00"),
            new BigDecimal("5.00"),
            null);

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
            "Test Book",
            defaultAuthor.getId(),
            "9780743273565",
            null,
            2020,
            13,
            new BigDecimal("0.5"),
            new BigDecimal("0.2"),
            null,
            null,
            new BigDecimal("20.00"),
            new BigDecimal("5.00"),
            null);

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
            "Book One",
            defaultAuthor.getId(),
            "9780743273565",
            null,
            2020,
            1,
            new BigDecimal("0.5"),
            new BigDecimal("0.2"),
            null,
            null,
            new BigDecimal("20.00"),
            new BigDecimal("5.00"),
            null);

    mockMvc
        .perform(
            post("/api/books")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated());

    BookRequest duplicateRequest =
        new BookRequest(
            "Book Two",
            defaultAuthor.getId(),
            "9780743273565",
            null,
            2021,
            5,
            new BigDecimal("0.3"),
            new BigDecimal("0.2"),
            null,
            null,
            new BigDecimal("20.00"),
            new BigDecimal("5.00"),
            null);

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
                "Test Book",
                defaultAuthor.getId(),
                "9780743273565",
                null,
                2020,
                1,
                new BigDecimal("0.5"),
                new BigDecimal("0.2"),
                null,
                null,
                new BigDecimal("20.00"),
                new BigDecimal("5.00"),
                null));

    mockMvc
        .perform(get("/api/books/{id}", bookId).cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(bookId))
        .andExpect(jsonPath("$.title").value("Test Book"));
  }

  @Test
  void getBookByIdWithZeroSalesReturnsZeroFinancials() throws Exception {
    Cookie token = login();
    Long bookId =
        createBook(
            token,
            new BookRequest(
                "Test Book",
                defaultAuthor.getId(),
                "9780743273565",
                null,
                2020,
                1,
                new BigDecimal("0.5"),
                new BigDecimal("0.2"),
                null,
                null,
                new BigDecimal("20.00"),
                new BigDecimal("5.00"),
                null));

    mockMvc
        .perform(get("/api/books/{id}", bookId).cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalSalesToDate").value(0))
        .andExpect(jsonPath("$.revenue").value(0))
        .andExpect(jsonPath("$.paidRoyalty").value(0))
        .andExpect(jsonPath("$.unpaidRoyalty").value(0))
        .andExpect(jsonPath("$.totalRoyalty").value(0));
  }

  @Test
  void updateBookUpdatesFields() throws Exception {
    Cookie token = login();
    Author newAuthor = createAuthor("New Author");
    Long bookId =
        createBook(
            token,
            new BookRequest(
                "Old Title",
                defaultAuthor.getId(),
                "9780743273565",
                null,
                2020,
                1,
                new BigDecimal("0.5"),
                new BigDecimal("0.2"),
                null,
                null,
                new BigDecimal("20.00"),
                new BigDecimal("5.00"),
                null));

    BookRequest updateRequest =
        buildBookRequest(
            "New Title",
            newAuthor.getId(),
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
        .andExpect(jsonPath("$.authorId").value(newAuthor.getId()))
        .andExpect(jsonPath("$.isbn10").value("0743273567"))
        .andExpect(jsonPath("$.publicationYear").value(2021))
        .andExpect(jsonPath("$.publicationMonth").value(5))
        .andExpect(jsonPath("$.distributorAuthorRoyaltyRate").value(0.75))
        .andExpect(jsonPath("$.handsoldAuthorRoyaltyRate").value(0.2));
  }

  @Test
  void updateBookPersistsAsin() throws Exception {
    Cookie token = login();
    Long bookId =
        createBook(
            token,
            new BookRequest(
                "Old Title",
                defaultAuthor.getId(),
                "9780743273565",
                null,
                2020,
                1,
                new BigDecimal("0.5"),
                new BigDecimal("0.2"),
                null,
                null,
                new BigDecimal("20.00"),
                new BigDecimal("5.00"),
                null));

    BookRequest updateRequest =
        new BookRequest(
            "Old Title",
            defaultAuthor.getId(),
            "9780743273565",
            null,
            2020,
            1,
            new BigDecimal("0.5"),
            new BigDecimal("0.2"),
            null,
            null,
            new BigDecimal("20.00"),
            new BigDecimal("5.00"),
            "B0ABC12345");

    mockMvc
        .perform(
            put("/api/books/{id}", bookId)
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.asin").value("B0ABC12345"));
  }

  @Test
  void updateBookClearsAsinWhenExplicitNull() throws Exception {
    Cookie token = login();

    Long bookId =
        createBook(
            token,
            new BookRequest(
                "Book With Asin",
                defaultAuthor.getId(),
                "9780743273565",
                null,
                2020,
                1,
                new BigDecimal("0.5"),
                new BigDecimal("0.2"),
                null,
                null,
                new BigDecimal("20.00"),
                new BigDecimal("5.00"),
                "B0ABC12345"));

    BookRequest updateRequest =
        new BookRequest(
            "Book With Asin Updated",
            defaultAuthor.getId(),
            "9780743273565",
            null,
            2021,
            2,
            new BigDecimal("0.5"),
            new BigDecimal("0.2"),
            null,
            null,
            new BigDecimal("20.00"),
            new BigDecimal("5.00"),
            null);

    mockMvc
        .perform(
            put("/api/books/{id}", bookId)
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Book With Asin Updated"))
        .andExpect(jsonPath("$.asin").value(nullValue()));
  }

  @Test
  void updateBookRejectsInvalidAsinWithBadRequest() throws Exception {
    Cookie token = login();

    Long bookId =
        createBook(
            token,
            new BookRequest(
                "Book",
                defaultAuthor.getId(),
                "9780743273565",
                null,
                2020,
                1,
                new BigDecimal("0.5"),
                new BigDecimal("0.2"),
                null,
                null,
                new BigDecimal("20.00"),
                new BigDecimal("5.00"),
                null));

    BookRequest updateRequest =
        new BookRequest(
            "Book",
            defaultAuthor.getId(),
            "9780743273565",
            null,
            2020,
            1,
            new BigDecimal("0.5"),
            new BigDecimal("0.2"),
            null,
            null,
            new BigDecimal("20.00"),
            new BigDecimal("5.00"),
            "BAD-ASIN");

    mockMvc
        .perform(
            put("/api/books/{id}", bookId)
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void deleteBookRemovesIt() throws Exception {
    Cookie token = login();
    Long bookId =
        createBook(
            token,
            new BookRequest(
                "Test Book",
                defaultAuthor.getId(),
                "9780743273565",
                null,
                2020,
                1,
                new BigDecimal("0.5"),
                new BigDecimal("0.2"),
                null,
                null,
                new BigDecimal("20.00"),
                new BigDecimal("5.00"),
                null));

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
    Author detailAuthor = createAuthor("Detail Author");
    Long bookId =
        createBook(
            token,
            buildBookRequest(
                "Detail Book",
                detailAuthor.getId(),
                "9780743279999",
                null,
                2020,
                1,
                new BigDecimal("0.5")));

    createSale(
        token,
        saleRequest(
            bookId, SaleSource.DISTRIBUTOR, 1, 2025, 10, new BigDecimal("1000.00"), true, null));

    createSale(
        token,
        saleRequest(
            bookId, SaleSource.DISTRIBUTOR, 2, 2025, 5, new BigDecimal("250.00"), false, null));

    mockMvc
        .perform(get("/api/books/{id}", bookId).cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(bookId))
        .andExpect(jsonPath("$.title").value("Detail Book"))
        .andExpect(jsonPath("$.author").value("Detail Author"))
        .andExpect(jsonPath("$.totalSalesToDate").value(15))
        .andExpect(jsonPath("$.revenue").value(1250.00))
        .andExpect(jsonPath("$.paidRoyalty").value(500.00))
        .andExpect(jsonPath("$.unpaidRoyalty").value(125.00))
        .andExpect(jsonPath("$.totalRoyalty").value(625.00));
  }

  @Test
  void searchBooksFindsIsbn10WithUppercaseXUsingLowercaseQuery() throws Exception {
    Cookie token = login();
    Author strunk = createAuthor("Strunk, William");
    mockMvc.perform(
        post("/api/books")
            .cookie(token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                objectMapper.writeValueAsString(
                    buildBookRequest(
                        "The Elements of Style",
                        strunk.getId(),
                        "9780205309023",
                        "080442957X",
                        1999,
                        1,
                        new BigDecimal("0.10")))));

    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "080442957x"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].isbn10").value("080442957X"));

    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "080442957X"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)));
  }

  @Test
  void searchBooksWithPeriodMatchesLiterally() throws Exception {
    Cookie token = login();
    Author tolkien = createAuthor("Tolkien, J.R.R.");
    Author murray = createAuthor("Murray, Bill");
    createBook(
        token,
        buildBookRequest(
            "The Hobbit", tolkien.getId(), "9780547928227", null, 1937, 9, new BigDecimal("0.5")));
    createBook(
        token,
        buildBookRequest(
            "Some Book", murray.getId(), "9780547928234", null, 2000, 1, new BigDecimal("0.5")));

    // "R.R." contains punctuation → literal match → only Tolkien
    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "R.R."))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].author").value("Tolkien, J.R.R."));

    // "rr" has no punctuation → lenient match → both Tolkien (jrr) and Murray (murray)
    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "rr"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(2)));
  }

  @Test
  void searchBooksWithApostropheMatchesLiterally() throws Exception {
    Cookie token = login();
    Author obrien = createAuthor("O'Brien, Flann");
    createBook(
        token,
        buildBookRequest(
            "At Swim", obrien.getId(), "9780141182681", null, 1939, 3, new BigDecimal("0.5")));

    // "O'Brien" contains punctuation → literal → matches
    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "O'Brien"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].author").value("O'Brien, Flann"));

    // "obrien" no punctuation → lenient → still matches (strips apostrophe from DB)
    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "obrien"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].author").value("O'Brien, Flann"));
  }

  @Test
  void searchBooksWithHyphenMatchesLiterally() throws Exception {
    Cookie token = login();
    Author sartre = createAuthor("Sartre, Jean-Paul");
    createBook(
        token,
        buildBookRequest(
            "Nausea", sartre.getId(), "9780811220309", null, 1938, 1, new BigDecimal("0.5")));

    // "Jean-Paul" contains punctuation → literal → matches
    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "Jean-Paul"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].author").value("Sartre, Jean-Paul"));

    // "jeanpaul" no punctuation → lenient → still matches (strips hyphen from DB)
    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "jeanpaul"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].author").value("Sartre, Jean-Paul"));
  }

  @Test
  void authorAutocompletePunctuationAware() throws Exception {
    Cookie token = login();
    Author tolkien = createAuthor("Tolkien, J.R.R.");
    Author murray = createAuthor("Murray, Bill");
    createBook(
        token,
        buildBookRequest(
            "The Hobbit", tolkien.getId(), "9780547928227", null, 1937, 9, new BigDecimal("0.5")));
    createBook(
        token,
        buildBookRequest(
            "Some Book", murray.getId(), "9780547928234", null, 2000, 1, new BigDecimal("0.5")));

    // "R.R." contains punctuation → literal match → only Tolkien
    mockMvc
        .perform(
            get("/api/books/authors").cookie(token).param("query", "R.R.").param("showAll", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].name").value("Tolkien, J.R.R."));

    // "rr" no punctuation → lenient match → both Tolkien (jrr) and Murray (murray)
    mockMvc
        .perform(
            get("/api/books/authors").cookie(token).param("query", "rr").param("showAll", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(2)));
  }

  // ---- Series tests ----

  @Test
  void createBookWithSeriesReturnsSeriesFields() throws Exception {
    Cookie token = login();
    BookRequest request =
        buildSeriesBookRequest(
            "Fellowship", defaultAuthor.getId(), "9780547928210", "Lord of the Rings", 1);

    mockMvc
        .perform(
            post("/api/books")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.seriesName").value("Lord of the Rings"))
        .andExpect(jsonPath("$.seriesPosition").value(1));
  }

  @Test
  void createBookAtPositionShiftsExistingBooks() throws Exception {
    Cookie token = login();
    createBook(
        token,
        buildSeriesBookRequest("Fellowship", defaultAuthor.getId(), "9780547928210", "LOTR", 1));
    createBook(
        token,
        buildSeriesBookRequest("Two Towers", defaultAuthor.getId(), "9780547928220", "LOTR", 2));

    // Insert at position 1 — should push Fellowship to 2 and Two Towers to 3
    createBook(
        token,
        buildSeriesBookRequest("Prequel", defaultAuthor.getId(), "9780547928230", "LOTR", 1));

    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "LOTR").param("showAll", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(3)));

    // Verify positions shifted: Prequel=1, Fellowship=2, Two Towers=3
    mockMvc
        .perform(
            get("/api/books")
                .cookie(token)
                .param("showAll", "true")
                .param("sortField", "seriesPosition")
                .param("sortDirection", "asc"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[?(@.title=='Prequel')].seriesPosition").value(1))
        .andExpect(jsonPath("$.content[?(@.title=='Fellowship')].seriesPosition").value(2))
        .andExpect(jsonPath("$.content[?(@.title=='Two Towers')].seriesPosition").value(3));
  }

  @Test
  void createBookSeriesPositionOutOfBoundsReturns400() throws Exception {
    Cookie token = login();
    // No books in series yet, so max position is 1
    BookRequest request =
        buildSeriesBookRequest("Book", defaultAuthor.getId(), "9780547928210", "New Series", 5);

    mockMvc
        .perform(
            post("/api/books")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.seriesPosition").exists());
  }

  @Test
  void createBookSeriesNameWithoutPositionReturns400() throws Exception {
    Cookie token = login();
    BookRequest request =
        new BookRequest(
            "Test Book",
            defaultAuthor.getId(),
            "9780547928210",
            null,
            2020,
            1,
            new BigDecimal("0.5"),
            new BigDecimal("0.2"),
            "Some Series",
            null,
            new BigDecimal("20.00"),
            new BigDecimal("5.00"),
            null);

    mockMvc
        .perform(
            post("/api/books")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void createBookSeriesPositionWithoutNameReturns400() throws Exception {
    Cookie token = login();
    BookRequest request =
        new BookRequest(
            "Test Book",
            defaultAuthor.getId(),
            "9780547928210",
            null,
            2020,
            1,
            new BigDecimal("0.5"),
            new BigDecimal("0.2"),
            null,
            3,
            new BigDecimal("20.00"),
            new BigDecimal("5.00"),
            null);

    mockMvc
        .perform(
            post("/api/books")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void deleteBookFromSeriesClosesGap() throws Exception {
    Cookie token = login();
    Long book1 =
        createBook(
            token,
            buildSeriesBookRequest(
                "Book 1", defaultAuthor.getId(), "9780547928210", "Series A", 1));
    Long book2 =
        createBook(
            token,
            buildSeriesBookRequest(
                "Book 2", defaultAuthor.getId(), "9780547928220", "Series A", 2));
    createBook(
        token,
        buildSeriesBookRequest("Book 3", defaultAuthor.getId(), "9780547928230", "Series A", 3));

    // Delete middle book
    mockMvc
        .perform(delete("/api/books/{id}", book2).cookie(token))
        .andExpect(status().isNoContent());

    // Book 3 should now be at position 2
    mockMvc
        .perform(get("/api/books/{id}", book1).cookie(token))
        .andExpect(jsonPath("$.seriesPosition").value(1));

    mockMvc
        .perform(
            get("/api/books")
                .cookie(token)
                .param("showAll", "true")
                .param("sortField", "seriesPosition")
                .param("sortDirection", "asc"))
        .andExpect(jsonPath("$.content[?(@.title=='Book 3')].seriesPosition").value(2));
  }

  @Test
  void updateBookAddSeriesToBookWithoutSeries() throws Exception {
    Cookie token = login();
    Long bookId =
        createBook(
            token,
            buildBookRequest(
                "Solo Book",
                defaultAuthor.getId(),
                "9780547928210",
                null,
                2020,
                1,
                new BigDecimal("0.5")));

    BookRequest updateRequest =
        buildSeriesBookRequest(
            "Solo Book", defaultAuthor.getId(), "9780547928210", "New Series", 1);

    mockMvc
        .perform(
            put("/api/books/{id}", bookId)
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.seriesName").value("New Series"))
        .andExpect(jsonPath("$.seriesPosition").value(1));
  }

  @Test
  void updateBookRemoveFromSeries() throws Exception {
    Cookie token = login();
    Long book1 =
        createBook(
            token,
            buildSeriesBookRequest("Book 1", defaultAuthor.getId(), "9780547928210", "Series", 1));
    createBook(
        token,
        buildSeriesBookRequest("Book 2", defaultAuthor.getId(), "9780547928220", "Series", 2));

    // Remove book1 from series
    BookRequest updateRequest =
        buildBookRequest(
            "Book 1", defaultAuthor.getId(), "9780547928210", null, 2020, 1, new BigDecimal("0.5"));

    mockMvc
        .perform(
            put("/api/books/{id}", book1)
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.seriesName").isEmpty())
        .andExpect(jsonPath("$.seriesPosition").isEmpty());

    // Book 2 should shift to position 1
    mockMvc
        .perform(get("/api/books").cookie(token).param("showAll", "true"))
        .andExpect(jsonPath("$.content[?(@.title=='Book 2')].seriesPosition").value(1));
  }

  @Test
  void updateBookMoveWithinSeries() throws Exception {
    Cookie token = login();
    createBook(
        token,
        buildSeriesBookRequest("Book 1", defaultAuthor.getId(), "9780547928210", "Series", 1));
    Long book2 =
        createBook(
            token,
            buildSeriesBookRequest("Book 2", defaultAuthor.getId(), "9780547928220", "Series", 2));
    createBook(
        token,
        buildSeriesBookRequest("Book 3", defaultAuthor.getId(), "9780547928230", "Series", 3));

    // Move book 2 to position 1
    BookRequest updateRequest =
        buildSeriesBookRequest("Book 2", defaultAuthor.getId(), "9780547928220", "Series", 1);

    mockMvc
        .perform(
            put("/api/books/{id}", book2)
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.seriesPosition").value(1));

    // Book 1 should now be at position 2
    mockMvc
        .perform(
            get("/api/books")
                .cookie(token)
                .param("showAll", "true")
                .param("sortField", "seriesPosition")
                .param("sortDirection", "asc"))
        .andExpect(jsonPath("$.content[?(@.title=='Book 2')].seriesPosition").value(1))
        .andExpect(jsonPath("$.content[?(@.title=='Book 1')].seriesPosition").value(2))
        .andExpect(jsonPath("$.content[?(@.title=='Book 3')].seriesPosition").value(3));
  }

  @Test
  void searchSeriesEndpointReturnsMatchingNames() throws Exception {
    Cookie token = login();
    createBook(
        token,
        buildSeriesBookRequest(
            "Book 1", defaultAuthor.getId(), "9780547928210", "Harry Potter", 1));
    createBook(
        token,
        buildSeriesBookRequest(
            "Book 2", defaultAuthor.getId(), "9780547928220", "Lord of the Rings", 1));

    mockMvc
        .perform(get("/api/books/series").cookie(token).param("query", "Harry"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0]").value("Harry Potter"));
  }

  @Test
  void searchSeriesEndpointReturnsAllWhenNoQuery() throws Exception {
    Cookie token = login();
    createBook(
        token,
        buildSeriesBookRequest(
            "Book 1", defaultAuthor.getId(), "9780547928210", "Alpha Series", 1));
    createBook(
        token,
        buildSeriesBookRequest("Book 2", defaultAuthor.getId(), "9780547928220", "Beta Series", 1));

    mockMvc
        .perform(get("/api/books/series").cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(2)));
  }

  @Test
  void searchBooksFindsSeriesName() throws Exception {
    Cookie token = login();
    createBook(
        token,
        buildSeriesBookRequest(
            "The Hobbit", defaultAuthor.getId(), "9780547928210", "Middle Earth", 1));
    createBook(
        token,
        buildBookRequest(
            "Unrelated Book",
            defaultAuthor.getId(),
            "9780547928220",
            null,
            2020,
            1,
            new BigDecimal("0.5")));

    mockMvc
        .perform(get("/api/books").cookie(token).param("query", "Middle Earth"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].title").value("The Hobbit"));
  }

  @Test
  void createBookWithNonExistentAuthorReturns400() throws Exception {
    BookRequest request =
        new BookRequest(
            "Test Book",
            99999L,
            "9780743273565",
            null,
            2020,
            1,
            new BigDecimal("0.5"),
            new BigDecimal("0.2"),
            null,
            null,
            new BigDecimal("20.00"),
            new BigDecimal("5.00"),
            null);

    mockMvc
        .perform(
            post("/api/books")
                .cookie(login())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
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
        SaleDistributor.OTHER,
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
}
