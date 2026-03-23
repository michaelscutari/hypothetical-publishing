package edu.duke.bookpublishing.currency;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CurrencyServiceTest {

  private OpenExchangeRatesClient openExchangeRatesClient;
  private CurrencyService currencyService;

  private static final Map<String, String> CURRENCIES =
      Map.of("USD", "United States Dollar", "GBP", "British Pound", "EUR", "Euro");

  @BeforeEach
  void setUp() {
    openExchangeRatesClient = mock(OpenExchangeRatesClient.class);
    currencyService = new CurrencyService(openExchangeRatesClient);
  }

  @Test
  void sameCurrencyReturnsAmountUnchanged() {
    BigDecimal result = currencyService.convert("USD", "USD", new BigDecimal("100.00"));

    assertEquals(new BigDecimal("100.00"), result);
    verifyNoInteractions(openExchangeRatesClient);
  }

  @Test
  void multipliesByRateAndRoundsToTwoDecimalPlaces() {
    when(openExchangeRatesClient.fetchCurrencies()).thenReturn(CURRENCIES);
    when(openExchangeRatesClient.fetchRate("GBP", "USD")).thenReturn(new BigDecimal("1.33"));

    BigDecimal result = currencyService.convert("GBP", "USD", new BigDecimal("10.00"));

    assertEquals(new BigDecimal("13.30"), result);
  }

  @Test
  void roundsHalfUp() {
    when(openExchangeRatesClient.fetchCurrencies()).thenReturn(CURRENCIES);
    when(openExchangeRatesClient.fetchRate("GBP", "USD")).thenReturn(new BigDecimal("1.3333"));

    BigDecimal result = currencyService.convert("GBP", "USD", new BigDecimal("10.00"));

    assertEquals(new BigDecimal("13.33"), result);
  }

  @Test
  void throwsForInvalidFromCurrency() {
    when(openExchangeRatesClient.fetchCurrencies()).thenReturn(CURRENCIES);

    assertThrows(
        IllegalArgumentException.class,
        () -> currencyService.convert("XYZ", "USD", BigDecimal.TEN));
  }

  @Test
  void throwsForInvalidToCurrency() {
    when(openExchangeRatesClient.fetchCurrencies()).thenReturn(CURRENCIES);

    assertThrows(
        IllegalArgumentException.class,
        () -> currencyService.convert("USD", "XYZ", BigDecimal.TEN));
  }

  @Test
  void validatesKnownCurrencyCode() {
    when(openExchangeRatesClient.fetchCurrencies()).thenReturn(CURRENCIES);

    assertTrue(currencyService.isValidCurrencyCode("USD"));
    assertTrue(currencyService.isValidCurrencyCode("GBP"));
    assertTrue(currencyService.isValidCurrencyCode("EUR"));
  }

  @Test
  void rejectsUnknownCurrencyCode() {
    when(openExchangeRatesClient.fetchCurrencies()).thenReturn(CURRENCIES);

    assertFalse(currencyService.isValidCurrencyCode("XYZ"));
  }

  @Test
  void rejectsNullCurrencyCode() {
    assertFalse(currencyService.isValidCurrencyCode(null));
  }

  @Test
  void rejectsEmptyCurrencyCode() {
    assertFalse(currencyService.isValidCurrencyCode(""));
  }

  @Test
  void rejectsWrongLengthCurrencyCode() {
    assertFalse(currencyService.isValidCurrencyCode("US"));
    assertFalse(currencyService.isValidCurrencyCode("USDX"));
  }

  @Test
  void rejectsLowercaseCurrencyCode() {
    assertFalse(currencyService.isValidCurrencyCode("usd"));
  }

  @Test
  void cachesRatesAcrossConvertCalls() {
    when(openExchangeRatesClient.fetchCurrencies()).thenReturn(CURRENCIES);
    when(openExchangeRatesClient.fetchRate("GBP", "USD")).thenReturn(new BigDecimal("1.33"));

    currencyService.convert("GBP", "USD", new BigDecimal("10.00"));
    currencyService.convert("GBP", "USD", new BigDecimal("20.00"));

    verify(openExchangeRatesClient, times(1)).fetchRate("GBP", "USD");
  }

  @Test
  void cachesCurrencyListAcrossCalls() {
    when(openExchangeRatesClient.fetchCurrencies()).thenReturn(CURRENCIES);

    currencyService.getSupportedCurrencies();
    currencyService.getSupportedCurrencies();

    verify(openExchangeRatesClient, times(1)).fetchCurrencies();
  }
}
