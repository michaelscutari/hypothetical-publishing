package edu.duke.bookpublishing.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ISBN10Validator implements ConstraintValidator<ISBN10, String> {

  private static final String ISBN10_PATTERN = "^\\d{9}[\\dXx]$";

  @Override
  public boolean isValid(String value, ConstraintValidatorContext context) {
    if (value == null || value.isBlank()) {
      return true; // Let @NotBlank handle null/blank if required
    }

    String normalized = value.replaceAll("-", "");
    return normalized.matches(ISBN10_PATTERN);
  }
}
