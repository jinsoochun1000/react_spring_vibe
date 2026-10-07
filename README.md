# React · Spring Boot · Oracle CRUD 구현 비교

React 프론트엔드와 Java Spring Boot 백엔드로 만든 **7개의 독립적인 CRUD 구현**을 비교하는 저장소입니다. 공통 요구사항은 [prompt.md](prompt.md)에 있으며, 게시판 구현 6개와 태스크 관리 구현 1개가 들어 있습니다. 각 프로젝트는 자체 `frontend/`, `backend/`, 의존성 설정과 실행 구성을 가집니다. 루트에서 전체 프로젝트를 한 번에 실행하는 통합 빌드는 없습니다.

이 문서는 **2026-10-07 현재 작업 폴더의 소스·설정·SQL·테스트 파일을 정적으로 비교한 개발자 안내서**입니다. 버전은 저장소에 선언된 값이며 최신 버전 여부를 뜻하지 않습니다. 기존 하위 README의 실행 성공 기록과 이번 문서 작성 중 확인한 사항은 구분합니다. 이번 작업에서는 애플리케이션 실행, DB 접속, 빌드 및 테스트를 수행하지 않았습니다.

## 1. 루트와 하위 폴더

```text
react_spring_vibe/
├── README.md                 # 전체 구조·구현 비교·실행 안내
├── prompt.md                 # 최초 요구사항 및 개정된 요청
├── .gitignore                # 빌드 결과, 의존성, 로컬 환경설정 제외
├── .github/modernize/         # Java 업그레이드 작업 기록 및 보조 스크립트
├── sql/                      # TB_USER·TB_POST 공통 DDL 및 샘플 SQL
├── claude_opus55/            # JPA + Spring Resource Server JWT 게시판
├── claude_vsc_opus55/        # JPA + JJWT 게시판
├── codex_gpt6astra/          # JDBC + 세션, 계층을 분리한 게시판
├── codex_vsc_astra/          # JDBC + 세션, 단일 JAR 게시판
├── copilot_vsc/              # 유사한 세션 게시판, 검색 SQL·의존성 차이
├── cursor_grok47/            # 별도 테이블을 사용하는 JPA + JWT 게시판
└── gemini38flash/            # JPA + JWT 태스크 관리
```

| 하위 경로 | 역할 및 포함 범위 |
| --- | --- |
| 각 프로젝트의 `frontend/` | React·TypeScript·Vite 앱. 모두 `package.json`, `package-lock.json` 포함 |
| 각 프로젝트의 `backend/` | Spring Boot Maven 앱. 모두 `pom.xml`, Maven Wrapper 포함 |
| 각 프로젝트의 `README.md` | 구현별 상세 개발자 가이드 |
| `codex_gpt6astra/scripts/` | 통합 빌드, 백엔드 실행, DB 조사용 Java 소스 |
| `codex_gpt6astra/docs/` | 빈 스키마용 참조 DDL |
| `codex_vsc_astra/scripts/`, `copilot_vsc/scripts/` | 프론트 빌드·단위 테스트·백엔드 패키징 및 JAR 실행 |
| `codex_vsc_astra/database/`, `copilot_vsc/database/` | 빈 스키마 설치용 DDL |
| `capture/` | `claude_opus55` 4장, `codex_gpt6astra` 3장, `codex_vsc_astra` 4장, `cursor_grok47` 3장, `gemini38flash` 6장의 화면 기록 |
| `gemini38flash/frontend/README.md`, `gemini38flash/backend/README.md` | 프론트·백엔드별 추가 설명 |

`node_modules/`, `target/`, `dist/` 등은 설치·빌드 산출물입니다. 구현 비교는 소스와 설정을 기준으로 합니다. 폴더명은 구현 식별자로 사용하며, 폴더명만으로 개발 도구의 성능이나 결과물의 우열을 판단하지 않습니다.

## 2. 기술 스택 비교

