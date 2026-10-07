# 모아 · React / Spring Boot / Oracle CRUD 튜토리얼

작은 기록을 모으고 공유하는 한국어 게시판입니다. **기존 Oracle 개발 서버의 `TB_USER`, `TB_POST`에 직접 연결**하여 로그인, 게시글 작성·조회·수정·삭제를 제공합니다. 프런트엔드는 React + TypeScript, 백엔드는 Java 17 + Spring Boot입니다.

## 1. 개발 결과 및 설계 선택

| 영역 | 구현 내용 |
| --- | --- |
| 로그인 | 기존 `TB_USER` 계정 / BCrypt 검증 / 서버 세션 / 로그아웃 |
| 목록 | 최신순·조회순, 제목·작성자 검색, 페이지당 8건, 내 게시글 필터 |
| 상세 | 본문 줄바꿈 유지, 작성자·작성일·최종 수정일·조회수 |
| 작성 | UTF-8 제목 200바이트, 본문 20,000자 제한, 공백 입력 거절 |
| 수정·삭제 | 본인 소유 여부를 서버에서 검증, 삭제 확인 UI |
| 대시보드 | 전체 게시글 수, 내 게시글 수, 누적 조회수 |
| UI | 한국어, 녹색·아이보리 테마, 반응형, 로딩·빈 목록·오류·완료 메시지 |
| 접근성 | 레이블, 키보드 포커스, 모달 포커스 순환·복귀, Escape 닫기 |
| 개발자 지원 | Maven Wrapper, 환경변수 설정 예제, 빌드·실행 스크립트, API 테스트, 브라우저 테스트 |

사용자 요구에 맞춰 회원 정보는 로그인·조회에 사용하고, **CRUD의 대상은 게시글**로 구성했습니다. 회원가입, 계정 관리, 파일 업로드, 댓글, 관리자 대리 수정 기능은 포함하지 않습니다.

### 기술 스택에 대한 제안

요청하신 React + Spring Boot + Oracle 구성을 유지했습니다. 이미 사용 가능한 Oracle 서버가 있으므로 이번 튜토리얼에서 다른 DB로 교체할 이유는 크지 않습니다. 대신 **React에 TypeScript를 추가**하여 API 응답과 화면 상태의 타입을 검사합니다.

