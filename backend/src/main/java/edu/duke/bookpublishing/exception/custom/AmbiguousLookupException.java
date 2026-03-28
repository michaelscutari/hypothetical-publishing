package edu.duke.bookpublishing.exception.custom;

/** Raised when a lookup expected to match one record returns multiple matches. */
public class AmbiguousLookupException extends RuntimeException {

  public AmbiguousLookupException(String message) {
    super(message);
  }
}
