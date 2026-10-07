# CRUD Tutorial — React + Spring Boot + Oracle

JWT 인증이 포함된 게시판 CRUD(등록/조회/수정/삭제) 튜토리얼 프로젝트입니다.
Oracle 18c XE 개발서버의 기존 `TB_USER`, `TB_POST` 테이블을 그대로 사용합니다.

> 이 문서는 프로젝트에 합류하거나 기능을 확장·운영할 개발자를 위한 가이드입니다.

---

## 1. 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| Frontend | React + TypeScript, Vite | React 19.2 / Vite 8.3 / TS 6.0 |
| 스타일 | Tailwind CSS (`@tailwindcss/vite` 플러그인) | 4.3 |
| 서버 상태 관리 | TanStack Query (React Query) | 5.104 |
| 라우팅 / HTTP | react-router-dom / axios | 7.18 / 1.20 |
| Backend | Spring Boot (Web MVC, Data JPA, Security, Validation) | 4.1.1 |
| 언어 / 빌드 | Java / Maven Wrapper | 17 / (`mvnw` 포함, Maven 설치 불필요) |
| 인증 | Spring Security + jjwt (Stateless JWT, HS256) | jjwt 0.13.0 |
| DB | Oracle Database 18c XE (`XEPDB1`), ojdbc17 | — |

### 요청 스택(React / Spring Boot / Oracle) 대비 보강한 점과 이유

기본 스택은 요청대로 유지하고, 그 위에 아래를 추가했습니다.

| 추가 | 이유 |
|------|------|
| **TypeScript** | API 응답 타입(DTO)을 코드로 1:1 맞춰, 백엔드·프론트 간 불일치를 컴파일 단계에서 잡습니다. |
| **Vite** | CRA(create-react-app)가 지원 종료된 뒤 사실상 표준이 된 React 빌드 도구. 개발 서버 기동과 HMR이 빠릅니다. |
| **TanStack Query** | 서버 데이터 캐싱, 로딩/에러 상태, 등록·수정·삭제 후 목록 갱신(invalidate)을 표준 방식으로 처리합니다. `useEffect` + `useState` 보일러플레이트가 대부분 사라집니다. |
| **Tailwind CSS** | 별도 CSS 설계 없이 일관된 UI를 빠르게 구성합니다. |
| **Spring Data JPA** | 단일 테이블 CRUD는 SQL 작성이 거의 필요 없습니다. 복잡한 조회는 JPQL/Native SQL로 확장 가능합니다. (조직 표준이 MyBatis라면 MyBatis로 바꿔도 무방합니다.) |
| **JWT (Stateless)** | 서버 세션 없이 React SPA + REST API 구조에 적합하고, 수평 확장이 쉽습니다. |

---

## 2. 디렉터리 구조

```
claude_vsc_opus55/
├── README.md                     ← 본 문서
├── backend/                      ← Spring Boot (포트 8080)
│   ├── mvnw, mvnw.cmd, pom.xml
│   └── src/main/
│       ├── java/com/example/crud/
│       │   ├── CrudApplication.java
│       │   ├── auth/             ← 로그인 / 회원가입 / 내 정보 API
│       │   │   ├── AuthController.java
│       │   │   ├── AuthService.java
│       │   │   └── AuthDtos.java       (LoginRequest, SignupRequest, TokenResponse, UserResponse)
│       │   ├── post/             ← 게시글 CRUD
│       │   │   ├── Post.java           (Entity ↔ TB_POST)
│       │   │   ├── PostRepository.java (검색/페이징, 조회수 증가 쿼리)
│       │   │   ├── PostService.java    (비즈니스 로직, 권한 검사)
│       │   │   ├── PostController.java (REST API)
│       │   │   └── PostDtos.java       (PostRequest, PostSummary, PostDetail)
│       │   ├── user/             ← User(Entity ↔ TB_USER), UserRepository, Role
│       │   ├── security/         ← SecurityConfig, JwtTokenProvider, JwtAuthenticationFilter
│       │   └── common/           ← ApiException, ErrorResponse, PageResponse, GlobalExceptionHandler
│       └── resources/
│           ├── application.yml                 ← 공통 설정 (환경변수 플레이스홀더)
│           ├── application-local.yml           ← DB 접속정보 (git 제외)
│           └── application-local.yml.example   ← 위 파일의 템플릿
└── frontend/                     ← React (포트 5173)
    ├── vite.config.ts            ← Tailwind 플러그인, /api → 8080 프록시
    └── src/
        ├── main.tsx              ← QueryClient, Router, AuthProvider 구성
        ├── App.tsx               ← 라우트 정의
        ├── index.css             ← Tailwind + 공통 컴포넌트 클래스(.card, .btn-primary 등)
        ├── api/                  ← axios 인스턴스(client.ts), API 함수(auth.ts, posts.ts), 타입(types.ts)
        ├── auth/AuthContext.tsx  ← 로그인 상태(토큰/사용자) 관리, 권한 체크(canEdit)
        ├── hooks/usePosts.ts     ← TanStack Query 훅 + 쿼리 키 관리
        ├── components/           ← Layout, ProtectedRoute, Pagination
        ├── pages/                ← LoginPage, SignupPage, PostListPage, PostDetailPage, PostFormPage
        └── utils/format.ts       ← 날짜 포맷
```

