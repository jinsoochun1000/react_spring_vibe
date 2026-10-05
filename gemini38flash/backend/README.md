# 🛠️ Backend 개발자 가이드 (Spring Boot 3 + Oracle 18c XE + JWT)

본 문서는 **CRUD Tutorial 프로젝트의 백엔드 아키텍처, 환경 설정, DB 연동, API 명세 및 유지보수 가이드**를 상세히 설명합니다.

---

## 📌 1. 기술 스택 및 라이브러리

- **Language & Runtime**: Java 17 (Eclipse Adoptium OpenJDK 17)
- **Framework**: Spring Boot 3.3.4
- **ORM / Persistence**: Spring Data JPA, Hibernate 6.5.3 (Oracle Dialect)
- **Database**: Oracle 18c XE (`ojdbc11:23.4.0.24.05`)
- **Connection Pool**: HikariCP (Max 10, Min-Idle 2)
- **Security & Auth**: Spring Security 6.3.3 + JJWT 0.12.6 (Stateless Bearer JWT)
- **Build Tool**: Apache Maven 3.9.9 (`mvnw.cmd` 내장)
- **Encoding**: UTF-8 (HTTP Servlet, POM Source/Report Encoding)

---

## 🗄️ 2. Oracle 18c XE 데이터베이스 구성

### 2.1 DB 접속 정보
```yaml
Host: 192.168.45.2
Port: 1521
Service Name: XEPDB1
Username: USERSTK7
Password: PwUserStk7
JDBC URL: jdbc:oracle:thin:@192.168.45.2:1521/XEPDB1
```

### 2.2 테이블 스키마 및 시퀀스

Hibernate `ddl-auto: update` 및 JPA 어노테이션을 통해 데이터베이스에 아래 객체가 자동 생성 및 관리됩니다:

#### ① 사용자 테이블 (`APP_USERS`)
| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `USER_ID` | `NUMBER(19)` | PRIMARY KEY | 시퀀스 `SEQ_APP_USERS` 발급 |
| `USERNAME` | `VARCHAR2(50)` | UNIQUE, NOT NULL | 사용자 로그인 ID |
| `PASSWORD` | `VARCHAR2(200)` | NOT NULL | BCrypt 암호화된 해시값 |
| `NAME` | `VARCHAR2(100)` | NOT NULL | 사용자 이름 |
| `ROLE` | `VARCHAR2(20)` | NOT NULL | 권한 (`ROLE_USER`, `ROLE_ADMIN`) |
| `CREATED_AT` | `TIMESTAMP` | NOT NULL | 등록 일시 (JPA Auditing) |
| `UPDATED_AT` | `TIMESTAMP` | - | 수정 일시 (JPA Auditing) |

#### ② 태스크 테이블 (`APP_TASKS`)
| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `TASK_ID` | `NUMBER(19)` | PRIMARY KEY | 시퀀스 `SEQ_APP_TASKS` 발급 |
| `TITLE` | `VARCHAR2(200)` | NOT NULL | 작업 제목 |
| `CONTENT` | `VARCHAR2(4000)` | NOT NULL | 상세 내용 (대소문자 무시 검색 호환) |
| `CATEGORY` | `VARCHAR2(30)` | NOT NULL | `FRONTEND`, `BACKEND`, `DATABASE`, `DEVOPS`, `DESIGN`, `OTHER` |
| `PRIORITY` | `VARCHAR2(20)` | NOT NULL | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `STATUS` | `VARCHAR2(20)` | NOT NULL | `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE` |
| `DUE_DATE` | `DATE` | - | 작업 마감일 |
| `AUTHOR_USERNAME` | `VARCHAR2(50)` | NOT NULL | 작성자 계정 ID |
| `AUTHOR_NAME` | `VARCHAR2(100)` | NOT NULL | 작성자 실명 |
| `CREATED_AT` | `TIMESTAMP` | NOT NULL | 등록 일시 (JPA Auditing) |
| `UPDATED_AT` | `TIMESTAMP` | - | 수정 일시 (JPA Auditing) |

---

## 🔐 3. Spring Security & JWT 인증 구조

### 3.1 무상태(Stateless) 정책
- 세션을 생성하지 않고(`SessionCreationPolicy.STATELESS`), 클라이언트가 요청마다 HTTP 헤더 `Authorization: Bearer <JWT>`를 전송하여 인증합니다.
- CSRF는 비활성화(`csrf.disable()`) 처리되어 있습니다.
- 교차 출처 리소스 공유(CORS)는 `localhost:5173`을 포함하여 전체 HTTP 메서드(`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`)를 허용하도록 `CorsConfigurationSource` 빈으로 등록되었습니다.

