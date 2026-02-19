package edu.duke.bookpublishing.author;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuthorRepository extends JpaRepository<Author, Long> {
  Page<Author> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
      String name, String email, Pageable pageable);

  List<Author> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
      String name, String email, Sort sort);
}
