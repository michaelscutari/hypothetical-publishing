package edu.duke.bookpublishing.books.cover;

import edu.duke.bookpublishing.books.Book;
import edu.duke.bookpublishing.books.BookService;
import edu.duke.bookpublishing.books.lookup.OpenLibraryClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/books/{bookId}/cover")
@RequiredArgsConstructor
@Tag(name = "Book Covers", description = "Cover image management endpoints")
public class CoverController {

  private final BookService bookService;
  private final CoverService coverService;
  private final OpenLibraryClient openLibraryClient;

  @Operation(operationId = "uploadCover", summary = "Upload or replace a book cover image")
  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Map<String, String>> uploadCover(
      @PathVariable Long bookId, @RequestParam("file") MultipartFile file) {
    Book book = findBookOrThrow(bookId);

    try {
      coverService.processAndStore(book, file);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
    }

    bookService.save(book);
    return ResponseEntity.ok(Map.of("message", "Cover uploaded successfully"));
  }

  @Operation(operationId = "getCover", summary = "Get the full-size cover image")
  @GetMapping
  public ResponseEntity<byte[]> getCover(@PathVariable Long bookId) {
    Book book = findBookOrThrow(bookId);

    if (book.getCoverImage() == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No cover image");
    }

    return buildImageResponse(book.getCoverImage(), book.getCoverContentType());
  }

  @Operation(operationId = "getCoverThumbnail", summary = "Get the cover thumbnail")
  @GetMapping("/thumbnail")
  public ResponseEntity<byte[]> getCoverThumbnail(@PathVariable Long bookId) {
    Book book = findBookOrThrow(bookId);

    if (book.getCoverThumbnail() == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No cover image");
    }

    return buildImageResponse(book.getCoverThumbnail(), book.getCoverContentType());
  }

  @Operation(operationId = "deleteCover", summary = "Remove a book cover image")
  @DeleteMapping
  public ResponseEntity<Void> deleteCover(@PathVariable Long bookId) {
    Book book = findBookOrThrow(bookId);

    coverService.removeCover(book);
    bookService.save(book);

    return ResponseEntity.noContent().build();
  }

  @Operation(
      operationId = "importCover",
      summary = "Import cover from OpenLibrary using the book's ISBN")
  @PostMapping("/import")
  public ResponseEntity<Map<String, String>> importCover(@PathVariable Long bookId) {
    Book book = findBookOrThrow(bookId);

    String isbn = book.getIsbn13() != null ? book.getIsbn13() : book.getIsbn10();
    if (isbn == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Book has no ISBN");
    }

    byte[] imageBytes;
    String contentType;
    try {
      OpenLibraryClient.CoverDownloadResult result = openLibraryClient.downloadCoverByIsbn(isbn);
      imageBytes = result.data();
      contentType = result.contentType();
    } catch (Exception e) {
      throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY, "Failed to download cover from OpenLibrary", e);
    }

    try {
      coverService.processAndStore(book, imageBytes, contentType);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
    }

    bookService.save(book);
    return ResponseEntity.ok(Map.of("message", "Cover imported successfully"));
  }

  private Book findBookOrThrow(Long bookId) {
    return bookService
        .findById(bookId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
  }

  private ResponseEntity<byte[]> buildImageResponse(byte[] imageData, String contentType) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.parseMediaType(contentType));
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Content-Disposition", "inline");
    headers.setContentLength(imageData.length);
    return new ResponseEntity<>(imageData, headers, HttpStatus.OK);
  }
}
