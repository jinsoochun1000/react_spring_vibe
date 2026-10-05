package com.example.tutorial.init;

import com.example.tutorial.domain.task.Task;
import com.example.tutorial.domain.task.TaskCategory;
import com.example.tutorial.domain.task.TaskPriority;
import com.example.tutorial.domain.task.TaskStatus;
import com.example.tutorial.domain.user.Role;
import com.example.tutorial.domain.user.User;
import com.example.tutorial.repository.TaskRepository;
import com.example.tutorial.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 1. Initial User Seed: guest01 / password123!
        User guestUser;
        if (!userRepository.existsByUsername("guest01")) {
            guestUser = User.builder()
                    .username("guest01")
                    .password(passwordEncoder.encode("password123!"))
                    .name("게스트 연구원")
                    .role(Role.ROLE_USER)
                    .build();
            userRepository.save(guestUser);
            log.info("기본 사용자 계정(guest01) 생성 완료!");
        } else {
            guestUser = userRepository.findByUsername("guest01").orElse(null);
        }

        // 2. Initial Sample Tasks Seed
        if (taskRepository.count() == 0 && guestUser != null) {
            List<Task> sampleTasks = List.of(
                    Task.builder()
                            .title("React 18 + Vite 환경 구성 및 번들링 최적화")
                            .content("최신 Vite 번들러를 이용한 React 프로젝트 셋업 및 빌드 속도 개선 작업입니다.\n- Tailwind CSS 연동\n- 코드 스플리팅 적용")
                            .category(TaskCategory.FRONTEND)
                            .priority(TaskPriority.HIGH)
                            .status(TaskStatus.DONE)
                            .dueDate(LocalDate.now().plusDays(2))
                            .authorUsername(guestUser.getUsername())
                            .authorName(guestUser.getName())
                            .build(),

                    Task.builder()
                            .title("Spring Boot 3 + Oracle 18c XE 연동 및 커넥션 풀 튜닝")
                            .content("HikariCP 설정 최적화 및 Hibernate Dialect를 오라클 18c XE에 맞게 구성합니다.\n- 페이징 쿼리 성능 확인\n- 트랜잭션 격리수준 점검")
                            .category(TaskCategory.BACKEND)
                            .priority(TaskPriority.URGENT)
                            .status(TaskStatus.DONE)
                            .dueDate(LocalDate.now().plusDays(3))
                            .authorUsername(guestUser.getUsername())
                            .authorName(guestUser.getName())
                            .build(),

                    Task.builder()
                            .title("TanStack Query (React Query) 캐싱 및 낙관적 업데이트 구현")
                            .content("서버 상태 관리를 TanStack Query v5로 일원화하고 생성/수정/삭제 시 실시간 캐시 동기화를 처리합니다.")
                            .category(TaskCategory.FRONTEND)
                            .priority(TaskPriority.HIGH)
                            .status(TaskStatus.IN_PROGRESS)
                            .dueDate(LocalDate.now().plusDays(5))
                            .authorUsername(guestUser.getUsername())
                            .authorName(guestUser.getName())
                            .build(),

                    Task.builder()
                            .title("Spring Security + JJWT 0.12 무상태(Stateless) 토큰 검증 필터")
                            .content("Bearer JWT 토큰을 요청 헤더에서 추출하여 인증 컨텍스트에 설정하고, 만료 및 변조 토큰을 방어합니다.")
                            .category(TaskCategory.BACKEND)
                            .priority(TaskPriority.HIGH)
                            .status(TaskStatus.DONE)
                            .dueDate(LocalDate.now().plusDays(1))
                            .authorUsername(guestUser.getUsername())
                            .authorName(guestUser.getName())
                            .build(),

                    Task.builder()
                            .title("모던 글래스모피즘 테마 및 반응형 칸반/리스트 뷰 디자인")
                            .content("Tailwind CSS를 활용하여 다크/라이트 모드 지원 및 세련된 그라데이션, 마이크로 인터랙션을 완성합니다.")
                            .category(TaskCategory.DESIGN)
                            .priority(TaskPriority.MEDIUM)
                            .status(TaskStatus.IN_PROGRESS)
                            .dueDate(LocalDate.now().plusDays(7))
                            .authorUsername(guestUser.getUsername())
                            .authorName(guestUser.getName())
                            .build(),

                    Task.builder()
                            .title("Oracle DB 인덱스 설계 및 실행계획 분석")
                            .content("APP_TASKS 테이블의 CREATED_AT, STATUS, CATEGORY 복합 인덱스를 구성하여 대용량 데이터 조회 성능을 극대화합니다.")
                            .category(TaskCategory.DATABASE)
                            .priority(TaskPriority.MEDIUM)
                            .status(TaskStatus.TODO)
                            .dueDate(LocalDate.now().plusDays(10))
                            .authorUsername(guestUser.getUsername())
                            .authorName(guestUser.getName())
                            .build(),

                    Task.builder()
                            .title("CI/CD 파이프라인 및 도커 컨테이너 빌드 자동화")
                            .content("GitHub Actions를 통한 단위 테스트 및 배포 파이프라인을 구축합니다.")
                            .category(TaskCategory.DEVOPS)
                            .priority(TaskPriority.LOW)
                            .status(TaskStatus.REVIEW)
                            .dueDate(LocalDate.now().plusDays(14))
                            .authorUsername(guestUser.getUsername())
                            .authorName(guestUser.getName())
                            .build()
            );

            taskRepository.saveAll(sampleTasks);
            log.info("초기 샘플 태스크 {}건 생성 완료!", sampleTasks.size());
        }
    }
}
