package edu.duke.bookpublishing.sales;

import static org.assertj.core.api.Assertions.assertThat;

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

  @Autowired private BookRepository bookRepository;

  @Autowired private SaleRepository saleRepository;

  @Autowired private EntityManager entityManager;

  @Test
  @DisplayName("Deleting a Book also deletes its Sales (ON DELETE CASCADE)")
  void deletingBookAlsoDeletesSales() {
    // arrange: create and save a book
    Book book =
        Book.builder()
            .title("Test Book")
            .author("Test Author")
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

    // arrange: create and save a couple of sales for this book
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

    // act: delete the book
    bookRepository.delete(book);

    // make sure changes hit the DB
    bookRepository.flush();
    entityManager.clear();

    // assert: all sales for that book should be gone
    assertThat(saleRepository.count()).isZero();
  }
}
