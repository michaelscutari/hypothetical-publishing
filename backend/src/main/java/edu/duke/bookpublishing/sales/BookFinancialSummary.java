package edu.duke.bookpublishing.sales;

import java.math.BigDecimal;
import lombok.Builder;

@Builder
public record BookFinancialSummary(
    Long bookId,
    Long totalUnitsSold,
    BigDecimal revenue,
    BigDecimal unpaidRoyalty,
    BigDecimal paidRoyalty,
    BigDecimal totalRoyalty) {}
