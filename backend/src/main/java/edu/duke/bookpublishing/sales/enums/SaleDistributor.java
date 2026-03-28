package edu.duke.bookpublishing.sales.enums;

import java.util.Set;

/**
 * Denotes the distributor for the sale that was made, e.g. AMAZON
 *
 * @author Daniel Rodriguez-Florido
 */
public enum SaleDistributor {
  INGRAM_SPARK(Set.of(SaleFormat.PRINT)),
  AMAZON(Set.of(SaleFormat.PRINT, SaleFormat.EBOOK, SaleFormat.KINDLE_UNLIMITED)),
  OTHER(Set.of(SaleFormat.PRINT, SaleFormat.EBOOK));

  private final Set<SaleFormat> allowedFormats;

  SaleDistributor(Set<SaleFormat> allowedFormats) {
    this.allowedFormats = allowedFormats;
  }

  public boolean allowsFormat(SaleFormat format) {
    return allowedFormats.contains(format);
  }
}
