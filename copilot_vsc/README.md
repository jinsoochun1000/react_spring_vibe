# 기록실 — React + Spring Boot + Oracle CRUD Tutorial

React 화면에서 로그인하고 Oracle `TB_POST` 게시글을 조회·작성·수정·삭제하는 한국어 학습용 풀스택 예제입니다. 제목·작성자 검색, 페이지 이동, 내 글 필터, 조회수, 작성자 권한 검사와 UTF-8 처리를 포함합니다.

## 개발 결과

| 영역 | 구현 |
| --- | --- |
| 로그인 | `TB_USER`의 BCrypt 해시로 인증하고 HttpOnly 세션 쿠키 사용 |
| 보안 | Spring Security, CSRF 토큰, 로그아웃 시 세션 무효화 |
| 목록 | 제목·작성자 검색, 페이지네이션, 내 글 필터 및 통계 |
| 상세 | 작성자·본문·작성/수정일·조회수 표시, 상세 조회 시 조회수 증가 |
| 작성·수정 | 필수값 검사, 제목 UTF-8 200바이트 제한, 본문 20,000자 제한 |
| 삭제 | 확인 UI 및 서버 측 작성자 본인 여부 확인 |
| 오류 처리 | 검증·권한·DB 오류를 JSON 메시지로 응답하고 DB 오류는 서버 로그에 기록 |
| 인코딩 | 브라우저, Servlet, JSON 응답에서 UTF-8 사용 |
| 테스트 | H2 Oracle 호환 모드의 백엔드 MockMvc 테스트, 프런트엔드 Vitest 및 선택적 Playwright E2E |

회원가입, 비밀번호 재설정, 사용자 관리, 첨부파일과 댓글은 범위에 포함하지 않습니다. 로그인 화면에는 아이디만 미리 표시하고 비밀번호는 저장하거나 미리 입력하지 않습니다.

## 기술 선택

- **Frontend:** React 19, TypeScript, Vite 7, lucide-react, CSS
- **Backend:** Java 17, Spring Boot 3.5, Spring Security, Spring JDBC, Bean Validation
- **Database:** Oracle 18c XE, Oracle JDBC Driver 21.x, HikariCP
- **Tests:** JUnit 5, Spring MockMvc, H2, Vitest, Playwright

제안하신 React·Spring Boot·Oracle 조합을 유지합니다. 이미 Oracle 개발 서버를 사용할 수 있으므로 이 튜토리얼에서 DB를 바꾸는 이점은 작습니다. CRUD와 SQL을 학습하기 위해 ORM 대신 Spring JDBC를 사용해 실제 쿼리를 드러냈습니다. 브라우저와 API가 같은 출처로 배포되는 구조라 JWT를 브라우저 저장소에 보관하기보다 HttpOnly 세션 쿠키와 CSRF 보호를 사용하는 편이 단순하고 안전합니다. 규모가 커지면 서비스·리포지터리 계층과 DB 스키마 마이그레이션 도구를 추가하는 것을 권합니다.

## 사전 준비

- Java 17 이상
- Node.js 20.19 이상 또는 22.12 이상
- Oracle 18c XE 접속 권한 및 `TB_USER`, `TB_POST` 테이블
- Maven Wrapper가 필요로 하는 Maven 배포본과 라이브러리를 내려받을 인터넷 연결

## 데이터베이스

애플리케이션은 기동 시 DDL이나 샘플 데이터를 실행하지 않으며 테이블을 초기화하지 않습니다. 제공된 개발 스키마를 그대로 사용합니다.

- `TB_USER`: `USER_ID`, `USERNAME`, `PASSWORD`(BCrypt 해시), `EMAIL`, `ROLE`, `CREATED_AT`, `UPDATED_AT`
- `TB_POST`: `POST_ID`, `TITLE`, `CONTENT`(CLOB), `USER_ID`, `VIEW_COUNT`, `CREATED_AT`, `UPDATED_AT`
- `TB_POST.USER_ID`는 `TB_USER.USER_ID`를 참조해야 합니다.

신규·빈 스키마에만 [database/schema.sql](./database/schema.sql)을 실행하세요. 기존 테이블에 실행하면 이름 충돌로 실패하므로 먼저 실제 컬럼·제약조건을 확인하세요. 로그인 계정은 이미 DB에 등록되어 있어야 하며 `TB_USER.PASSWORD`에는 Spring BCrypt 형식의 해시가 저장되어야 합니다.

### 로컬 DB 설정

프로젝트 폴더에서 `.env.example`을 `.env`로 복사하고 `DB_PASSWORD`에 DB 계정 암호를 입력합니다.

```powershell
Copy-Item .env.example .env
notepad .env
```