| 폴더 | Java / Spring Boot | DB 접근 | 인증 | 프론트 기반 |
| --- | --- | --- | --- | --- |
| `claude_opus55` | 17 / 4.1.1 | Spring Data JPA | Resource Server·Nimbus JWT | React 19, Vite 8, TypeScript 6 |
| `claude_vsc_opus55` | 17 / 4.1.1 | Spring Data JPA | JJWT 0.13.0 + 커스텀 필터 | React 19, Vite 8, TypeScript 6 |
| `codex_gpt6astra` | 17 / 3.5.16 | Spring JDBC·JdbcTemplate | 서버 세션 + CSRF | React 19, Vite 7, TypeScript 5.9 |
| `codex_vsc_astra` | 17 / 3.5.16 | Spring JDBC·JdbcTemplate | 서버 세션 + CSRF | React 19, Vite 7, TypeScript 5.9 |
| `copilot_vsc` | 17 / 3.5.16 | Spring JDBC·JdbcTemplate | 서버 세션 + CSRF | React 19, Vite 7, TypeScript 5.9 |
| `cursor_grok47` | 21 / 3.5.16 | Spring Data JPA | JJWT 0.12.6 + 커스텀 필터 | React 19, Vite 8, TypeScript 6 |
| `gemini38flash` | 17 / 3.3.4 | Spring Data JPA | JJWT 0.12.6 + 커스텀 필터 | React 19, Vite 8, TypeScript 6 |

프론트 구성도 두 가지 방식으로 나뉩니다.

| 폴더 | 서버 상태·화면 구성 | 스타일·HTTP |
| --- | --- | --- |
| `claude_opus55`, `claude_vsc_opus55` | TanStack Query 5, React Router 7, 페이지·훅·인증 컨텍스트 분리 | Tailwind CSS 4, Axios |
| `cursor_grok47` | TanStack Query 5, React Router 7, 페이지별 구성 | Tailwind CSS 4, fetch 래퍼 |
| `gemini38flash` | TanStack Query 5, 모달 중심 구성, 인증·테마 컨텍스트 | Tailwind CSS 3, Axios, Lucide |
| `codex_gpt6astra`, `codex_vsc_astra`, `copilot_vsc` | React 상태로 목록·상세·폼 관리 | 직접 작성한 CSS, fetch, Lucide |

JPA 구현은 엔티티와 Repository를 통해 데이터를 다루고, JDBC 구현은 SQL·바인딩·행 매핑을 직접 작성합니다. JDBC 세 구현은 React 빌드 결과를 Spring Boot JAR에 포함하는 Maven 리소스 설정도 갖고 있습니다.

## 3. 기능과 권한 비교

| 폴더 | 검색·목록 | 추가 기능 | 조회 / 수정·삭제 권한 |
| --- | --- | --- | --- |
| `claude_opus55` | 제목 검색, 페이지 목록 | 회원가입, 조회수, 상세 조회 시 조회수 증가 여부 선택 | 비로그인 조회 / 작성자 또는 관리자 |
| `claude_vsc_opus55` | 제목·작성자 검색, 페이지 목록 | 회원가입, 상세 조회수 | 비로그인 조회 / 작성자 또는 관리자 |
| `codex_gpt6astra` | 제목·작성자 검색, 내 글, 최신순·조회순 | 전체·내 글·누적 조회수 통계, 조회수 증가 API 분리 | 로그인 필요 / 작성자만 |
| `codex_vsc_astra` | 제목·작성자 검색, 내 글, 최신순 | 전체·내 글·작성자 수 통계, 상세 조회수 | 로그인 필요 / 작성자만 |
| `copilot_vsc` | 제목·작성자 검색, 내 글, 최신순 | 위 세션 게시판과 같은 화면·통계 구성 | 로그인 필요 / 작성자만 |
| `cursor_grok47` | 페이지 목록 | 로그인, 게시글 CRUD | 로그인 필요 / 작성자만 |
| `gemini38flash` | 제목·내용·작성자명 검색, 분류·상태·우선순위 필터, 정렬·페이징 | 기한, 상태 변경, 상태별 통계, 다크·라이트 테마 | 로그인 필요 / 서비스에 작성자 소유권 검사 없음 |

### 구현별 주요 차이

