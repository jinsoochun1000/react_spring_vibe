package com.example.crud.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class PostDtos {

    private PostDtos() {
    }

    /** 등록/수정 요청 */
    public record PostRequest(
            @NotBlank(message = "제목을 입력하세요.")
            @Size(max = 200, message = "제목은 200자 이하로 입력하세요.")
            String title,

            @NotBlank(message = "내용을 입력하세요.")
            String content
    ) {
    }

    /** 목록 항목 (본문 제외) */
    public record PostSummary(
            Long id,
            String title,
            String authorUsername,
            Integer viewCount,
            LocalDateTime createdAt
    ) {
        static PostSummary from(Post post) {
            return new PostSummary(post.getId(), post.getTitle(), post.getAuthor().getUsername(),
                    post.getViewCount(), post.getCreatedAt());
        }
    }

    /** 상세 */
    public record PostDetail(
            Long id,
            String title,
            String content,
            Long authorId,
            String authorUsername,
            Integer viewCount,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        static PostDetail from(Post post) {
            return new PostDetail(post.getId(), post.getTitle(), post.getContent(),
                    post.getAuthor().getId(), post.getAuthor().getUsername(), post.getViewCount(),
                    post.getCreatedAt(), post.getUpdatedAt());
        }
    }
}