DB DDL과 샘플 데이터는 저장소 루트의 [`../sql/`](../sql/) 폴더(`스키마.sql`, `샘플데이타입력.sql`)에 있습니다.

---

## 3. 시작하기

### 3.1 사전 준비

- JDK 17 이상 (`java -version`)
- Node.js 20.19+ 또는 22.12+ (Vite 8 요구사항, Node 24에서 검증)
- Oracle 서버(192.168.45.2:1521) 네트워크 접근 가능
- Maven 설치 불필요 (포함된 `mvnw` 사용)

### 3.2 DB 준비 (최초 1회)

개발서버에는 테이블과 샘플 데이터가 이미 있습니다. 새 DB라면 아래 순서로 실행합니다.

```sql
-- SQL Developer / sqlplus 등에서 USERSTK6 계정으로
@sql/스키마.sql
@sql/샘플데이타입력.sql
```

### 3.3 백엔드 설정

DB 접속정보는 **`backend/src/main/resources/application-local.yml`** 에 둡니다. 저장소의 `.gitignore`가 이 파일을 제외하므로 비밀번호가 커밋되지 않습니다.

```bash
cd backend/src/main/resources
cp application-local.yml.example application-local.yml   # 이후 접속정보 입력
```

```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@//192.168.45.2:1521/XEPDB1   # //host:port/SERVICE 형식
    username: USERSTK6
    password: ********
```

기본 프로필은 `local`입니다(`spring.profiles.default: local`). 파일 대신 환경변수로도 설정할 수 있습니다.

| 환경변수 | 용도 | 기본값 |
|---------|------|--------|
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | DB 접속 | (application-local.yml 값) |
| `JWT_SECRET` | JWT 서명 키 (Base64, 256bit 이상) | 개발용 키 — **운영에서는 반드시 교체** |
| `JWT_EXPIRATION_MS` | 토큰 유효시간 | `3600000` (1시간) |
| `CORS_ALLOWED_ORIGINS` | 허용할 프론트 Origin (쉼표 구분) | `http://localhost:5173` |

### 3.4 실행

터미널 2개에서 각각 실행합니다.

```bash
# 터미널 1 — 백엔드 (http://localhost:8080)
cd backend
./mvnw spring-boot:run          # Windows CMD/PowerShell: .\mvnw.cmd spring-boot:run

# 터미널 2 — 프론트엔드 (http://localhost:5173)
cd frontend
npm install                     # 최초 1회
npm run dev
```

브라우저에서 **http://localhost:5173** 에 접속한 뒤, 테스트 계정 **`guest01` / `password123!`** 로 로그인합니다.
샘플 데이터의 모든 계정(`admin`, `manager01`, `user01` …)은 비밀번호가 `password123!`로 같습니다.
`admin`, `manager01`은 `ROLE_ADMIN`이라 다른 사람의 글도 수정·삭제할 수 있습니다.

### 3.5 빌드 / 테스트

