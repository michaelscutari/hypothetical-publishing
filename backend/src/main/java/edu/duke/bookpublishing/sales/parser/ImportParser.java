package edu.duke.bookpublishing.sales.parser;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.web.multipart.MultipartFile;

public interface ImportParser<T> {

  int MAX_COMMENT_LENGTH = 256;
  int MAX_FORMAT_LENGTH = 35;
  int MAX_MARKET_LENGTH = 45;
  int MAX_FILENAME_LENGTH = 100;
  int MAX_SHEET_LENGTH = 35;
  DateTimeFormatter COMMENT_TIMESTAMP_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

  /** Returns true if this parser can handle a file with the given content type / name. */
  boolean supports(String contentType, String filename);

  /** Parses the given file into a batch of typed records plus any row-level errors. */
  ParsedBatch<T> parse(MultipartFile file);

  static String truncateField(String value, int maxLength) {
    if (value == null || value.isBlank()) {
      return "unknown";
    }
    String trimmed = value.trim();
    return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
  }

  static String formatCommentTimestamp(LocalDateTime timestamp) {
    if (timestamp == null) {
      return "unknown";
    }
    return timestamp.format(COMMENT_TIMESTAMP_FORMATTER);
  }

  static String truncateComment(String comment) {
    if (comment == null) {
      return null;
    }
    return comment.length() <= MAX_COMMENT_LENGTH
        ? comment
        : comment.substring(0, MAX_COMMENT_LENGTH);
  }
}
