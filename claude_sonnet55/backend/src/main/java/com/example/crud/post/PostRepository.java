package com.example.crud.post;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    @EntityGraph(attributePaths = "author")
    Page<Post> findByTitleContainingIgnoreCase(String keyword, Pageable pageable);

    @EntityGraph(attributePaths = "author")
    Optional<Post> findWithAuthorById(Long id);

    /** 조회수만 갱신 (UPDATED_AT 은 건드리지 않는다). */
    @Modifying(clearAutomatically = true)
    @Query("update Post p set p.viewCount = p.viewCount + 1 where p.id = :id")
    int increaseViewCount(@Param("id") Long id);
}
