# 🚀 CRUD Tutorial: 풀스택 바이브 코딩 (React + Spring Boot 3 + Oracle 18c XE)

본 저장소는 **React(Vite) + Tailwind CSS + TanStack Query** 프론트엔드와 **Spring Boot 3 + Spring Data JPA + Oracle 18c XE + Stateless JWT** 백엔드로 구성된 풀스택 CRUD 튜토리얼 프로젝트입니다.

---

## 🛠️ 기술 스택 (Tech Stack)

| 영역 | 기술 스택 | 주요 특징 |
| :--- | :--- | :--- |
| **Front** | **React 19 (Vite 8) + Tailwind CSS + TanStack Query v5** | • 글래스모피즘(Glassmorphism) & 다크/라이트 테마<br>• TanStack Query를 통한 서버 상태 캐싱 및 즉시 동기화<br>• Axios 인터셉터를 통한 JWT 토큰 자동화 |
| **Back** | **Java Spring Boot 3.3.4 + Spring Data JPA** | • Oracle 18c XE Dialect 및 시퀀스 자동 매핑<br>• 동적 검색, 다중 필터링, 정렬, 페이징 API<br>• RestControllerAdvice 기반 표준화된 예외 처리 |
| **DB** | **Oracle 18c XE (`192.168.45.2:1521/XEPDB1`)** | • 계정: `USERSTK7` / `PwUserStk7`<br>• HikariCP 고성능 커넥션 풀 적용 |
| **Auth** | **Spring Security 6 + JJWT 0.12.6** | • 완전한 무상태(Stateless) Bearer 토큰 검증<br>• BCrypt 해싱 암호화<br>• 테스트용 기본 계정: `guest01` / `password123!` |
| **Encoding** | **UTF-8 일괄 적용** | • Spring Servlet Encoding, POM, HTML UTF-8 완벽 지원 |

---

## 📂 프로젝트 구조

```bash
gemini38flash/
├── backend/                  # Java Spring Boot 3 백엔드 프로젝트
│   ├── src/main/java/        # 도메인, 리포지토리, 서비스, 컨트롤러, 보안 필터
│   ├── src/main/resources/   # application.yml (Oracle 18c XE 설정, UTF-8 인코딩)
│   ├── pom.xml               # Maven 의존성 및 빌드 설정
│   ├── mvnw.cmd              # 내장 Maven 실행 스크립트
│   └── README.md             # 📖 Backend 개발자 가이드
│
├── frontend/                 # React Vite 프론트엔드 프로젝트
│   ├── src/                  # React 컴포넌트, TanStack Query 훅, 컨텍스트
│   ├── package.json          # npm 패키지 설정
│   ├── tailwind.config.js    # Tailwind 스타일 설정
│   └── README.md             # 📖 Frontend 개발자 가이드
│
└── README.md                 # 프로젝트 통합 개요 (본 문서)
```

---

## ⚡ 빠른 시작 (Quick Start)

### 1. 백엔드 실행 (Spring Boot 3)
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
- 백엔드 서버 기본 주소: `http://localhost:8080`
- 기본 계정(`guest01` / `password123!`) 및 샘플 태스크 7건이 Oracle DB에 자동 시딩됩니다.

### 2. 프론트엔드 실행 (React Vite)
```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
- 웹 브라우저에서 `http://localhost:5173`으로 접속합니다.

---

## 📖 세부 개발자 가이드 문서 바로가기

- [📘 Backend 상세 개발자 가이드 (DB 스키마, API 명세, JWT 구조)](file:///c:/Users/jinso/source/react_javaspring_vibe/gemini38flash/backend/README.md)
- [📙 Frontend 상세 개발자 가이드 (컴포넌트 설계, React Query 캐싱 전략)](file:///c:/Users/jinso/source/react_javaspring_vibe/gemini38flash/frontend/README.md)
