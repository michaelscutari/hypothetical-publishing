package edu.duke.bookpublishing.books.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ASINValidator implements ConstraintValidator<ASIN, String> {

  @Override
  public boolean isValid(String value, ConstraintValidatorContext context) {
    if (value == null || value.isBlank()) {
      return true; // Let @NotBlank handle null/blank if required
    }

    String normalized = value.trim();
    return ValidationPatterns.ASIN.matcher(normalized).matches();
  }
}
