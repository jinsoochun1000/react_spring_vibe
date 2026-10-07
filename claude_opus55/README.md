# CRUD Tutorial — React + Spring Boot + Oracle

게시판(TB_POST) CRUD와 JWT 로그인(TB_USER)을 구현한 풀스택 튜토리얼 프로젝트입니다.
이 문서는 **개발자 가이드**입니다. 프로젝트 구조, 실행 방법, 설계 결정, API 명세, 문제 해결 방법을 정리했습니다.

---

## 1. 한눈에 보기

| 구분 | 내용 |
|---|---|
| 기능 | 로그인/회원가입(JWT), 게시글 목록(페이징·제목 검색)·상세(조회수)·등록·수정·삭제 |
| 권한 | 조회는 누구나 / 등록은 로그인 사용자 / 수정·삭제는 **작성자 본인 또는 ROLE_ADMIN** |
| 프론트엔드 | http://localhost:5174 |
| 백엔드 API | http://localhost:8081/api |
| 테스트 계정 | `guest01` / `password123!` (ROLE_USER), `admin` / `password123!` (ROLE_ADMIN) |
| 문자셋 | 소스·HTTP·DB 모두 UTF-8 (DB: `AL32UTF8`) |

> 포트를 8080/5173 이 아닌 **8081/5174** 로 잡은 이유: 같은 PC에서 다른 비교용 프로젝트가 8080/5173 을 사용 중이어서 충돌을 피했습니다. 환경변수로 바꿀 수 있습니다(§6).

---

## 2. 기술 스택과 제안 사항

요청하신 스택(React / Spring Boot / Oracle 18c XE)을 유지하면서, 각 영역에서 현재 표준에 가까운 도구를 골랐습니다.

| 영역 | 사용 기술 | 선택 이유 |
|---|---|---|
| Frontend | **React 19 + Vite 8 + TypeScript** | CRA는 지원 종료. Vite가 사실상 표준이며 빌드·HMR 속도가 빠릅니다. TS로 API 타입을 백엔드 DTO와 맞춥니다. |
| 서버 상태 | **TanStack Query v5** | 로딩/에러/캐시/재조회(invalidate)를 직접 구현하지 않아도 됩니다. CRUD 튜토리얼에 가장 효과가 큽니다. |
| 라우팅 | React Router v7 | 목록/상세/작성/수정 화면 분리, 보호 라우트 |
| 스타일 | Tailwind CSS v4 | 별도 CSS 파일 없이 빠르게 일관된 UI 구성 |
| HTTP | axios | 인터셉터로 JWT 자동 첨부, 401 처리 |
| Backend | **Spring Boot 4.1 (Java 17)** | 현재 최신 GA. Jakarta EE, Hibernate 7, Spring Security 7 기반 |
| ORM | Spring Data JPA | 단순 CRUD는 JPA가 가장 생산적. 복잡한 조회가 늘면 MyBatis/QueryDSL 병행 고려 |
| 인증 | Spring Security + **OAuth2 Resource Server(Nimbus JWT, HS256)** | jjwt 등 외부 라이브러리 + 커스텀 필터 없이, Spring 공식 JWT 검증 기능 사용 → 코드가 적고 보안 결함 여지가 적습니다. |
| DB | Oracle 18c XE (`XEPDB1`) | 기존 개발서버 사용 |

### 💡 추가 제안

1. **Oracle 버전 업그레이드 권장 (가장 중요)**
   Hibernate 7은 Oracle **19 미만을 공식 지원하지 않습니다.** 실행 시 다음 경고가 출력됩니다.
   ```
   HHH000511: The 18.0.0 version for [OracleDialect] is no longer supported ... minimum supported version is 19.0.0
   ```
   이 프로젝트의 기능은 18c에서 모두 정상 동작하는 것을 확인했지만, 18c XE는 이미 지원 종료된 버전입니다.
   무료 버전인 **Oracle Database 23ai Free**(또는 21c XE)로 옮기시는 것을 권장합니다. 코드 변경은 필요 없습니다.
