package com.example.tutorial.dto.task;

import com.example.tutorial.domain.task.Task;
import com.example.tutorial.domain.task.TaskCategory;
import com.example.tutorial.domain.task.TaskPriority;
import com.example.tutorial.domain.task.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {
    private Long id;
    private String title;
    private String content;
    private TaskCategory category;
    private TaskPriority priority;
    private TaskStatus status;
    private LocalDate dueDate;
    private String authorUsername;
    private String authorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TaskResponse from(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .content(task.getContent())
                .category(task.getCategory())
                .priority(task.getPriority())
                .status(task.getStatus())
                .dueDate(task.getDueDate())
                .authorUsername(task.getAuthorUsername())
                .authorName(task.getAuthorName())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
