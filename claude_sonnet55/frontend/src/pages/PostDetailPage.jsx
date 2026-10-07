import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import { formatDateTime } from '../format.js'

export default function PostDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [error, setError] = useState('')
  const fetchedFor = useRef(null)

  useEffect(() => {
    // StrictMode 개발 모드의 effect 이중 실행으로 조회수가 2씩 오르는 것을 방지
    if (fetchedFor.current === id) return
    fetchedFor.current = id
    setPost(null)
    setError('')
    api.getPost(id).then(setPost).catch((e) => setError(e.message))
  }, [id])

  async function onDelete() {
    if (!window.confirm('이 게시글을 삭제할까요?')) return
    try {
      await api.deletePost(id)
      navigate('/', { replace: true })
    } catch (e) {
      setError(e.message)
    }
  }

  if (error && !post) return <><p className="error">{error}</p><Link to="/" className="btn">목록</Link></>
  if (!post) return <p className="center muted">불러오는 중…</p>

  const canEdit = user.admin || user.id === post.authorId

  return (
    <article className="card">
      <h1>{post.title}</h1>
      <p className="meta">
        {post.authorName} · {formatDateTime(post.createdAt)} · 조회 {post.viewCount}
        {post.updatedAt !== post.createdAt && ` · 수정 ${formatDateTime(post.updatedAt)}`}
      </p>
      <div className="content">{post.content}</div>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <Link to="/" className="btn">목록</Link>
        <span className="spacer" />
        {canEdit && (
          <>
            <Link to={`/posts/${post.id}/edit`} className="btn">수정</Link>
            <button className="btn danger" onClick={onDelete}>삭제</button>
          </>
        )}
      </div>
    </article>
  )
}
