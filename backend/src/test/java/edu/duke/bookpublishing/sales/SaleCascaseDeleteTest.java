package edu.duke.bookpublishing.sales;

import static org.assertj.core.api.Assertions.assertThat;

import edu.duke.bookpublishing.author.Author;
import edu.duke.bookpublishing.author.AuthorRepository;
import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.sales.enums.SaleSource;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
class SaleCascadeDeleteTest {

  @Autowired private AuthorRepository authorRepository;

  @Autowired private BookRepository bookRepository;

  @Autowired private SaleRepository saleRepository;

  @Autowired private EntityManager entityManager;

  @Test
  @DisplayName("Deleting a Book also deletes its Sales (ON DELETE CASCADE)")
  void deletingBookAlsoDeletesSales() {
    Author author =
        authorRepository.saveAndFlush(
            Author.builder().name("Test Author").email("test@example.com").build());

    Book book =
        Book.builder()
            .title("Test Book")
            .author(author)
            .isbn13("1234567890123")
            .isbn10("1234567890")
            .publicationYear(2024)
            .publicationMonth(1)
            .distributorAuthorRoyaltyRate(new BigDecimal("0.1000"))
            .handsoldAuthorRoyaltyRate(new BigDecimal("0.0500"))
            .coverPrice(new BigDecimal("20.00"))
            .printCost(new BigDecimal("5.00"))
            .build();

    book = bookRepository.saveAndFlush(book);

    Sale sale1 =
        Sale.builder()
            .book(book)
            .saleSource(SaleSource.DISTRIBUTOR)
            .saleMonth(1)
            .saleYear(2024)
            .quantitySold(10)
            .publisherRevenue(new BigDecimal("100.00"))
            .authorRoyalty(new BigDecimal("10.00"))
            .hasAuthorBeenPaid(false)
            .build();

    Sale sale2 =
        Sale.builder()
            .book(book)
            .saleSource(SaleSource.DISTRIBUTOR)
            .saleMonth(2)
            .saleYear(2024)
            .quantitySold(5)
            .publisherRevenue(new BigDecimal("50.00"))
            .authorRoyalty(new BigDecimal("5.00"))
            .hasAuthorBeenPaid(false)
            .build();

    saleRepository.save(sale1);
    saleRepository.save(sale2);
    saleRepository.flush();

    assertThat(saleRepository.count()).isEqualTo(2L);

    bookRepository.delete(book);

    bookRepository.flush();
    entityManager.clear();

    assertThat(saleRepository.count()).isZero();
  }
}
