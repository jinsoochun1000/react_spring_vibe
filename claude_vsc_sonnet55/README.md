# CRUD Tutorial (React + Spring Boot + Oracle)

로그인(JWT) 후 게시글을 등록·조회·수정·삭제하는 게시판 튜토리얼입니다. 개발자 가이드 용도로 작성했습니다.

## 1. 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React 19, Vite, react-router-dom, axios |
| Backend | Java 17, Spring Boot 3.3.5, Spring Web / Data JPA / Security / Validation |
| 인증 | Stateless JWT (jjwt 0.12), 비밀번호 BCrypt |
| DB | Oracle 18c XE (PDB: XEPDB1), JDBC ojdbc11 |
| 문자셋 | 전 구간 UTF-8 (DB는 AL32UTF8, 서버 응답 `charset=UTF-8` 강제) |

스택 제안: 요청하신 구성이 이 용도에 적합해 그대로 사용했습니다. 참고로 Oracle 18c는 Hibernate 6 공식 지원(19+) 밖이라 기동 시 경고(`HHH000511`)가 나옵니다. 이 프로젝트의 쿼리는 동작하지만, 신규 환경이라면 Oracle 19c 이상 또는 PostgreSQL을 권장합니다.

## 2. 구조

```
backend/                         Spring Boot (포트 8090)
  src/main/java/com/example/crud/
    entity/        User, Post                 TB_USER, TB_POST 매핑
    repository/    UserRepository, PostRepository
    service/       PostService                비즈니스 로직 + 권한 검사
    controller/    AuthController, PostController
    security/      SecurityConfig, JwtProvider, JwtAuthFilter, DbUserDetailsService
    dto/ exception/
  src/main/resources/application.yml
frontend/                        React (Vite, 포트 5173)
  src/api.js                     axios 인스턴스, JWT 자동 첨부, 401 처리
  src/pages/                     Login / PostList / PostDetail / PostForm
db/fix-guest01-password.sql      guest01 비밀번호 보정 SQL (아래 5절 참고)
```

## 3. 실행 방법

사전 준비: JDK 17, Node 18+ (Maven은 `mvnw` 포함).

```bash
# 1) 백엔드 (http://localhost:8090)
cd backend
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run

# 2) 프론트엔드 (http://localhost:5173)
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속. 개발 서버가 `/api` 를 백엔드로 프록시하므로 CORS 설정이 필요 없습니다.

설정은 환경변수로 덮어쓸 수 있습니다.

| 변수 | 기본값 | 설명 |
|---|---|---|
| `SERVER_PORT` | 8090 | 백엔드 포트 (바꾸면 프론트 `API_TARGET` 도 같이 지정) |
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | 개발서버 접속정보 | DB 접속 |
| `JWT_SECRET` | 개발용 임의값 | 32바이트 이상. 운영에서는 반드시 교체 |
| `API_TARGET` | `http://localhost:8090` | 프론트 dev 프록시 대상 |

> 보안 주의: `application.yml` 의 기본값에 개발 DB 계정이 들어 있습니다. 저장소를 공개하기 전에 제거하고 환경변수로만 주입하세요.

## 4. DB 테이블 (기존 테이블 사용, `ddl-auto: none`)

- `TB_USER`: USER_ID(IDENTITY PK), USERNAME(UQ), PASSWORD(BCrypt), EMAIL(UQ), ROLE(`ROLE_USER`/`ROLE_ADMIN`), CREATED_AT, UPDATED_AT
- `TB_POST`: POST_ID(IDENTITY PK), TITLE(200), CONTENT(CLOB), USER_ID(FK→TB_USER), VIEW_COUNT, CREATED_AT, UPDATED_AT

ID는 Oracle IDENTITY 컬럼이라 JPA에서 `GenerationType.IDENTITY` 를 사용합니다. `CREATED_AT`/`UPDATED_AT` 은 `@PrePersist`/`@PreUpdate` 에서 채웁니다.