2. **DB 접속 정보는 환경변수로** — `application.yml`에는 로컬 개발 편의를 위한 기본값만 두었고, `DB_PASSWORD`, `JWT_SECRET`은 운영에서 반드시 환경변수로 주입하세요.
3. **스키마 버전 관리** — 테이블이 늘어나면 Flyway를 도입해 `sql/스키마.sql`을 마이그레이션 파일로 관리하는 것을 권장합니다.

---

## 3. 아키텍처

```
┌──────────────── Browser ────────────────┐
│ React (Vite dev server :5174)           │
│  ├ pages/*  ── hooks/usePosts (TanStack Query)
│  └ api/client (axios + JWT 인터셉터)     │
└───────────────┬─────────────────────────┘
                │  /api/**  (Vite proxy → 같은 Origin, CORS 불필요)
┌───────────────▼─────────────────────────┐
│ Spring Boot (:8081)                     │
│  SecurityFilterChain (JWT 검증, Stateless)
│  Controller → Service(@Transactional) → Repository(JPA)
└───────────────┬─────────────────────────┘
                │  JDBC (ojdbc17, HikariCP)
┌───────────────▼─────────────────────────┐
│ Oracle 18c XE  XEPDB1 / USERSTK6        │
│  TB_USER (1) ───< TB_POST (N)           │
└─────────────────────────────────────────┘
```

### 로그인 / 인증 흐름

1. `POST /api/auth/login` → DB의 BCrypt 해시와 비밀번호 비교
2. 성공 시 HS256 JWT 발급 (클레임: `sub`=username, `uid`=USER_ID, `roles`=["ROLE_USER"], 만료 120분)
3. 프론트는 토큰을 `localStorage`에 저장, axios 인터셉터가 모든 요청에 `Authorization: Bearer <token>` 첨부
4. 새로고침 시 `GET /api/auth/me`로 사용자 정보 복원
5. 토큰 만료/위조로 **401** 응답 → 토큰 삭제 후 로그아웃 상태로 전환

---

## 4. 폴더 구조

```
claude_opus55/
├─ README.md
├─ backend/                              # Spring Boot (Maven Wrapper 포함)
│  ├─ pom.xml
│  └─ src/main/
│     ├─ resources/application.yml       # DB, JWT, CORS, 포트 설정
│     └─ java/com/example/crud/
│        ├─ CrudApplication.java
│        ├─ config/
│        │  ├─ SecurityConfig.java       # 보안 규칙, JWT Encoder/Decoder, CORS, BCrypt
│        │  └─ JwtProperties.java        # app.jwt.* 바인딩
│        ├─ common/
│        │  ├─ ApiException.java         # 상태코드를 가진 비즈니스 예외
│        │  ├─ ErrorResponse.java        # 공통 오류 응답 포맷
│        │  ├─ GlobalExceptionHandler.java
│        │  └─ PageResponse.java         # 페이지 응답 포맷
│        ├─ user/   User(엔티티), UserRepository
│        ├─ auth/   AuthController, AuthService, AuthDtos
│        └─ post/   Post(엔티티), PostRepository, PostService, PostController, PostDtos
└─ frontend/                             # React + Vite + TS
   ├─ vite.config.ts                     # 포트 5174, /api 프록시 → 8081
   └─ src/
      ├─ main.tsx                        # QueryClient, Router, AuthProvider
      ├─ App.tsx                         # 라우트 정의
      ├─ index.css                       # Tailwind + 공통 유틸(btn, input, card)
      ├─ api/       client.ts(axios), auth.ts, posts.ts (타입 + API 함수)
      ├─ auth/      AuthContext.tsx (로그인 상태 전역 관리)
      ├─ hooks/     usePosts.ts (CRUD용 Query/Mutation 훅)
      ├─ components/ Layout, ProtectedRoute, Pagination
      ├─ pages/     LoginPage, SignupPage, PostListPage, PostDetailPage, PostFormPage
      └─ utils/     format.ts (날짜 포맷)
```

