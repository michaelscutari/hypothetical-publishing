package edu.duke.bookpublishing.currency;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrencyService {

  private static final Pattern CURRENCY_CODE_PATTERN = Pattern.compile("^[A-Z]{3}$");
  private static final Duration RATE_TTL = Duration.ofHours(24);

  private final OpenExchangeRatesClient openExchangeRatesClient;

  private final ConcurrentHashMap<String, CachedRate> rateCache = new ConcurrentHashMap<>();
  private volatile Map<String, String> currencyMap;

  record CachedRate(BigDecimal rate, Instant fetchedAt) {
    boolean isExpired() {
      return Duration.between(fetchedAt, Instant.now()).compareTo(RATE_TTL) > 0;
    }
  }

  public boolean isValidCurrencyCode(String code) {
    if (code == null || !CURRENCY_CODE_PATTERN.matcher(code).matches()) {
      return false;
    }
    return getSupportedCurrencies().containsKey(code);
  }

  public BigDecimal convert(String from, String to, BigDecimal amount) {
    if (from.equals(to)) {
      return amount;
    }
    if (!isValidCurrencyCode(from)) {
      throw new IllegalArgumentException("Invalid currency code: " + from);
    }
    if (!isValidCurrencyCode(to)) {
      throw new IllegalArgumentException("Invalid currency code: " + to);
    }

    BigDecimal rate = getCachedRate(from, to);
    return amount.multiply(rate).setScale(2, RoundingMode.HALF_UP);
  }

  public Map<String, String> getSupportedCurrencies() {
    if (currencyMap == null) {
      currencyMap = openExchangeRatesClient.fetchCurrencies();
    }
    return currencyMap;
  }

  private BigDecimal getCachedRate(String from, String to) {
    String key = from + "->" + to;
    CachedRate cached = rateCache.get(key);
    if (cached != null && !cached.isExpired()) {
      return cached.rate();
    }
    BigDecimal rate = openExchangeRatesClient.fetchRate(from, to);
    rateCache.put(key, new CachedRate(rate, Instant.now()));
    return rate;
  }
}
