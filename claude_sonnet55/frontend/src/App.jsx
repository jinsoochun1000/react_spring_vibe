import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import LoginPage from './pages/LoginPage.jsx'
import PostListPage from './pages/PostListPage.jsx'
import PostDetailPage from './pages/PostDetailPage.jsx'
import PostFormPage from './pages/PostFormPage.jsx'

function Layout() {
  const { user, logout } = useAuth()
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">CRUD 튜토리얼 게시판</Link>
        <span className="spacer" />
        <span className="who">{user.username}{user.admin && ' (관리자)'}</span>
        <button className="btn ghost" onClick={logout}>로그아웃</button>
      </header>
      <main className="container"><Outlet /></main>
    </>
  )
}

// 로그인하지 않았으면 /login 으로 보내고, 로그인 후 원래 가려던 곳으로 돌려보낸다
function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <p className="center muted">불러오는 중…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Layout />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<PostListPage />} />
        <Route path="/posts/new" element={<PostFormPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/posts/:id/edit" element={<PostFormPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
