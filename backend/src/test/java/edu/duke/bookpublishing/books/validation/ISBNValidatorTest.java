package edu.duke.bookpublishing.books.validation;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ISBNValidatorTest {

  private ISBN13Validator isbn13Validator;
  private ISBN10Validator isbn10Validator;

  @BeforeEach
  void setUp() {
    isbn13Validator = new ISBN13Validator();
    isbn10Validator = new ISBN10Validator();
  }

  @Test
  void validIsbn13WithoutDashes() {
    assertTrue(isbn13Validator.isValid("9780743273565", null));
  }

  @Test
  void validIsbn13WithDashes() {
    assertTrue(isbn13Validator.isValid("978-0-7432-7356-5", null));
  }

  @Test
  void invalidIsbn13TooShort() {
    assertFalse(isbn13Validator.isValid("123", null));
  }

  @Test
  void invalidIsbn13Letters() {
    assertFalse(isbn13Validator.isValid("978074327356X", null));
  }

  @Test
  void isbn13NullIsValid() {
    assertTrue(isbn13Validator.isValid(null, null));
  }

  @Test
  void isbn13EmptyIsValid() {
    assertTrue(isbn13Validator.isValid("", null));
  }

  @Test
  void validIsbn10WithX() {
    assertTrue(isbn10Validator.isValid("080442957X", null));
  }

  @Test
  void validIsbn10WithLowercaseX() {
    assertTrue(isbn10Validator.isValid("080442957x", null));
  }

  @Test
  void validIsbn10WithDashes() {
    assertTrue(isbn10Validator.isValid("0-7432-7356-7", null));
  }

  @Test
  void invalidIsbn10XMiddle() {
    assertFalse(isbn10Validator.isValid("080X429571", null));
  }

  @Test
  void isbn10NullIsValid() {
    assertTrue(isbn10Validator.isValid(null, null));
  }

  @Test
  void isbn10EmptyIsValid() {
    assertTrue(isbn10Validator.isValid("", null));
  }
}
