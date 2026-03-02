package edu.duke.bookpublishing.books.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = ISBN10Validator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ISBN10 {
  String message() default "Invalid ISBN-10 format";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};
}