- **`claude_opus55`**: Spring Security의 JWT 검증 기능을 사용합니다. `config/`, `auth/`, `post/`, `user/`, `common/`으로 역할을 분리하고, 프론트는 `hooks/usePosts.ts`에 CRUD 쿼리와 캐시 갱신을 모았습니다. 제목 검색과 조회수 증가 선택 옵션이 있습니다.
- **`claude_vsc_opus55`**: 화면 구조는 위 구현과 유사하지만 `security/JwtTokenProvider.java`, `JwtAuthenticationFilter.java`를 직접 구성합니다. 제목뿐 아니라 작성자도 검색하며, 기본 `local` 프로필과 로컬 설정 예제 파일을 제공합니다.
- **`codex_gpt6astra`**: `PostController → PostService → PostRepository`로 JDBC 코드를 분리합니다. 목록에서는 CLOB 본문을 가져오지 않고, 검색의 `%`, `_`를 문자 그대로 처리합니다. 상세 GET과 조회수 증가 POST를 분리했으며, 통계도 별도 API입니다.
- **`codex_vsc_astra`**: `PostController.java`에 SQL·검증·권한·CRUD가 모여 있습니다. 프론트는 `App.tsx`, `api.ts`, `styles.css` 중심이며, 통계는 목록 응답에 포함합니다. 상세 GET이 조회수를 증가시킵니다.
- **`copilot_vsc`**: 비교 시점에 `frontend/src/App.tsx`는 `codex_vsc_astra`와 같습니다. 백엔드 검색은 빈 검색어일 때 검색 조건을 생략하고, 내 글 필터의 사용자 ID도 바인딩하도록 다릅니다. POM에는 Jackson BOM `2.21.7`, Log4j2 `2.25.5`, Tomcat `10.1.60` 재정의가 있으며, Vitest 선언도 `^4.1.11`로 `codex_vsc_astra`의 `^3.2.0`과 다릅니다. 이 차이가 현재 취약점 해소를 보증한다는 의미는 아닙니다.
- **`cursor_grok47`**: 별도 사용자·게시글 테이블과 시퀀스를 사용하는 간결한 게시판입니다. 회원가입·검색·조회수 대신 로그인과 기본 CRUD·페이지 이동에 집중합니다.
- **`gemini38flash`**: 게시글 대신 태스크를 관리합니다. `TaskModal`, `TaskDetailModal`, `FilterBar`, `StatsCards` 등으로 UI를 나눴습니다. `TaskService`의 수정·삭제는 전달받은 사용자명과 작성자를 비교하지 않고, 상태 변경도 소유권을 검사하지 않으므로 다른 게시판의 작성자 제한과 동일하게 해석하면 안 됩니다.

## 4. 데이터베이스 구조와 초기화

요구사항의 DB는 Oracle 18c XE입니다. 동일 DB 서버를 이용하더라도 **모든 프로젝트가 같은 테이블을 사용하는 것은 아닙니다.**

| 폴더 | 테이블 | 스키마 관리 | 계정 설정 |
| --- | --- | --- | --- |
| `claude_opus55` | `TB_USER`, `TB_POST` | JPA `validate` | `DB_USERNAME`, 기본 `USERSTK6` |
| `claude_vsc_opus55` | `TB_USER`, `TB_POST` | JPA `validate` | 환경변수 또는 `application-local.yml` |
| `codex_gpt6astra` | `TB_USER`, `TB_POST` | `spring.sql.init.mode=never` | `DB_USERNAME`, 기본 `USERSTK6` |
| `codex_vsc_astra`, `copilot_vsc` | `TB_USER`, `TB_POST` | `spring.sql.init.mode=never` | `.env` 또는 환경변수 |
| `cursor_grok47` | `APP_USER`, `BOARD_POST` | JPA `update`, 시퀀스 사용 | 기본 설정 `USERSTK7` |
| `gemini38flash` | `APP_USERS`, `APP_TASKS` | JPA `update`, 시퀀스 사용 | 기본 설정 `USERSTK7` |

`TB_USER`와 `TB_POST`의 관계는 다음과 같습니다.

