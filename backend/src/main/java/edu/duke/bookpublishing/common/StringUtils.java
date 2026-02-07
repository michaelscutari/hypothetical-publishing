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
}
