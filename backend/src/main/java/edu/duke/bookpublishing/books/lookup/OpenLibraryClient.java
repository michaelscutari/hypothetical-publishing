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
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OpenLibraryClient {

  private static final String BASE_URL = "https://openlibrary.org/api/books";
  private static final String COVERS_URL = "https://covers.openlibrary.org/b/isbn/";
  private static final Logger logger = LoggerFactory.getLogger(OpenLibraryClient.class);

  private final ObjectMapper objectMapper;

  @Value("${app.openlibrary.user-agent:book-publishing/1.0}")
  private String userAgent;

  private final HttpClient httpClient =
      HttpClient.newBuilder()
          .connectTimeout(Duration.ofSeconds(5))
          .followRedirects(HttpClient.Redirect.NORMAL)
          .build();

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

  public CoverDownloadResult downloadCoverByIsbn(String isbn) {
    String url = COVERS_URL + isbn + "-L.jpg?default=false";

    HttpRequest request =
        HttpRequest.newBuilder(URI.create(url))
            .timeout(Duration.ofSeconds(10))
            .header("User-Agent", userAgent)
            .GET()
            .build();

    try {
      HttpResponse<byte[]> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
      if (response.statusCode() == 404) {
        throw new NotFoundException("No cover found for ISBN: " + isbn);
      }
      if (response.statusCode() >= 400) {
        throw new IllegalStateException(
            "OpenLibrary cover download failed: HTTP " + response.statusCode());
      }

      byte[] data = response.body();
      if (data == null || data.length == 0) {
        throw new NotFoundException("No cover found for ISBN: " + isbn);
      }

      String contentType =
          Optional.ofNullable(response.headers().firstValue("Content-Type").orElse(null))
              .orElse("image/jpeg");

      return new CoverDownloadResult(data, contentType);
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Cover download interrupted", ex);
    } catch (IOException ex) {
      logger.warn("Cover download failed for ISBN {}: {}", isbn, ex.getMessage());
      throw new IllegalStateException("Cover download failed", ex);
    }
  }

  public record CoverDownloadResult(byte[] data, String contentType) {}
}
