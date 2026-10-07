import { useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { clearAuth, getAuth } from './api'
import LoginPage from './pages/LoginPage'
import PostListPage from './pages/PostListPage'
import PostDetailPage from './pages/PostDetailPage'
import PostFormPage from './pages/PostFormPage'

export default function App() {
  const [auth, setAuthState] = useState(getAuth())
  const navigate = useNavigate()

  const logout = () => {
    clearAuth()
    setAuthState(null)
    navigate('/login')
  }

  // 로그인이 필요한 화면 보호
  const RequireAuth = ({ children }) => (auth ? children : <Navigate to="/login" replace />)

  return (
    <div className="container">
      <header>
        <Link to="/" className="brand">CRUD Tutorial 게시판</Link>
        <nav>
          {auth ? (
            <>
              <span className="who">{auth.username} ({auth.role === 'ROLE_ADMIN' ? '관리자' : '사용자'})</span>
              <button className="btn" onClick={logout}>로그아웃</button>
            </>
          ) : (
            <Link to="/login" className="btn">로그인</Link>
          )}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={setAuthState} />} />
          <Route path="/" element={<PostListPage auth={auth} />} />
          <Route path="/posts/new" element={<RequireAuth><PostFormPage /></RequireAuth>} />
          <Route path="/posts/:id" element={<PostDetailPage auth={auth} />} />
          <Route path="/posts/:id/edit" element={<RequireAuth><PostFormPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