```text
TB_USER (1) ────────── (N) TB_POST
USER_ID [PK]               POST_ID [PK]
USERNAME [UNIQUE]          USER_ID [FK]
PASSWORD                  TITLE
EMAIL [UNIQUE]             CONTENT [CLOB]
ROLE                      VIEW_COUNT
CREATED_AT / UPDATED_AT    CREATED_AT / UPDATED_AT
```

| SQL 파일 | 용도 |
| --- | --- |
| [sql/스키마.sql](sql/스키마.sql) | 공통 테이블·키·주석 생성. ID는 `GENERATED ALWAYS AS IDENTITY` |
| [sql/샘플데이타입력.sql](sql/샘플데이타입력.sql) | 사용자·게시글 샘플 입력 |
| [sql/입력확인쿼리.sql](sql/입력확인쿼리.sql) | 입력 결과 확인 |
| [codex_gpt6astra/docs/schema-reference.sql](codex_gpt6astra/docs/schema-reference.sql) | 빈 스키마용 참조 DDL. ID는 `GENERATED BY DEFAULT AS IDENTITY`, 문자열 BYTE 명시 |
| [codex_vsc_astra/database/schema.sql](codex_vsc_astra/database/schema.sql), [copilot_vsc/database/schema.sql](copilot_vsc/database/schema.sql) | 빈 스키마 설치용 DDL. `BY DEFAULT` ID와 게시글 사용자 인덱스 포함 |

기존 `TB_USER`·`TB_POST`를 사용하는 경우 DDL과 샘플 입력을 반복 실행하지 않습니다. 새 스키마를 만들 때도 위 DDL들은 대안이므로 하나를 선택합니다. `cursor_grok47`와 `gemini38flash`는 루트 SQL과 테이블명이 다르며, 시작 시 Hibernate가 스키마를 변경할 수 있습니다.

`cursor_grok47`는 `guest01`이 없을 때 사용자를 생성합니다. `gemini38flash`는 기본 사용자 및 태스크 테이블이 비었을 때 샘플 태스크 7건을 준비하는 초기화 코드가 있습니다. `TB_USER` 기반 구현은 사용할 계정과 BCrypt 비밀번호 해시가 DB에 준비되어 있어야 합니다.

### 한글과 길이 제한

소스·문서 저장은 UTF-8을 사용합니다. 각 백엔드에는 HTTP UTF-8 설정이 있으며, Maven에도 소스 인코딩이 지정되어 있습니다. DB 문자셋과 컬럼 길이 단위는 별도로 확인해야 합니다.

- 루트 DDL의 `TITLE VARCHAR2(200)`은 `BYTE`/`CHAR`를 명시하지 않았으므로 DB 길이 의미 설정의 영향을 받습니다.
- JDBC 세 구현은 제목을 **UTF-8 200바이트**로 제한합니다. 한글 200자와는 다른 제한입니다.
- Claude 두 구현의 제목 검증은 문자열 길이 중심이므로, BYTE 컬럼을 쓰는 DB에서는 긴 한글 제목이 검증을 통과한 뒤 저장에 실패할 수 있습니다.
- 공통 본문은 CLOB이며, JDBC 세 구현에는 본문 20,000자 제한이 있습니다.

## 5. 실행 포트와 요청 경로

| 폴더 | 프론트 개발 포트 | 백엔드 기본 포트 | 개발 중 API 연결 | React 포함 JAR |
| --- | --- | --- | --- | --- |
| `claude_opus55` | 5174 | 8081 | Vite `/api` 프록시 | 별도 프론트 배포 구성 필요 |
| `claude_vsc_opus55` | 5173 | 8080 | Vite `/api` 프록시 | 별도 프론트 배포 구성 필요 |
| `codex_gpt6astra` | 5176 | 8086 | Vite `/api` 프록시 | 지원 |
| `codex_vsc_astra` | 15173 | 18080 | Vite `/api` 프록시 | 지원 |
| `copilot_vsc` | 15173 | 18080 | Vite `/api` 프록시 | 지원 |
| `cursor_grok47` | 5173 | 8080 | Vite `/api` 프록시 | 별도 프론트 배포 구성 필요 |
| `gemini38flash` | 5173 기본값 | 8080 | Axios가 `http://localhost:8080/api` 직접 호출 | 별도 프론트 배포 구성 필요 |

