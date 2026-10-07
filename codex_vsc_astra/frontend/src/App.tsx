import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, FileText, Layers3, LogOut, Pencil, Plus, Search, Trash2, Users, X, Eye, LockKeyhole, LoaderCircle } from 'lucide-react';
import { api, ApiError, refreshCsrf, titleBytes, type Post, type PostPage, type User } from './api';

const formatDate = (value: string) => new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
const errorText = (e: unknown) => e instanceof Error ? e.message : '문제가 발생했습니다. 다시 시도해 주세요.';

function Logo() { return <div className="brand"><span className="brand-icon"><Layers3 size={22}/></span><span>기록실<span className="brand-dot">.</span></span></div>; }
function Busy() { return <LoaderCircle className="spin" size={18}/>; }
function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const el = dialog.current!; el.showModal(); return () => el.close(); }, []);
  return <dialog ref={dialog} className={wide ? 'modal wide' : 'modal'} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === dialog.current) onClose(); }}>
    <div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="닫기"><X size={21}/></button></div>{children}
  </dialog>;
}

function Login({ onLogin, notice }: { onLogin: (u: User) => void; notice: string }) {
  const [username, setUsername] = useState('guest01');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await refreshCsrf();
      await api('/auth/login', { method: 'POST', body: new URLSearchParams({ username, password }) });
      await refreshCsrf(); onLogin(await api<User>('/auth/me'));
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  return <div className="login-page"><section className="login-story"><Logo/><div className="story-main"><span className="eyebrow light">A SPACE FOR YOUR IDEAS</span><h1>생각을 남기고,<br/>가능성을 쌓다<span>.</span></h1><p>작은 아이디어부터 새로운 배움까지.<br/>당신의 이야기가 시작되는 공간, 기록실.</p><div className="paper-stack"><div className="paper back"/><div className="paper"><span className="paper-label">MY FIRST RECORD</span><div className="paper-title">오늘의 작은 발견</div><div className="paper-line"/><div className="paper-line short"/><div className="paper-footer"><span className="tiny-tag">생각의 시작</span><Pencil size={22}/></div></div><span className="float-plus">+</span></div></div><div className="story-footer">WRITE. CONNECT. GROW.<span>01 — ∞</span></div></section>
    <main className="login-form-wrap"><div className="login-form"><span className="eyebrow">WELCOME BACK</span><h2>다시 만나 반가워요</h2><p className="muted">로그인하고 새로운 기록을 시작해 보세요.</p>{notice && <div className="notice">{notice}</div>}<form onSubmit={submit}><label htmlFor="username">아이디</label><input id="username" autoComplete="username" required maxLength={50} value={username} onChange={e => setUsername(e.target.value)} placeholder="아이디를 입력하세요"/><label htmlFor="password">비밀번호</label><input id="password" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호를 입력하세요"/>{error && <p className="error" role="alert">{error}</p>}<button className="primary login-button" disabled={busy}>{busy ? <Busy/> : <>로그인<ArrowRight size={18}/></>}</button></form><div className="login-note"><LockKeyhole size={16}/><span>안전한 세션으로 소중한 기록을 관리합니다.</span></div></div><div className="login-bottom">기록실 · CRUD TUTORIAL <span>React + Spring Boot + Oracle</span></div></main></div>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null); const [booting, setBooting] = useState(true); const [notice, setNotice] = useState('');
  useEffect(() => {
    api<User>('/auth/me').then(setUser).catch(e => { if (!(e instanceof ApiError && e.status === 401)) setNotice(errorText(e)); }).finally(() => setBooting(false));
    const expired = () => { setUser(null); setNotice('세션이 만료되었습니다. 다시 로그인해 주세요.'); };
    window.addEventListener('session-expired', expired); return () => window.removeEventListener('session-expired', expired);
  }, []);
  if (booting) return <div className="initial-loading"><Logo/><Busy/></div>;
  return user ? <Workspace user={user} onLogout={() => { setUser(null); setNotice(''); }}/>
    : <Login notice={notice} onLogin={u => { setUser(u); setNotice(''); }}/>;
}

