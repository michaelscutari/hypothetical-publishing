package edu.duke.bookpublishing.books.validation;

import java.util.regex.Pattern;

public final class ValidationPatterns {

  public static final Pattern ISBN10 = Pattern.compile("^\\d{9}[\\dXx]$");

  public static final Pattern ISBN13 = Pattern.compile("^\\d{13}$");

  public static final Pattern ISBN_ANY = Pattern.compile("^(\\d{9}[\\dXx]|\\d{13})$");
}