### 3.2 토큰 처리 (`JwtTokenProvider.java`)
- 최신 JJWT 0.12.x API 표준(`Jwts.parser().verifyWith(secretKey).build()`)을 준수합니다.
- 토큰 유효 기간: 24시간 (86,400,000 ms)

### 3.3 초기 시드 데이터 (`DataInitializer.java`)
서버 최초 실행 시 `guest01` 계정이 없으면 자동 등록됩니다:
- **아이디**: `guest01`
- **비밀번호**: `password123!` (BCrypt 암호화 저장)
- **샘플 태스크**: 튜토리얼용 실무 태스크 7건 자동 생성

---

## 📡 4. REST API 명세서

### 4.1 인증 API
| Method | Endpoint | 설명 | 인증 여부 | Request Body | Response |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/auth/login` | 로그인 및 JWT 토큰 발급 | 공개 | `{"username":"...", "password":"..."}` | `{token, tokenType, expiresIn, user}` |
| `GET` | `/api/auth/me` | 현재 로그인된 사용자 정보 조회 | 필수 | - | `{id, username, name, role}` |

### 4.2 태스크 CRUD & 통계 API
모든 태스크 API는 `Authorization: Bearer <TOKEN>` 헤더가 필요합니다.

| Method | Endpoint | 설명 | Query / Body Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | 태스크 목록 검색 및 페이징 | `keyword`: 검색어<br>`category`: 카테고리 필터<br>`status`: 상태 필터<br>`priority`: 우선순위 필터<br>`page`: 페이지 번호 (0부터 시작, 기본 0)<br>`size`: 페이지 크기 (기본 9)<br>`sort`: 정렬 기준 (예: `createdAt,desc`) |
| `GET` | `/api/tasks/{id}` | 태스크 단건 상세 조회 | 경로 변수 `id` |
| `POST` | `/api/tasks` | 새 태스크 등록 | `{"title":"...", "content":"...", "category":"...", "priority":"...", "status":"...", "dueDate":"YYYY-MM-DD"}` |
| `PUT` | `/api/tasks/{id}` | 태스크 전체 정보 수정 | `{"title":"...", "content":"...", "category":"...", "priority":"...", "status":"...", "dueDate":"YYYY-MM-DD"}` |
| `PATCH` | `/api/tasks/{id}/status` | 태스크 상태 단독 변경 | `{"status":"IN_PROGRESS"}` |
| `DELETE` | `/api/tasks/{id}` | 태스크 영구 삭제 | 경로 변수 `id` |
| `GET` | `/api/tasks/stats` | 상태별 태스크 집계 통계 | 응답: `{total, todo, inProgress, review, done}` |

---

## 🏃 5. 빌드 및 실행 가이드

### 5.1 사전 요구사항
- Java 17 이상 설치 (`JAVA_HOME` 등록)
- Oracle 18c XE 서버 네트워크 접근 가능 (`192.168.45.2:1521`)

### 5.2 빌드 및 컴파일
```powershell
# backend 디렉토리로 이동
cd backend

# 프로젝트 컴파일
.\mvnw.cmd compile

# 패키징 (JAR 파일 생성)
.\mvnw.cmd clean package -DskipTests
```

### 5.3 애플리케이션 실행
```powershell
# 개발 환경 즉시 실행 (포트 8080)
.\mvnw.cmd spring-boot:run
```

---

## 💡 6. 트러블슈팅 및 주의사항

1. **Oracle 18c XE CLOB 필드 대소문자 검색 오류 (ORA-22859)**
   - Hibernate 6에서 `@Lob` 매핑된 컬럼을 `LOWER(t.content)` 함수로 처리할 경우 HQL 파싱 예외가 발생할 수 있습니다.
   - 따라서 본 프로젝트는 본문 필드를 `@Column(length = 4000)`의 `VARCHAR2(4000)`로 매핑하여 한글 검색 및 다국어 처리가 안전하게 작동하도록 구성했습니다.
2. **한글 인코딩 (UTF-8) 보장**
   - `application.yml`의 `server.servlet.encoding.charset: UTF-8` 및 `force: true`를 적용하여 모든 REST API 요청/응답에서 한글 깨짐이 발생하지 않습니다.
