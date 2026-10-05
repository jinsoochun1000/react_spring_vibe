package com.example.tutorial.service;

import com.example.tutorial.domain.task.Task;
import com.example.tutorial.domain.task.TaskCategory;
import com.example.tutorial.domain.task.TaskPriority;
import com.example.tutorial.domain.task.TaskStatus;
import com.example.tutorial.domain.user.User;
import com.example.tutorial.dto.task.TaskCreateRequest;
import com.example.tutorial.dto.task.TaskResponse;
import com.example.tutorial.dto.task.TaskStatsResponse;
import com.example.tutorial.dto.task.TaskUpdateRequest;
import com.example.tutorial.exception.ResourceNotFoundException;
import com.example.tutorial.repository.TaskRepository;
import com.example.tutorial.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<TaskResponse> getTasks(String keyword,
                                      TaskCategory category,
                                      TaskStatus status,
                                      TaskPriority priority,
                                      Pageable pageable) {
        String queryKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        return taskRepository.searchTasks(queryKeyword, category, status, priority, pageable)
                .map(TaskResponse::from);
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("해당 태스크를 찾을 수 없습니다. (ID: " + id + ")"));
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse createTask(TaskCreateRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다: " + username));

        Task task = Task.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .priority(request.getPriority())
                .status(request.getStatus())
                .dueDate(request.getDueDate())
                .authorUsername(user.getUsername())
                .authorName(user.getName())
                .build();

        Task saved = taskRepository.save(task);
        log.info("새 태스크 등록 완료: ID={}, Title={}", saved.getId(), saved.getTitle());
        return TaskResponse.from(saved);
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskUpdateRequest request, String username) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("해당 태스크를 찾을 수 없습니다. (ID: " + id + ")"));

        task.update(
                request.getTitle(),
                request.getContent(),
                request.getCategory(),
                request.getPriority(),
                request.getStatus(),
                request.getDueDate()
        );

        log.info("태스크 수정 완료: ID={}", id);
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long id, TaskStatus status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("해당 태스크를 찾을 수 없습니다. (ID: " + id + ")"));

        task.updateStatus(status);
        log.info("태스크 상태 변경 완료: ID={}, Status={}", id, status);
        return TaskResponse.from(task);
    }

    @Transactional
    public void deleteTask(Long id, String username) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("해당 태스크를 찾을 수 없습니다. (ID: " + id + ")"));

        taskRepository.delete(task);
        log.info("태스크 삭제 완료: ID={}", id);
    }

    @Transactional(readOnly = true)
    public TaskStatsResponse getTaskStats() {
        long total = taskRepository.count();
        long todo = taskRepository.countByStatus(TaskStatus.TODO);
        long inProgress = taskRepository.countByStatus(TaskStatus.IN_PROGRESS);
        long review = taskRepository.countByStatus(TaskStatus.REVIEW);
        long done = taskRepository.countByStatus(TaskStatus.DONE);

        return TaskStatsResponse.builder()
                .total(total)
                .todo(todo)
                .inProgress(inProgress)
                .review(review)
                .done(done)
                .build();
    }
}