```bash
# 백엔드: 테스트(DB 접속 필요 — 엔티티↔테이블 매핑 검증) 및 jar 빌드
cd backend
./mvnw test
./mvnw package                  # → target/crud-0.0.1-SNAPSHOT.jar (DB 접근 불가 시 -DskipTests)
java -jar target/crud-0.0.1-SNAPSHOT.jar

# 프론트엔드: 타입체크 + 프로덕션 빌드, 린트
cd frontend
npm run build                   # → dist/
npm run lint                    # oxlint
```

---

## 4. 아키텍처

```
 Browser (React SPA :5173)
   │  axios → /api/**   (Authorization: Bearer <JWT>)
   ▼
 Vite dev proxy ──────────────►  Spring Boot (:8080)
                                   │
                                   ├─ JwtAuthenticationFilter  → 토큰 검증, SecurityContext 등록
                                   ├─ SecurityConfig           → URL별 접근 규칙 (401/403 JSON 응답)
                                   ├─ Controller  (@Valid 입력 검증)
                                   ├─ Service     (@Transactional, 작성자/관리자 권한 검사)
                                   ├─ Repository  (Spring Data JPA, JPQL)
                                   └─ GlobalExceptionHandler   → 공통 ErrorResponse 형식
                                   ▼
                                 Oracle 18c XE (XEPDB1: TB_USER, TB_POST)
```

- 개발 중에는 **Vite 프록시**가 `/api`를 8080으로 넘기므로, 브라우저 입장에서 같은 출처라 CORS가 적용되지 않습니다.
  프론트와 백엔드를 다른 도메인에 배포하는 경우를 위해 `SecurityConfig`에 CORS 설정도 해 두었습니다.
- 계층 구조는 **Controller → Service → Repository** 입니다. 엔티티를 응답으로 직접 내보내지 않고, 항상 DTO(`record`)로 변환합니다.

---

## 5. DB 매핑

DDL은 `sql/스키마.sql`에서만 관리하며, JPA는 스키마를 변경하지 않습니다(`ddl-auto: validate`).
기동 시 Hibernate가 엔티티와 테이블을 비교해 **불일치하면 기동을 거부**하므로, 매핑 오류를 일찍 잡을 수 있습니다.

### TB_USER ↔ `user/User.java`

| 컬럼 | 타입 | 필드 | 비고 |
|------|------|------|------|
| USER_ID | NUMBER(19) IDENTITY | `id` | `@GeneratedValue(strategy = IDENTITY)` |
| USERNAME | VARCHAR2(50) UNIQUE | `username` | 로그인 아이디 |
| PASSWORD | VARCHAR2(255) | `password` | BCrypt 해시 |
| EMAIL | VARCHAR2(100) UNIQUE | `email` | |
| ROLE | VARCHAR2(20) | `role` | `ROLE_USER` / `ROLE_ADMIN` |
| CREATED_AT / UPDATED_AT | TIMESTAMP | `createdAt` / `updatedAt` | `@PrePersist` / `@PreUpdate`로 자동 설정 |

### TB_POST ↔ `post/Post.java`

| 컬럼 | 타입 | 필드 | 비고 |
|------|------|------|------|
| POST_ID | NUMBER(19) IDENTITY | `id` | |
| TITLE | VARCHAR2(200) | `title` | |
| CONTENT | CLOB | `content` | `@Lob String` |
| USER_ID | NUMBER(19) FK | `author` | `@ManyToOne(fetch = LAZY)` |
| VIEW_COUNT | NUMBER(10) | `viewCount` | 상세 조회 시 UPDATE 쿼리로 +1 |
| CREATED_AT / UPDATED_AT | TIMESTAMP | `createdAt` / `updatedAt` | |

> **Oracle 관련 참고**
> - `GENERATED ALWAYS AS IDENTITY` 컬럼은 INSERT 시 값을 넣을 수 없습니다. `GenerationType.IDENTITY`를 써야 Hibernate가 해당 컬럼을 INSERT에서 뺍니다.
> - Spring Boot 4에 포함된 ojdbc17 드라이버로 18c XE에 정상 접속되는 것을 확인했습니다.
> - 페이징은 Oracle 12c+ 문법(`OFFSET ... FETCH NEXT ... ROWS ONLY`)을 Hibernate가 자동 생성합니다.
> - 목록 조회는 `@EntityGraph(attributePaths = "author")`로 작성자를 함께 가져와 N+1 쿼리를 방지합니다.
> - 엔티티의 시각은 마이크로초로 잘라 저장합니다. Oracle `TIMESTAMP`(기본 6자리)와 정밀도를 맞추기 위해서입니다.

