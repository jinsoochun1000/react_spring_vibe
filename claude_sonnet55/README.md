# CRUD Tutorial — React + Spring Boot + Oracle

로그인(JWT) 후 **게시글 CRUD**를 수행하는 튜토리얼 프로젝트입니다. 이 문서는 개발자 가이드를 겸합니다.

| 구분 | 기술 |
|---|---|
| Front | React 18 + Vite 5, react-router-dom 6 (순수 JS, 외부 상태/UI 라이브러리 없음) |
| Back | Java 17, Spring Boot 3.3.5 (Web, Data JPA, Security, Validation), jjwt 0.12 |
| DB | Oracle 18c XE (`XEPDB1`), 기존 테이블 `TB_USER`, `TB_POST` 사용 (DDL 변경 없음) |
| 인코딩 | 전 구간 UTF-8 |

---

## 1. 빠른 시작

### 사전 준비
- JDK 17+, Node 18+ (Maven 은 `mvnw` 내장 — 별도 설치 불필요)
- 개발 DB(Oracle) 네트워크 접속 가능

### 1) 백엔드 설정 파일 만들기 (최초 1회)
DB 접속정보는 git 에 올리지 않기 위해 `application-local.yml`(gitignore)에 둡니다.

```bash
cd backend/src/main/resources
cp application-local.yml.example application-local.yml   # 값을 채운다
```

```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@//192.168.45.2:1521/XEPDB1
    username: USERSTK7
    password: <DB 비밀번호>
app:
  jwt:
    secret: <32바이트 이상 임의 문자열>
```

`application.yml` 은 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` 환경변수로도 주입할 수 있습니다(운영 배포 시 권장).

### 2) 실행
```bash
# 터미널 1 — 백엔드 (기본 8080)
cd backend
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run

# 터미널 2 — 프론트 (기본 5173, /api 는 8080 으로 프록시)
cd frontend
npm install
npm run dev
```
브라우저에서 http://localhost:5173 접속.

**포트가 겹칠 때**
```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments=--server.port=9090
VITE_API_TARGET=http://localhost:9090 VITE_PORT=5174 npm run dev     # PowerShell: $env:VITE_API_TARGET="..."
```

### 3) 빌드
```bash
cd backend  && ./mvnw package        # target/crud-tutorial-0.0.1-SNAPSHOT.jar
cd frontend && npm run build         # dist/ (정적 배포용)
```

---

## 2. 프로젝트 구조

```
backend/
  pom.xml, mvnw
  src/main/resources/
    application.yml                  # 공통 설정 (비밀값은 placeholder)
    application-local.yml            # 로컬 접속정보 (gitignore) / .example 제공
  src/main/java/com/example/crud/
    CrudApplication.java
    config/SecurityConfig.java       # Stateless JWT 보안 설정, BCrypt
    security/{AuthUser,JwtService,JwtAuthFilter}.java
    user/{User,UserRepository}.java  # TB_USER 매핑
    auth/AuthController.java         # 로그인, 내 정보
    post/{Post,PostRepository,PostService,PostController,PostDtos}.java   # TB_POST CRUD
    common/ApiExceptionHandler.java  # {"message": "..."} 형태 오류 응답
frontend/
  vite.config.js                     # /api 프록시
  src/
    main.jsx, App.jsx                # 라우팅, 로그인 가드(RequireAuth), 레이아웃
    api.js                           # fetch 래퍼 (JWT 첨부, 401 처리)
    auth.jsx                         # AuthContext (user, login, logout)
    format.js, styles.css
    pages/{Login,PostList,PostDetail,PostForm}Page.jsx
