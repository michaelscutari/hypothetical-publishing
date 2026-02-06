package edu.duke.bookpublishing.books.lookup;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.duke.bookpublishing.exception.custom.NotFoundException;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OpenLibraryClient {

  private static final String BASE_URL = "https://openlibrary.org/api/books";
  private static final Logger logger = LoggerFactory.getLogger(OpenLibraryClient.class);

  private final ObjectMapper objectMapper;

  @Value("${app.openlibrary.user-agent:book-publishing/1.0}")
  private String userAgent;

  private final HttpClient httpClient =
      HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

  public JsonNode fetchByIsbn(String isbn) {
    String key = "ISBN:" + isbn;
    String query =
        "bibkeys=" + URLEncoder.encode(key, StandardCharsets.UTF_8) + "&jscmd=data&format=json";
    String url = BASE_URL + "?" + query;

    HttpRequest request =
        HttpRequest.newBuilder(URI.create(url))
            .timeout(Duration.ofSeconds(8))
            .header("User-Agent", userAgent)
            .GET()
            .build();

    try {
      HttpResponse<String> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() == 404) {
        throw new NotFoundException("Book not found");
      }
      if (response.statusCode() >= 400) {
        String body = response.body();
        String snippet = body == null ? "" : body.substring(0, Math.min(500, body.length()));
        logger.warn(
            "Open Library API error: HTTP {} for {} body={}", response.statusCode(), url, snippet);
        throw new IllegalStateException("Open Library API error: HTTP " + response.statusCode());
      }
      return objectMapper.readTree(response.body());
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Open Library API request interrupted", ex);
    } catch (IOException ex) {
      logger.warn("Open Library API request failed for {}: {}", url, ex.getMessage());
      throw new IllegalStateException("Open Library API request failed", ex);
    }
  }
}