---

## 6. REST API 명세

Base URL: `http://localhost:8080/api` (프론트에서는 `/api`)

| Method | URL | 인증 | 설명 | 성공 |
|--------|-----|------|------|------|
| POST | `/auth/login` | — | 로그인, JWT 발급 | 200 |
| POST | `/auth/signup` | — | 회원가입 (`ROLE_USER`) | 201 |
| GET | `/auth/me` | 필요 | 내 정보 | 200 |
| GET | `/posts?page=0&size=10&keyword=` | — | 목록 (페이징, 제목·작성자 검색) | 200 |
| GET | `/posts/{id}` | — | 상세 (**조회수 +1**) | 200 |
| POST | `/posts` | 필요 | 등록 | 201 + `Location` 헤더 |
| PUT | `/posts/{id}` | 작성자/관리자 | 수정 | 200 |
| DELETE | `/posts/{id}` | 작성자/관리자 | 삭제 | 204 |

### 요청/응답 예시

```http
POST /api/auth/login
Content-Type: application/json

{ "username": "guest01", "password": "password123!" }
```
```json
{
  "accessToken": "eyJhbGciOiJIUzM4NCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": { "id": 9, "username": "guest01", "email": "guest01@example.com", "role": "ROLE_USER" }
}
```

```http
GET /api/posts?page=0&size=3&keyword=Spring
```
```json
{
  "content": [
    { "id": 6, "title": "Spring Security Stateless JWT 인증 플로우", "authorUsername": "user03",
      "viewCount": 88, "createdAt": "2026-09-24T16:04:42.836" },
    { "id": 2, "title": "Spring Boot 3.x 환경 설정 가이드", "authorUsername": "manager01",
      "viewCount": 95, "createdAt": "2026-09-13T16:04:42.836" }
  ],
  "page": 0, "size": 3, "totalElements": 2, "totalPages": 1, "first": true, "last": true
}
```

```http
POST /api/posts
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{ "title": "제목", "content": "본문" }
```
```json
{ "id": 41, "title": "제목", "content": "본문", "authorId": 9, "authorUsername": "guest01",
  "viewCount": 0, "createdAt": "2026-10-07T10:09:11.706388", "updatedAt": "2026-10-07T10:09:11.706388" }
```

- `page`는 **0부터** 시작합니다. 정렬 기본값은 `id DESC`(최신순)이며, `sort=viewCount,desc` 등으로 바꿀 수 있습니다.
- 날짜는 로컬 시각(Asia/Seoul) 기준 ISO-8601 문자열입니다.

### 오류 응답 (공통 형식)

필터 단계의 인증·권한 오류를 포함해, 모든 오류가 아래 형식으로 내려옵니다.

```json
{
  "status": 400,
  "message": "입력값을 확인하세요.",
  "fieldErrors": { "title": "제목을 입력하세요.", "content": "내용을 입력하세요." },
  "timestamp": "2026-10-07T10:09:01.4505372"
}
```

| 상태 | 발생 상황 |
|------|------|
| 400 | `@Valid` 검증 실패(`fieldErrors` 포함), JSON 형식 오류, 타입 불일치 |
| 401 | 보호된 API에 토큰 없음·위조·만료, 로그인 시 아이디/비밀번호 불일치 |
| 403 | 작성자도 관리자도 아닌 사용자가 남의 글을 수정·삭제 |
| 404 | 존재하지 않는 게시글 |
| 409 | 회원가입 시 아이디·이메일 중복 |
| 500 | 예상하지 못한 서버 오류 (스택트레이스는 서버 로그에만 남김) |

---

## 7. 인증·인가 흐름

