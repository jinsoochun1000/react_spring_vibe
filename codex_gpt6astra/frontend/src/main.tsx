import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  LayoutGrid,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
  Code2,
  ExternalLink,
  LoaderCircle,
} from "lucide-react";
import {
  api,
  ApiError,
  refreshCsrf,
  type Account,
  type Post,
  type Page,
  type Stats,
} from "./api";
import "./styles.css";

const date = (value: string) =>
  new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
const bytes = (value: string) => new TextEncoder().encode(value.trim()).length;
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">m.</span>
      <span>
        모아<span className="brand-dot">.</span>
      </span>
    </div>
  );
}
function Busy() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={22} /> 불러오는 중입니다
    </div>
  );
}

function Login({ onLogin }: { onLogin: (user: Account) => void }) {
  const [username, setUsername] = useState("guest01");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await refreshCsrf();
      await api("/api/auth/login", {
        method: "POST",
        body: new URLSearchParams({ username, password }),
      });
      await refreshCsrf();
      onLogin(await api<Account>("/api/auth/me"));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <Brand />
        <div>
          <span className="eyebrow">YOUR IDEAS, IN ONE PLACE</span>
          <h1>
            작은 기록이 모여,
            <br />
            새로운 시작이 됩니다.
          </h1>
          <p>
            생각을 기록하고, 함께 나누고, 더 나은 아이디어로.
            <br />
            우리의 기록이 쌓이는 공간, 모아에 오신 것을 환영합니다.
          </p>
          <div className="story-cards">
            <div>
              <FileText size={26} />
              <strong>기록하고</strong>
              <span>떠오른 생각을 자유롭게</span>
            </div>
            <div>
              <Pencil size={26} />
              <strong>다듬고</strong>
              <span>아이디어를 더 선명하게</span>
            </div>
            <div>
              <LayoutGrid size={26} />
              <strong>모아보세요</strong>
              <span>한곳에서 연결되는 기록</span>
            </div>
          </div>
        </div>
        <small>
          REACT + SPRING BOOT + ORACLE <span>CRUD TUTORIAL / 01</span>
        </small>
      </section>
      <section className="login-form-wrap">
        <form onSubmit={login} className="login-form">
          <span className="pill">함께 만드는 워크스페이스</span>
          <h2>다시 만나 반가워요</h2>
          <p>로그인하고 새로운 기록을 시작해 보세요.</p>
          <label>
            아이디
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              maxLength={50}
              placeholder="아이디를 입력하세요"
            />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              maxLength={200}
              placeholder="비밀번호를 입력하세요"
            />
          </label>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <button className="primary full" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <>
                워크스페이스 들어가기 <ArrowRight size={18} />
              </>
            )}
          </button>
          <div className="login-note">
            <ShieldCheck size={18} />
            <span>
              계정 정보는 안전하게 보호됩니다.
              <br />
              세션 기반 인증으로 로그인합니다.
            </span>
          </div>
        </form>
        <small className="login-copyright">모아 · 아이디어가 자라는 공간</small>
      </section>
    </main>
  );
}

