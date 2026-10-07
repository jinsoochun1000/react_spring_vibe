package com.example.crud.repository;

import com.example.crud.entity.Post;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    @EntityGraph(attributePaths = "author")
    Page<Post> findByTitleContainingIgnoreCase(String keyword, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = "author")
    Page<Post> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "author")
    Optional<Post> findWithAuthorById(Long id);

    @Modifying(clearAutomatically = true)
    @Query("update Post p set p.viewCount = p.viewCount + 1 where p.id = :id")
    int increaseViewCount(@Param("id") Long id);
}
