import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/posts')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/posts" className="text-lg font-bold text-indigo-600">
            CRUD 게시판
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                <span className="text-slate-600">
                  <b>{user.username}</b>
                  {user.role === 'ROLE_ADMIN' && (
                    <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                      관리자
                    </span>
                  )}
                </span>
                <button onClick={handleLogout} className="btn-secondary">
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  로그인
                </Link>
                <Link to="/signup" className="btn-primary">
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
