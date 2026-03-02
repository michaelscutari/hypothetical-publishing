package edu.duke.bookpublishing.books.lookup;

import com.fasterxml.jackson.databind.JsonNode;
import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookRepository;
import edu.duke.bookpublishing.books.dto.BookLookupResponse;
import edu.duke.bookpublishing.exception.custom.NotFoundException;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookLookupService {

  private final BookRepository bookRepository;
  private final OpenLibraryClient openLibraryClient;

  public BookLookupResult lookupByIsbn(String isbn) {
    if (isbn == null || isbn.isBlank()) {
      throw new IllegalArgumentException("ISBN is required");
    }

    String normalized = normalizeIsbn(isbn);
    boolean isIsbn13 = isIsbn13(normalized);
    boolean isIsbn10 = isIsbn10(normalized);
    if (!isIsbn13 && !isIsbn10) {
      throw new IllegalArgumentException("Invalid ISBN format");
    }
    if (isIsbn13 && !isValidIsbn13Checksum(normalized)) {
      throw new IllegalArgumentException("Invalid ISBN checksum");
    }
    if (isIsbn10 && !isValidIsbn10Checksum(normalized)) {
      throw new IllegalArgumentException("Invalid ISBN checksum");
    }

    Optional<Book> existing =
        findExistingByIdentifiers(isIsbn13 ? normalized : null, isIsbn10 ? normalized : null);
    if (existing.isPresent()) {
      return BookLookupResult.existing(existing.get());
    }

    JsonNode root = openLibraryClient.fetchByIsbn(normalized);
    String key = "ISBN:" + normalized;
    JsonNode record = root.path(key);
    if (record.isMissingNode() || record.isNull() || record.isEmpty()) {
      throw new NotFoundException("Book not found");
    }

    String title = textOrNull(record.path("title"));
    String author = joinAuthors(record.path("authors"));

    JsonNode identifiers = record.path("identifiers");
    String isbn13 = extractArrayIdentifier(identifiers, "isbn_13");
    String isbn10 = extractArrayIdentifier(identifiers, "isbn_10");
    if (isbn13 == null && isIsbn13) {
      isbn13 = normalized;
    }
    if (isbn10 == null && isIsbn10) {
      isbn10 = normalized;
    }

    Optional<Book> existingByIdentifiers = findExistingByIdentifiers(isbn13, isbn10);
    if (existingByIdentifiers.isPresent()) {
      return BookLookupResult.existing(existingByIdentifiers.get());
    }

    PublishedDate publishedDate = parsePublishedDate(textOrNull(record.path("publish_date")));

    String coverIsbn = isbn13 != null ? isbn13 : isbn10;
    String coverImageUrl =
        coverIsbn != null
            ? "https://covers.openlibrary.org/b/isbn/" + coverIsbn + "-L.jpg?default=false"
            : null;

    BookLookupResponse response =
        new BookLookupResponse(
            title,
            author,
            isbn13,
            isbn10,
            publishedDate.year(),
            publishedDate.month(),
            coverImageUrl);

    return BookLookupResult.lookup(response);
  }

  private String normalizeIsbn(String raw) {
    return raw.replaceAll("-", "").replaceAll("\\s+", "").toUpperCase(Locale.US);
  }

  private boolean isIsbn13(String isbn) {
    return isbn.matches("^\\d{13}$");
  }

  private boolean isIsbn10(String isbn) {
    return isbn.matches("^\\d{9}[\\dX]$");
  }

  private String joinAuthors(JsonNode authorsNode) {
    if (!authorsNode.isArray() || authorsNode.isEmpty()) {
      return null;
    }
    StringBuilder builder = new StringBuilder();
    for (int i = 0; i < authorsNode.size(); i++) {
      JsonNode authorNode = authorsNode.get(i);
      String name =
          authorNode.isObject() ? textOrNull(authorNode.path("name")) : authorNode.asText();
      if (name == null || name.isBlank()) {
        continue;
      }
      if (builder.length() > 0) {
        builder.append(", ");
      }
      builder.append(name);
    }
    return builder.length() == 0 ? null : builder.toString();
  }

  private String extractArrayIdentifier(JsonNode identifiers, String key) {
    JsonNode list = identifiers.path(key);
    if (!list.isArray() || list.isEmpty()) {
      return null;
    }
    String rawIdentifier = list.get(0).asText();
    if (rawIdentifier == null || rawIdentifier.isBlank()) {
      return null;
    }
    return normalizeIsbn(rawIdentifier);
  }

  private String textOrNull(JsonNode node) {
    return node.isMissingNode() || node.isNull() ? null : node.asText();
  }

  private PublishedDate parsePublishedDate(String raw) {
    if (raw == null || raw.isBlank()) {
      return new PublishedDate(null, null);
    }
    Matcher matcher = Pattern.compile("^(\\d{4})(?:-(\\d{1,2}))?(?:-\\d{1,2})?$").matcher(raw);
    if (matcher.matches()) {
      Integer year = Integer.valueOf(matcher.group(1));
      Integer month = matcher.group(2) != null ? Integer.valueOf(matcher.group(2)) : null;
      if (month != null && (month < 1 || month > 12)) {
        month = null;
      }
      return new PublishedDate(year, month);
    }

    Matcher yearMatcher = Pattern.compile("(\\d{4})").matcher(raw);
    if (!yearMatcher.find()) {
      return new PublishedDate(null, null);
    }
    Integer year = Integer.valueOf(yearMatcher.group(1));
    Integer month = parseMonthName(raw);
    return new PublishedDate(year, month);
  }

  private Optional<Book> findExistingByIdentifiers(String isbn13, String isbn10) {
    if (isbn13 != null) {
      Optional<Book> byIsbn13 = bookRepository.findByIsbn13(isbn13);
      if (byIsbn13.isPresent()) {
        return byIsbn13;
      }
    }
    if (isbn10 != null) {
      Optional<Book> byIsbn10 = bookRepository.findByIsbn10(isbn10);
      if (byIsbn10.isPresent()) {
        return byIsbn10;
      }
    }
    return Optional.empty();
  }

  private boolean isValidIsbn13Checksum(String isbn13) {
    int sum = 0;
    for (int i = 0; i < 12; i++) {
      int digit = Character.getNumericValue(isbn13.charAt(i));
      sum += (i % 2 == 0) ? digit : digit * 3;
    }
    int checkDigit = (10 - (sum % 10)) % 10;
    int actual = Character.getNumericValue(isbn13.charAt(12));
    return checkDigit == actual;
  }

  private boolean isValidIsbn10Checksum(String isbn10) {
    int sum = 0;
    for (int i = 0; i < 9; i++) {
      int digit = Character.getNumericValue(isbn10.charAt(i));
      sum += (10 - i) * digit;
    }
    char last = isbn10.charAt(9);
    int check = last == 'X' ? 10 : Character.getNumericValue(last);
    sum += check;
    return sum % 11 == 0;
  }

  private Integer parseMonthName(String raw) {
    String lower = raw.toLowerCase(Locale.US);
    if (lower.contains("january") || lower.contains("jan")) return 1;
    if (lower.contains("february") || lower.contains("feb")) return 2;
    if (lower.contains("march") || lower.contains("mar")) return 3;
    if (lower.contains("april") || lower.contains("apr")) return 4;
    if (lower.contains("may")) return 5;
    if (lower.contains("june") || lower.contains("jun")) return 6;
    if (lower.contains("july") || lower.contains("jul")) return 7;
    if (lower.contains("august") || lower.contains("aug")) return 8;
    if (lower.contains("september") || lower.contains("sep")) return 9;
    if (lower.contains("october") || lower.contains("oct")) return 10;
    if (lower.contains("november") || lower.contains("nov")) return 11;
    if (lower.contains("december") || lower.contains("dec")) return 12;
    return null;
  }

  private record PublishedDate(Integer year, Integer month) {}
}
