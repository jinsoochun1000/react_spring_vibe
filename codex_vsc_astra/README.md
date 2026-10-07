# 기록실 · React + Spring Boot + Oracle CRUD Tutorial

React 화면에서 로그인하고 Oracle의 게시글을 조회·작성·수정·삭제하는 학습용 풀스택 프로젝트입니다. 한국어 UI, UTF-8 인코딩, 검색, 페이지 이동, 작성자 권한 검증, 세션 인증을 구현했습니다.

## 1. 개발 결과

| 구분 | 구현 내용 |
| --- | --- |
| 로그인 | 기존 `TB_USER`의 BCrypt 비밀번호 검증, 서버 세션 발급, 새로고침 후 로그인 유지, 로그아웃 |
| 게시글 목록 | 최신 ID 순 정렬, 8개씩 페이지 이동, 제목·작성자 부분 검색, 내 게시글 필터 |
| 게시글 상세 | 제목·본문·작성자·작성일·수정일·조회수, 조회할 때 조회수 증가 |
| 게시글 작성 | 제목·본문 필수, UTF-8 제목 200바이트, 본문 20,000자 제한 |
| 수정·삭제 | 작성자 본인만 가능, 서버에서도 권한 검사, 삭제 확인 대화상자 |
| 사용성 | 저장 알림, 로딩·오류·빈 목록 안내, 작성 취소 시 내용 버리기 확인, 반응형 화면 |
| 보안 | Spring Security, BCrypt, HttpOnly 세션 쿠키, CSRF 토큰, 바인딩 SQL |
| 실행 | 개발 중 React/Vite와 API 분리 실행 또는 React 빌드를 포함한 단일 JAR 실행 |
| DB | 제공된 Oracle에 존재하는 `TB_USER`, `TB_POST`를 그대로 사용. 앱 시작 시 DDL 실행 안 함 |

회원가입·비밀번호 변경·사용자 관리·첨부파일·댓글은 이번 구현 범위에 포함하지 않았습니다. 로그인 화면에는 아이디만 미리 입력하며 비밀번호는 직접 입력합니다.

## 2. 기술 선택

- **Frontend:** React 19, TypeScript, Vite 7, lucide-react, CSS.
- **Backend:** Java 17, Spring Boot 3.5.16, Spring Security, Spring JDBC, Bean Validation.
- **DB:** Oracle 18c XE, `ojdbc11` 21.23.0.0, HikariCP.
- **Test:** JUnit 5 + MockMvc + H2 Oracle 모드, Vitest, Playwright(Edge).
- Maven Wrapper 3.9.11 및 `package-lock.json`으로 빌드 환경을 관리합니다. 실제 프런트엔드 설치 버전은 lockfile 기준입니다.

제안하신 React + Spring Boot + Oracle 구성을 유지했습니다. 이미 Oracle 개발 서버가 있고 SQL 학습에 적합하므로 DB 교체 이점보다 기존 환경 활용이 큽니다. Java 17 환경과 기존 프로젝트 예제를 고려해 Spring Boot 3.5를 선택했습니다. JDBC를 사용해 SQL과 트랜잭션 동작을 직접 확인할 수 있게 했습니다. 서비스 규모가 커지면 서비스·리포지터리 계층 분리, Flyway 마이그레이션, 낙관적 잠금, 전문 검색 도입을 검토할 수 있습니다.

