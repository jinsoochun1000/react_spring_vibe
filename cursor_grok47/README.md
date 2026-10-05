# 게시판 CRUD 개발자 가이드

Stateless JWT 로그인이 있는 게시판입니다. React 화면에서 글을 조회·작성·수정·삭제하고, Spring Boot API가 Oracle에 저장합니다.

## 개발 결과 요약

| 영역 | 결과 |
| --- | --- |
| 화면 | 로그인, 글 목록(페이지), 상세, 작성, 수정, 삭제, 로그아웃 |
| 인증 | 세션 없는 JWT(HS256, 1시간). 로그인만 공개, 게시글 API는 인증 필요 |
| 권한 | 수정·삭제는 작성자만 가능 |
| 저장소 | Oracle `XEPDB1` / `USERSTK7`. 기동 시 테이블·시퀀스 생성, `guest01` 시드 |
| 확인 | 브라우저에서 로그인 → 작성 → 목록 → 상세 → 수정 → 삭제 → 로그아웃까지 수행 |

로컬 JDK가 없어 Temurin 21을 설치했습니다. start.spring.io는 Spring Boot 4만 받기 때문에, 백엔드는 Spring Boot **3.5.16** 부모 POM으로 직접 구성했습니다.

## 기술 스택

- Front: React 19, Vite 8, TypeScript, Tailwind CSS 4, TanStack Query 5, React Router 7
- Back: Java 21, Spring Boot 3.5.16, Spring Security, Spring Data JPA, Hibernate 6, Bean Validation
- JWT: jjwt 0.12.6 (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`)
- DB: Oracle 18c XE, JDBC `ojdbc11`
- 문자 인코딩: UTF-8

## 디렉터리

```
backend/     Spring Boot API (패키지 com.example.board)
frontend/    Vite React 화면
.editorconfig
```

백엔드 패키지:

| 패키지 | 역할 |
| --- | --- |
| `config` | SecurityFilterChain, CORS, BCrypt, AuthenticationManager |
| `security` | JWT 발급·검증, OncePerRequestFilter, UserDetailsService |
| `auth` | `POST /api/auth/login`, `GET /api/auth/me` |
| `user` | `APP_USER` 엔티티, 리포지토리, `guest01` 시드 |
| `post` | `BOARD_POST` CRUD |
| `common` | `{ message }` 오류 응답 |

프론트:

| 경로 | 역할 |
| --- | --- |
| `src/api/client.ts` | `fetch` 래퍼. Bearer 헤더, 401 시 토큰 삭제 |
| `src/auth/AuthContext.tsx` | 토큰·사용자명을 `localStorage`에 보관 |
| `src/pages/*` | 로그인, 목록, 상세, 작성/수정 폼 |
| `src/components/Layout.tsx` | 헤더, 사용자명, 로그아웃 |

## 사전 준비

- JDK 21. 이 PC에는 Eclipse Temurin 21.0.12가 `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot`에 설치되어 있고, 시스템 PATH에 포함됩니다. 새 터미널에서 `java -version`이 21인지 확인합니다.
- Node.js 24, npm 11.
- Oracle 18c XE가 `192.168.45.2:1521`, 서비스명 `XEPDB1`로 떠 있어야 합니다.
- 스키마 계정 `USERSTK7`은 테이블과 시퀀스를 만들 수 있어야 합니다.

## 실행

백엔드와 프론트는 각각 터미널에서 띄웁니다. 프론트 개발 서버가 `/api`를 8080으로 프록시하므로, 브라우저는 5173만 열면 됩니다.

```powershell
backend\mvnw.cmd spring-boot:run
```

```powershell
cd frontend
npm install
npm run dev
```

- 화면: http://localhost:5173
- API: http://localhost:8080
- 로그인: `guest01` / `password123!`

`npm run build`는 `tsc -b` 후 Vite 프로덕션 빌드를 만듭니다. 빌드 결과물은 API 프록시가 없으므로, 배포 시에는 같은 출처로 두거나 백엔드 CORS(`http://localhost:5173`)를 실제 출처로 바꿉니다.

## 한글과 UTF-8

소스, HTTP, JVM 기본 문자를 UTF-8로 고정했습니다. Windows 기본 코드 페이지(CP949)와 섞이지 않게 하는 설정입니다.

- `.editorconfig`의 `charset = utf-8`
- `frontend/index.html`의 `<meta charset="UTF-8" />`, `lang="ko"`
- `backend/pom.xml`의 `project.build.sourceEncoding`, `project.reporting.outputEncoding` = `UTF-8`
- `spring-boot-maven-plugin`의 JVM 인자: `-Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8`
- `application.yml`의 `server.servlet.encoding`: charset `UTF-8`, `force` / `force-request` / `force-response` `true`
- JSON 오류를 필터에서 직접 쓸 때도 `response.setCharacterEncoding("UTF-8")`를 호출합니다.

JDBC는 Java 문자열(UTF-16)을 DB 문자셋으로 변환합니다. XE 기본값인 `AL32UTF8`이면 제목·본문 한글이 그대로 저장됩니다. DB 문자셋이 `KO16MSWIN949`여도 드라이버가 변환하지만, 이 프로젝트의 계약은 UTF-8입니다.

## 데이터베이스

접속 정보는 `backend/src/main/resources/application.yml`에 있습니다.

```
jdbc:oracle:thin:@//192.168.45.2:1521/XEPDB1
username: USERSTK7
```

`spring.jpa.hibernate.ddl-auto`는 `update`입니다. 첫 기동에서 아래 객체를 만들고, 이후 기동에서는 없는 컬럼만 보강합니다. 데이터는 지우지 않습니다.

| 객체 | 설명 |
| --- | --- |
| `APP_USER` | `USERNAME`(unique, 50), `PASSWORD`(BCrypt, 100), `ROLE`(30) |
| `APP_USER_SEQ` | 사용자 ID. `allocationSize = 1` |
| `BOARD_POST` | `TITLE`(200), `CONTENT`(CLOB), `AUTHOR_ID`, `CREATED_AT`, `UPDATED_AT` |
| `BOARD_POST_SEQ` | 글 ID. `allocationSize = 1` |

시퀀스 증가 값을 1로 둔 이유: Hibernate 기본 `allocationSize` 50과 Oracle 시퀀스 `INCREMENT BY 1`이 어긋나면 ID가 건너뛰거나 충돌합니다.

`open-in-view`는 꺼져 있습니다. 작성자 이름은 서비스의 트랜잭션 안에서 DTO로 복사한 뒤 응답합니다.

`UserSeed`는 `guest01`이 없을 때만 BCrypt로 `password123!`을 저장합니다. 이미 있으면 비밀번호를 덮어쓰지 않습니다. role 값은 `USER`이고, Spring Security가 `ROLE_USER`로 올립니다.

Hibernate는 Oracle 18.0이 지원 하한(19)보다 낮다고 경고합니다. 이 환경에서는 접속, 시드, CRUD가 동작했습니다. 방언은 `OracleDialect`를 명시했습니다.

## 인증

세션을 만들지 않습니다. CSRF, form login, HTTP Basic, 로그아웃 엔드포인트는 꺼져 있습니다. 토큰은 `Authorization: Bearer <accessToken>` 헤더로만 전달합니다.

1. `POST /api/auth/login`이 아이디·비밀번호를 검증하고 HS256 JWT를 발급합니다.
2. `JwtAuthenticationFilter`가 헤더의 토큰을 검증하고 `SecurityContext`에 사용자를 넣습니다.
3. 만료 토큰은 `로그인이 만료되었습니다.`, 그 외 잘못된 토큰은 `인증이 필요합니다.`
4. 토큰이 없는 보호 API도 `인증이 필요합니다.`(401)입니다.

JWT 설정(`application.yml`):

- `app.jwt.secret`: HS256용 비밀키. 32바이트 이상이어야 합니다.
- `app.jwt.expiration-ms`: `3600000`(1시간)

로그인 응답:

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "username": "guest01"
}
```

`GET /api/auth/me` 응답: `{ "id": 1, "username": "guest01" }`

프론트는 토큰을 `localStorage.accessToken`, 사용자명을 `localStorage.username`에 둡니다. 앱이 뜨면 `/api/auth/me`로 토큰을 확인합니다. 401이면 두 값을 지우고 `auth:logout` 이벤트를 보내 로그인 화면으로 보냅니다. 이 저장 방식은 튜토리얼용이며, XSS에 토큰이 노출될 수 있습니다.

CORS는 `http://localhost:5173`의 `GET POST PUT DELETE OPTIONS`를 허용합니다. 개발 중 브라우저는 Vite 프록시를 타므로 같은 출처 요청입니다.

## API

공통 오류 본문: `{ "message": "..." }`

검증 실패는 400, 인증 실패는 401, 작성자가 아니면 403, 글이 없으면 404입니다.

### 인증

| 메서드 | 경로 | 인증 | 설명 |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | 공개 | `{ "username", "password" }` |
| GET | `/api/auth/me` | 필요 | 현재 사용자 |

### 게시글

목록은 `createdAt` 내림차순입니다. `page`는 0부터, `size` 기본 10, 허용 범위는 1~50입니다.

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/api/posts?page=0&size=10` | 페이지 목록 |
| GET | `/api/posts/{id}` | 상세 |
| POST | `/api/posts` | 작성. 201. 본문 `{ "title", "content" }` |
| PUT | `/api/posts/{id}` | 수정. 작성자만 |
| DELETE | `/api/posts/{id}` | 삭제. 작성자만. 204, 본문 없음 |

글 한 건:

```json
{
  "id": 1,
  "title": "제목",
  "content": "내용",
  "author": "guest01",
  "createdAt": "2026-10-05T07:09:00Z",
  "updatedAt": "2026-10-05T07:10:00Z"
}
```

목록 응답:

```json
{
  "content": [],
  "page": 0,
  "size": 10,
  "totalElements": 0,
  "totalPages": 0
}
```

검증 메시지:

- 제목 없음: `제목을 입력하세요.`
- 제목 200자 초과: `제목은 200자 이하로 입력하세요.`
- 내용 없음: `내용을 입력하세요.`
- 아이디/비밀번호 공백: `아이디를 입력하세요.` / `비밀번호를 입력하세요.`
- 자격 증명 불일치: `아이디 또는 비밀번호가 올바르지 않습니다.`
- 글 없음: `글을 찾을 수 없습니다.`
- 타인 글 수정·삭제: `본인 글만 수정하거나 삭제할 수 있습니다.`

제목과 내용은 저장 전에 `trim`합니다. Oracle은 빈 문자열을 NULL로 보므로, 공백만 있는 값은 `@NotBlank`에서 거절합니다.

## 프론트엔드

화면 문구는 한국어입니다.

| 경로 | 화면 |
| --- | --- |
| `/login` | 로그인. 이미 토큰이 있으면 `/`로 이동 |
| `/` | 글 목록, 빈 목록, 페이지(`?page=`), 글쓰기 |
| `/posts/new` | 작성 |
| `/posts/:id` | 상세. 작성자에게만 수정·삭제 |
| `/posts/:id/edit` | 수정 |

TanStack Query 키:

- 목록: `['posts', page]`
- 상세: `['post', id]`

작성·수정·삭제 성공 시 `['posts']`와 해당 `['post', id]`를 무효화합니다. 쿼리 재시도는 꺼져 있어 401이 세 번 반복되지 않습니다.

로그인 화면에는 데모 계정 안내가 있습니다. 삭제 전에 `이 글을 삭제할까요?`를 확인합니다.

## 요청 흐름

```
브라우저 → Vite :5173
        → proxy /api → Spring Boot :8080
        → JwtAuthenticationFilter
        → Controller → Service(트랜잭션) → JPA → Oracle
```

## 동작 확인 기록

2026-10-05에 아래 순서를 브라우저에서 확인했습니다.

1. 미로그인 상태로 `/`에 들어가면 `/login`으로 이동
2. `guest01` 로그인 후 빈 목록(`전체 0건`)
3. 글 작성 후 `/posts/1` 상세에 제목·본문·작성자 표시
4. 제목 수정 후 상세에 수정 시각 표시
5. 목록에 수정된 제목이 보임
6. 삭제 후 다시 빈 목록
7. 로그아웃 후 로그인 화면. 헤더에는 `guest01`이 표시되었음

같은 흐름을 다시 볼 때는 위 실행 명령으로 두 서버를 띄운 뒤 http://localhost:5173 에서 로그인하면 됩니다.