```

---

## 3. DB 매핑

스키마를 변경하지 않고(`ddl-auto: none`) 기존 테이블에 매핑합니다.

**TB_USER** — `USER_ID`(PK, IDENTITY), `USERNAME`(UQ), `PASSWORD`(BCrypt), `EMAIL`(UQ), `ROLE`(`ROLE_USER`/`ROLE_ADMIN`), `CREATED_AT`, `UPDATED_AT`

**TB_POST** — `POST_ID`(PK, IDENTITY), `TITLE`(200), `CONTENT`(CLOB), `USER_ID`(FK→TB_USER), `VIEW_COUNT`(기본 0), `CREATED_AT`, `UPDATED_AT`

구현 시 참고한 점
- PK 는 Oracle 12c+ IDENTITY 컬럼 → `@GeneratedValue(strategy = IDENTITY)`.
- `CREATED_AT/UPDATED_AT` 은 `NOT NULL` 이므로 `@PrePersist/@PreUpdate` 로 애플리케이션에서 채움.
- `CONTENT` 는 CLOB → `@Lob`. CLOB 컬럼은 `LIKE` 검색 비용/제약이 있어 **검색은 제목만** 대상.
- 목록은 `@EntityGraph(attributePaths = "author")` 로 작성자를 함께 조회하여 N+1 방지.
- 조회수는 `update ... set view_count = view_count + 1` 단일 UPDATE 로 원자적 증가(`UPDATED_AT` 은 변경하지 않음).
- Hibernate 의 `jdbc.time_zone: Asia/Seoul` 로 시간대 일치.

---

## 4. 인증 / 권한

1. `POST /api/auth/login` — `TB_USER` 에서 `USERNAME` 조회 후 `BCryptPasswordEncoder.matches()` 로 검증, 성공 시 JWT(HS256, 기본 120분) 발급.
2. 프론트는 토큰을 `localStorage['crud.token']` 에 저장하고 모든 요청에 `Authorization: Bearer <token>` 첨부.
3. `JwtAuthFilter` 가 토큰을 검증하고 `AuthUser(id, username, role)` 를 SecurityContext 에 설정 (요청마다 DB 조회 없음).
4. `/api/auth/login` 을 제외한 모든 `/api/**` 는 인증 필요, 미인증 시 `401`.
5. 게시글 **수정/삭제는 작성자 본인 또는 `ROLE_ADMIN`** 만 가능, 아니면 `403`. (조회/작성은 로그인 사용자 모두)
6. 프론트에서 API 가 401 을 반환하면 자동 로그아웃 → 로그인 화면으로 이동.

> 보안 참고: 토큰을 `localStorage` 에 두는 방식은 튜토리얼 단순화를 위한 선택입니다. XSS 위험을 줄이려면 `HttpOnly` 쿠키 방식을 고려하세요.

---

## 5. REST API

공통: JSON, UTF-8. 오류 응답은 `{"message": "사유"}`.

| Method | URL | 설명 | 성공 | 주요 오류 |
|---|---|---|---|---|
| POST | `/api/auth/login` | 로그인 `{username, password}` → `{token, expiresIn, user}` | 200 | 400 입력누락, 401 인증실패 |
| GET | `/api/auth/me` | 현재 사용자 | 200 | 401 |
| GET | `/api/posts?keyword=&page=0&size=10` | 목록(제목 검색, 최신순, size 최대 50) | 200 | 401 |
| GET | `/api/posts/{id}?countView=true` | 상세 (+조회수 1 증가, `countView=false` 면 증가 안 함) | 200 | 404 |
| POST | `/api/posts` | 작성 `{title, content}` | 201 | 400 검증 |
| PUT | `/api/posts/{id}` | 수정 `{title, content}` | 200 | 400, 403, 404 |
| DELETE | `/api/posts/{id}` | 삭제 | 204 | 403, 404 |

목록 응답: `{content:[{id,title,authorName,viewCount,createdAt}], page, size, totalElements, totalPages}`
상세 응답: `{id,title,content,authorId,authorName,viewCount,createdAt,updatedAt}`

검증: 제목 필수·200자 이내, 내용 필수.

---

## 6. 프론트엔드 화면

| 경로 | 화면 |
|---|---|
| `/login` | 로그인 (로그인 후 원래 가려던 경로로 복귀) |
| `/` | 목록 — 제목 검색, 페이징. 검색어/페이지는 URL 쿼리(`?keyword=&page=`)에 유지 |
| `/posts/new` | 글쓰기 |
| `/posts/:id` | 상세 — 작성자/관리자에게만 수정·삭제 버튼 노출 |
| `/posts/:id/edit` | 수정 (조회수 증가 없이 기존 값 로딩) |

구현 포인트
- `RequireAuth` 라우트 가드로 비로그인 접근 차단, 새로고침 시 `/api/auth/me` 로 세션 복원.
- React `StrictMode` 는 개발 모드에서 effect 를 두 번 실행하므로, 상세 화면은 `useRef` 로 중복 호출(=조회수 2배 증가)을 방지.
- 목록 요청은 `cancelled` 플래그로 늦게 도착한 이전 응답이 화면을 덮어쓰지 않게 처리.

---

## 7. 테스트 계정

| 계정 | 권한 |
|---|---|
| `guest01` | ROLE_USER |
| `admin`, `manager01` | ROLE_ADMIN |
| `user01`~`user05`, `dev_tester`, `operator` | ROLE_USER |

비밀번호는 DB 의 BCrypt 해시와 일치해야 로그인됩니다.

---

## 8. 기술 스택 제안 (선택 사항)

현재 구성(React + Spring Boot + Oracle)은 요구사항에 충분합니다. 규모가 커질 때의 개선 후보:

- **TypeScript 전환** — API DTO 타입 공유로 프론트/백 불일치 조기 발견.
- **TanStack Query** — 목록/상세 캐싱, 재시도, 로딩/에러 상태를 선언적으로 관리 (현재는 `useEffect` 직접 관리).
- **Flyway** — 스키마 변경 이력 관리 (현재는 DB 를 수동 관리하므로 `ddl-auto: none`).
- **Testcontainers (gvenzl/oracle-free)** — 실DB 없이 통합 테스트.
- **HttpOnly 쿠키 + Refresh Token** — 토큰 보관 보안 강화.
- Oracle 은 라이선스/운영 부담이 있으므로 신규 프로젝트라면 PostgreSQL 도 고려 (본 프로젝트는 요구에 따라 Oracle 유지).

---

## 9. 알려진 한계 / 다음 단계

- 자동화 테스트 미포함 (수동/스크립트로 API·화면 검증함).
- 회원가입, 비밀번호 변경, 댓글, 첨부파일은 범위 외.
- 삭제는 물리 삭제 (소프트 삭제 컬럼 없음).
- 제목 검색은 `LIKE %키워드%` — 대용량이면 Oracle Text 인덱스 검토.
