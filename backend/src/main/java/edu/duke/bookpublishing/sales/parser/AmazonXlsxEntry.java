package edu.duke.bookpublishing.sales.parser;

import edu.duke.bookpublishing.sales.enums.Currency;
import edu.duke.bookpublishing.sales.enums.SaleFormat;
import java.math.BigDecimal;
import lombok.Builder;

@Builder
public record AmazonXlsxEntry(
    String sheetName,
    int sourceRowNumber,
    Integer saleMonth,
    Integer saleYear,
    SaleFormat format,
    String isbn,
    String asin,
    String marketplace,
    Integer quantitySold,
    Integer kenp,
    Currency currency,
    BigDecimal royalty) {}
