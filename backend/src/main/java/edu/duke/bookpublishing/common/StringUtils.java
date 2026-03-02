package edu.duke.bookpublishing.common;

public final class StringUtils {

  private StringUtils() {}

  /**
   * Trims leading/trailing whitespace and collapses internal whitespace runs to a single space.
   * Returns null if input is null.
   */
  public static String normalizeWhitespace(String value) {
    if (value == null) {
      return null;
    }
    return String.join(" ", value.trim().split("\\s+"));
  }

  /**
   * Checks if a string contains author-related punctuation marks (period, apostrophe, or hyphen).
   * Used to determine whether to use literal or lenient author name matching.
   */
  public static boolean containsAuthorPunctuation(String s) {
    return s.chars().anyMatch(c -> c == '.' || c == '\'' || c == '-');
  }
}
