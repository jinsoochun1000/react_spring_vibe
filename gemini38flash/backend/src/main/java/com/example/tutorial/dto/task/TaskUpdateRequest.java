package com.example.tutorial.dto.task;

import com.example.tutorial.domain.task.TaskCategory;
import com.example.tutorial.domain.task.TaskPriority;
import com.example.tutorial.domain.task.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskUpdateRequest {

    @NotBlank(message = "제목은 필수입니다.")
    @Size(max = 200, message = "제목은 200자 이하여야 합니다.")
    private String title;

    @NotBlank(message = "내용은 필수입니다.")
    private String content;

    @NotNull(message = "카테고리를 선택해주세요.")
    private TaskCategory category;

    @NotNull(message = "우선순위를 선택해주세요.")
    private TaskPriority priority;

    @NotNull(message = "상태를 선택해주세요.")
    private TaskStatus status;

    private LocalDate dueDate;
}
