package edu.duke.bookpublishing.books;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {

  boolean existsByIsbn13(String isbn13);

  boolean existsByIsbn10(String isbn10);

  Optional<Book> findByIsbn13(String isbn13);

  Optional<Book> findByIsbn10(String isbn10);

  List<Book> findAllByAmazonEbookAsinIgnoreCase(String asin);

  List<Book> findAllByKickstarterItemTagEbook(String tag);

  List<Book> findAllByKickstarterItemTagPrint(String tag);

  List<Book> findBySeriesNameIgnoreCaseOrderBySeriesPositionAsc(String seriesName);

  @Query(
      """
          SELECT DISTINCT b.seriesName FROM Book b
          WHERE b.seriesName IS NOT NULL
            AND LOWER(b.seriesName) LIKE CONCAT('%', LOWER(:query), '%')
          ORDER BY b.seriesName ASC
          """)
  List<String> findDistinctSeriesNames(@Param("query") String query);

  @Query(
      "SELECT DISTINCT b.seriesName FROM Book b WHERE b.seriesName IS NOT NULL ORDER BY"
          + " b.seriesName ASC")
  List<String> findAllDistinctSeriesNames();
}
