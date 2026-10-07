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

    /** 목록 조회: 작성자를 함께 로딩(N+1 방지). keyword 가 null 이면 전체. */
    @EntityGraph(attributePaths = "author")
    @Query("""
            select p from Post p
            where :keyword is null
               or lower(p.title) like lower(concat('%', :keyword, '%'))
               or lower(p.author.username) like lower(concat('%', :keyword, '%'))
            """)
    Page<Post> search(@Param("keyword") String keyword, Pageable pageable);

    @EntityGraph(attributePaths = "author")
    @Query("select p from Post p where p.id = :id")
    Optional<Post> findWithAuthorById(@Param("id") Long id);

    /** 동시 조회 시에도 누락 없도록 DB 에서 직접 증가시킨다. */
    @Modifying(clearAutomatically = true)
    @Query("update Post p set p.viewCount = p.viewCount + 1 where p.id = :id")
    int increaseViewCount(@Param("id") Long id);
}
