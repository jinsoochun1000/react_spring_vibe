package com.example.crud.dto;

import com.example.crud.entity.Post;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;

public final class Dtos {
    private Dtos() {}

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}

    public record LoginResponse(String token, String username, String role) {}

    public record PostRequest(
            @NotBlank @Size(max = 200) String title,
            @NotBlank @Size(max = 4000) String content) {}

    public record PostResponse(Long id, String title, String content, String authorUsername,
                               long viewCount, LocalDateTime createdAt, LocalDateTime updatedAt) {
        public static PostResponse of(Post p) {
            return new PostResponse(p.getId(), p.getTitle(), p.getContent(), p.getAuthor().getUsername(),
                    p.getViewCount(), p.getCreatedAt(), p.getUpdatedAt());
        }
    }

    public record PageResponse<T>(List<T> items, int page, int size, long totalElements, int totalPages) {
        public static <T> PageResponse<T> of(Page<T> p) {
            return new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
        }
    }

    public record ErrorResponse(String message) {}
}
