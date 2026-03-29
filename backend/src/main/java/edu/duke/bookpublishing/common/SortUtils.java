package edu.duke.bookpublishing.common;

import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Sort;

public final class SortUtils {

  private SortUtils() {}

  /**
   * Builds a {@link Sort} from parallel lists of field names and directions. Falls back to {@code
   * defaultSort} when no fields are provided.
   */
  public static Sort buildSort(List<String> fields, List<String> directions, Sort defaultSort) {
    if (fields == null || fields.isEmpty()) {
      return defaultSort;
    }
    List<Sort.Order> orders = new ArrayList<>();
    for (int i = 0; i < fields.size(); i++) {
      Sort.Direction dir =
          (directions != null && i < directions.size())
              ? Sort.Direction.fromString(directions.get(i))
              : Sort.Direction.ASC;
      // Req 3.1.1: sorting by original revenue groups by currency first
      if ("originalPublisherRevenue".equals(fields.get(i))) {
        orders.add(new Sort.Order(dir, "saleCurrency"));
      }
      orders.add(new Sort.Order(dir, fields.get(i)));
    }
    return Sort.by(orders);
  }
}
