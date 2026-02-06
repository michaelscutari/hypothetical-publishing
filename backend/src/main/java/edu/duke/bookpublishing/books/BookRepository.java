package edu.duke.bookpublishing.books;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

  @Query(
      """
          select distinct b.author
          from Book b
          where lower(b.author) like concat('%', lower(:query), '%')
          order by b.author asc
          """)
  List<String> findDistinctAuthors(@Param("query") String query);

  @Query(
      """
          select distinct b.author
          from Book b
          where lower(b.author) like concat('%', lower(:query), '%')
          order by b.author asc
          """)
  Page<String> findDistinctAuthors(@Param("query") String query, Pageable pageable);
}