호환성 참고: [Spring Boot 3.5 공식 시스템 요구사항](https://docs.spring.io/spring-boot/3.5/system-requirements.html), [Vite 공식 시작 가이드](https://vite.dev/guide/). Java 17 이상, Node.js 20.19+ 또는 22.12+를 준비하세요. 개발 검증 환경은 Java 17, Node.js 24입니다.

## 3. 빠른 실행 — 단일 JAR

명령은 이 README가 있는 프로젝트 루트에서 실행합니다. Windows PowerShell 기준입니다.

### 3.1 DB 설정

로컬 `.env`가 없을 때에만 다음과 같이 복사합니다.

```powershell
Copy-Item .env.example .env
notepad .env
```

```properties
DB_URL=jdbc:oracle:thin:@//192.168.45.2:1521/XEPDB1
DB_USERNAME=USERSTK6
DB_PASSWORD=전달받은_DB_비밀번호
SERVER_PORT=18080
COOKIE_SECURE=false
```

현재 작업 폴더의 `.env`에는 제공받은 접속 정보를 설정해 두었습니다. `.env`는 Git 추적에서 제외하며 비밀번호는 README·소스에 기록하지 않습니다. 이 파일은 Spring 설정이 읽는 Java properties 형식이므로 값 주위에 따옴표를 넣지 않습니다. 환경변수로도 같은 키를 지정할 수 있습니다.

### 3.2 빌드 및 테스트

```powershell
.\scripts\build.ps1
```

이 스크립트는 `npm ci` → React 빌드 → Vitest → Maven `clean package`(백엔드 테스트 포함)를 순서대로 실행합니다. 최초 실행 시 npm 패키지 및 Maven 배포본·의존성 다운로드를 위한 인터넷 연결이 필요합니다.

### 3.3 실행

```powershell
.\scripts\start.ps1
```

- 웹 화면: **http://127.0.0.1:18080**
- DB 연결 확인: **http://127.0.0.1:18080/api/health**
- 로그인 아이디: **guest01**
- 로그인 비밀번호: 요청에서 제공한 로그인 비밀번호 사용.
- 종료: 실행 터미널에서 `Ctrl+C`.

직접 실행하려면 다음 명령을 사용합니다.

```powershell
java '-Dfile.encoding=UTF-8' -jar backend/target/crud-tutorial-1.0.0.jar '--debug=false'
```

빌드 결과는 `backend/target/crud-tutorial-1.0.0.jar`입니다. 루트에서 실행하면 같은 위치의 `.env`를 읽습니다. 프런트엔드 빌드 결과는 Maven의 리소스 복사로 JAR의 `static/`에 포함됩니다. 별도 Node 서버 없이 Spring Boot가 화면과 API를 함께 제공합니다.

## 4. 개발 모드

터미널 1 — API:

```powershell
cd backend
.\mvnw.cmd spring-boot:run '-Dspring-boot.run.arguments=--debug=false'
```

터미널 2 — React:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

접속 주소는 **http://127.0.0.1:15173**입니다. Vite가 `/api` 요청을 `http://127.0.0.1:18080`으로 프록시하므로 개발 환경에도 별도 CORS 허용 설정이 필요하지 않습니다. 기본 8080 포트에 다른 프로그램이 있어 충돌을 피하도록 포트를 정했습니다. API 포트를 바꿀 경우 `.env`의 `SERVER_PORT`와 `frontend/vite.config.ts`의 프록시 주소를 함께 변경하세요. Vite preview는 14173 포트를 사용합니다.

## 5. 폴더 및 코드 안내

```text
.
├── backend/
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd / .mvn/wrapper/
│   └── src/
│       ├── main/java/kr/co/tutorial/crud/
│       │   ├── CrudApplication.java       # 시작점
│       │   ├── SecurityConfig.java        # 인증·인가·CSRF·로그아웃
│       │   ├── AuthController.java        # 현재 사용자·토큰·상태
│       │   ├── PostController.java        # CRUD SQL·권한·트랜잭션
│       │   └── ApiExceptionHandler.java   # 오류 응답 통일
│       ├── main/resources/application.yml
│       └── test/                         # DB 독립 통합 테스트
├── frontend/
│   ├── src/App.tsx                        # 로그인·목록·상세·편집 화면
│   ├── src/api.ts                         # 타입·HTTP·CSRF·UTF-8 계산
│   ├── src/styles.css                     # 반응형 스타일
│   ├── src/api.test.ts                    # 바이트 길이 검증
│   ├── e2e/crud.spec.ts                   # 실제 Oracle 브라우저 검증
│   └── playwright.config.ts
├── database/schema.sql                   # 신규 빈 스키마용 DDL
├── scripts/build.ps1
├── scripts/start.ps1
├── .env.example
└── README.md
```

단순한 학습 흐름을 위해 CRUD의 HTTP 처리와 JDBC 호출을 `PostController`에 모았습니다. SQL은 PreparedStatement 바인딩을 사용합니다. 내 글 필터에 사용되는 숫자 ID는 인증 사용자로부터 DB에서 조회하며 요청 문자열을 SQL에 직접 붙이지 않습니다. 업무 규칙이 커지면 컨트롤러 → 서비스 → 리포지터리 구조로 분리하면 됩니다.

## 6. DB 구조와 데이터 보존

개발 서버에서 기존 테이블과 사용자를 조회해 확인했습니다. 기존 게시글 10개와 `guest01` 계정이 존재했습니다. 앱은 계정 생성·비밀번호 변경·기존 글 초기화를 수행하지 않습니다. 함께 존재하는 `VT_CRUD_POSTS`, `VT_CRUD_USERS` 테이블은 사용하지 않습니다.

### TB_USER

| 컬럼 | 자료형 | 용도 |
| --- | --- | --- |
| USER_ID | NUMBER, IDENTITY, PK | 사용자 식별자 |
| USERNAME | VARCHAR2(50 BYTE), UNIQUE | 로그인 아이디 |
| PASSWORD | VARCHAR2(255 BYTE) | 기존 BCrypt 해시 |
| EMAIL | VARCHAR2(100 BYTE), UNIQUE | 이메일 |
| ROLE | VARCHAR2(20 BYTE) | ROLE_USER / ROLE_ADMIN |
| CREATED_AT / UPDATED_AT | TIMESTAMP | 생성·수정 시각 |

### TB_POST

| 컬럼 | 자료형 | 용도 |
| --- | --- | --- |
| POST_ID | NUMBER, IDENTITY, PK | 게시글 식별자 |
| TITLE | VARCHAR2(200 BYTE) | 제목 |
| CONTENT | CLOB | 본문 |
| USER_ID | NUMBER, FK → TB_USER | 작성자 |
| VIEW_COUNT | NUMBER, 기본값 0 | 조회수 |
| CREATED_AT / UPDATED_AT | TIMESTAMP | 생성·수정 시각, 기본값 SYSTIMESTAMP |

`database/schema.sql`은 **동일 테이블이 없는 새 스키마**에서만 직접 실행하는 참고 DDL입니다. 현재 제공된 서버에는 실행할 필요가 없습니다. 새 스키마에서 사용할 경우 BCryptPasswordEncoder로 해시를 생성한 테스트 계정을 별도로 준비해야 합니다.

### 한글과 시간 처리

- DB 문자셋: `AL32UTF8`, 국가 문자셋: `AL16UTF16` 확인.
- Java 소스, HTTP 요청·응답, HTML, 저장 파일을 UTF-8로 구성했습니다.
- `TITLE`은 글자 수가 아닌 200 **바이트** 제한입니다. 한글 66자는 보통 198바이트, 67자는 201바이트입니다. 이모지는 보통 4바이트입니다.
- React에서는 `TextEncoder`, Java에서는 `StandardCharsets.UTF_8`로 제목을 검증합니다. 앞뒤 공백을 제거한 값을 저장합니다.
- 본문은 문자열을 CLOB으로 바인딩하며 20,000 Java/JS 문자열 코드 단위로 제한합니다. 줄바꿈과 이모지를 저장할 수 있습니다.
- DB의 TIMESTAMP에는 시간대가 없습니다. API는 DB 시각을 `LocalDateTime`으로 반환합니다. 현재 화면은 브라우저 로컬 날짜로 표시하므로 다국가 서비스로 확장할 때는 UTC 기반 저장·반환 정책을 별도로 정해야 합니다.

## 7. API 명세

`/api/auth/csrf`, `/api/auth/login`, `/api/health`를 제외한 업무 API는 로그인이 필요합니다. 세션 쿠키는 브라우저가 보관합니다.

| Method | 경로 | 요청 / 응답 |
| --- | --- | --- |
| GET | `/api/health` | DB `SELECT 1 FROM DUAL`, `{status:"UP",database:"connected"}` |
| GET | `/api/auth/csrf` | `{token,headerName}` |
| POST | `/api/auth/login` | form-urlencoded `username`, `password` |
| GET | `/api/auth/me` | `{id,username,email,role}` |
| POST | `/api/auth/logout` | 세션 폐기·쿠키 삭제 |
| GET | `/api/posts?q=&page=0&size=8&mine=false` | 목록·페이지 정보·전체/내 글/작성자 통계 |
| GET | `/api/posts/{id}` | 상세 조회 및 조회수 증가 |
| POST | `/api/posts` | JSON `{title,content}`, 201 + 저장 결과 |
| PUT | `/api/posts/{id}` | JSON `{title,content}`, 200 + 수정 결과 |
| DELETE | `/api/posts/{id}` | 본인 게시글 삭제, 204 |

목록 응답:

```json
{
  "items": [{ "id": 1, "title": "제목", "content": "내용", "userId": 9,
    "author": "guest01", "viewCount": 0,
    "createdAt": "2026-10-07T10:00:00", "updatedAt": "2026-10-07T10:00:00" }],
  "totalElements": 1, "page": 0, "size": 8, "totalPages": 1,
  "totalPosts": 10, "myPosts": 1, "authors": 10
}
```

위 숫자는 응답 구조를 설명하기 위한 예입니다. `totalElements`는 검색·내 글 필터 적용 후 개수이며 `totalPosts`, `myPosts`, `authors`는 검색과 관계없는 전체 현황입니다. 제목과 작성자를 대소문자 구분 없이 검색합니다. SQL LIKE 와일드카드 대신 INSTR를 사용하므로 `%`, `_`는 일반 문자로 취급합니다. 본문 검색은 제공하지 않습니다.

`page`는 0부터, `size`는 1~50, 검색어는 최대 100자입니다. 목록은 ID 내림차순이며 Oracle `OFFSET/FETCH`로 페이지를 처리합니다.

오류 응답은 `{ "message": "안내 메시지" }`입니다. 주요 상태 코드는 400(입력 오류), 401(인증 필요/실패), 403(권한 또는 CSRF 오류), 404(게시글 없음), 503(DB 요청 실패)입니다.

## 8. 인증·권한 흐름

1. 로그인 전 `/api/auth/csrf`에서 토큰을 발급받습니다.
2. 로그인 POST에 form 데이터와 응답의 `headerName` 헤더(기본 `X-CSRF-TOKEN`)로 토큰을 보냅니다.
3. Spring Security가 `TB_USER`를 조회하고 BCrypt 해시를 검증합니다.
4. 로그인 성공 시 세션 ID가 변경되고 기존 CSRF 토큰이 폐기되므로 토큰을 다시 조회합니다.
5. 이후 POST/PUT/DELETE에 세션 쿠키와 CSRF 토큰을 함께 보냅니다.
6. 수정·삭제는 세션 사용자 ID와 게시글의 USER_ID를 비교합니다. 관리자도 다른 사람 글을 변경할 수 없는 **작성자 전용 정책**입니다.
7. 로그아웃은 POST로 처리하고 세션을 무효화합니다. 비활성 세션 만료는 30분입니다.

비밀번호 및 토큰은 localStorage에 저장하지 않습니다. 세션 쿠키 이름은 같은 호스트의 다른 개발 앱과 구분하도록 `RECORD_SESSION`으로 지정했습니다. React는 게시글을 일반 문자열로 렌더링하며 HTML 삽입을 사용하지 않습니다. 사용자에게 DB 오류 SQL·비밀번호를 반환하지 않으며 서버 로그에서 원인을 확인할 수 있습니다.

## 9. 테스트 방법

### 백엔드 — 실제 Oracle과 분리

```powershell
cd backend
.\mvnw.cmd test '-Ddebug=false'
```

H2 메모리 DB의 Oracle 모드에 테스트 스키마·사용자를 생성합니다. 운영/개발 Oracle 데이터를 지우지 않습니다. 검증 항목은 로그인 성공/실패, 세션 유지/로그아웃, 비인증 차단, CSRF 누락 차단, 타인 수정·삭제 차단, 한글 CRUD, 조회수, 검색, 입력 제한, SQL 삽입 형태 검색어입니다. H2만으로 Oracle 호환성을 보장할 수 없으므로 아래 실제 서버 브라우저 테스트를 별도로 사용합니다.

### 프런트엔드 단위 테스트 및 빌드

```powershell
cd frontend
npm.cmd test
npm.cmd run build
```

### 실제 Oracle을 사용하는 E2E

앱을 18080에서 실행하고 Microsoft Edge를 설치한 상태로 수행합니다.

```powershell
cd frontend
$env:E2E_PASSWORD = '전달받은_로그인_비밀번호'
npm.cmd run test:e2e
Remove-Item Env:E2E_PASSWORD
```

`E2E_BASE_URL`로 주소를 바꿀 수 있습니다. 테스트는 `guest01`로 로그인하고 고유 제목의 글을 작성→검색→조회→긴 한글 본문 수정→삭제한 후 게시글 총수가 원복됐는지 확인합니다. 세션 새로고침 유지, 페이지 이동, 390px 모바일 문서 폭, 로그아웃 후 접근 차단도 확인합니다. 실패 시 생성된 글을 `finally`에서 삭제 시도하며, 강제 프로세스 종료/서버 장애 시 테스트 글이 남을 수 있습니다. 스크린샷은 `.local/`에 저장되고 Git에서 제외됩니다. 테스트 중 ID 시퀀스 증가로 번호에 빈 구간이 생길 수 있습니다.

## 10. 운영 확장 및 문제 해결

- 기본 주소는 `127.0.0.1`입니다. 외부 공개 시 `SERVER_ADDRESS`, HTTPS reverse proxy, 방화벽 및 `COOKIE_SECURE=true`를 함께 설정하세요.
- 현재 세션은 서버 메모리이므로 재시작하면 로그인이 풀립니다. 여러 서버를 사용할 때는 Spring Session/Redis 등 공유 저장소가 필요합니다.
- 운영 서비스 전환 시 로그인 시도 제한, 계정 잠금, 비밀번호 재설정, 감사 로그를 추가할 수 있습니다.
- 동시 수정은 마지막 저장이 우선합니다. 협업 편집이 필요하면 VERSION 컬럼 기반 낙관적 잠금을 추가하세요.
- 목록은 학습 편의를 위해 전체 본문을 포함합니다. 글 수와 본문이 커지면 목록 DTO에 요약만 반환하고 통계 조회·검색 인덱스도 별도 최적화하세요.
- 글 상세 GET마다 조회수를 1 증가시킵니다. 고유 방문자 수가 아니며 중복 열기도 포함합니다.
- Noto Sans KR을 Google Fonts로 가져옵니다. 외부 폰트 접속이 불가능하면 시스템 한글 글꼴로 표시됩니다.
- 포트 충돌: `.env`의 `SERVER_PORT` 및 Vite 프록시를 함께 변경합니다. 기존 서버를 임의로 종료하지 마세요.
- ORA-01017: DB 사용자·비밀번호를 확인합니다. 앱 로그인 계정과 DB 접속 계정은 다릅니다.
- ORA-12514/접속 시간 초과: Oracle listener, `XEPDB1` 서비스, 1521 방화벽 및 사설망 연결을 확인합니다.
- 로그인 실패: 기존 guest01 계정과 BCrypt 해시·전달받은 로그인 비밀번호를 확인합니다. 앱은 비밀번호를 덮어쓰지 않습니다.
- 403 발생: CSRF 토큰이 만료됐을 수 있습니다. 화면을 새로고침하거나 다시 로그인하세요.
- 루트 화면 404: React를 먼저 빌드한 후 Maven 패키징을 다시 하세요. `scripts/build.ps1`은 순서를 보장합니다.
- PowerShell 실행 정책으로 ps1이 차단되면 스크립트 안의 명령을 터미널에서 직접 실행할 수 있습니다.

## 11. 개발 검증 결과

2026-10-07 기준 아래 검증을 완료했습니다.

| 검증 | 결과 |
| --- | --- |
| 백엔드 JUnit/MockMvc 통합 테스트 | 4개 통과 |
| 프런트엔드 Vitest | 1개 통과 |
| TypeScript 검사 + Vite 프로덕션 빌드 | 성공 |
| Maven clean package | 테스트 포함 성공 |
| 실제 Oracle 연결 | `/api/health`: `UP/connected` |
| 실제 Edge 브라우저 E2E | 1개 시나리오 통과 |
| 실제 계정 로그인 / 잘못된 비밀번호 / 세션 새로고침 유지 | 정상 |
| 실제 Oracle 한글·이모지 작성 / 검색 / 상세 / 긴 CLOB 수정 / 삭제 | 정상 |
| 페이지 이동 / 390px 모바일 폭 / 로그아웃 후 401 | 정상 |
| 생성한 테스트 게시글 정리 | 삭제 완료, E2E 시작·종료 게시글 총수 일치 |

모바일 검증은 목록 데이터 로딩이 끝난 후 문서 폭을 측정하며, 최종 E2E 시나리오는 6.8초에 완료되었습니다. 개발 중 확인한 모바일 가로 여백 문제는 스크롤 영역 내 접근성 텍스트의 위치 기준을 수정해 해결했습니다. 검증용 백그라운드 서버는 `http://127.0.0.1:18080`에서 실행해 두었습니다. 컴퓨터/프로세스를 종료하면 `scripts/start.ps1`로 다시 실행하세요. 이미 실행 중이면 동일 포트에 중복 실행하지 않습니다.
