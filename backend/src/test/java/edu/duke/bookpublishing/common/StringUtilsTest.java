package edu.duke.bookpublishing.common;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class StringUtilsTest {

  @Test
  void nullInput_returnsNull() {
    assertNull(StringUtils.normalizeWhitespace(null));
  }

  @Test
  void emptyString_returnsEmpty() {
    assertEquals("", StringUtils.normalizeWhitespace(""));
  }

  @Test
  void trimsLeadingAndTrailingWhitespace() {
    assertEquals("hello", StringUtils.normalizeWhitespace("  hello  "));
  }

  @Test
  void collapsesInternalWhitespace() {
    assertEquals("John Robert Smith", StringUtils.normalizeWhitespace("John   Robert   Smith"));
  }

  @Test
  void handlesTabs() {
    assertEquals("a b c", StringUtils.normalizeWhitespace("a\tb\t\tc"));
  }

  @Test
  void noOpForAlreadyNormalized() {
    assertEquals("already normal", StringUtils.normalizeWhitespace("already normal"));
  }
}
