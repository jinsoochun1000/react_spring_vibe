# 🎨 Frontend 개발자 가이드 (React + Vite + Tailwind CSS + TanStack Query)

본 문서는 **CRUD Tutorial 프로젝트의 프론트엔드 아키텍처, 디렉토리 구조, 상태 관리 전략, 컴포넌트 설계 및 실행 가이드**를 설명합니다.

---

## 📌 1. 기술 스택 및 환경

- **Core**: React 19, TypeScript, Vite 8
- **Styling**: Tailwind CSS 3.4, PostCSS, Autoprefixer, Glassmorphism UI
- **Server State Management**: `@tanstack/react-query` v5 (React Query)
- **HTTP Client**: Axios 1.20 (인터셉터를 통한 JWT 토큰 자동화)
- **Iconography**: `lucide-react`
- **Encoding**: UTF-8 (`<meta charset="UTF-8" />` 및 소스코드 일괄)

---

## 📂 2. 디렉토리 구조 및 역할

```bash
frontend/
├── public/                 # 정적 리소스
├── src/
│   ├── api/
│   │   ├── client.ts       # Axios 인스턴스 (JWT 인터셉터 및 401 세션 만료 제어)
│   │   ├── auth.ts         # 로그인(/api/auth/login) 및 사용자 정보(/api/auth/me) API
│   │   └── task.ts         # 태스크 CRUD 및 통계(/api/tasks) API
│   ├── components/
│   │   ├── Navbar.tsx             # 상단 네비게이션, 테마 토글, 태스크 생성 버튼, 사용자 프로필
│   │   ├── StatsCards.tsx         # 실시간 상태별 집계 카드 및 원클릭 필터링
│   │   ├── FilterBar.tsx          # 키워드 검색, 카테고리/우선순위/상태 셀렉터, 정렬 옵션
│   │   ├── TaskCard.tsx           # 카드 컴포넌트, 뱃지, 마감일, 인라인 빠른 상태 변경 드롭다운
│   │   ├── TaskModal.tsx          # 등록 및 수정 겸용 모달 폼 (유효성 검사 포함)
│   │   ├── TaskDetailModal.tsx    # 태스크 상세 정보 및 본문 조회 모달
│   │   ├── DeleteConfirmModal.tsx # 영구 삭제 확인 다이얼로그
│   │   ├── Pagination.tsx         # 페이징 컨트롤러
│   │   └── LoginPage.tsx          # 게스트 프리셋 버튼이 포함된 로그인 화면
│   ├── context/
│   │   ├── AuthContext.tsx        # JWT 토큰 관리 및 로그인/로그아웃 전역 상태
│   │   └── ThemeContext.tsx       # 다크/라이트 테마 전역 상태 (localStorage 연동)
│   ├── types/
│   │   └── index.ts               # 공통 TypeScript 타입 및 인터페이스
│   ├── App.tsx                    # TanStack Query 연동 메인 대시보드
│   ├── index.css                  # 글래스모피즘 유틸리티 클래스 및 커스텀 스크롤바
│   └── main.tsx                   # QueryClientProvider 및 Provider 트리 세팅
├── index.html                     # UTF-8 메타 태그, 파비콘, 타이틀
├── tailwind.config.js             # 커스텀 인디고/바이올렛 팔레트 및 다크모드 클래스 설정
└── tsconfig.app.json              # TypeScript 컴파일 설정
```

---

## ⚡ 3. 핵심 아키텍처 및 구현 전략

### 3.1 TanStack Query (React Query) 서버 상태 관리
- **쿼리 키 구조화**:
  - 태스크 목록: `['tasks', { keyword, category, priority, status, page, sort }]`
  - 상태 통계: `['taskStats']`
- **캐시 동기화 (`queryClient.invalidateQueries`)**:
  - 태스크 등록(`createTask`), 수정(`updateTask`), 상태 변경(`updateTaskStatus`), 삭제(`deleteTask`) 뮤테이션 성공 시 `tasks`와 `taskStats` 쿼리를 즉시 무효화하여 화면에 최신 데이터를 동기화합니다.
- **캐싱 설정**:
  - 불필요한 네트워크 트래픽을 방지하기 위해 `staleTime: 30초` 및 `refetchOnWindowFocus: false`로 최적화되었습니다.

### 3.2 Stateless JWT 인터셉터 (`src/api/client.ts`)
```typescript
// Request Interceptor: 모든 API 요청 헤더에 자동으로 Bearer 토큰 주입
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: 401 Unauthorized 감지 시 토큰 제거 및 이벤트 발생
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('jwt_user');
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error);
  }
);
```

### 3.3 디자인 시스템 & UI/UX (Glassmorphism & Micro-Interactions)
- **Glassmorphism**: 반투명 배경 및 `backdrop-filter: blur(16px)`를 활용한 입체감 있는 카드 및 패널 디자인.
- **인터랙티브 빠른 상태 토글**: 카드의 드롭다운을 통해 모달을 열지 않고도 `TODO` ↔ `IN_PROGRESS` ↔ `REVIEW` ↔ `DONE` 즉각 전환 가능.
- **원클릭 계정 자동완성**: 로그인 화면에서 `[기본 계정 자동 완성 (guest01 / password123!)]` 버튼을 클릭하여 테스트 편의성 극대화.

---

## 🏃 4. 실행 및 빌드 가이드

### 4.1 의존성 설치
```powershell
cd frontend
npm install
```

### 4.2 로컬 개발 서버 실행
```powershell
# 기본 포트: 5173
npm run dev -- --host 127.0.0.1 --port 5173
```
- 브라우저에서 `http://localhost:5173`으로 접속합니다.

### 4.3 프로덕션 번들 빌드
```powershell
npm run build
```
- 빌드 결과물은 `frontend/dist/` 디렉토리에 정적 파일로 생성됩니다.

### 4.4 빌드 결과물 미리보기
```powershell
npm run preview
```

---

## 🔒 5. 기본 계정 및 인증 정보

- **아이디**: `guest01`
- **비밀번호**: `password123!`
- 로그인 성공 시 발급받은 Stateless JWT는 브라우저 `localStorage`에 안전하게 보관되며, 로그아웃 시 완전 제거됩니다.
