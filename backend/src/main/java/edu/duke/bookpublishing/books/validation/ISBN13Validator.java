package edu.duke.bookpublishing.books.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ISBN13Validator implements ConstraintValidator<ISBN13, String> {

  private static final String ISBN13_PATTERN = "^\\d{13}$";

  @Override
  public boolean isValid(String value, ConstraintValidatorContext context) {
    if (value == null || value.isBlank()) {
      return true; // Let @NotBlank handle null/blank
    }

    String normalized = value.replaceAll("-", "");
    return normalized.matches(ISBN13_PATTERN);
  }
}