```
[로그인]  LoginPage → POST /api/auth/login
          → AuthService: 사용자 조회 + BCrypt 비밀번호 비교
          → JwtTokenProvider.createToken(sub=username, role=ROLE_xxx, exp=+1h)
          → 프론트: localStorage 에 accessToken, user 저장

[API 호출] axios request interceptor → Authorization: Bearer <token> 자동 첨부
          → JwtAuthenticationFilter: 서명·만료 검증 → SecurityContext 에 username/role 등록
          → SecurityConfig 규칙: GET /api/posts/** 는 공개, 나머지 쓰기는 인증 필요
          → PostService.checkOwner(): 작성자 본인 또는 ROLE_ADMIN 만 수정·삭제

[만료]    401 응답 → axios response interceptor 가 토큰 삭제 → /login?expired=1 로 이동
```

- **비밀번호**는 `BCryptPasswordEncoder`로 해시합니다. 샘플 데이터의 해시도 BCrypt입니다.
- JWT 안에 username과 role이 들어 있어 **요청마다 인증용 DB 조회를 하지 않습니다.**
  단, 권한(role)을 바꾸면 사용자가 다시 로그인해 새 토큰을 받아야 반영됩니다.
- **실제 보안은 서버 검사가 담당합니다.** 프론트에서 수정/삭제 버튼을 숨기는 것(`canEdit`)은 UX 편의일 뿐입니다.

---

## 8. 프론트엔드 설계 포인트

### 라우트

| 경로 | 화면 | 로그인 |
|------|--------|--------|
| `/posts` | 목록 (검색어·페이지는 URL 쿼리 `?keyword=&page=`에 유지) | — |
| `/posts/:id` | 상세 (작성자·관리자에게만 수정/삭제 버튼 표시) | — |
| `/posts/new` | 등록 | 필요 (`ProtectedRoute`) |
| `/posts/:id/edit` | 수정 (등록과 같은 `PostFormPage` 컴포넌트) | 필요 |
| `/login`, `/signup` | 로그인, 회원가입 | — |

로그인하지 않은 상태로 로그인이 필요한 화면에 들어가면 `/login`으로 이동하고, 로그인 후 원래 화면으로 돌아옵니다.

### TanStack Query 데이터 처리 (`hooks/usePosts.ts`)

```ts
postKeys = {
  all:    ['posts'],
  lists:  ['posts', 'list'],
  list:   ['posts', 'list', { page, size, keyword }],
  detail: ['posts', 'detail', id],
}
```

| 훅 | 동작 |
|----|------|
| `usePostList` | `placeholderData: keepPreviousData`로 페이지 이동 중에도 이전 목록을 보여 줘 화면이 깜빡이지 않음 |
| `usePost` | 상세 조회 (`enabled` 인자로 조회 중지 가능 — 삭제 직후 404 재조회 방지에 사용) |
| `useCreatePost` | 성공 시 응답을 상세 캐시에 넣고, 목록 전체를 무효화 |
| `useUpdatePost` | 성공 시 **응답을 상세 캐시에 바로 반영**(재조회하면 조회수가 오르므로)하고, 목록을 무효화 |
| `useDeletePost` | 성공 시 상세 캐시를 제거하고, 목록을 무효화 |

상세 API는 호출할 때마다 조회수가 오르므로, 클라이언트는 `refetchOnWindowFocus`를 끄고 `staleTime: 30s`를 써서 불필요한 재조회를 막습니다.

### 새 화면·API 추가 패턴

1. 백엔드: 새 패키지에 `XxxDtos`(record) → `XxxRepository` → `XxxService` → `XxxController` 작성
2. 공개 API라면 `SecurityConfig.authorizeHttpRequests`에 URL 규칙 추가
3. 프론트: `api/types.ts`에 타입 → `api/xxx.ts`에 API 함수 → `hooks/useXxx.ts`에 쿼리 키·훅 → `pages/` → `App.tsx`에 라우트

---

## 9. 한글(UTF-8) 처리

| 계층 | 설정 |
|------|------|
| DB | `VARCHAR2`/`CLOB`에 한글 제목·본문 저장·조회 확인 |
| Spring | `server.servlet.encoding.charset=UTF-8, force=true`, JSON은 기본 UTF-8 |
| 빌드 | `pom.xml`의 `project.build.sourceEncoding=UTF-8` |
| 프론트 | `<meta charset="UTF-8">`, `lang="ko"`, axios는 JSON을 UTF-8로 전송 |
| 소스 파일 | 전부 UTF-8 (BOM 없음) |

