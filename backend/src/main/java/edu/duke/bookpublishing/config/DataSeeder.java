package edu.duke.bookpublishing.config;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import com.opencsv.CSVReader;
import edu.duke.bookpublishing.author.Author;
import edu.duke.bookpublishing.author.AuthorRepository;
import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.common.StringUtils;
import edu.duke.bookpublishing.sales.Sale;
import edu.duke.bookpublishing.sales.SaleRepository;
import edu.duke.bookpublishing.sales.enums.SaleSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
    ClassPathResource resource = new ClassPathResource("ev2-sample-data/books.csv");

    try (CSVReader reader = new CSVReader(new InputStreamReader(resource.getInputStream()))) {
      reader.readNext();
      String[] line;
      while ((line = reader.readNext()) != null) {
        String title = line[0];
        String authorName = StringUtils.normalizeWhitespace(line[1]);
        String seriesName = emptyToNull(getValue(line, 2));
        Integer seriesPosition = parseInteger(getValue(line, 3));
        String isbn13 = line[4];
        String isbn10 = emptyToNull(line[5]);
        String publicationDate = line[6];
        BigDecimal distributorRoyaltyRate =
            parseBigDecimal(getValue(line, 7), new BigDecimal("0.5")).divide(new BigDecimal("100"));
        BigDecimal handsoldRoyaltyRate =
            parseBigDecimal(getValue(line, 8), new BigDecimal("0.2")).divide(new BigDecimal("100"));
        BigDecimal coverPrice = parseBigDecimal(getValue(line, 9), BigDecimal.ZERO);
        BigDecimal printCost = parseBigDecimal(getValue(line, 10), BigDecimal.ZERO);
        String coverImageFilename = emptyToNull(getValue(line, 11));

        byte[] coverImageBytes = null;
        if (coverImageFilename != null) {
          coverImageBytes = loadCoverImage(coverImageFilename);
        }

        Author author = authorCache.computeIfAbsent(authorName,
            name -> authorRepository.save(Author.builder().name(name)
                .email(name.toLowerCase().replaceAll("[^a-z0-9]", "") + "@placeholder.com")
                .build()));

        String[] dateParts = publicationDate.split(" ");
        int month = parseMonth(dateParts[0]);
        int year = Integer.parseInt(dateParts[1]);
        Book book = Book.builder().title(title).author(author).isbn13(isbn13).isbn10(isbn10)
            .publicationMonth(month).publicationYear(year)
            .distributorAuthorRoyaltyRate(distributorRoyaltyRate)
            .handsoldAuthorRoyaltyRate(handsoldRoyaltyRate).seriesName(seriesName)
            .seriesPosition(seriesPosition).coverPrice(coverPrice).printCost(printCost)
            .coverImage(coverImageBytes).build();

        book = bookRepository.save(book);
        isbnToBook.put(isbn13, book);
        if (isbn10 != null && !isbn10.isBlank()) {
          isbnToBook.put(isbn10, book);
        }
      }
    }

    return isbnToBook;
  }

  private int seedSales(Map<String, Book> isbnToBook) throws Exception {
    int count = 0;
    ClassPathResource resource = new ClassPathResource("ev2-sample-data/sales_records.csv");

    try (CSVReader reader = new CSVReader(new InputStreamReader(resource.getInputStream()))) {
      reader.readNext();
      String[] line;
      while ((line = reader.readNext()) != null) {
        String isbn = line[0];
        SaleSource saleSource = parseSaleSource(line[1]);
        String recordDate = line[2];
        int unitsSold = Integer.parseInt(line[3]);
        String totalRevenueStr = emptyToNull(getValue(line, 4));
        boolean royaltyPaid = "y".equalsIgnoreCase(getValue(line, 5));
        String comment = emptyToNull(getValue(line, 6));

        Book book = isbnToBook.get(isbn);
        if (book == null) {
          log.warn("No book found for ISBN {}, skipping sale record", isbn);
          continue;
        }

        String[] dateParts = recordDate.split(" ");
        int month = parseMonth(dateParts[0]);
        int year = Integer.parseInt(dateParts[1]);

        BigDecimal publisherRevenue;
        if (saleSource == SaleSource.HAND_SOLD || totalRevenueStr == null) {
          publisherRevenue = book.getCoverPrice().subtract(book.getPrintCost())
              .multiply(BigDecimal.valueOf(unitsSold));
        } else {
          publisherRevenue = new BigDecimal(totalRevenueStr);
        }

        BigDecimal authorRate =
            saleSource == SaleSource.HAND_SOLD ? book.getHandsoldAuthorRoyaltyRate()
                : book.getDistributorAuthorRoyaltyRate();
        BigDecimal authorRoyalty =
            publisherRevenue.multiply(authorRate).setScale(2, RoundingMode.HALF_UP);

        Sale sale = Sale.builder().book(book)
            .saleSource(saleSource != null ? saleSource : SaleSource.DISTRIBUTOR).saleMonth(month)
            .saleYear(year).quantitySold(unitsSold).publisherRevenue(publisherRevenue)
            .authorRoyalty(authorRoyalty).hasAuthorBeenPaid(royaltyPaid).comment(comment).build();

        saleRepository.save(sale);
        count++;
      }
    }

    return count;
  }

  private static String getValue(String[] row, int index) {
    return index < row.length ? row[index] : null;
  }

  private static String emptyToNull(String raw) {
    return raw == null || raw.isBlank() ? null : raw;
  }

  private static BigDecimal parseBigDecimal(String raw, BigDecimal fallback) {
    String value = emptyToNull(raw);
    return value == null ? fallback : new BigDecimal(value);
  }

  private static Integer parseInteger(String raw) {
    String value = emptyToNull(raw);
    return value == null ? null : Integer.valueOf(value);
  }

  private static SaleSource parseSaleSource(String raw) {
    String value = emptyToNull(raw);
    if (value == null) {
      return null;
    }
    if ("handsold".equalsIgnoreCase(value) || "hand_sold".equalsIgnoreCase(value)) {
      return SaleSource.HAND_SOLD;
    }
    return SaleSource.DISTRIBUTOR;
  }

  private static int parseMonth(String monthName) {
    return switch (monthName.toLowerCase()) {
      case "january" -> 1;
      case "february" -> 2;
      case "march" -> 3;
      case "april" -> 4;
      case "may" -> 5;
      case "june" -> 6;
      case "july" -> 7;
      case "august" -> 8;
      case "september" -> 9;
      case "october" -> 10;
      case "november" -> 11;
      case "december" -> 12;
      default -> throw new IllegalArgumentException("Invalid month name: " + monthName);
    };
  }

  private static byte[] loadCoverImage(String filename) {
    try {
      ClassPathResource resource = new ClassPathResource("ev2-sample-data/" + filename);
      if (!resource.exists()) {
        // If JXL file doesn't exist, try fallback to JPG
        if (filename.endsWith(".jxl")) {
          String jpgFilename = filename.replace(".jxl", ".jpg");
          resource = new ClassPathResource("ev2-sample-data/" + jpgFilename);
          if (!resource.exists()) {
            log.warn("Cover image not found: {} (tried JXL and JPG fallback)", filename);
            return null;
          }
        } else {
          log.warn("Cover image not found: {}", filename);
          return null;
        }
      }
      return resource.getInputStream().readAllBytes();
    } catch (Exception e) {
      log.warn("Failed to load cover image {}: {}", filename, e.getMessage());
      return null;
    }
  }
}