DDL·샘플 데이터는 상위 폴더 `../sql/`(`스키마.sql`, `샘플데이타입력.sql`, `입력확인쿼리.sql`)에 있습니다.

---

## 5. 실행 방법

### 사전 준비
- JDK 17 이상 (`java -version`)
- Node.js 20.19+ / 22.12+ (`node -v`) — 개발 시 v24 사용
- Maven 설치 불필요 (Maven Wrapper `mvnw` 포함)
- Oracle 접속 가능(192.168.45.2:1521) 및 `../sql/스키마.sql`, `샘플데이타입력.sql` 실행 완료 상태

### 백엔드
```bash
cd backend
./mvnw spring-boot:run          # Windows CMD/PowerShell: mvnw.cmd spring-boot:run
```
`Started CrudApplication` 로그가 보이면 성공입니다. (첫 실행은 의존성 다운로드로 수 분 소요)

### 프론트엔드
```bash
cd frontend
npm install
npm run dev
```
브라우저에서 http://localhost:5174 접속 → 우측 상단 **로그인** → `guest01` / `password123!`

### 운영용 빌드
```bash
cd backend && ./mvnw clean package        # → target/crud-0.0.1-SNAPSHOT.jar
java -jar target/crud-0.0.1-SNAPSHOT.jar

cd frontend && npm run build              # → dist/ (정적 파일)
```
운영에서는 `dist/`를 Nginx 등으로 서빙하고 `/api`를 백엔드로 리버스 프록시하거나,
`VITE_API_BASE_URL=https://api.example.com/api npm run build` 처럼 API 주소를 지정한 뒤 `CORS_ALLOWED_ORIGINS`를 맞춰 주세요.

---

## 6. 설정 (환경변수)

`backend/src/main/resources/application.yml`의 값은 모두 환경변수로 덮어쓸 수 있습니다.

| 환경변수 | 기본값 | 설명 |
|---|---|---|
| `SERVER_PORT` | `8081` | 백엔드 포트 |
| `DB_URL` | `jdbc:oracle:thin:@//192.168.45.2:1521/XEPDB1` | **서비스명** 방식(`//host:port/service`) 사용. PDB 접속 시 SID 방식(`host:port:SID`)은 실패합니다. |
| `DB_USERNAME` | `USERSTK6` | |
| `DB_PASSWORD` | `PwUserStk6` | 운영에서는 반드시 교체 |
| `JWT_SECRET` | 개발용 문자열 | HS256 서명키, **32바이트 이상**. 운영에서 반드시 교체 |
| `JWT_EXPIRATION_MINUTES` | `120` | 토큰 유효시간 |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5174` | 쉼표로 여러 개 지정 가능 |

프론트 포트/프록시 대상은 `frontend/vite.config.ts`에서 변경합니다.

---

## 7. REST API 명세

공통: `Content-Type: application/json; charset=UTF-8`, 인증 필요 API는 `Authorization: Bearer <accessToken>`

### 인증

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/auth/login` | - | 로그인, 토큰 발급 |
| POST | `/api/auth/signup` | - | 회원가입 (ROLE_USER) → 201 |
| GET | `/api/auth/me` | ✅ | 내 정보 |

```jsonc
// POST /api/auth/login  요청
{ "username": "guest01", "password": "password123!" }
// 200 응답
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 7200,
  "user": { "id": 9, "username": "guest01", "email": "guest01@example.com", "role": "ROLE_USER" }
}
```

### 게시글