function Workspace({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [mine, setMine] = useState(false); const [search, setSearch] = useState(''); const [q, setQ] = useState(''); const [page, setPage] = useState(0);
  const [data, setData] = useState<PostPage | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<Post | null>(null); const [editor, setEditor] = useState<{ post?: Post } | null>(null); const [deletePost, setDeletePost] = useState<Post | null>(null);
  const [saving, setSaving] = useState(false); const [modalError, setModalError] = useState(''); const [toast, setToast] = useState(''); const [guide, setGuide] = useState(false); const [opening, setOpening] = useState<number | null>(null);
  const requestSequence = useRef(0);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    api<PostPage>(`/posts?q=${encodeURIComponent(q)}&page=${page}&size=8&mine=${mine}`).then(result => {
      if (!active) return;
      if (page > 0 && result.items.length === 0) { setPage(Math.max(0, result.totalPages - 1)); return; }
      setData(result);
    }).catch(e => { if (active) setError(errorText(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [q, page, mine, revision]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3500); return () => clearTimeout(timer); }, [toast]);
  const reload = () => setRevision(v => v + 1);
  const switchTab = (value: boolean) => { setMine(value); setPage(0); setSearch(''); setQ(''); };
  async function openPost(id: number) {
    const seq = ++requestSequence.current; setOpening(id); setError('');
    try { const post = await api<Post>(`/posts/${id}`); if (seq === requestSequence.current) { setSelected(post); reload(); } }
    catch (e) { setError(errorText(e)); } finally { if (seq === requestSequence.current) setOpening(null); }
  }
  async function save(title: string, content: string) {
    setSaving(true); setModalError('');
    try { await api<Post>(editor?.post ? `/posts/${editor.post.id}` : '/posts', { method: editor?.post ? 'PUT' : 'POST', body: JSON.stringify({ title, content }) }); setEditor(null); setSelected(null); setToast('게시글이 저장되었습니다.'); reload(); }
    catch (e) { setModalError(errorText(e)); } finally { setSaving(false); }
  }
  async function remove() {
    setSaving(true); setModalError('');
    try { await api(`/posts/${deletePost!.id}`, { method: 'DELETE' }); setDeletePost(null); setSelected(null); setToast('게시글이 삭제되었습니다.'); reload(); }
    catch (e) { setModalError(errorText(e)); } finally { setSaving(false); }
  }
  async function logout() { try { await api('/auth/logout', { method: 'POST' }); await refreshCsrf(); onLogout(); } catch (e) { setError(errorText(e)); } }
  function newPost() { setModalError(''); setEditor({}); }
  return <div className="app-shell"><aside className="sidebar"><Logo/><div className="workspace-label">WORKSPACE</div><nav aria-label="주 메뉴"><button className={!mine ? 'nav-item active' : 'nav-item'} onClick={() => switchTab(false)}><Layers3 size={19}/>전체 게시글<span>{data?.totalPosts ?? '—'}</span></button><button className={mine ? 'nav-item active' : 'nav-item'} onClick={() => switchTab(true)}><FileText size={19}/>내 게시글<span>{data?.myPosts ?? '—'}</span></button></nav><div className="sidebar-tip"><div className="tip-icon"><BookOpen size={21}/></div><h3>모든 기록은 시작이니까</h3><p>오늘의 배움과 생각을<br/>자유롭게 남겨 보세요.</p><button onClick={() => setGuide(true)}>이용 가이드<ArrowRight size={15}/></button></div><div className="sidebar-bottom"><span className="status-dot"/>CRUD TUTORIAL<span>v1.0</span></div></aside>
    <div className="workspace"><header className="topbar"><div className="breadcrumb">워크스페이스<ChevronRight size={14}/><strong>{mine ? '내 게시글' : '전체 게시글'}</strong></div><div className="account"><span className="avatar">{user.username.slice(0, 1).toUpperCase()}</span><div><strong>{user.username}</strong><small>멤버</small></div><button className="icon-btn" onClick={logout} aria-label="로그아웃" title="로그아웃"><LogOut size={18}/></button></div></header>
    <main className="main-content"><div className="page-title"><div><div className="eyebrow">YOUR IDEAS, ALL IN ONE PLACE</div><h1>{mine ? '나만의 기록' : '함께 쌓는 기록'}<span>.</span></h1><p>{mine ? '내가 남긴 생각과 배움을 한곳에서 관리하세요.' : '새로운 생각을 나누고, 서로의 이야기에서 영감을 찾아보세요.'}</p></div><button className="primary" onClick={newPost}><Plus size={19}/>새 게시글</button></div>
    <section className="stats" aria-label="게시글 현황"><div className="stat"><div><span>전체 게시글</span><strong>{data?.totalPosts.toLocaleString() ?? '—'}<small>개의 기록</small></strong></div><span className="stat-icon teal"><Layers3 size={22}/></span></div><div className="stat"><div><span>내가 쓴 게시글</span><strong>{data?.myPosts.toLocaleString() ?? '—'}<small>개의 이야기</small></strong></div><span className="stat-icon blue"><Pencil size={21}/></span></div><div className="stat"><div><span>함께하는 작성자</span><strong>{data?.authors.toLocaleString() ?? '—'}<small>명의 동료</small></strong></div><span className="stat-icon amber"><Users size={22}/></span></div></section>
    <section className="board"><div className="board-toolbar"><div className="tabs"><button className={!mine ? 'tab active' : 'tab'} onClick={() => switchTab(false)}>전체 게시글</button><button className={mine ? 'tab active' : 'tab'} onClick={() => switchTab(true)}>내 게시글</button></div><form className="search" onSubmit={e => { e.preventDefault(); setPage(0); setQ(search.trim()); }}><Search size={18}/><input aria-label="게시글 검색" placeholder="제목 또는 작성자로 검색" maxLength={100} value={search} onChange={e => setSearch(e.target.value)}/>{search && <button type="button" className="clear-search" aria-label="검색 초기화" onClick={() => { setSearch(''); setQ(''); setPage(0); }}><X size={15}/></button>}<button type="submit">검색</button></form></div>
    <div className="list-caption"><span>{q ? <><strong>“{q}”</strong> 검색 결과 </> : '총 '}<strong>{data?.totalElements ?? 0}</strong>개의 게시글</span><span>최신 등록순<ArrowDown size={13}/></span></div>
    {error ? <div className="empty"><p className="error" role="alert">{error}</p><button className="secondary" onClick={reload}>다시 시도</button></div> : loading ? <div className="empty" role="status"><Busy/><p>기록을 불러오고 있어요.</p></div> : !data?.items.length ? <div className="empty"><FileText size={34}/><h3>{q ? '검색 결과가 없습니다' : '첫 번째 기록을 남겨 보세요'}</h3><p>{q ? '다른 제목이나 작성자로 검색해 보세요.' : '작은 생각도 좋은 이야기의 시작이 됩니다.'}</p><button className="secondary" onClick={q ? () => { setQ(''); setSearch(''); } : newPost}>{q ? '전체 보기' : '게시글 작성'}</button></div> : <div className="table-scroll"><table><thead><tr><th className="number-col">번호</th><th>제목</th><th>작성자</th><th>작성일</th><th className="views-col">조회</th><th><span className="sr-only">열기</span></th></tr></thead><tbody>{data.items.map(post => <tr key={post.id}><td className="post-number">{String(post.id).padStart(2, '0')}</td><td className="post-title-cell"><button className="post-title" onClick={() => openPost(post.id)} disabled={opening !== null}>{post.title}{post.userId === user.id && <span className="my-tag">MY</span>}</button><p className="excerpt">{post.content.replace(/\s+/g, ' ').slice(0, 100)}</p></td><td><span className="author"><span className={`mini-avatar color-${post.userId % 3}`}>{post.author.slice(0, 1).toUpperCase()}</span>{post.author}</span></td><td className="date-cell">{formatDate(post.createdAt)}</td><td className="view-cell">{post.viewCount}</td><td><button className="row-arrow" aria-label={`${post.title} 상세 보기`} onClick={() => openPost(post.id)} disabled={opening !== null}>{opening === post.id ? <Busy/> : <ArrowRight size={17}/>}</button></td></tr>)}</tbody></table></div>}
    <div className="pagination"><span>{data?.totalElements ? `${page * 8 + 1}–${Math.min((page + 1) * 8, data.totalElements)} / ${data.totalElements}개` : '0개의 기록'}</span><div><button aria-label="이전 페이지" disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}><ChevronLeft size={17}/></button>{Array.from({ length: Math.min(data?.totalPages || 1, 5) }, (_, i) => Math.max(0, Math.min(page - 2, (data?.totalPages || 1) - 5)) + i).map(p => <button key={p} className={p === page ? 'current' : ''} aria-current={p === page ? 'page' : undefined} onClick={() => setPage(p)} disabled={loading}>{p + 1}</button>)}<button aria-label="다음 페이지" disabled={loading || page + 1 >= (data?.totalPages || 1)} onClick={() => setPage(p => p + 1)}><ChevronRight size={17}/></button></div><span className="page-size">페이지당 8개</span></div></section>
    <footer className="content-footer"><span>작은 기록이 모여, 더 큰 가능성이 됩니다.</span><span>기록실 © {new Date().getFullYear()}</span></footer></main></div>
    {toast && <div className="toast" role="status"><Check size={18}/>{toast}</div>}
    {selected && !editor && !deletePost && <Modal title="게시글" wide onClose={() => setSelected(null)}><article className="post-detail"><span className="eyebrow">RECORD #{selected.id}</span><h2>{selected.title}</h2><div className="detail-meta"><span className="mini-avatar">{selected.author[0].toUpperCase()}</span><strong>{selected.author}</strong><span>{formatDate(selected.createdAt)}</span><span><Eye size={15}/>{selected.viewCount}</span></div><div className="detail-content">{selected.content}</div><p className="updated">최근 수정 · {formatDate(selected.updatedAt)}</p><div className="modal-actions"><button className="secondary" onClick={() => setSelected(null)}><ArrowLeft size={16}/>목록으로</button>{selected.userId === user.id && <div><button className="danger-text" onClick={() => { setModalError(''); setDeletePost(selected); }}><Trash2 size={16}/>삭제</button><button className="primary" onClick={() => { setModalError(''); setEditor({ post: selected }); }}><Pencil size={16}/>수정</button></div>}</div></article></Modal>}
    {editor && <Editor post={editor.post} busy={saving} error={modalError} onSave={save} onClose={() => { if (!saving) setEditor(null); }}/>}
    {deletePost && <Modal title="게시글 삭제" onClose={() => { if (!saving) setDeletePost(null); }}><div className="delete-body"><div className="delete-icon"><Trash2 size={24}/></div><h3>이 기록을 삭제할까요?</h3><p>“{deletePost.title}”</p><p className="muted">삭제한 게시글은 복구할 수 없습니다.</p>{modalError && <p className="error" role="alert">{modalError}</p>}<div className="modal-actions"><button className="secondary" disabled={saving} onClick={() => setDeletePost(null)}>취소</button><button className="danger" disabled={saving} onClick={remove}>{saving ? <Busy/> : '삭제하기'}</button></div></div></Modal>}
    {guide && <Modal title="기록실 이용 가이드" onClose={() => setGuide(false)}><div className="guide-body"><h3>01. 함께 읽기</h3><p>전체 게시글에서 동료의 기록을 읽고, 제목이나 작성자로 검색하세요.</p><h3>02. 나의 생각 남기기</h3><p>새 게시글을 눌러 제목과 내용을 입력하세요. 제목은 UTF-8 기준 200바이트, 내용은 20,000자까지 작성할 수 있습니다.</p><h3>03. 기록 다듬기</h3><p>내가 작성한 게시글의 상세 화면에서 수정하거나 삭제할 수 있습니다.</p></div></Modal>}
  </div>;
}

function Editor({ post, busy, error, onSave, onClose }: { post?: Post; busy: boolean; error: string; onSave: (title: string, content: string) => void; onClose: () => void }) {
  const [title, setTitle] = useState(post?.title || ''); const [content, setContent] = useState(post?.content || '');
  const [discard, setDiscard] = useState(false); const bytes = titleBytes(title);
  const close = () => { if (busy) return; if (title !== (post?.title || '') || content !== (post?.content || '')) setDiscard(true); else onClose(); };
  useEffect(() => { const warn = (e: BeforeUnloadEvent) => { if (title !== (post?.title || '') || content !== (post?.content || '')) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [title, content, post]);
  return <Modal title={post ? '게시글 수정' : '새로운 기록'} wide onClose={close}><form className="editor-form" onSubmit={e => { e.preventDefault(); if (bytes <= 200) onSave(title, content); }}><p className="muted">오늘의 생각과 배움을 자유롭게 남겨 보세요.</p><label htmlFor="post-title">제목<span className={bytes > 200 ? 'error' : ''}>{bytes} / 200 bytes</span></label><input id="post-title" autoFocus required maxLength={200} disabled={busy} placeholder="어떤 이야기를 나누고 싶으세요?" value={title} onChange={e => setTitle(e.target.value)}/><label htmlFor="post-content">내용<span>{content.length.toLocaleString()} / 20,000</span></label><textarea id="post-content" required maxLength={20000} disabled={busy} placeholder="여기에 이야기를 적어 주세요." value={content} onChange={e => setContent(e.target.value)}/>{error && <p className="error" role="alert">{error}</p>}{bytes > 200 && <p className="error" role="alert">제목이 200바이트를 초과했습니다. 한글은 보통 한 글자당 3바이트입니다.</p>}{discard && <div className="discard-prompt" role="alert">작성 중인 내용을 버릴까요?<button type="button" onClick={() => setDiscard(false)}>계속 작성</button><button type="button" onClick={onClose}>내용 버리기</button></div>}<div className="modal-actions"><span className="editor-hint">좋은 기록은 작은 생각에서 시작됩니다.</span><div><button type="button" className="secondary" disabled={busy} onClick={close}>취소</button><button className="primary" disabled={busy || !title.trim() || !content.trim() || bytes > 200}>{busy ? <Busy/> : <><Check size={17}/>{post ? '수정 저장' : '게시글 등록'}</>}</button></div></div></form></Modal>;
}
