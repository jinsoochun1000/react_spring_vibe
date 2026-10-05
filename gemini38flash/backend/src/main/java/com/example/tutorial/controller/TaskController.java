package com.example.tutorial.controller;

import com.example.tutorial.domain.task.TaskCategory;
import com.example.tutorial.domain.task.TaskPriority;
import com.example.tutorial.domain.task.TaskStatus;
import com.example.tutorial.dto.common.ApiResponse;
import com.example.tutorial.dto.task.TaskCreateRequest;
import com.example.tutorial.dto.task.TaskResponse;
import com.example.tutorial.dto.task.TaskStatsResponse;
import com.example.tutorial.dto.task.TaskStatusUpdateRequest;
import com.example.tutorial.dto.task.TaskUpdateRequest;
import com.example.tutorial.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TaskResponse>>> getTasks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) TaskCategory category,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        String[] sortParts = sort.split(",");
        Sort.Direction direction = (sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        String property = sortParts[0];

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, property));
        Page<TaskResponse> tasks = taskService.getTasks(keyword, category, status, priority, pageable);
        return ResponseEntity.ok(ApiResponse.ok(tasks));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> getTaskById(@PathVariable Long id) {
        TaskResponse response = taskService.getTaskById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @Valid @RequestBody TaskCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        TaskResponse response = taskService.createTask(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("태스크가 성공적으로 등록되었습니다.", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        TaskResponse response = taskService.updateTask(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("태스크가 성공적으로 수정되었습니다.", response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(
            @PathVariable Long id,
            @Valid @RequestBody TaskStatusUpdateRequest request
    ) {
        TaskResponse response = taskService.updateTaskStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.ok("태스크 상태가 업데이트되었습니다.", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        taskService.deleteTask(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("태스크가 성공적으로 삭제되었습니다.", null));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<TaskStatsResponse>> getTaskStats() {
        TaskStatsResponse stats = taskService.getTaskStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