`.env`는 Git에서 제외됩니다. 비밀번호를 README, 소스 코드, 커밋 또는 화면 캡처에 넣지 마세요. `.env` 대신 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` 환경변수를 직접 설정할 수도 있습니다. `COOKIE_SECURE=false`는 로컬 HTTP 개발 설정입니다. HTTPS 배포에서는 `COOKIE_SECURE=true`로 지정하고 TLS 종단 구성을 확인하세요.

## 빌드 및 테스트

프로젝트 루트에서 다음을 실행합니다.

```powershell
.\scripts\build.ps1
```

스크립트는 `npm ci`, 프런트엔드 TypeScript/Vite 빌드, Vitest, Maven 패키지 빌드와 백엔드 테스트를 실행합니다. 테스트는 메모리 H2를 사용하므로 Oracle 서버나 로컬 `.env` 없이 실행할 수 있습니다.

컴포넌트를 따로 확인할 때:

```powershell
cd frontend
npm.cmd ci
npm.cmd run build
npm.cmd test
```

```powershell
cd backend
.\mvnw.cmd -B -ntp test
```

실제 Oracle을 사용하는 선택적 브라우저 E2E는 API와 Vite 서버를 실행한 뒤 `E2E_PASSWORD` 환경변수를 로컬 터미널에 설정하고 `npm.cmd run test:e2e`를 실행합니다. 이 환경변수는 테스트 계정 암호이며 저장소에 기록하지 마세요. 테스트는 임시 게시글을 만들고 삭제합니다.

## 실행

먼저 DB 접속용 `.env`를 준비한 후 빌드합니다. 빌드된 단일 JAR를 실행하면 Spring Boot가 정적 React 화면과 `/api`를 함께 제공합니다.

```powershell
.\scripts\start.ps1
```

- 웹: http://127.0.0.1:18080
- DB 상태: http://127.0.0.1:18080/api/health
- 로그인: 기존 `TB_USER` 계정 사용
- 종료: 실행 중인 터미널에서 `Ctrl+C`

개발 모드에서는 backend와 frontend를 각각 터미널에서 실행합니다.

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Vite 주소는 http://127.0.0.1:15173이며 `/api` 요청을 `http://127.0.0.1:18080`으로 프록시합니다. 포트를 바꿀 때는 `SERVER_PORT`와 `frontend/vite.config.ts`의 프록시 설정을 함께 변경합니다.

## API

인증되지 않은 `/api/**` 요청은 `401`을 반환합니다. 상태 변경 요청은 세션의 CSRF 토큰이 필요합니다. API의 오류 응답은 `{ "message": "..." }` 형태입니다.

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| `GET` | `/api/auth/csrf` | CSRF 토큰 발급 |
| `POST` | `/api/auth/login` | 폼 필드 `username`, `password`로 로그인 |
| `GET` | `/api/auth/me` | 로그인 사용자 정보 |
| `POST` | `/api/auth/logout` | 로그아웃 및 세션 무효화 |
| `GET` | `/api/health` | Oracle 연결 상태 확인 |
| `GET` | `/api/posts?q=&page=0&size=8&mine=false` | 게시글 검색·페이지 조회 |
| `GET` | `/api/posts/{id}` | 상세 조회 및 조회수 증가 |
| `POST` | `/api/posts` | `{ "title": "...", "content": "..." }` 작성 |
| `PUT` | `/api/posts/{id}` | 작성자 본인의 게시글 수정 |
| `DELETE` | `/api/posts/{id}` | 작성자 본인의 게시글 삭제 |

`page`는 0부터 시작하고 `size`는 1~50입니다. 검색어는 최대 100자입니다. 제목과 작성자 검색은 PreparedStatement 바인딩을 사용합니다. 게시글 생성 시 작성자 ID는 요청 본문이 아니라 인증된 세션에서 결정됩니다.

## 폴더 구조

```text
.
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/java/kr/co/tutorial/crud/
│       │   ├── CrudApplication.java       # Spring Boot 시작점
│       │   ├── SecurityConfig.java        # DB 로그인·세션·CSRF
│       │   ├── AuthController.java        # 로그인 사용자·헬스 확인
│       │   ├── PostController.java        # 게시글 SQL·CRUD·권한
│       │   └── ApiExceptionHandler.java   # API 오류 응답
│       ├── main/resources/application.yml # 외부 DB 설정
│       └── test/                          # H2 기반 API 테스트
├── frontend/
│   ├── src/App.tsx                        # 로그인·게시판 화면
│   ├── src/api.ts                         # API·CSRF 클라이언트
│   ├── src/styles.css                     # 반응형 스타일
│   └── e2e/crud.spec.ts                   # 선택적 실제 DB E2E
├── database/schema.sql                    # 빈 스키마 설치용 DDL
├── scripts/build.ps1
├── scripts/start.ps1
└── .env.example
```

## 보안·운영 참고

- Oracle 주소와 계정은 환경 설정으로 전달하고 비밀번호는 `.env` 또는 비밀 저장소에 둡니다.
- 사용자가 공유한 기존 접속 암호는 노출된 것으로 간주해 교체하고, 저장소·셸 기록·공유된 로그에 남았는지 점검하세요.
- `guest01`의 실제 암호는 데이터베이스에 저장된 BCrypt 해시와 일치해야 합니다. DB 권한에는 애플리케이션이 사용하는 테이블의 최소 권한만 부여하세요.
- 프로덕션은 HTTPS를 적용하고 `COOKIE_SECURE=true`로 설정하세요. 개발용 `127.0.0.1` 바인딩을 외부 공개 주소로 변경하지 마세요.
- 2026-10 의존성 점검에서 프런트엔드는 패치 후 알려진 CVE가 없었습니다. Spring Boot 3.5.16이 관리하는 Spring Framework 6.2.19의 Spring MVC에는 `CVE-2026-47884`가 남아 있으며, 확인한 권고 수정 버전은 Spring Framework 7.0.9 이상입니다. 이는 Spring Boot 3.x 범위를 벗어나므로 이 프로젝트에서는 임의로 프레임워크 버전을 섞지 않았습니다. 이 REST 전용 앱은 `XsltView`를 사용하지 않지만, 해당 의존성이 포함된 상태이므로 프로덕션 배포 전 Spring Boot 4 전환 승인 또는 호환되는 3.x 패치를 확인하세요.