| Method | URL | 인증 | 설명 | 성공 |
|---|---|---|---|---|
| GET | `/api/posts?page=0&size=10&keyword=` | - | 목록 (최신순, 제목 검색, size 최대 50) | 200 |
| GET | `/api/posts/{id}?increaseView=true` | - | 상세 (기본 조회수 +1, 수정화면은 `false`) | 200 |
| POST | `/api/posts` | ✅ | 등록 | 201 + `Location` |
| PUT | `/api/posts/{id}` | ✅ 작성자/ADMIN | 수정 | 200 |
| DELETE | `/api/posts/{id}` | ✅ 작성자/ADMIN | 삭제 | 204 |

```jsonc
// POST·PUT 요청 본문
{ "title": "제목(필수, 200자 이하)", "content": "내용(필수)" }

// GET /api/posts 응답
{
  "content": [
    { "id": 10, "title": "...", "authorId": 7, "authorName": "user05",
      "viewCount": 12, "createdAt": "2026-10-04T16:04:42.851", "updatedAt": "..." }
  ],
  "page": 0, "size": 10, "totalElements": 11, "totalPages": 2
}
// 상세(GET /api/posts/{id})는 위 항목에 "content"(본문)가 추가됩니다.
```

### 오류 응답 (공통 포맷)

```json
{ "status": 400, "message": "입력값을 확인해 주세요.",
  "fieldErrors": { "title": "제목을 입력해 주세요." }, "timestamp": "2026-10-07T10:41:29.12" }
```

| 상태 | 상황 |
|---|---|
| 400 | 검증 실패(`fieldErrors` 포함), JSON 파싱 실패, 잘못된 인코딩의 쿼리 파라미터 |
| 401 | 로그인 실패, 토큰 없음/만료/위조 (토큰 오류는 본문 없이 401) |
| 403 | 다른 사람의 글 수정/삭제 시도 |
| 404 | 없는 게시글 |
| 409 | 회원가입 시 아이디/이메일 중복 |

---

## 8. 백엔드 구현 포인트

### 8.1 엔티티 ↔ 테이블 매핑
| 테이블 컬럼 | JPA 매핑 | 비고 |
|---|---|---|
| `USER_ID`, `POST_ID` `GENERATED ALWAYS AS IDENTITY` | `@GeneratedValue(strategy = IDENTITY)` | INSERT 시 PK 컬럼을 보내지 않음. `GENERATED ALWAYS`라 값을 직접 넣으면 오류(ORA-32795) |
| `TB_POST.CONTENT` `CLOB` | `@Lob String` | |
| `TB_POST.USER_ID` FK | `@ManyToOne(fetch = LAZY) User author` | |
| `CREATED_AT`, `UPDATED_AT` | `@CreationTimestamp`, `@UpdateTimestamp` | Hibernate가 INSERT/UPDATE 시 자동 세팅 |
| `ROLE` | `String` (`ROLE_USER`/`ROLE_ADMIN`) | JWT `roles` 클레임으로 그대로 사용 |

`spring.jpa.hibernate.ddl-auto: validate` — 테이블은 SQL 스크립트로 관리하고, JPA는 기동 시 매핑이 테이블과 맞는지 **검증만** 합니다. 컬럼명/타입이 다르면 기동이 실패하므로 매핑 실수를 빨리 발견할 수 있습니다. (절대 `create`/`update`로 바꾸지 마세요 — 공유 DB입니다.)

### 8.2 조회 성능
- 목록/상세 조회는 `@EntityGraph(attributePaths = "author")`로 작성자를 **한 번의 JOIN 쿼리**로 가져옵니다(N+1 방지).
- 페이징 쿼리에는 별도 `countQuery`를 지정해 count 쿼리에 불필요한 JOIN이 붙지 않게 했습니다.
- 페이징은 Oracle 12c+ 문법(`OFFSET ... FETCH NEXT ...`)으로 Hibernate가 생성합니다.

### 8.3 조회수 증가
```java
@Modifying(clearAutomatically = true)
@Query("update Post p set p.viewCount = p.viewCount + 1 where p.id = :id")
```
엔티티를 수정(dirty checking)하면 `@UpdateTimestamp` 때문에 `UPDATED_AT`이 바뀌어 "수정됨"으로 보이므로, 단일 UPDATE 쿼리로 처리합니다. 동시 조회에도 DB 레벨에서 원자적으로 증가합니다.

