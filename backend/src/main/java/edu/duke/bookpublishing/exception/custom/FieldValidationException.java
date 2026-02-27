package edu.duke.bookpublishing.exception.custom;

/** Validation error tied to a specific field, rendered as {field: message} with 400 status. */
public class FieldValidationException extends RuntimeException {

  private final String field;

  public FieldValidationException(String field, String message) {
    super(message);
    this.field = field;
  }

  public String getField() {
    return field;
  }
}
