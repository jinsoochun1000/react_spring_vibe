package com.example.tutorial.domain.task;

import com.example.tutorial.domain.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "APP_TASKS")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Task extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "TASK_SEQ_GEN")
    @SequenceGenerator(name = "TASK_SEQ_GEN", sequenceName = "SEQ_APP_TASKS", allocationSize = 1)
    @Column(name = "TASK_ID")
    private Long id;

    @Column(name = "TITLE", nullable = false, length = 200)
    private String title;

    @Column(name = "CONTENT", nullable = false, length = 4000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "CATEGORY", nullable = false, length = 30)
    private TaskCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "PRIORITY", nullable = false, length = 20)
    private TaskPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false, length = 20)
    private TaskStatus status;

    @Column(name = "DUE_DATE")
    private LocalDate dueDate;

    @Column(name = "AUTHOR_USERNAME", nullable = false, length = 50)
    private String authorUsername;

    @Column(name = "AUTHOR_NAME", nullable = false, length = 100)
    private String authorName;

    public void update(String title, String content, TaskCategory category, TaskPriority priority, TaskStatus status, LocalDate dueDate) {
        this.title = title;
        this.content = content;
        this.category = category;
        this.priority = priority;
        this.status = status;
        this.dueDate = dueDate;
    }

    public void updateStatus(TaskStatus status) {
        this.status = status;
    }
}