### 8.4 권한 검사
- URL 단위: `SecurityConfig` — GET `/api/posts/**`, 로그인/회원가입만 `permitAll`, 나머지는 인증 필요
- 데이터 단위: `PostService.checkOwner()` — 작성자 ID(JWT `uid`)와 글의 `USER_ID` 비교, ADMIN은 통과
- 프론트의 수정/삭제 버튼 숨김은 **UX 용도**일 뿐이며, 실제 보안은 항상 서버에서 검사합니다.

### 8.5 비밀번호
`BCryptPasswordEncoder`(strength 10). 샘플 데이터의 해시(`$2a$10$...`)와 호환됩니다. 회원가입 시에도 같은 방식으로 저장합니다.

---

## 9. 프론트엔드 구현 포인트

### 9.1 화면/라우트
| 경로 | 화면 | 접근 |
|---|---|---|
| `/posts` | 목록 + 검색 + 페이지네이션 | 누구나 |
| `/posts/:id` | 상세 (작성자/ADMIN에게만 수정·삭제 버튼) | 누구나 |
| `/posts/new` | 등록 | 로그인 (`ProtectedRoute`) |
| `/posts/:id/edit` | 수정 (등록 화면 재사용) | 로그인 + 작성자/ADMIN |
| `/login`, `/signup` | 로그인/회원가입 | 누구나 |

로그인이 필요한 화면에 접근하면 로그인 페이지로 이동했다가, 로그인 후 원래 페이지로 돌아옵니다.

### 9.2 TanStack Query 사용 패턴 (`src/hooks/usePosts.ts`)
```ts
export const postKeys = {
  all: ['posts'],
  list: (params) => ['posts', 'list', params],
  detail: (id) => ['posts', 'detail', id],
}
```
- **R**: `usePostList`, `usePost` — `queryKey`에 page/keyword가 들어가 있어 조건이 바뀌면 자동 재조회. `keepPreviousData`로 페이지 이동 시 깜빡임 방지
- **C/U/D**: `useCreatePost`, `useUpdatePost`, `useDeletePost` — 성공 시 `invalidateQueries(['posts'])`로 목록/상세 캐시를 무효화 → 화면이 자동으로 최신화
- 목록의 page/keyword는 URL 쿼리스트링(`?page=1&keyword=...`)에 저장 → 새로고침·뒤로가기에도 유지

### 9.3 API 레이어 (`src/api/`)
- `client.ts`: axios 인스턴스, 요청 인터셉터(토큰 첨부), 응답 인터셉터(401 → 로그아웃), `toApiError()`로 모든 오류를 `{status, message, fieldErrors}`로 통일
- `posts.ts`, `auth.ts`: 백엔드 DTO와 1:1로 대응하는 TypeScript 타입 + API 함수

### 9.4 Vite 프록시
개발 중에는 `vite.config.ts`의 `proxy: { '/api': 'http://localhost:8081' }`로 브라우저가 같은 Origin(5174)에만 요청합니다. 따라서 개발 시 CORS 설정과 무관하게 동작합니다. (백엔드의 CORS 설정은 프론트를 별도 도메인에 배포할 때를 위한 것입니다.)

---

## 10. 한글(UTF-8) 처리

| 계층 | 설정 |
|---|---|
| 소스 | 모든 파일 UTF-8, `pom.xml`의 `project.build.sourceEncoding=UTF-8` |
| HTTP | `server.servlet.encoding.charset=UTF-8`, `force=true` / 프론트 `Content-Type: application/json; charset=UTF-8` |
| DB | `NLS_CHARACTERSET = AL32UTF8` 확인 완료. ojdbc는 Java 문자열(UTF-16) ↔ DB 문자셋 변환을 자동 처리 |
| HTML | `<html lang="ko">`, `<meta charset="UTF-8">` |

