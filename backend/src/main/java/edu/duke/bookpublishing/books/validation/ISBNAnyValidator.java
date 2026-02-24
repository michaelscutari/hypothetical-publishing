package edu.duke.bookpublishing.books.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ISBNAnyValidator implements ConstraintValidator<ISBNAny, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }

        String normalized = value.replaceAll("[-\\s]", "");

        return ValidationPatterns.ISBN_ANY.matcher(normalized).matches();
    }
}
