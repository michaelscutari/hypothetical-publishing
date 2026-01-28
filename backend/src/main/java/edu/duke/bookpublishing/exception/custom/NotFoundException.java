package edu.duke.bookpublishing.exception.custom;

/**
 * Custom exception intended for use when retrieval from a database does not exist. Java equivalent
 * of the HTTP NOT FOUND 404. Intended to be used at the Service layer
 *
 * @author Daniel Rodriguez-Florido
 */
public class NotFoundException extends RuntimeException {

  public NotFoundException(String message) {
    super(message);
  }
}
