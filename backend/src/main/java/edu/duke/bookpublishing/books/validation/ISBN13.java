package edu.duke.bookpublishing.books.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = ISBN13Validator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ISBN13 {
  String message() default "Invalid ISBN-13 format";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};
}
