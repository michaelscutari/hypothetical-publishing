package edu.duke.bookpublishing.books;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {

  boolean existsByIsbn13(String isbn13);

  boolean existsByIsbn10(String isbn10);

  Optional<Book> findByIsbn13(String isbn13);
}
