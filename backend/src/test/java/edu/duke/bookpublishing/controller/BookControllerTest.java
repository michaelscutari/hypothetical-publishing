package edu.duke.bookpublishing.controller;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.duke.bookpublishing.dto.BookRequest;
import edu.duke.bookpublishing.repository.BookRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class BookControllerTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Autowired private BookRepository bookRepository;

  @BeforeEach
  void setUp() {
    bookRepository.deleteAll();
  }

  @Test
  void getAllBooksReturnsEmptyList() throws Exception {
    mockMvc.perform(get("/api/books")).andExpect(status().isOk()).andExpect(content().json("[]"));
  }

  @Test
  void getAllBooksReturnsBooks() throws Exception {
    BookRequest request =
        new BookRequest(
            "Test Book",
            "Test Author",
            "9780743273565",
            null,
            LocalDate.of(2020, 1, 15),
            new BigDecimal("0.5"));

    mockMvc.perform(
        post("/api/books")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)));

    mockMvc
        .perform(get("/api/books"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].title").value("Test Book"));
  }

  @Test
  void getBooksReturnsDateInIsoFormat() throws Exception {
    BookRequest request =
        new BookRequest(
            "Test Book",
            "Test Author",
            "9780743273565",
            null,
            LocalDate.of(2024, 1, 15),
            new BigDecimal("0.5"));

    mockMvc.perform(
        post("/api/books")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)));

    mockMvc
        .perform(get("/api/books"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].publicationDate").value("2024-01-01"))
        .andExpect(jsonPath("$[0].publicationDate").isString());
  }

  @Test
  void createBookReturnsCreatedBook() throws Exception {
    BookRequest request =
        new BookRequest(
            "The Great Gatsby",
            "Fitzgerald, F. Scott",
            "978-0-7432-7356-5",
            "0-7432-7356-7",
            LocalDate.of(1925, 4, 10),
            new BigDecimal("0.15"));

    mockMvc
        .perform(
            post("/api/books")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").isNumber())
        .andExpect(jsonPath("$.title").value("The Great Gatsby"))
        .andExpect(jsonPath("$.author").value("Fitzgerald, F. Scott"))
        .andExpect(jsonPath("$.isbn13").value("9780743273565"))
        .andExpect(jsonPath("$.isbn10").value("0743273567"))
        .andExpect(jsonPath("$.publicationDate").value("1925-04-01"))
        .andExpect(jsonPath("$.royaltyRate").value(0.15));
  }

  @Test
  void createBookUsesDefaultRoyaltyRate() throws Exception {
    BookRequest request =
        new BookRequest(
            "Test Book", "Test Author", "9780743273565", null, LocalDate.of(2020, 1, 15), null);

    mockMvc
        .perform(
            post("/api/books")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.royaltyRate").value(0.5));
  }

  @Test
  void createBookValidationErrorMissingTitle() throws Exception {
    BookRequest request =
        new BookRequest(
            null,
            "Test Author",
            "9780743273565",
            null,
            LocalDate.of(2020, 1, 15),
            new BigDecimal("0.5"));

    mockMvc
        .perform(
            post("/api/books")
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
            "Test Author",
            "978074327356X",
            null,
            LocalDate.of(2020, 1, 15),
            new BigDecimal("0.5"));

    mockMvc
        .perform(
            post("/api/books")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.isbn13").value("Invalid ISBN-13 format"));
  }

  @Test
  void createBookDuplicateIsbnReturns409() throws Exception {
    BookRequest request =
        new BookRequest(
            "Book One",
            "Author One",
            "9780743273565",
            null,
            LocalDate.of(2020, 1, 15),
            new BigDecimal("0.5"));

    mockMvc
        .perform(
            post("/api/books")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated());

    BookRequest duplicateRequest =
        new BookRequest(
            "Book Two",
            "Author Two",
            "9780743273565",
            null,
            LocalDate.of(2021, 5, 20),
            new BigDecimal("0.3"));

    mockMvc
        .perform(
            post("/api/books")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicateRequest)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.isbn13").exists());
  }
}
