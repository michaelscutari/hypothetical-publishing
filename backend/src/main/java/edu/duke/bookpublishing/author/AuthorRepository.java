package edu.duke.bookpublishing.author;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AuthorRepository extends JpaRepository<Author, Long> {
    Page<Author> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(String name,
            String email, Pageable pageable);

    List<Author> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(String name,
            String email, Sort sort);

    @Query("""
            select a from Author a
            where replace(replace(replace(lower(a.name), '.', ''), '''', ''), '-', '')
              like concat('%', replace(replace(replace(lower(:query), '.', ''), '''', ''), '-', ''), '%')
            or lower(a.email) like concat('%', lower(:query), '%')
            """)
    List<Author> findByNameLenient(@Param("query") String query, Sort sort);

    @Query("""
            select a from Author a
            where replace(replace(replace(lower(a.name), '.', ''), '''', ''), '-', '')
              like concat('%', replace(replace(replace(lower(:query), '.', ''), '''', ''), '-', ''), '%')
            or lower(a.email) like concat('%', lower(:query), '%')
            """)
    Page<Author> findByNameLenient(@Param("query") String query, Pageable pageable);

    @Query("""
            select a from Author a
            where lower(a.name) like concat('%', lower(:query), '%')
            or lower(a.email) like concat('%', lower(:query), '%')
            """)
    List<Author> findByNameLiteral(@Param("query") String query, Sort sort);

    @Query("""
            select a from Author a
            where lower(a.name) like concat('%', lower(:query), '%')
            or lower(a.email) like concat('%', lower(:query), '%')
            """)
    Page<Author> findByNameLiteral(@Param("query") String query, Pageable pageable);
}