`claude_vsc_opus55`·`cursor_grok47`·`gemini38flash`는 기본 포트가 겹치고, `codex_vsc_astra`·`copilot_vsc`도 서로 겹칩니다. 동시에 실행하려면 백엔드 포트와 프론트 API 대상, 필요한 CORS 설정을 함께 바꿉니다. `gemini38flash`의 API 주소는 `frontend/src/api/client.ts`에 고정되어 있습니다.

일반적인 개발 요청 흐름은 `브라우저 → Vite → /api 프록시 → Spring Security → Controller → DB`입니다. `gemini38flash`는 브라우저에서 백엔드로 직접 요청하므로 CORS 설정이 관여합니다.

## 6. 실행 방법

### 공통 준비

1. 실행할 폴더를 선택합니다.
2. 해당 POM에 맞는 JDK를 준비합니다. Java 기준은 대부분 17이고 `cursor_grok47`는 21입니다.
3. Node.js·npm 및 Oracle 접속 환경을 준비합니다. 실제 프론트 패키지 버전은 각 `package-lock.json`을 확인합니다.
4. 해당 구현의 DB 테이블과 계정을 준비하고 설정을 입력합니다.

아래 명령은 Windows PowerShell 기준입니다. Maven Wrapper를 사용하므로 별도 Maven 설치 없이 실행할 수 있습니다. 처음에는 npm·Maven 의존성을 다운로드할 네트워크 연결이 필요합니다.

### 환경 설정 방식

| 폴더 | 설정 방법 |
| --- | --- |
| `claude_opus55` | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` 등 환경변수. `application.yml`에 개발 기본값 존재 |
| `claude_vsc_opus55` | `backend/src/main/resources/application-local.yml.example`을 같은 폴더의 `application-local.yml`로 복사하여 수정하거나 환경변수 사용 |
| `codex_gpt6astra` | `.env.example`을 `.env.local`로 복사. `scripts/start-backend.ps1`이 읽음. Maven·Java 직접 실행 시에는 환경변수를 별도로 설정 |
| `codex_vsc_astra`, `copilot_vsc` | `.env.example`을 `.env`로 복사. Spring 설정이 현재 폴더·상위 폴더의 `.env`를 읽음 |
| `cursor_grok47`, `gemini38flash` | `backend/src/main/resources/application.yml` 확인. 필요 시 Spring 표준 환경변수 `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`로 재정의 |

환경파일은 이미 있으면 덮어쓰지 않습니다. DB 암호와 JWT 키는 로컬 설정에 입력합니다. 임의의 `.env` 파일이 모든 프로젝트에서 자동으로 로딩되는 것은 아닙니다.

### 프론트·백엔드 분리 실행

다음은 `claude_opus55`를 선택한 예시입니다. 다른 구현은 폴더명을 바꾸고 해당 설정 방식을 적용합니다. 두 터미널은 각각 저장소 루트에서 시작합니다.

터미널 1:

```powershell
cd claude_opus55/backend
.\mvnw.cmd spring-boot:run
```

터미널 2:

```powershell
cd claude_opus55/frontend
npm.cmd ci
npm.cmd run dev
```

브라우저에서는 선택한 구현의 프론트 포트를 엽니다. 이 예시는 `http://localhost:5174`입니다. `codex_gpt6astra`는 `.env.local` 로딩을 위해 프로젝트 폴더에서 아래 백엔드 실행 스크립트를 사용할 수 있습니다.

```powershell
.\scripts\start-backend.ps1 -Build
```

### React 포함 단일 JAR 실행

`codex_gpt6astra`는 프로젝트 폴더에서 다음을 실행합니다.

```powershell
.\scripts\build.ps1
.\scripts\start-backend.ps1
```

접속 주소는 `http://127.0.0.1:8086`입니다.

