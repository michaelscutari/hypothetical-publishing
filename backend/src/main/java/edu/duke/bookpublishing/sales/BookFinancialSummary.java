package edu.duke.bookpublishing.sales;

import java.math.BigDecimal;
import lombok.Builder;

@Builder
public record BookFinancialSummary(
    Long bookId,
    BigDecimal revenue,
    BigDecimal unpaidRoyalty,
    BigDecimal paidRoyalty,
    BigDecimal totalRoyalty) {}
