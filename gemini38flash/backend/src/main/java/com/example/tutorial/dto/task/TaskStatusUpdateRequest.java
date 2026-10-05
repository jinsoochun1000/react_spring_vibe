package com.example.tutorial.dto.task;

import com.example.tutorial.domain.task.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatusUpdateRequest {
    @NotNull(message = "상태값은 필수입니다.")
    private TaskStatus status;
}