## 5. 알려진 이슈: guest01 로그인

DB의 `TB_USER` 비밀번호 해시는 10개 계정이 모두 같은 값이고, `password123!` 와 일치하지 않는 것을 BCrypt 검증으로 확인했습니다. 따라서 해시를 그대로 두면 `guest01 / password123!` 로 로그인할 수 없습니다.

`db/fix-guest01-password.sql` 을 DB에서 실행하면 guest01 한 행만 올바른 해시로 바뀝니다. 원복용 기존 해시도 파일에 적어 두었습니다. 이 스크립트는 자동 실행되지 않으며, 실행 전 확인이 필요합니다.

## 6. REST API

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/auth/login` | 불필요 | `{username,password}` → `{token,username,role}` |
| GET | `/api/auth/me` | 필요 | 토큰 확인 |
| GET | `/api/posts?keyword=&page=0&size=10` | 불필요 | 목록(최신순, 제목 검색, 페이징) |
| GET | `/api/posts/{id}` | 불필요 | 상세 (조회수 +1) |
| POST | `/api/posts` | 필요 | 등록 `{title,content}` |
| PUT | `/api/posts/{id}` | 작성자/관리자 | 수정 |
| DELETE | `/api/posts/{id}` | 작성자/관리자 | 삭제 |

오류 응답은 `{ "message": "..." }` 형식이며 상태코드는 400(검증), 401(미인증/로그인 실패), 403(권한 없음), 404(없음)입니다. 조회는 비로그인으로도 가능하고, 쓰기는 로그인이 필요합니다.

## 7. 구현 포인트

- **인증 흐름**: 로그인 시 `AuthenticationManager` 가 `DbUserDetailsService` 로 TB_USER 를 조회해 BCrypt 비교 → JWT 발급(기본 120분) → 프론트는 localStorage 에 저장하고 axios 인터셉터가 `Authorization: Bearer` 로 첨부. 서버는 세션을 쓰지 않습니다(`STATELESS`).
- **권한**: 수정/삭제는 `PostService.checkOwner` 에서 작성자 본인 또는 `ROLE_ADMIN` 만 허용. 프론트도 버튼을 숨기지만 최종 검사는 서버가 합니다.
- **조회수**: `UPDATE ... SET view_count = view_count + 1` 단일 쿼리로 증가시켜 동시 요청에서도 값이 유실되지 않습니다. React StrictMode 의 이펙트 이중 실행으로 개발 중 조회수가 두 번 오르지 않게 `useRef` 로 막았습니다.
- **N+1 방지**: 목록/상세는 `@EntityGraph(attributePaths = "author")` 로 작성자를 함께 조회합니다.
- **검색**: 제목 부분일치(대소문자 무시)만 지원합니다. CLOB 본문 검색은 성능·함수 제약이 있어 제외했습니다.
- **입력 검증**: 제목 200자, 내용 4000자(서버 `@Size`, 프론트 `maxLength`).

## 8. 빌드·배포

```bash
cd backend && ./mvnw package          # target/crud-tutorial-0.0.1.jar
cd frontend && npm run build          # dist/ (정적 파일)
java -Dfile.encoding=UTF-8 -jar backend/target/crud-tutorial-0.0.1.jar
```

`dist/` 는 Nginx 등으로 서빙하면서 `/api` 를 백엔드로 리버스 프록시하는 구성을 권장합니다.

## 9. 개발 중 확인한 사항

- 로컬에서 8080/8081 포트를 다른 프로세스가 사용 중이어서 기본 포트를 8090 으로 정했습니다.
- 테스트 상태: 백엔드·프론트 빌드 성공, 백엔드 기동과 Oracle 연결, 비로그인 목록 조회(`GET /api/posts`), 인증 없는 쓰기 요청 401, 잘못된 비밀번호 401을 확인했습니다. 로그인 이후의 등록·수정·삭제 흐름은 5절의 비밀번호 문제 때문에 아직 실제 DB로 검증하지 못했습니다.