`codex_vsc_astra`와 `copilot_vsc`는 각 프로젝트 폴더에서 다음을 실행합니다.

```powershell
.\scripts\build.ps1
.\scripts\start.ps1
```

접속 주소는 `http://127.0.0.1:18080`이며, 결과물은 `backend/target/crud-tutorial-1.0.0.jar`입니다. 프론트 변경을 반영하려면 다시 빌드합니다. 세 구현 모두 프론트 빌드를 먼저 수행한 다음 Maven이 `frontend/dist/`를 JAR의 정적 리소스에 포함합니다.

## 7. API 계약의 차이

모든 게시판이 `/api/posts`를 사용하더라도 요청·응답 규격이 동일하지 않으므로 다른 폴더의 프론트와 백엔드를 그대로 교체해 연결할 수 없습니다.

| 구현 | 목록 요청의 주요 파라미터 | 페이지 시작 | 응답 및 조회수 특징 |
| --- | --- | --- | --- |
| `claude_opus55` | `keyword`, `page`, `size` | 0 | `content` 목록. 상세 `increaseView` 옵션 |
| `claude_vsc_opus55` | `keyword`, `page`, `size` | 0 | `content` 목록. 상세 GET에서 조회수 증가 |
| `codex_gpt6astra` | `query`, `mine`, `sort`, `page`, `size` | 1 | `items`, `total`. `/stats`, `POST /{id}/view` 별도 제공 |
| `codex_vsc_astra`, `copilot_vsc` | `q`, `mine`, `page`, `size` | 0 | `items`, `totalElements`, 전체·내 글·작성자 수. 상세 GET에서 조회수 증가 |
| `cursor_grok47` | `page`, `size` | 0 | `content` 목록. 조회수 기능 없음 |
| `gemini38flash` | `/api/tasks`의 `keyword`, `category`, `status`, `priority`, `page`, `size`, `sort` | 0 | `ApiResponse`로 감싼 페이지. `/stats`, `PATCH /{id}/status` 제공 |

인증 계약도 다릅니다.

- JWT 네 구현은 JSON 로그인 후 토큰을 `Authorization: Bearer …`로 전달합니다. 프론트는 `localStorage`에 토큰을 보관합니다. 회원가입 API `/api/auth/signup`은 Claude 두 구현에 있습니다.
- 세션 세 구현은 `/api/auth/csrf`로 CSRF 토큰을 얻고, 폼 형식으로 `/api/auth/login`에 로그인합니다. 이후 세션 쿠키와 변경 요청의 CSRF 토큰을 사용하며, `/api/auth/logout`에서 서버 세션을 종료합니다.
- `codex_gpt6astra`의 세션 쿠키는 기본 `JSESSIONID`, `codex_vsc_astra`·`copilot_vsc`는 `RECORD_SESSION`입니다.
- `codex_vsc_astra`·`copilot_vsc`의 `/api/health`는 공개된 DB 연결 확인 API입니다.

## 8. 테스트 및 검증 구성

아래는 **테스트 파일의 존재와 구현된 범위**에 대한 비교이며, 이번 작업의 테스트 통과 결과가 아닙니다.

| 폴더 | 백엔드 테스트 | 프론트 자동 테스트 |
| --- | --- | --- |
| `claude_opus55`, `claude_vsc_opus55` | `contextLoads` 중심의 Spring 컨텍스트 테스트 | 별도 테스트 스크립트 없음. `lint`, `build` 제공 |
| `codex_gpt6astra` | H2 기반 API 테스트 5개: 세션, CRUD·조회수, 권한·CSRF, 입력 검증, 검색·페이지 | Playwright 시나리오 1개. `npm test`가 E2E |
| `codex_vsc_astra` | H2 기반 API 테스트 4개: 로그인, 권한·CSRF, 한글 CRUD·검색·페이지, 입력 검증 | Vitest UTF-8 바이트 계산, Playwright CRUD 시나리오 |
| `copilot_vsc` | H2 기반 API 테스트 4개 | Vitest UTF-8 바이트 계산, Playwright CRUD 시나리오 |
| `cursor_grok47`, `gemini38flash` | 테스트 의존성은 있으나 별도 테스트 소스 확인되지 않음 | 별도 테스트 스크립트 없음. `lint`, `build` 제공 |