> **Windows 테스트 팁**: Git Bash나 CMD에서 `curl -d '{"title":"한글"}'`처럼 한글을 직접 보내면, 콘솔 인코딩(CP949) 때문에 요청이 깨져 400이나 500이 날 수 있습니다.
> 본문은 UTF-8 파일로 저장해 `--data-binary @body.json`으로 보내거나, Postman·IntelliJ HTTP Client·브라우저로 테스트하세요.
> 쿼리 파라미터도 UTF-8로 퍼센트 인코딩해야 합니다(`keyword=%ED%8A%9C%ED%86%A0%EB%A6%AC%EC%96%BC`).

---

## 10. 검증 결과

2026-10-07, 개발 DB(192.168.45.2/XEPDB1) 기준으로 확인했습니다.

**API (curl)**
- [x] 기동 시 Hibernate `validate` 통과 (엔티티↔테이블 매핑 일치)
- [x] 목록 / 페이징 / 한글 키워드 검색
- [x] `guest01` / `password123!` 로그인 (샘플 데이터 BCrypt 해시 일치)
- [x] 등록(201) → 상세(조회수 +1) → 수정(200, `updatedAt` 갱신) → 삭제(204) → 재조회(404)
- [x] 토큰 없이 등록 → 401, 위조 토큰 → 401, 비밀번호 오류 → 401
- [x] 남의 글 수정 → 403, 빈 제목·본문 → 400 + `fieldErrors`, 중복 회원가입 → 409

**브라우저 E2E (Playwright)**
- [x] 목록 → 검색 → 로그아웃 상태로 글쓰기 진입 시 로그인으로 이동 → 로그인 후 글쓰기 화면 복귀
- [x] 검증 메시지 표시 → 등록 → 상세 → 수정 → 삭제 → 목록 복귀
- [x] 남의 글에서는 수정/삭제 버튼 숨김
- [x] 의도한 400 외에 콘솔 오류 없음

**빌드**: `./mvnw test` 통과, `npm run build`·`npm run lint` 통과

> 테스트 중 생성한 게시글은 모두 삭제했습니다. 다만 IDENTITY 채번 특성상 새 글 번호는 이어서 증가합니다.

---

## 11. 트러블슈팅

| 증상 | 원인 / 해결 |
|------|-----------|
| `ORA-12514` / `listener does not currently know of service` | URL을 `@//host:1521/XEPDB1`(서비스명) 형식으로 쓰세요. `@host:1521:XE`(SID)는 CDB에 접속합니다. |
| `Schema-validation: missing table [TB_POST]` | 접속 계정에 테이블이 없습니다. `username`을 확인하거나 `sql/스키마.sql`을 먼저 실행하세요. |
| 샘플 계정 로그인 시 401 | PASSWORD 컬럼이 바뀐 경우입니다. `BCryptPasswordEncoder`로 만든 새 해시를 DB에 저장하세요. |
| `Port 8080 already in use` | 기존 프로세스를 종료하거나 `server.port`를 바꾸세요(바꾸면 `vite.config.ts` 프록시도 같이 수정). |
| 프론트에서 401이 나며 로그인 화면으로 이동 | 토큰 만료(1시간)입니다. 다시 로그인하세요. |
| 한글 깨짐 | §9의 Windows 테스트 팁을 참고하세요. |

---

## 12. 다음 단계 (확장 아이디어)

- **Refresh Token**: Access Token은 짧게 두고, Refresh Token은 localStorage 대신 HttpOnly 쿠키에 보관해 XSS 노출을 줄입니다.
- **Swagger/OpenAPI**: `springdoc-openapi`를 추가해 API 문서를 자동 생성합니다.
- **테스트**: 서비스·컨트롤러 계층 `@WebMvcTest` 슬라이스 테스트, Testcontainers(Oracle Free)를 이용한 통합 테스트.
- **관리자 화면**: `TB_USER` CRUD, 권한 변경 등 사용자 관리.
- **소프트 삭제·감사 필드**: `DELETED_YN`, `CREATED_BY` 컬럼, Spring Data JPA Auditing.
- **배포**: `npm run build` 결과물을 Spring Boot `static/`에 넣어 단일 jar로 만들거나, Nginx로 따로 서비스합니다.