- Java 17 / Spring Boot **3.5.16**: 로컬 JDK 및 Spring Security 6 계열에 맞춘 구성입니다. 최신 메이저 버전이라는 의미는 아닙니다. [Spring Boot 공식 시스템 요구사항](https://docs.spring.io/spring-boot/3.5/system-requirements.html)
- Oracle JDBC **21.23.0.0**: Oracle 18c와 연결할 수 있는 21c JDBC 계열입니다. [Oracle 공식 JDBC 호환성 문서](https://docs.oracle.com/en/database/oracle/oracle-database/21/jjdbc/JDBC-getting-started.html)
- Spring JDBC: SQL, 바인딩, 트랜잭션을 학습하기 쉽고 기존 스키마를 명시적으로 사용하는 방식입니다. Hibernate 자동 DDL은 사용하지 않습니다.
- Spring Security: BCrypt 비밀번호 검증, 세션 고정 공격 방어, CSRF, 로그인·로그아웃을 처리합니다.
- React 19 / Vite 7 / TypeScript 5.9: 실제 설치 버전은 `frontend/package-lock.json`으로 고정됩니다.
- H2는 자동 테스트에서만 사용합니다. 실행 앱의 DB는 Oracle입니다.

## 2. 확인한 개발 DB

| 설정 | 값 |
| --- | --- |
| Host | `192.168.45.2` |
| Port | `1521` |
| Service name | `XEPDB1` (SID 방식이 아님) |
| Username | `USERSTK6` |
| JDBC URL | `jdbc:oracle:thin:@//192.168.45.2:1521/XEPDB1` |
| DB 문자셋 | `AL32UTF8` |
| National 문자셋 | `AL16UTF16` |
| 로그인 계정 | `guest01` |

DB·로그인 비밀번호는 이 문서에 기재하지 않습니다. DB 비밀번호는 Git 제외 파일인 `.env.local`에 저장되어 있으며, 다른 개발자는 `.env.example`을 복사하고 전달받은 값을 입력하면 됩니다. 브라우저 로그인은 요청 시 제공한 `guest01` 계정의 비밀번호를 사용합니다.

최초 점검 시 `TB_POST`에 기존 게시글 11건이 있었고, `guest01`은 `USER_ID=9`, `ROLE_USER`, BCrypt 비밀번호 형식이었습니다. **테이블 재생성·초기 데이터 주입·비밀번호 재설정은 하지 않습니다.** 같은 스키마에 있던 `VT_CRUD_*` 테이블도 사용하지 않습니다.

## 3. 빠른 실행 — Windows PowerShell

필수 환경: Java 17 이상(검증 환경은 Java 17), Node.js 22.12 이상 권장(검증 환경은 Node 24), Oracle 개발 서버에 접근할 수 있는 네트워크. 최초 실행에는 npm 및 Maven 다운로드가 필요합니다.

### 환경 설정

프로젝트 루트에서 실행합니다. `.env.local`이 이미 있다면 덮어쓰지 마세요.

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

`.env.local` 예시:

```dotenv
DB_URL=jdbc:oracle:thin:@//192.168.45.2:1521/XEPDB1
DB_USERNAME=USERSTK6
DB_PASSWORD=전달받은_DB_비밀번호
SERVER_PORT=8086
```

`scripts/start-backend.ps1`이 이 파일을 읽어 현재 자식 프로세스의 환경변수로 전달합니다. **Java를 직접 실행하면 `.env.local`은 자동으로 로딩되지 않습니다.** 직접 실행 시에는 `$env:DB_PASSWORD` 등을 먼저 설정하세요. OS에 이미 설정한 환경변수보다 `.env.local` 값이 우선합니다.

### 방법 A: 단일 JAR 실행

```powershell
# React 빌드 → 테스트 → 정적 리소스 포함 Spring Boot JAR 생성
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build.ps1

# 서버 실행 (종료: Ctrl+C)
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-backend.ps1
```

브라우저: **http://127.0.0.1:8086**

React 빌드 산출물이 Maven 리소스 설정을 통해 JAR의 `static/`에 포함됩니다. 배포 파일은 `backend/target/crud-tutorial-1.0.0.jar`입니다. UI 변경 후에는 반드시 React를 먼저 다시 빌드해야 JAR에 반영됩니다.

Windows에서는 실행 중인 JAR이 잠길 수 있습니다. 다시 패키징하기 전에 서버 터미널에서 Ctrl+C로 종료한 뒤 빌드하고 재시작하세요.

### 방법 B: 프런트·백엔드 분리 개발

터미널 1:

```powershell
# 백엔드만 최초 빌드 및 실행
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-backend.ps1 -Build
```

터미널 2:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

브라우저: **http://127.0.0.1:5176**

Vite가 `/api` 요청을 `http://127.0.0.1:8086`으로 프록시합니다. 브라우저 관점에서 동일 출처 요청이므로 별도 CORS 허용이 필요 없습니다. 포트를 변경하면 `frontend/vite.config.ts`의 프록시 대상도 수정하세요. Vite는 포트 충돌 시 임의로 다음 포트를 사용하지 않고 종료합니다.

백엔드는 로컬 개발용으로 `127.0.0.1`에 바인딩합니다. `localhost`와 `127.0.0.1`은 쿠키 출처가 다르므로 로그인 시 한 주소로 통일하세요.

### Maven 직접 사용

```powershell
cd backend
.\mvnw.cmd -B -ntp test
.\mvnw.cmd -B -ntp package
```

Maven Wrapper가 Maven 3.9.11을 내려받으므로 별도 Maven 설치가 필요 없습니다. 이미 설치된 Maven이 있으면 `mvn`으로도 빌드할 수 있습니다.

## 4. 프로젝트 구조

```text
.
├─ backend/
│  ├─ pom.xml, mvnw, mvnw.cmd, .mvn/wrapper/
│  └─ src/
│     ├─ main/java/kr/co/tutorial/crud/
│     │  ├─ CrudApplication.java   # Spring Boot 진입점
│     │  ├─ SecurityConfig.java    # BCrypt, 세션, CSRF, 접근 제어
│     │  ├─ AuthController.java    # CSRF 토큰, 현재 사용자
│     │  ├─ PostController.java    # REST API, 입력 검증
│     │  ├─ PostService.java       # 소유권, UTF-8 검증, 트랜잭션
│     │  ├─ PostRepository.java    # 바인딩 SQL, Oracle 조회·저장
│     │  └─ ApiErrors.java         # 한국어 오류 응답
│     ├─ main/resources/application.properties
│     └─ test/                    # H2 Oracle 모드 통합 테스트
├─ frontend/
│  ├─ src/api.ts                  # fetch, 세션, CSRF, API 타입
│  ├─ src/main.tsx                # 로그인, 게시판, 모달, 가이드
│  ├─ src/styles.css              # 데스크톱·모바일 스타일
│  ├─ tests/crud.spec.ts          # 실제 Oracle 브라우저 E2E
│  ├─ vite.config.ts             # 로컬 개발 프록시
│  └─ playwright.config.ts
├─ scripts/
│  ├─ build.ps1                  # 프런트 + 백엔드 통합 빌드
│  ├─ start-backend.ps1          # 환경파일 로딩 및 서버 실행
│  └─ InspectDb.java             # 읽기 전용 DB 구조 점검 도구
├─ docs/schema-reference.sql     # 빈 스키마용 참고 DDL (자동 실행 안 함)
├─ .env.example                 # 공유 가능한 환경변수 예제
└─ .env.local                   # 로컬 비밀번호, Git 제외
```

## 5. DB 테이블 및 한글 처리

### TB_USER

| 컬럼 | 타입 | 의미 |
| --- | --- | --- |
| USER_ID | NUMBER / IDENTITY / PK | 사용자 번호 |
| USERNAME | VARCHAR2(50 BYTE), UNIQUE | 로그인 아이디 |
| PASSWORD | VARCHAR2(255 BYTE) | BCrypt 해시 |
| EMAIL | VARCHAR2(100 BYTE), UNIQUE | 이메일 |
| ROLE | VARCHAR2(20 BYTE) | 기본값 ROLE_USER |
| CREATED_AT / UPDATED_AT | TIMESTAMP | 생성·수정 시각 |

### TB_POST

| 컬럼 | 타입 | 의미 |
| --- | --- | --- |
| POST_ID | NUMBER / IDENTITY / PK | 게시글 번호 |
| TITLE | VARCHAR2(200 BYTE) | 제목 |
| CONTENT | CLOB | 본문 |
| USER_ID | NUMBER / FK → TB_USER.USER_ID | 작성자 |
| VIEW_COUNT | NUMBER, 기본값 0 | 상세 열기 횟수 |
| CREATED_AT / UPDATED_AT | TIMESTAMP | DB SYSTIMESTAMP로 기록 |

모든 필수 컬럼은 NOT NULL입니다. 신규 ID는 기존 Oracle IDENTITY가 생성합니다. 삭제된 ID는 재사용하지 않으므로 번호 사이에 빈 구간이 생기는 것이 정상입니다.

중요한 차이: `TITLE`은 200 **자**가 아니라 200 **바이트**입니다. 한글은 일반적으로 UTF-8 3바이트이므로 약 66자입니다. 프런트에서는 `TextEncoder`, 서버에서는 `StandardCharsets.UTF_8`로 실제 저장할 제목의 길이를 검사합니다. 앞뒤 공백은 저장 전에 제거합니다. 본문은 CLOB 스트림으로 바인딩하며 앱 정책상 20,000자로 제한합니다.

Java 소스·컴파일·HTTP 요청·응답과 프런트 파일은 UTF-8을 사용합니다. DB의 TIMESTAMP는 시간대 없는 값이므로 API에서도 오프셋 없는 ISO 형식으로 전달합니다. 원격 DB 서버의 시각을 기준으로 저장하며, 글로벌 서비스 확장 시 UTC/시간대 정책을 별도로 정해야 합니다.

`schema-reference.sql`은 새 빈 스키마에서 구조를 이해하고 재현하기 위한 참고용입니다. **기존 USERSTK6에서 실행할 필요가 없습니다.** 새 스키마에는 별도로 BCrypt 비밀번호 해시를 가진 사용자를 준비해야 합니다.

## 6. 요청 흐름 및 보안

1. React가 `GET /api/auth/csrf`에서 CSRF 토큰을 받습니다.
2. 로그인 폼은 `application/x-www-form-urlencoded`로 아이디·비밀번호를 전달합니다.
3. Spring Security가 `TB_USER.PASSWORD`와 BCrypt 검증을 수행합니다.
4. 성공하면 HttpOnly 세션 쿠키로 인증 상태를 유지하고, React는 로그인 후 CSRF 토큰을 다시 받습니다.
5. 쓰기 요청에는 `X-CSRF-TOKEN` 헤더를 함께 보냅니다. CSRF가 없거나 잘못되면 403입니다.
6. 수정·삭제 시 현재 세션 사용자의 ID와 게시글 작성자 ID를 비교합니다. UPDATE/DELETE SQL에도 `USER_ID` 조건을 넣습니다.
7. 로그아웃은 POST로 세션을 무효화하고 쿠키를 삭제합니다. 세션은 기본 30분 비활동 후 만료됩니다.

- 로그인 없는 게시글 API 접근은 401입니다. 로그인 페이지와 정적 리소스만 공개합니다.
- 다른 작성자의 글 변경은 403입니다. ROLE_ADMIN도 별도 예외로 처리하지 않습니다.
- 비밀번호나 세션 토큰을 `localStorage`에 저장하지 않습니다.
- SQL은 `PreparedStatement`/`JdbcTemplate` 파라미터 바인딩을 사용합니다. 정렬 SQL은 허용 목록 `latest|views`로 제한합니다.
- 검색어 `%`, `_`, `\`는 LIKE 와일드카드가 아닌 문자로 검색되도록 이스케이프합니다.
- 본문은 React 텍스트로 출력하며 HTML을 실행하지 않습니다.
- DB 오류는 클라이언트에 SQL·접속 비밀값을 노출하지 않고 503 메시지로 반환합니다.
- 로그인 비밀번호 해시는 기존 `$2...` BCrypt 형식을 사용합니다. 기존 계정을 자동 변경하지 않습니다.
- 단일 서버 개발용 세션입니다. 외부 운영 배포에는 HTTPS, Secure 쿠키, 로그인 속도 제한, 계정 정책, 운영 모니터링 및 다중 서버 세션 저장소 등을 환경에 맞게 추가하세요.

조회수는 `POST /api/posts/{id}/view`에서 원자적으로 1 증가합니다. 상세 화면을 다시 열 때마다 증가하며 순 방문자 수가 아닙니다. `GET /api/posts/{id}`는 데이터를 변경하지 않습니다. 목록 SQL은 CLOB 본문을 읽지 않아 목록 응답 크기를 줄입니다.

## 7. REST API 명세

공통 오류 응답: `{"message":"한국어 오류 설명"}`. 인증 API 외 게시글 API는 로그인 세션이 필요합니다. 모든 POST/PUT/DELETE는 CSRF 헤더가 필요합니다.

| Method | URL | 설명 / 성공 코드 |
| --- | --- | --- |
| GET | `/api/auth/csrf` | `{token, headerName}` / 200 |
| POST | `/api/auth/login` | form: username, password / 204 |
| GET | `/api/auth/me` | `{id, username, email, role}` / 200 |
| POST | `/api/auth/logout` | 세션 종료 / 204 |
| GET | `/api/posts` | 목록, 페이지 메타데이터 / 200 |
| GET | `/api/posts/stats` | `{total, mine, views}` / 200 |
| GET | `/api/posts/{id}` | 상세 조회 / 200 |
| POST | `/api/posts/{id}/view` | 조회수 증가 + 상세 반환 / 200 |
| POST | `/api/posts` | 게시글 작성, Location 헤더 / 201 |
| PUT | `/api/posts/{id}` | 게시글 수정 / 200 |
| DELETE | `/api/posts/{id}` | 게시글 삭제 / 204 |

목록 파라미터:

| 파라미터 | 기본값 | 제약 |
| --- | --- | --- |
| query | 빈 문자열 | 최대 100자, 제목/작성자 부분 검색 |
| mine | false | true면 현재 사용자가 쓴 글만 |
| page | 1 | 1~1,000,000, 1부터 시작 |
| size | 8 | 1~50 |
| sort | latest | latest 또는 views |

목록 응답 예시:

```json
{
  "items": [{"id": 12, "title": "첫 번째 기록", "content": null,
    "userId": 9, "username": "guest01", "viewCount": 0,
    "createdAt": "2026-10-07T10:00:00", "updatedAt": "2026-10-07T10:00:00"}],
  "total": 1, "page": 1, "size": 8, "totalPages": 1
}
```

작성·수정 요청 JSON:

```json
{"title":"한글 제목","content":"안녕하세요.\n줄바꿈을 포함한 본문입니다."}
```

클라이언트는 작성자 ID를 지정하지 않습니다. 서버가 로그인 세션에서 결정합니다. 상태 코드는 잘못된 입력 400, 인증 필요/로그인 실패 401, 소유권·CSRF 오류 403, 글 없음 404, DB 처리 실패 503입니다.

## 8. 테스트 방법

### 실제 검증 결과 (2026-10-07, 한국 시간)

| 검증 | 결과 |
| --- | --- |
| Java 컴파일 및 H2 통합 테스트 | 5개 통과, 실패 0 |
| React TypeScript 검사 + Vite 프로덕션 빌드 | 통과 |
| React 정적 파일 포함 실행 JAR | 패키징·실행 성공 |
| Vite 5176 → Spring Boot 8086 → 실제 Oracle 브라우저 E2E | 1개 시나리오 통과 |
| 단일 JAR 8086 → 실제 Oracle 브라우저 E2E | 1개 시나리오 통과 |
| 데스크톱 1440px / 모바일 390px | 스크린샷 확인, 문서 전체 가로 넘침 없음 |
| 브라우저 JavaScript 예외 | E2E 실행 중 0건 |
| 테스트 데이터 정리 | 테스트 후 TB_POST 11건 유지 |

브라우저 시나리오는 실패 로그인, 정상 로그인, 새로고침 후 세션 유지, 새 글 작성, 한글·이모지 수정, 검색, 삭제 확인, 모바일 화면, 이용 가이드, 로그아웃을 포함합니다. 단순 테스트 개수와 별도로 실제 사용자 흐름 전체를 실행했습니다.

### 백엔드 자동 통합 테스트

```powershell
cd backend
.\mvnw.cmd -B -ntp test
```

H2 Oracle 호환 모드에서 실행되며 실제 Oracle 데이터는 변경하지 않습니다.

- 정상·실패 로그인, 인증 없는 접근, 세션 유지 및 로그아웃
- 한글 생성·조회·수정·삭제, 조회수 증가
- 타인 게시글 수정·삭제 거절, CSRF 없는 요청 거절
- UTF-8 200바이트 경계, 빈 내용, 페이지·정렬 입력 검증
- 한글 검색, 리터럴 `%` 검색, 페이지네이션, 내 글 필터, 통계

### 프런트 타입 검사 / 프로덕션 빌드

```powershell
cd frontend
npm.cmd run build
npm.cmd run format:check
```

### 실제 Oracle + 브라우저 E2E

먼저 백엔드와 프런트를 실행한 뒤 다른 터미널에서:

```powershell
cd frontend
npx.cmd playwright install chromium  # 최초 1회, 브라우저가 없을 때
$env:E2E_PASSWORD='전달받은_로그인_비밀번호'
npm.cmd test
Remove-Item Env:E2E_PASSWORD
```

단일 JAR로 테스트할 때는 `$env:E2E_URL='http://127.0.0.1:8086'`도 설정합니다. 비밀번호 환경변수가 없으면 E2E는 skip되며 검증 통과로 보지 않아야 합니다.

이 테스트는 실제 DB에 고유한 제목의 글 한 건을 작성하고, 한글·이모지 저장과 수정, 검색, 삭제, 로그인 유지, 모바일 화면, 로그아웃을 확인합니다. 테스트가 생성한 글은 정상 흐름과 `finally` 정리에서 삭제합니다. 기존 게시글은 수정·삭제하지 않습니다. 테스트 중 생성한 글의 IDENTITY 번호는 삭제 후에도 소모됩니다.

스크린샷: `frontend/test-results/login-desktop.png`, `board-desktop.png`, `post-detail.png`, `board-mobile.png`. 실패 시 Playwright trace가 저장됩니다. trace에는 폼 입력 등 테스트 데이터가 포함될 수 있으므로 외부 공유 전 확인하세요. 테스트 결과 폴더는 Git에서 제외합니다.

## 9. 문제 해결

| 증상 | 확인 및 해결 |
| --- | --- |
| Oracle 접속 실패, 503 | 개발 서버 네트워크, 1521 포트, 서비스명 XEPDB1, DB_PASSWORD 확인 |
| 로그인 실패 401 | TB_USER의 guest01 존재 여부와 제공된 로그인 비밀번호 확인. DB 사용자 비밀번호와 다릅니다. |
| 쓰기 요청 403 | 세션 쿠키/CSRF 토큰 확인. 재로그인 후 새 토큰 사용. 타인 글은 수정·삭제 불가 |
| 제목이 저장되지 않음 | 글자 수가 아닌 UTF-8 바이트 수를 확인. 화면의 bytes 표시 참고 |
| Java 실행 시 DB_PASSWORD 오류 | start-backend.ps1 사용 또는 환경변수 직접 설정 |
| npm.ps1 실행 정책 오류 | `npm` 대신 `npm.cmd` 사용 |
| 8086/5176 포트 사용 중 | 기존 프로세스 종료 또는 서버 포트와 Vite 프록시 설정 함께 변경 |
| 수정한 화면이 JAR에 반영 안 됨 | frontend 빌드 후 backend 패키징. 통합 build.ps1 권장 |
| 새 빈 스키마 로그인 불가 | 참고 DDL만으로 계정은 생기지 않음. BCrypt 사용자 별도 준비 |
| 외부 폰트가 안 뜸 | Google Fonts가 차단되면 시스템 한글 폰트로 자동 대체 |

## 10. 튜토리얼 확장 방향

`Controller → Service → Repository → Oracle` 순서로 요청을 추적하면 CRUD 전체 흐름을 이해하기 쉽습니다. 후속 학습으로 댓글, 파일 첨부, 낙관적 잠금, 회원가입, 감사 로그, 운영 HTTPS 구성을 추가할 수 있습니다. 현재 동시 수정은 마지막 저장이 반영되며 버전 충돌 검사는 별도 구현하지 않았습니다. 검색은 부분 LIKE이므로 데이터가 많아지면 실행 계획과 검색 인덱스 전략을 검토하세요.
