package edu.duke.bookpublishing.config;

import com.opencsv.CSVReader;
import edu.duke.bookpublishing.author.Author;
import edu.duke.bookpublishing.author.AuthorRepository;
import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.books.cover.CoverService;
import edu.duke.bookpublishing.common.StringUtils;
import edu.duke.bookpublishing.currency.CurrencyService;
import edu.duke.bookpublishing.sales.Sale;
import edu.duke.bookpublishing.sales.SaleRepository;
import edu.duke.bookpublishing.sales.enums.Currency;
import edu.duke.bookpublishing.sales.enums.SaleDistributor;
import edu.duke.bookpublishing.sales.enums.SaleFormat;
import edu.duke.bookpublishing.sales.enums.SaleSource;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
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
  private final CoverService coverService;
  private final CurrencyService currencyService;

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
    ClassPathResource resource = new ClassPathResource("ev3-sample-data/books.csv");

    try (CSVReader reader = new CSVReader(new InputStreamReader(resource.getInputStream()))) {
      reader.readNext(); // skip header
      String[] line;
      while ((line = reader.readNext()) != null) {
        if (line.length < 5 || emptyToNull(line[0]) == null) continue;
        // Ev3 format: title,author,series_name,series_index,isbn13,isbn10,asin,
        //   publish_date,print_cost,cover_price,royalty_percent_distribution,
        //   royalty_percent_handsold,cover_image
        String title = line[0];
        String authorName = StringUtils.normalizeWhitespace(line[1]);
        String seriesName = emptyToNull(getValue(line, 2));
        Integer seriesPosition = parseInteger(getValue(line, 3));
        String isbn13 = line[4];
        String isbn10 = emptyToNull(getValue(line, 5));
        String asin = emptyToNull(getValue(line, 6));
        String publicationDate = getValue(line, 7); // YYYY/MM
        BigDecimal printCost = parseBigDecimal(getValue(line, 8), BigDecimal.ZERO);
        BigDecimal coverPrice = parseBigDecimal(getValue(line, 9), BigDecimal.ZERO);
        BigDecimal distributorRoyaltyRate =
            parseBigDecimal(getValue(line, 10), new BigDecimal("50")).divide(new BigDecimal("100"));
        BigDecimal handsoldRoyaltyRate =
            parseBigDecimal(getValue(line, 11), new BigDecimal("20")).divide(new BigDecimal("100"));
        String coverImageFilename = emptyToNull(getValue(line, 12));

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
        int year = Integer.parseInt(dateParts[0]);
        int month = Integer.parseInt(dateParts[1]);

        Book book =
            Book.builder()
                .title(title)
                .author(author)
                .isbn13(isbn13)
                .isbn10(isbn10)
                .amazonEbookAsin(asin)
                .publicationMonth(month)
                .publicationYear(year)
                .distributorAuthorRoyaltyRate(distributorRoyaltyRate)
                .handsoldAuthorRoyaltyRate(handsoldRoyaltyRate)
                .seriesName(seriesName)
                .seriesPosition(seriesPosition)
                .coverPrice(coverPrice)
                .printCost(printCost)
                .build();

        book = bookRepository.save(book);

        if (coverImageFilename != null) {
          try {
            byte[] imageBytes = loadCoverImage(coverImageFilename);
            if (imageBytes != null) {
              String contentType = getContentTypeFromFilename(coverImageFilename);
              coverService.processAndStore(book, imageBytes, contentType);
              book = bookRepository.save(book);
            }
          } catch (Exception e) {
            log.warn("Failed to process cover image for {}: {}", title, e.getMessage());
          }
        }

        isbnToBook.put(isbn13, book);
        if (isbn10 != null && !isbn10.isBlank()) {
          isbnToBook.put(isbn10, book);
        }
        if (asin != null && !asin.isBlank()) {
          isbnToBook.put(asin, book);
        }
      }
    }

    return isbnToBook;
  }

  private int seedSales(Map<String, Book> isbnToBook) throws Exception {
    int count = 0;
    ClassPathResource resource = new ClassPathResource("ev3-sample-data/records.csv");

    try (CSVReader reader = new CSVReader(new InputStreamReader(resource.getInputStream()))) {
      reader.readNext(); // skip header
      String[] line;
      while ((line = reader.readNext()) != null) {
        if (line.length < 5 || emptyToNull(line[0]) == null) continue;
        // Ev3 format: record_date,source,distributor,format,isbn13,qty_sold,kenp,
        //   publisher_revenue,iso_currency,author_paid
        String recordDate = line[0]; // YYYY/MM
        SaleSource saleSource = parseSaleSource(line[1]);
        SaleDistributor distributor = parseDistributor(getValue(line, 2));
        SaleFormat format = parseFormat(getValue(line, 3));
        String isbn = line[4];
        Integer qtySold = parseInteger(getValue(line, 5));
        Integer kenp = parseInteger(getValue(line, 6));
        String revenueStr = emptyToNull(getValue(line, 7));
        Currency currency = parseCurrency(getValue(line, 8));
        boolean royaltyPaid = "y".equalsIgnoreCase(getValue(line, 9));

        Book book = isbnToBook.get(isbn);
        if (book == null) {
          log.warn("No book found for ISBN {}, skipping sale record", isbn);
          continue;
        }

        String[] dateParts = recordDate.split("/");
        int year = Integer.parseInt(dateParts[0]);
        int month = Integer.parseInt(dateParts[1]);

        boolean isHandsold = saleSource == SaleSource.HAND_SOLD;
        boolean isKU = format == SaleFormat.KINDLE_UNLIMITED;

        BigDecimal originalRevenue;
        if (isHandsold) {
          int qty = qtySold != null ? qtySold : 0;
          originalRevenue =
              book.getCoverPrice().subtract(book.getPrintCost()).multiply(BigDecimal.valueOf(qty));
        } else {
          originalRevenue = revenueStr != null ? new BigDecimal(revenueStr) : BigDecimal.ZERO;
        }

        BigDecimal publisherRevenueUsd;
        if (currency == Currency.USD || isHandsold) {
          publisherRevenueUsd = originalRevenue;
        } else {
          try {
            publisherRevenueUsd = currencyService.convert(currency.name(), "USD", originalRevenue);
          } catch (Exception e) {
            log.warn(
                "Currency conversion failed for {}, using original value: {}",
                currency,
                e.getMessage());
            publisherRevenueUsd = originalRevenue;
          }
        }

        BigDecimal authorRate =
            isHandsold
                ? book.getHandsoldAuthorRoyaltyRate()
                : book.getDistributorAuthorRoyaltyRate();
        BigDecimal authorRoyalty =
            publisherRevenueUsd.multiply(authorRate).setScale(2, RoundingMode.HALF_UP);

        Sale sale =
            Sale.builder()
                .book(book)
                .saleSource(saleSource)
                .distributor(isHandsold ? null : distributor)
                .format(format)
                .saleMonth(month)
                .saleYear(year)
                .quantitySold(isKU ? null : qtySold)
                .kenp(isKU ? kenp : null)
                .saleCurrency(currency)
                .originalPublisherRevenue(originalRevenue)
                .publisherRevenue(publisherRevenueUsd)
                .authorRoyalty(authorRoyalty)
                .hasAuthorBeenPaid(royaltyPaid)
                .build();

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
    if (value == null) return null;
    if ("handsold".equalsIgnoreCase(value) || "hand_sold".equalsIgnoreCase(value)) {
      return SaleSource.HAND_SOLD;
    }
    return SaleSource.DISTRIBUTOR;
  }

  private static SaleDistributor parseDistributor(String raw) {
    String value = emptyToNull(raw);
    if (value == null) return null;
    return switch (value.toLowerCase().replaceAll("[\\s_]", "")) {
      case "ingramspark" -> SaleDistributor.INGRAM_SPARK;
      case "amazon" -> SaleDistributor.AMAZON;
      default -> SaleDistributor.OTHER;
    };
  }

  private static SaleFormat parseFormat(String raw) {
    String value = emptyToNull(raw);
    if (value == null) return SaleFormat.PRINT;
    return switch (value.toLowerCase().replaceAll("[\\s_]", "")) {
      case "ebook" -> SaleFormat.EBOOK;
      case "kindleunlimited" -> SaleFormat.KINDLE_UNLIMITED;
      default -> SaleFormat.PRINT;
    };
  }

  private static Currency parseCurrency(String raw) {
    String value = emptyToNull(raw);
    if (value == null) return Currency.USD;
    try {
      return Currency.valueOf(value.toUpperCase());
    } catch (IllegalArgumentException e) {
      return Currency.USD;
    }
  }

  private static byte[] loadCoverImage(String filename) {
    try {
      // JXL (JPEG XL) is not supported by CoverService, so use JPG fallback
      String actualFilename = filename;

      ClassPathResource resource = new ClassPathResource("ev3-sample-data/" + actualFilename);
      if (!resource.exists()) {
        log.warn("Cover image not found: {}", actualFilename);
        return null;
      }
      return resource.getInputStream().readAllBytes();
    } catch (Exception e) {
      log.warn("Failed to load cover image {}: {}", filename, e.getMessage());
      return null;
    }
  }

  private static String getContentTypeFromFilename(String filename) {

    String lowerFilename = filename.toLowerCase();
    if (lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg")) {
      return "image/jpeg";
    } else if (lowerFilename.endsWith(".png")) {
      return "image/png";
    } else if (lowerFilename.endsWith(".gif")) {
      return "image/gif";
    } else if (lowerFilename.endsWith(".webp")) {
      return "image/webp";
    }
    throw new IllegalArgumentException("Unsupported image type: " + filename);
  }
}
