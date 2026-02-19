package edu.duke.bookpublishing.config;

import com.opencsv.CSVReader;
import edu.duke.bookpublishing.author.Author;
import edu.duke.bookpublishing.author.AuthorRepository;
import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.common.StringUtils;
import edu.duke.bookpublishing.sales.Sale;
import edu.duke.bookpublishing.sales.SaleRepository;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class DataSeeder implements CommandLineRunner {

  private final AuthorRepository authorRepository;
  private final BookRepository bookRepository;
  private final SaleRepository saleRepository;

  @Override
  public void run(String... args) throws Exception {
    if (bookRepository.count() > 0) {
      log.info("Books already exist, skipping data seeding");
      return;
    }

    Map<String, Book> isbnToBook = seedBooks();
    int salesCount = seedSales(isbnToBook);

    log.info("Seeded {} books and {} sales records", isbnToBook.size(), salesCount);
  }

  private Map<String, Book> seedBooks() throws Exception {
    Map<String, Book> isbnToBook = new HashMap<>();
    Map<String, Author> authorCache = new HashMap<>();
    ClassPathResource resource = new ClassPathResource("seed/books.csv");

    try (CSVReader reader = new CSVReader(new InputStreamReader(resource.getInputStream()))) {
      reader.readNext();
      String[] line;
      while ((line = reader.readNext()) != null) {
        String title = line[0];
        String authorName = StringUtils.normalizeWhitespace(line[1]);
        String isbn13 = line[2];
        String isbn10 = line[3];
        String publicationDate = line[4];
        String royaltyPercent = line[5];

        Author author =
            authorCache.computeIfAbsent(
                authorName,
                name ->
                    authorRepository.save(
                        Author.builder()
                            .name(name)
                            .email(
                                name.toLowerCase().replaceAll("[^a-z0-9]", "") + "@placeholder.com")
                            .build()));

        String[] dateParts = publicationDate.split("/");
        int month = Integer.parseInt(dateParts[0]);
        int year = Integer.parseInt(dateParts[1]);
        Book book =
            Book.builder()
                .title(title)
                .author(author)
                .isbn13(isbn13)
                .isbn10(isbn10)
                .publicationMonth(month)
                .publicationYear(year)
                .royaltyRate(new BigDecimal(royaltyPercent))
                .build();

        book = bookRepository.save(book);
        isbnToBook.put(isbn13, book);
      }
    }

    return isbnToBook;
  }

  private int seedSales(Map<String, Book> isbnToBook) throws Exception {
    int count = 0;
    ClassPathResource resource = new ClassPathResource("seed/records.csv");

    try (CSVReader reader = new CSVReader(new InputStreamReader(resource.getInputStream()))) {
      reader.readNext();
      String[] line;
      while ((line = reader.readNext()) != null) {
        String isbn13 = line[0];
        String recordDate = line[1];
        int unitsSold = Integer.parseInt(line[2]);
        BigDecimal totalRevenue = new BigDecimal(line[3]);
        BigDecimal royaltyTotal = new BigDecimal(line[4]);
        boolean royaltyPaid = "y".equalsIgnoreCase(line[5]);

        Book book = isbnToBook.get(isbn13);
        if (book == null) {
          log.warn("No book found for ISBN {}, skipping sale record", isbn13);
          continue;
        }

        String[] dateParts = recordDate.split("/");
        int month = Integer.parseInt(dateParts[0]);
        int year = Integer.parseInt(dateParts[1]);
        Sale sale =
            Sale.builder()
                .book(book)
                .saleMonth(month)
                .saleYear(year)
                .quantitySold(unitsSold)
                .publisherRevenue(totalRevenue)
                .authorRoyalty(royaltyTotal)
                .hasAuthorBeenPaid(royaltyPaid)
                .build();

        saleRepository.save(sale);
        count++;
      }
    }

    return count;
  }
}
