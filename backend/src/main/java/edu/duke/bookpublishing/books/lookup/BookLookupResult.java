package edu.duke.bookpublishing.books.lookup;

import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.dto.BookLookupResponse;

public record BookLookupResult(BookLookupResponse lookup, Book existing) {

  public static BookLookupResult existing(Book book) {
    return new BookLookupResult(null, book);
  }

  public static BookLookupResult lookup(BookLookupResponse response) {
    return new BookLookupResult(response, null);
  }
}
