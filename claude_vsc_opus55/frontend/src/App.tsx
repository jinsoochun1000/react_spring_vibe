import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import PostDetailPage from './pages/PostDetailPage'
import PostFormPage from './pages/PostFormPage'
import PostListPage from './pages/PostListPage'
import SignupPage from './pages/SignupPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/posts" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/posts" element={<PostListPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        {/* 로그인 필요 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/posts/new" element={<PostFormPage />} />
          <Route path="/posts/:id/edit" element={<PostFormPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/posts" replace />} />
      </Route>
    </Routes>
  )
}
