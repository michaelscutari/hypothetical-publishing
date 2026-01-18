package edu.duke.bookpublishing.repository;

import edu.duke.bookpublishing.model.Book;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

  boolean existsByIsbn13(String isbn13);

  boolean existsByIsbn10(String isbn10);

  Optional<Book> findByIsbn13(String isbn13);
}
