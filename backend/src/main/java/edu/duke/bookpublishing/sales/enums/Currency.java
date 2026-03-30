package edu.duke.bookpublishing.sales.enums;

/**
 * This enum is to denote the different currencies in the world. Follows the convention of the
 * variance request posted on Ed by team 4. Includes all countries that have an amazon domain.
 *
 * @author Daniel Rodriguez-Florido
 */
public enum Currency {
  AUD(2),
  BRL(2),
  CAD(2),
  CNY(2),
  EGP(2),
  EUR(2),
  INR(2),
  JPY(0),
  MXN(2),
  PLN(2),
  SAR(2),
  SGD(2),
  SEK(2),
  TRY(2),
  AED(2),
  GBP(2),
  USD(2);

  private final int fractionalDigits;

  Currency(int fractionalDigits) {
    this.fractionalDigits = fractionalDigits;
  }

  public int getFractionalDigits() {
    return fractionalDigits;
  }
}
