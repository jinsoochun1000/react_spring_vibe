import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/posts" className="text-lg font-bold text-indigo-600">
            CRUD 게시판
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                <span className="text-slate-600">
                  <b className="text-slate-800">{user.username}</b> 님
                  {user.role === 'ROLE_ADMIN' && (
                    <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">ADMIN</span>
                  )}
                </span>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    logout()
                    navigate('/posts')
                  }}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-primary">
                  로그인
                </Link>
                <Link to="/signup" className="btn-secondary">
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
