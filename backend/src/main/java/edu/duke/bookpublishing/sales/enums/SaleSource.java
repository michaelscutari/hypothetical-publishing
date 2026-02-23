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
  };

  public abstract BigDecimal getRoyaltyRate(Book book);
}
