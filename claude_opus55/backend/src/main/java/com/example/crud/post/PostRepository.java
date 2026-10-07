package com.example.crud.post;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    /** 목록 - 작성자를 함께 fetch(N+1 방지), 제목 키워드 검색(대소문자 무시) */
    @EntityGraph(attributePaths = "author")
    @Query(value = "select p from Post p where lower(p.title) like lower(concat('%', :keyword, '%'))",
        countQuery = "select count(p) from Post p where lower(p.title) like lower(concat('%', :keyword, '%'))")
    Page<Post> searchByTitle(@Param("keyword") String keyword, Pageable pageable);

    @EntityGraph(attributePaths = "author")
    @Query(value = "select p from Post p", countQuery = "select count(p) from Post p")
    Page<Post> findAllWithAuthor(Pageable pageable);

    @EntityGraph(attributePaths = "author")
    @Query("select p from Post p where p.id = :id")
    Optional<Post> findWithAuthorById(@Param("id") Long id);

    /** 조회수 증가는 단일 UPDATE 로 처리 (UPDATED_AT 은 변경하지 않음) */
    @Modifying(clearAutomatically = true)
    @Query("update Post p set p.viewCount = p.viewCount + 1 where p.id = :id")
    int increaseViewCount(@Param("id") Long id);
}
