package edu.duke.bookpublishing.currency;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OpenExchangeRatesClient {

  private static final Logger logger = LoggerFactory.getLogger(OpenExchangeRatesClient.class);

  private final ObjectMapper objectMapper;

  @Value("${app.currency.api-base-url:https://openexchangerates.org/api}")
  private String baseUrl;

  @Value("${app.currency.api-app-id}")
  private String appId;

  private final HttpClient httpClient =
      HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

  public Map<String, String> fetchCurrencies() {
    String url = baseUrl + "/currencies.json?app_id=" + appId;

    HttpRequest request =
        HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(8)).GET().build();

    try {
      HttpResponse<String> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() >= 400) {
        logger.warn("Open Exchange Rates API error: HTTP {} for {}", response.statusCode(), url);
        throw new IllegalStateException(
            "Open Exchange Rates API error: HTTP " + response.statusCode());
      }
      return objectMapper.readValue(response.body(), new TypeReference<>() {});
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Open Exchange Rates API request interrupted", ex);
    } catch (IOException ex) {
      logger.warn("Open Exchange Rates API request failed for {}: {}", url, ex.getMessage());
      throw new IllegalStateException("Open Exchange Rates API request failed", ex);
    }
  }

  /**
   * Fetches the exchange rate from one currency to another. Free tier is base-locked to USD, so we
   * fetch USD-based rates and compute the cross rate: rate(FROM→TO) = rate(USD→TO) / rate(USD→FROM)
   */
  public BigDecimal fetchRate(String from, String to) {
    String url = baseUrl + "/latest.json?app_id=" + appId;

    HttpRequest request =
        HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(8)).GET().build();

    try {
      HttpResponse<String> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() == 404) {
        throw new IllegalArgumentException("Unknown currency code: " + from + " or " + to);
      }
      if (response.statusCode() >= 400) {
        logger.warn("Open Exchange Rates API error: HTTP {} for {}", response.statusCode(), url);
        throw new IllegalStateException(
            "Open Exchange Rates API error: HTTP " + response.statusCode());
      }
      JsonNode root = objectMapper.readTree(response.body());
      JsonNode rates = root.path("rates");

      if ("USD".equals(from)) {
        JsonNode toRate = rates.path(to);
        if (toRate.isMissingNode()) {
          throw new IllegalArgumentException("Unknown currency code: " + to);
        }
        return toRate.decimalValue();
      }

      if ("USD".equals(to)) {
        JsonNode fromRate = rates.path(from);
        if (fromRate.isMissingNode()) {
          throw new IllegalArgumentException("Unknown currency code: " + from);
        }
        return BigDecimal.ONE.divide(fromRate.decimalValue(), 10, RoundingMode.HALF_UP);
      }

      JsonNode fromRate = rates.path(from);
      JsonNode toRate = rates.path(to);
      if (fromRate.isMissingNode()) {
        throw new IllegalArgumentException("Unknown currency code: " + from);
      }
      if (toRate.isMissingNode()) {
        throw new IllegalArgumentException("Unknown currency code: " + to);
      }
      return toRate.decimalValue().divide(fromRate.decimalValue(), 10, RoundingMode.HALF_UP);
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Open Exchange Rates API request interrupted", ex);
    } catch (IOException ex) {
      logger.warn("Open Exchange Rates API request failed for {}: {}", url, ex.getMessage());
      throw new IllegalStateException("Open Exchange Rates API request failed", ex);
    }
  }
}
