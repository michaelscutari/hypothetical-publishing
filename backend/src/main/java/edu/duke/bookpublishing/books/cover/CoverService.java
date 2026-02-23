package edu.duke.bookpublishing.books.cover;

import edu.duke.bookpublishing.books.Book;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Set;
import javax.imageio.ImageIO;
import net.coobird.thumbnailator.Thumbnails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CoverService {

  private static final Logger logger = LoggerFactory.getLogger(CoverService.class);

  private static final Set<String> ALLOWED_CONTENT_TYPES =
      Set.of("image/jpeg", "image/png", "image/gif", "image/webp");

  @Value("${app.covers.thumbnail-width:200}")
  private int thumbnailWidth;

  @Value("${app.covers.thumbnail-height:300}")
  private int thumbnailHeight;

  public void processAndStore(Book book, MultipartFile file) {
    if (file.isEmpty()) {
      throw new IllegalArgumentException("File is empty");
    }

    String contentType = file.getContentType();
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
      throw new IllegalArgumentException("Unsupported image type. Allowed: JPEG, PNG, GIF, WebP");
    }

    byte[] imageBytes;
    try {
      imageBytes = file.getBytes();
    } catch (IOException e) {
      throw new IllegalStateException("Failed to read uploaded file", e);
    }

    validateImageBytes(imageBytes);

    byte[] thumbnail = generateThumbnail(imageBytes, contentType);

    book.setCoverImage(imageBytes);
    book.setCoverThumbnail(thumbnail);
    book.setCoverContentType(contentType);
  }

  public void processAndStore(Book book, byte[] imageBytes, String contentType) {
    if (imageBytes == null || imageBytes.length == 0) {
      throw new IllegalArgumentException("Image data is empty");
    }

    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
      throw new IllegalArgumentException("Unsupported image type. Allowed: JPEG, PNG, GIF, WebP");
    }

    validateImageBytes(imageBytes);

    byte[] thumbnail = generateThumbnail(imageBytes, contentType);

    book.setCoverImage(imageBytes);
    book.setCoverThumbnail(thumbnail);
    book.setCoverContentType(contentType);
  }

  public void removeCover(Book book) {
    book.setCoverImage(null);
    book.setCoverThumbnail(null);
    book.setCoverContentType(null);
  }

  private void validateImageBytes(byte[] imageBytes) {
    try {
      BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageBytes));
      if (image == null) {
        throw new IllegalArgumentException("File is not a valid image");
      }
    } catch (IOException e) {
      throw new IllegalArgumentException("File is not a valid image", e);
    }
  }

  private byte[] generateThumbnail(byte[] original, String contentType) {
    try {
      String formatName = contentType.substring(contentType.indexOf('/') + 1);
      if ("webp".equals(formatName)) {
        formatName = "png";
      }

      ByteArrayOutputStream out = new ByteArrayOutputStream();
      Thumbnails.of(new ByteArrayInputStream(original))
          .size(thumbnailWidth, thumbnailHeight)
          .outputFormat(formatName)
          .toOutputStream(out);
      return out.toByteArray();
    } catch (IOException e) {
      logger.warn("Failed to generate thumbnail, using original image", e);
      return original;
    }
  }
}