백엔드는 각 `backend/`에서 다음 명령으로 테스트합니다.

```powershell
.\mvnw.cmd test
```

H2 설정이 있는 세션 구현은 테스트 DB를 사용합니다. Claude 두 구현의 컨텍스트 테스트에는 별도 H2 구성이 없으므로 실제 설정·DB 연결의 영향을 받을 수 있습니다.

`codex_vsc_astra`·`copilot_vsc`의 `frontend/`:

```powershell
npm.cmd test
npm.cmd run test:e2e
```

`codex_gpt6astra`의 `frontend/`:

```powershell
npm.cmd test
```

E2E는 앱 서버를 자동 실행하지 않습니다. 먼저 앱을 실행하고 테스트 계정 암호를 `E2E_PASSWORD` 환경변수에 설정합니다. 시나리오는 실제 DB에 임시 글을 작성·수정·삭제합니다.

| E2E 대상 | 기본 접속 주소 | 주소 재정의 | 브라우저 설정 |
| --- | --- | --- | --- |
| `codex_gpt6astra` | `http://127.0.0.1:5176` | `E2E_URL` | Chromium |
| `codex_vsc_astra`, `copilot_vsc` | `http://127.0.0.1:18080` | `E2E_BASE_URL` | Microsoft Edge 채널 |

`codex_gpt6astra`는 암호 미설정 시 E2E를 건너뛰고, 나머지 두 구현은 오류를 발생시킵니다. H2 테스트만으로 Oracle의 CLOB·IDENTITY·문자열 동작까지 검증했다고 볼 수는 없습니다.

## 9. 비교 시 확인할 사항

| 확인 항목 | 이 저장소에서의 의미 |
| --- | --- |
| 공통 요구사항과 실제 구현 | `TB_USER`·`TB_POST` 요구와 다른 테이블을 쓰는 두 구현, JPA·JWT 대신 JDBC·세션을 선택한 세 구현이 공존 |
| DB 자동 변경 | `validate`·SQL 초기화 비활성화와 JPA `update`는 실행 시 동작이 다름 |
| 기본 포트 중복 | 같은 포트의 두 앱을 동시에 시작할 수 없으며 API 대상도 함께 조정 필요 |
| 인증·권한 | 공개 조회, 관리자 수정 허용, 작성자만 허용, 소유권 검사 없음이 구현마다 다름 |
| 조회수 | GET의 부수 효과 여부와 별도 POST 존재 여부가 다름 |
| 검색·페이지 계약 | 검색 파라미터 이름, 페이지 시작 번호, 응답 필드가 다름 |
| UTF-8 | 파일 인코딩과 DB의 바이트 길이 제한은 별개 |
| 기존 개발 기록 | 하위 README와 `capture/`는 과거 작업 자료이며 현재 동작을 보증하는 자동 테스트 결과는 아님 |

## 10. 개별 문서 바로가기

- [claude_opus55 개발자 가이드](claude_opus55/README.md)
- [claude_vsc_opus55 개발자 가이드](claude_vsc_opus55/README.md)
- [codex_gpt6astra 개발자 가이드](codex_gpt6astra/README.md)
- [codex_vsc_astra 개발자 가이드](codex_vsc_astra/README.md)
- [copilot_vsc 개발자 가이드](copilot_vsc/README.md)
- [cursor_grok47 개발자 가이드](cursor_grok47/README.md)
- [gemini38flash 통합 가이드](gemini38flash/README.md)
- [gemini38flash 백엔드 가이드](gemini38flash/backend/README.md)
- [gemini38flash 프론트엔드 가이드](gemini38flash/frontend/README.md)

설명과 실제 동작이 다르면 각 폴더의 `pom.xml`, `package.json`, `vite.config.ts`, `application.yml` 또는 `application.properties`, 컨트롤러·보안 설정을 우선 확인합니다.
