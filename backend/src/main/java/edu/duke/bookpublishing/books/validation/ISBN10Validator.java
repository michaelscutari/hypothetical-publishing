package edu.duke.bookpublishing.books.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ISBN10Validator implements ConstraintValidator<ISBN10, String> {

  @Override
  public boolean isValid(String value, ConstraintValidatorContext context) {
    if (value == null || value.isBlank()) {
      return true; // Let @NotBlank handle null/blank if required
    }

    String normalized = value.replaceAll("-", "");
    return ValidationPatterns.ISBN10.matcher(normalized).matches();
  }
}
