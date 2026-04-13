package edu.duke.bookpublishing.sales.enums;

import edu.duke.bookpublishing.books.Book;
import java.math.BigDecimal;

public enum SaleSource {
  DISTRIBUTOR {
    @Override
    public BigDecimal getRoyaltyRate(Book book) {
      return book.getDistributorAuthorRoyaltyRate();
    }
  },

  HAND_SOLD {
    @Override
    public BigDecimal getRoyaltyRate(Book book) {
      return book.getHandsoldAuthorRoyaltyRate();
    }

    @Override
    public BigDecimal effectivePrintCost(Book book) {
      return book.getPrintCost();
    }
  },

  KICKSTARTER {
    @Override
    public BigDecimal getRoyaltyRate(Book book) {
      return book.getHandsoldAuthorRoyaltyRate();
    }

    @Override
    public BigDecimal effectivePrintCost(Book book) {
      return BigDecimal.ZERO;
    }
  };

  public abstract BigDecimal getRoyaltyRate(Book book);

  /** Whether revenue is computed server-side vs provided by the user. */
  public boolean isRevenueComputed() {
    return this != DISTRIBUTOR;
  }

  /** Whether a distributor must be specified for this source. */
  public boolean requiresDistributor() {
    return this == DISTRIBUTOR;
  }

  /** Print cost used in revenue formula. Only valid when isRevenueComputed(). */
  public BigDecimal effectivePrintCost(Book book) {
    throw new UnsupportedOperationException("Revenue is not computed for " + this);
  }

  /** Compute publisher revenue: (cover_price - effectivePrintCost) * qty. */
  public BigDecimal computeRevenue(Book book, int qty) {
    return book.getCoverPrice()
        .subtract(effectivePrintCost(book))
        .multiply(BigDecimal.valueOf(qty));
  }
}
