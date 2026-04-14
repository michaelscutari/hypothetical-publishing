package edu.duke.bookpublishing.books;

import edu.duke.bookpublishing.common.StringUtils;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

/** Reusable specifications for Book search queries. */
public final class BookSpecifications {

  private BookSpecifications() {}

  /** Builds a specification that matches books where all query terms match some field. */
  public static Specification<Book> matchesQuery(String query) {
    return (root, cq, cb) -> buildQueryPredicate(root, cb, query);
  }

  /** Filters books by author ID. */
  public static Specification<Book> hasAuthorId(Long authorId) {
    return (root, cq, cb) -> cb.equal(root.get("author").get("id"), authorId);
  }

  /**
   * Builds a predicate for book fields given a path to a Book entity. This allows reuse from other
   * entities that have a book relationship (e.g., Sale.book).
   */
  public static Predicate buildQueryPredicate(
      Path<Book> bookPath, CriteriaBuilder cb, String query) {
    if (query == null || query.isBlank()) {
      return cb.conjunction();
    }

    String[] terms = query.trim().split("\\s+");
    Predicate predicate = cb.conjunction();

    for (String term : terms) {
      predicate = cb.and(predicate, termMatchesAnyField(bookPath, cb, term));
    }
    return predicate;
  }

  private static Predicate termMatchesAnyField(
      Path<Book> bookPath, CriteriaBuilder cb, String term) {
    String lowerTerm = term.toLowerCase();
    // Normalize term for ISBN search by removing dashes (def 12)
    String normalizedTerm = lowerTerm.replaceAll("-", "");

    // Author matching: if the user typed punctuation (. ' -), match literally;
    // otherwise strip those characters from the DB value for lenient matching.
    boolean hasAuthorPunctuation = StringUtils.containsAuthorPunctuation(lowerTerm);
    Predicate authorPredicate;
    if (hasAuthorPunctuation) {
      authorPredicate =
          cb.like(cb.lower(bookPath.get("author").get("name")), "%" + lowerTerm + "%");
    } else {
      authorPredicate =
          cb.like(
              cb.function(
                  "REPLACE",
                  String.class,
                  cb.function(
                      "REPLACE",
                      String.class,
                      cb.function(
                          "REPLACE",
                          String.class,
                          cb.lower(bookPath.get("author").get("name")),
                          cb.literal("."),
                          cb.literal("")),
                      cb.literal("'"),
                      cb.literal("")),
                  cb.literal("-"),
                  cb.literal("")),
              "%" + lowerTerm + "%");
    }

    return cb.or(
        cb.like(cb.lower(bookPath.get("title")), "%" + lowerTerm + "%"),
        authorPredicate,
        cb.like(cb.lower(bookPath.get("isbn13")), "%" + normalizedTerm + "%"),
        cb.like(cb.lower(bookPath.get("isbn10")), "%" + normalizedTerm + "%"),
        cb.like(cb.lower(bookPath.get("seriesName")), "%" + lowerTerm + "%"),
        cb.like(cb.lower(bookPath.get("amazonEbookAsin")), "%" + lowerTerm + "%"),
        cb.like(cb.lower(bookPath.get("kickstarterItemTagEbook")), "%" + lowerTerm + "%"),
        cb.like(cb.lower(bookPath.get("kickstarterItemTagPrint")), "%" + lowerTerm + "%"));
  }
}
