package com.example.crud.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Function;

public final class PostDtos {
    private PostDtos() {}

    public record PostRequest(
            @NotBlank(message = "제목을 입력하세요") @Size(max = 200, message = "제목은 200자 이내") String title,
            @NotBlank(message = "내용을 입력하세요") String content) {}

    public record PostSummary(Long id, String title, String authorName, int viewCount, LocalDateTime createdAt) {
        static PostSummary from(Post p) {
            return new PostSummary(p.getId(), p.getTitle(), p.getAuthor().getUsername(), p.getViewCount(), p.getCreatedAt());
        }
    }

    public record PostDetail(Long id, String title, String content, Long authorId, String authorName,
                             int viewCount, LocalDateTime createdAt, LocalDateTime updatedAt) {
        static PostDetail from(Post p) {
            return new PostDetail(p.getId(), p.getTitle(), p.getContent(), p.getAuthor().getId(),
                    p.getAuthor().getUsername(), p.getViewCount(), p.getCreatedAt(), p.getUpdatedAt());
        }
    }

    public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {
        static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
            return new PageResponse<>(page.map(mapper).getContent(), page.getNumber(), page.getSize(),
                    page.getTotalElements(), page.getTotalPages());
        }
    }
}