function Modal({
  children,
  close,
  title,
}: {
  children: React.ReactNode;
  close: () => void;
  title: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input, textarea, select, a[href]",
        ) || [],
      );
    focusables()[0]?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key === "Tab") {
        const items = focusables();
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", key);
      before?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
      >
        {children}
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<Account | null>(null);
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState("");
  const [section, setSection] = useState<"all" | "mine" | "guide">("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<Post | null>(null);
  const [editor, setEditor] = useState<{
    id?: number;
    title: string;
    content: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [opening, setOpening] = useState(false);
  async function bootstrap() {
    setBooting(true);
    setBootError("");
    try {
      await refreshCsrf();
      setUser(await api<Account>("/api/auth/me"));
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401))
        setBootError(errorMessage(e));
    } finally {
      setBooting(false);
    }
  }
  useEffect(() => {
    void bootstrap();
  }, []);
  useEffect(() => {
    const expire = () => {
      setUser(null);
      setDetail(null);
      setEditor(null);
      setData(null);
      setStats(null);
      setNotice("");
    };
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, []);
  useEffect(() => {
    if (!user || section === "guide") return;
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      api<Page>(
        `/api/posts?query=${encodeURIComponent(search)}&mine=${section === "mine"}&page=${page}&size=8&sort=${sort}`,
      ),
      api<Stats>("/api/posts/stats"),
    ])
      .then(([posts, counts]) => {
        if (active) {
          if (posts.totalPages > 0 && page > posts.totalPages) {
            setPage(posts.totalPages);
            return;
          }
          setData(posts);
          setStats(counts);
        }
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, section, search, sort, page, reload]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  function navigate(next: typeof section) {
    setSection(next);
    setPage(1);
    setQuery("");
    setSearch("");
  }
  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
      setUser(null);
      setData(null);
      setStats(null);
      setSection("all");
      setPage(1);
      await refreshCsrf();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function openPost(id: number) {
    if (opening) return;
    setOpening(true);
    setError("");
    setModalError("");
    try {
      setDetail(await api<Post>(`/api/posts/${id}/view`, { method: "POST" }));
      setReload((n) => n + 1);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setOpening(false);
    }
  }
  const closeModal = React.useCallback(() => {
    if (saving) return;
    if (
      editor &&
      (editor.title || editor.content) &&
      !window.confirm(
        "작성 중인 내용을 닫을까요? 저장하지 않은 변경사항은 사라집니다.",
      )
    )
      return;
    setEditor(null);
    setDetail(null);
    setConfirmDelete(false);
    setModalError("");
  }, [saving, editor]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editor || saving) return;
    setSaving(true);
    setModalError("");
    try {
      const post = await api<Post>(
        editor.id ? `/api/posts/${editor.id}` : "/api/posts",
        {
          method: editor.id ? "PUT" : "POST",
          body: JSON.stringify({
            title: editor.title.trim(),
            content: editor.content.trim(),
          }),
        },
      );
      setNotice(
        editor.id ? "게시글을 수정했습니다." : "새로운 기록을 등록했습니다.",
      );
      setEditor(null);
      setDetail(post);
      setPage(1);
      setReload((n) => n + 1);
    } catch (e) {
      setModalError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (!detail || saving) return;
    setSaving(true);
    setModalError("");
    try {
      await api(`/api/posts/${detail.id}`, { method: "DELETE" });
      setDetail(null);
      setConfirmDelete(false);
      setNotice("게시글을 삭제했습니다.");
      setReload((n) => n + 1);
    } catch (e) {
      setModalError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  if (booting) return <Busy />;
  if (bootError)
    return (
      <div className="startup-error">
        <Brand />
        <h2>서버에 연결할 수 없습니다</h2>
        <p role="alert">{bootError}</p>
        <button className="primary" onClick={bootstrap}>
          다시 시도
        </button>
      </div>
    );
  if (!user) return <Login onLogin={setUser} />;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="workspace-label">
          WORKSPACE <span>개인</span>
        </div>
        <nav aria-label="주 메뉴">
          <button
            className={section === "all" ? "active" : ""}
            onClick={() => navigate("all")}
          >
            <LayoutGrid size={19} />
            전체 게시글<span>{stats?.total ?? "—"}</span>
          </button>
          <button
            className={section === "mine" ? "active" : ""}
            onClick={() => navigate("mine")}
          >
            <FileText size={19} />내 게시글<span>{stats?.mine ?? "—"}</span>
          </button>
          <div className="nav-divider" />
          <button
            className={section === "guide" ? "active" : ""}
            onClick={() => navigate("guide")}
          >
            <BookOpen size={19} />
            이용 가이드
            <ExternalLink size={14} />
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="learning-card">
            <div className="learning-icon">
              <Code2 size={20} />
              <span>BUILD & LEARN</span>
            </div>
            <strong>직접 만들며 배우는 CRUD</strong>
            <p>
              작은 기록 하나에서 시작하는
              <br />
              풀스택 개발 이야기.
            </p>
            <button onClick={() => navigate("guide")}>
              프로젝트 알아보기 <ArrowRight size={15} />
            </button>
          </div>
          <div className="profile">
            <span className="avatar">G</span>
            <div>
              <strong>{user.username}</strong>
              <small>워크스페이스 멤버</small>
            </div>
            <button
              className="icon-button"
              aria-label="로그아웃"
              onClick={logout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <span>
            워크스페이스 <ChevronRight size={13} />{" "}
            <strong>
              {section === "mine"
                ? "내 게시글"
                : section === "guide"
                  ? "이용 가이드"
                  : "전체 게시글"}
            </strong>
          </span>
          <div>
            <span className="environment-dot" />
            개발 워크스페이스<span className="header-avatar">G</span>
          </div>
        </header>
        <main className="content">
          {section === "guide" ? (
            <Guide />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">OUR LITTLE ARCHIVE</div>
                  <h1>
                    {section === "mine"
                      ? "나의 기록을 모아보세요"
                      : "생각을 나누는 공간"}
                    <span className="heading-dot">.</span>
                  </h1>
                  <p>
                    {section === "mine"
                      ? "직접 작성한 게시글을 한눈에 확인하고 관리하세요."
                      : "오늘의 아이디어와 이야기를 기록하고, 함께 나눠보세요."}
                  </p>
                </div>
                <button
                  className="primary"
                  onClick={() => {
                    setEditor({ title: "", content: "" });
                    setModalError("");
                  }}
                >
                  <Plus size={18} /> 새 글 작성
                </button>
              </div>
              <section className="stats-grid" aria-label="게시글 통계">
                <Stat
                  icon={<FileText size={21} />}
                  label="전체 게시글"
                  value={stats?.total}
                  suffix="개의 이야기"
                />
                <Stat
                  icon={<Pencil size={21} />}
                  label="내가 쓴 게시글"
                  value={stats?.mine}
                  suffix="개의 기록"
                />
                <Stat
                  icon={<Eye size={21} />}
                  label="누적 조회수"
                  value={stats?.views}
                  suffix="번의 관심"
                />
              </section>
              <section className="board">
                <div className="board-toolbar">
                  <div className="tabs">
                    <button
                      className={section === "all" ? "selected" : ""}
                      onClick={() => navigate("all")}
                    >
                      전체 게시글 <span>{stats?.total ?? "—"}</span>
                    </button>
                    <button
                      className={section === "mine" ? "selected" : ""}
                      onClick={() => navigate("mine")}
                    >
                      내 게시글
                    </button>
                  </div>
                  <form
                    className="search"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSearch(query.trim());
                      setPage(1);
                    }}
                  >
                    <Search size={17} />
                    <input
                      aria-label="게시글 검색"
                      value={query}
                      maxLength={100}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="제목 또는 작성자 검색"
                    />
                    {query && (
                      <button
                        type="button"
                        aria-label="검색 초기화"
                        onClick={() => {
                          setQuery("");
                          setSearch("");
                          setPage(1);
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                    <button type="submit">검색</button>
                  </form>
                </div>
                <div className="list-meta">
                  <span>
                    {search ? (
                      <>
                        <strong>“{search}”</strong> 검색 결과
                      </>
                    ) : (
                      "차곡차곡 쌓이는 우리의 이야기"
                    )}{" "}
                    <span className="count">{data?.total ?? 0}개</span>
                  </span>
                  <label>
                    <ArrowDown size={14} />
                    <select
                      aria-label="게시글 정렬"
                      value={sort}
                      onChange={(e) => {
                        setSort(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="latest">최신순</option>
                      <option value="views">조회순</option>
                    </select>
                  </label>
                </div>
                {error ? (
                  <div className="list-error" role="alert">
                    <p>{error}</p>
                    <button
                      className="secondary"
                      onClick={() => setReload((n) => n + 1)}
                    >
                      다시 시도
                    </button>
                  </div>
                ) : loading ? (
                  <Busy />
                ) : data?.items.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th className="number-col">번호</th>
                          <th>제목</th>
                          <th>작성자</th>
                          <th>작성일</th>
                          <th className="views-col">조회</th>
                          <th aria-label="열기" />
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((post) => (
                          <tr key={post.id}>
                            <td className="post-number">
                              {String(post.id).padStart(2, "0")}
                            </td>
                            <td className="title-cell">
                              <button
                                onClick={() => openPost(post.id)}
                                disabled={opening}
                              >
                                {post.title}
                              </button>
                              {post.userId === user.id && (
                                <span className="my-badge">MY</span>
                              )}
                            </td>
                            <td>
                              <span
                                className={`mini-avatar tone-${post.userId % 3}`}
                              >
                                {post.username[0]?.toUpperCase()}
                              </span>
                              <span className="author-name">
                                {post.username}
                              </span>
                            </td>
                            <td className="date-cell">
                              {date(post.createdAt)}
                            </td>
                            <td className="views-cell">
                              <Eye size={13} />
                              {post.viewCount.toLocaleString()}
                            </td>
                            <td>
                              <button
                                className="icon-button row-arrow"
                                aria-label={`${post.title} 열기`}
                                disabled={opening}
                                onClick={() => openPost(post.id)}
                              >
                                <ArrowRight size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty">
                    <div>
                      <FileText size={28} />
                    </div>
                    <h3>
                      {search
                        ? "검색 결과가 없습니다"
                        : "아직 작성된 기록이 없어요"}
                    </h3>
                    <p>
                      {search
                        ? "다른 제목이나 작성자로 다시 검색해 보세요."
                        : "첫 번째 이야기를 남겨보세요."}
                    </p>
                  </div>
                )}
                <div className="pagination">
                  <small>
                    총 {data?.total ?? 0}개 중{" "}
                    {data?.total ? (page - 1) * 8 + 1 : 0}–
                    {Math.min(page * 8, data?.total ?? 0)}개
                  </small>
                  <div>
                    <button
                      aria-label="이전 페이지"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((n) => n - 1)}
                    >
                      <ChevronLeft size={17} />
                    </button>
                    {Array.from(
                      { length: Math.min(data?.totalPages || 1, 5) },
                      (_, i) =>
                        Math.max(
                          1,
                          Math.min(page - 2, (data?.totalPages || 1) - 4),
                        ) + i,
                    ).map((n) => (
                      <button
                        key={n}
                        className={n === page ? "current" : ""}
                        aria-current={n === page ? "page" : undefined}
                        disabled={loading}
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      aria-label="다음 페이지"
                      disabled={page >= (data?.totalPages || 1) || loading}
                      onClick={() => setPage((n) => n + 1)}
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                  <small>페이지당 8개</small>
                </div>
              </section>
              <div className="bottom-note">
                <BookOpen size={16} />
                <span>좋은 아이디어는 작은 기록에서 시작됩니다.</span>
                <button onClick={() => navigate("guide")}>
                  이용 가이드 <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}
          <footer>
            <span>© 2026 모아. 함께 쌓아가는 기록.</span>
            <span>
              React <i /> Spring Boot <i /> Oracle
            </span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Check size={18} />
          {notice}
        </div>
      )}
      {(detail || editor) && (
        <Modal
          close={closeModal}
          title={
            editor ? (editor.id ? "게시글 수정" : "새 글 작성") : "게시글 상세"
          }
        >
          <div className="modal-header">
            <span>
              {editor
                ? editor.id
                  ? "EDIT YOUR STORY"
                  : "NEW STORY"
                : `STORY / ${detail?.id}`}
            </span>
            <button
              className="icon-button"
              aria-label="닫기"
              onClick={closeModal}
              disabled={saving}
            >
              <X size={20} />
            </button>
          </div>
          {editor ? (
            <form onSubmit={save}>
              <h2>{editor.id ? "기록 다듬기" : "어떤 이야기를 남길까요?"}</h2>
              <p className="modal-subtitle">
                작은 생각도 좋아요. 자유롭게 기록해 보세요.
              </p>
              <label className="editor-label">
                제목{" "}
                <small className={bytes(editor.title) > 200 ? "invalid" : ""}>
                  {bytes(editor.title)} / 200 bytes
                </small>
                <input
                  value={editor.title}
                  maxLength={200}
                  onChange={(e) =>
                    setEditor({ ...editor, title: e.target.value })
                  }
                  placeholder="이야기의 제목을 입력하세요"
                  required
                  disabled={saving}
                />
              </label>
              <label className="editor-label">
                내용{" "}
                <small>{editor.content.length.toLocaleString()} / 20,000</small>
                <textarea
                  value={editor.content}
                  maxLength={20000}
                  onChange={(e) =>
                    setEditor({ ...editor, content: e.target.value })
                  }
                  placeholder="나누고 싶은 이야기를 들려주세요."
                  required
                  disabled={saving}
                />
              </label>
              <p className="field-hint">
                제목은 UTF-8 기준 200바이트까지 입력할 수 있습니다. (한글 약
                66자)
              </p>
              {modalError && (
                <div className="error" role="alert">
                  {modalError}
                </div>
              )}
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  className="primary"
                  disabled={
                    saving ||
                    !editor.title.trim() ||
                    !editor.content.trim() ||
                    bytes(editor.title) > 200
                  }
                >
                  {saving
                    ? "저장 중…"
                    : editor.id
                      ? "수정 완료"
                      : "게시글 등록"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          ) : (
            detail && (
              <>
                <h2 className="detail-title">{detail.title}</h2>
                <div className="detail-meta">
                  <span className="mini-avatar">
                    {detail.username[0]?.toUpperCase()}
                  </span>
                  <strong>{detail.username}</strong>
                  <span>{date(detail.createdAt)}</span>
                  <span>
                    <Eye size={14} />
                    {detail.viewCount}
                  </span>
                </div>
                <div className="post-content">{detail.content}</div>
                <small className="updated-at">
                  마지막 수정 {date(detail.updatedAt)}
                </small>
                {modalError && (
                  <div className="error" role="alert">
                    {modalError}
                  </div>
                )}
                {confirmDelete ? (
                  <div className="delete-confirm">
                    <strong>이 게시글을 삭제할까요?</strong>
                    <p>삭제한 게시글은 복구할 수 없습니다.</p>
                    <div>
                      <button
                        className="secondary"
                        disabled={saving}
                        onClick={() => setConfirmDelete(false)}
                      >
                        취소
                      </button>
                      <button
                        className="danger"
                        disabled={saving}
                        onClick={remove}
                      >
                        {saving ? "삭제 중…" : "삭제 확인"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="modal-footer">
                    <button className="secondary" onClick={closeModal}>
                      <ArrowLeft size={16} />
                      목록으로
                    </button>
                    {detail.userId === user.id && (
                      <div>
                        <button
                          className="text-danger"
                          onClick={() => setConfirmDelete(true)}
                        >
                          <Trash2 size={16} />
                          삭제
                        </button>
                        <button
                          className="primary"
                          onClick={() => {
                            setEditor({
                              id: detail.id,
                              title: detail.title,
                              content: detail.content,
                            });
                            setModalError("");
                          }}
                        >
                          <Pencil size={16} />
                          수정하기
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )
          )}
        </Modal>
      )}
    </div>
  );
}
function Stat({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  suffix: string;
}) {
  return (
    <div className="stat-card">
      <div>
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong>
        {value?.toLocaleString() ?? "—"}
        <small>{suffix}</small>
      </strong>
    </div>
  );
}
function Guide() {
  return (
    <div className="guide">
      <div className="eyebrow">A GUIDE TO YOUR WORKSPACE</div>
      <h1>기록의 시작, 모아 이용 가이드.</h1>
      <p>React와 Spring Boot, Oracle을 연결한 게시판 CRUD 튜토리얼입니다.</p>
      <div className="guide-grid">
        {[
          [
            "01",
            "새로운 기록 만들기",
            "새 글 작성에서 제목과 내용을 입력하세요. 제목은 UTF-8 200바이트, 내용은 20,000자까지 작성할 수 있습니다.",
          ],
          [
            "02",
            "필요한 이야기 찾기",
            "제목 또는 작성자를 검색하고 최신순·조회순으로 정렬하세요. 내 게시글에서 직접 작성한 글만 모아볼 수 있습니다.",
          ],
          [
            "03",
            "생각을 다듬고 정리하기",
            "게시글을 열어 내용을 읽고, 본인이 작성한 글을 수정하거나 삭제할 수 있습니다. 삭제 전에는 한 번 더 확인합니다.",
          ],
          [
            "04",
            "안전하게 사용하기",
            "30분간 사용하지 않으면 세션이 만료됩니다. 작업 후에는 왼쪽 아래 로그아웃 버튼으로 세션을 종료하세요.",
          ],
        ].map(([n, title, body]) => (
          <article key={n}>
            <span>{n}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <div className="guide-stack">
        <Code2 size={25} />
        <div>
          <h3>화면에서 데이터베이스까지, 한 번에</h3>
          <p>React + TypeScript → Spring Boot REST API → Oracle 18c XE</p>
          <p>
            구조, API 명세, 실행 방법, 검증 결과는 프로젝트의 README.md에서
            확인하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
