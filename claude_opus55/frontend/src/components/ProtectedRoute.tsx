import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

/** 로그인하지 않은 사용자는 로그인 페이지로 보내고, 로그인 후 원래 페이지로 복귀 */
export default function ProtectedRoute() {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <p className="text-center text-slate-500">로딩 중...</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