> `VARCHAR2(200)`은 기본적으로 **바이트** 단위입니다(`NLS_LENGTH_SEMANTICS=BYTE`). AL32UTF8에서 한글은 3바이트이므로 제목은 한글 기준 약 66자까지 들어갑니다. 프론트/백엔드 검증은 "200자"로 되어 있으므로, 한글 제목을 길게 쓰려면 컬럼을 `VARCHAR2(200 CHAR)`로 변경하는 것을 권장합니다.
> ```sql
> ALTER TABLE TB_POST MODIFY (TITLE VARCHAR2(200 CHAR));
> ```

---

## 11. 테스트 / 검증 결과

개발 완료 후 실제 Oracle 개발서버를 대상으로 다음을 확인했습니다.

**API (curl)**
- [x] guest01 로그인 성공 / 잘못된 비밀번호 401
- [x] `/auth/me` 토큰으로 사용자 조회
- [x] 토큰 없이 등록 401, 위조 토큰 401
- [x] 빈 제목/내용 등록 → 400 + `fieldErrors`
- [x] 한글·이모지 제목 등록 → 조회 → 수정 → 한글 키워드 검색 → 삭제(204) → 재조회 404
- [x] 남의 글(admin 작성) 수정 → 403, ADMIN이 다른 사용자 글 삭제 → 204
- [x] 중복 아이디 회원가입 → 409

**UI (브라우저)**
- [x] 로그인 → 목록(11건, 2페이지) 표시
- [x] 새 글 작성 → 상세 이동, 줄바꿈 유지 → 수정 → "수정 일시" 표시 → 삭제 후 목록 복귀
- [x] 다른 사람 글: 수정/삭제 버튼 미노출, 수정 URL 직접 접근 시 차단 메시지

---

## 12. 문제 해결 (Troubleshooting)

| 증상 | 원인 / 해결 |
|---|---|
| `Port 8081 was already in use` | 다른 프로세스가 사용 중. `SERVER_PORT=8082`로 실행하고 `vite.config.ts` 프록시도 변경 |
| `ORA-12514 listener does not currently know of service` | URL을 서비스명 방식 `@//host:1521/XEPDB1`로 지정했는지 확인 |
| `Schema-validation: missing column/table` | 접속 계정에 테이블이 없음. `../sql/스키마.sql` 실행 여부 확인 |
| `HHH000511 ... 18.0.0 ... no longer supported` 경고 | Oracle 18c가 Hibernate 7 공식 지원 범위 밖이라는 경고. 동작에는 문제 없음(§2 제안 참고) |
| 로그인 401 (계정은 존재) | DB의 PASSWORD가 BCrypt 해시인지 확인. 평문이면 로그인 불가 |
| Windows Git Bash에서 curl로 한글 전송 시 400 | 셸이 한글을 UTF-8이 아닌 CP949로 전달하기 때문. JSON은 UTF-8 파일로 저장해 `--data-binary @file.json`으로, 쿼리스트링은 URL 인코딩(`%EC%88%98...`)해서 전송 |
| 프론트에서 "서버에 연결할 수 없습니다." | 백엔드 미기동 또는 포트 불일치 |
| 새로고침 후 로그아웃됨 | 토큰 만료(기본 120분). 재로그인 |

---

## 13. 다음 단계 (확장 아이디어)

- 댓글(TB_COMMENT) 추가 — 동일한 Entity/Repository/Service/Controller/Hook 패턴을 그대로 복제
- Refresh Token + HttpOnly 쿠키로 토큰 저장 방식 강화 (현재 localStorage는 XSS에 취약할 수 있음)
- Flyway로 스키마 버전 관리, Testcontainers(Oracle Free)로 통합 테스트
- springdoc-openapi로 Swagger UI 자동 문서화
- 낙관적 락(`@Version`)으로 동시 수정 충돌 방지
