import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function Layout() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()

  function onLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-300 bg-[#f7f4ee]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-semibold tracking-tight">
            게시판
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-stone-600">{username}</span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-stone-400 px-3 py-1 hover:bg-white"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
