package edu.duke.bookpublishing.sales.parser;

import java.util.List;
import lombok.Builder;

@Builder
public record BackerkitXlsxEntry(
    String sheetName,
    int sourceRowNumber,
    boolean successfulPledge,
    Integer saleMonth,
    Integer saleYear,
    List<RequestedItem> requestedItems) {

  @Builder
  public record RequestedItem(String itemTag, int quantity) {}
}
