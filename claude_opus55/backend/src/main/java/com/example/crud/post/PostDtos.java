package com.example.crud.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/** 게시글 요청/응답 DTO 모음 */
public final class PostDtos {

    private PostDtos() {
    }

    public record PostRequest(
        @NotBlank(message = "제목을 입력해 주세요.")
        @Size(max = 200, message = "제목은 200자 이하입니다.")
        String title,
        @NotBlank(message = "내용을 입력해 주세요.")
        String content) {
    }

    public record PostSummary(Long id, String title, Long authorId, String authorName,
                              Integer viewCount, LocalDateTime createdAt, LocalDateTime updatedAt) {
        public static PostSummary from(Post p) {
            return new PostSummary(p.getId(), p.getTitle(), p.getAuthor().getId(), p.getAuthor().getUsername(),
                p.getViewCount(), p.getCreatedAt(), p.getUpdatedAt());
        }
    }

    public record PostDetail(Long id, String title, String content, Long authorId, String authorName,
                             Integer viewCount, LocalDateTime createdAt, LocalDateTime updatedAt) {
        public static PostDetail from(Post p) {
            return new PostDetail(p.getId(), p.getTitle(), p.getContent(), p.getAuthor().getId(),
                p.getAuthor().getUsername(), p.getViewCount(), p.getCreatedAt(), p.getUpdatedAt());
        }
    }
}
