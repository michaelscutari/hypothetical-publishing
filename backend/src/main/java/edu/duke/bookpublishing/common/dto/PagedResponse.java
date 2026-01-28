package edu.duke.bookpublishing.common.dto;

import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

/**
 * Generic Paged Response type. Allows for returns of custom paginated objects,
 * such as Sale, Book, etc.
 * Gives the option to paginate or unpaginated and allows for mapping input.
 * 
 * @author Daniel Rodriguez-Florido
 */
public record PagedResponse<T>(
    List<T> content,
    int pageNumber,
    int pageSize,
    long totalElements,
    int totalPages,
    boolean paged) {

  /* ---------- Unpaged, no mapping ---------- */

  public static <T> PagedResponse<T> unpaged(List<T> content) {
    int size = content != null ? content.size() : 0;

    return new PagedResponse<>(content, 0, size, size, 1, false);
  }

  /* ---------- Unpaged, with mapping ---------- */

  public static <T, R> PagedResponse<R> unpaged(List<T> content, Function<? super T, R> mapper) {
    List<R> mapped = content == null ? List.of() : content.stream().map(mapper).toList();

    int size = mapped.size();

    return new PagedResponse<>(mapped, 0, size, size, 1, false);
  }

  /* ---------- Paged, no mapping ---------- */

  public static <T> PagedResponse<T> paged(Page<T> page) {
    return new PagedResponse<>(
        page.getContent(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        true);
  }

  /* ---------- Paged, mapping only the content ---------- */

  public static <T, R> PagedResponse<R> paged(Page<T> page, Function<? super T, R> mapper) {
    List<R> mappedContent = page.getContent().stream().map(mapper).toList();

    return new PagedResponse<>(
        mappedContent,
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        true);
  }
}
