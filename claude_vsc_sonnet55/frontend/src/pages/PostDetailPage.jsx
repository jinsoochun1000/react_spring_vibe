import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deletePost, errorMessage, fetchPost } from '../api'

const fmt = (s) => s?.replace('T', ' ').slice(0, 16)

export default function PostDetailPage({ auth }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [error, setError] = useState('')
  const fetched = useRef(null) // StrictMode 개발환경에서 조회수가 2번 오르는 것 방지

  useEffect(() => {
    if (fetched.current === id) return
    fetched.current = id
    fetchPost(id).then(setPost).catch((e) => setError(errorMessage(e)))
  }, [id])

  const canEdit = auth && post && (auth.role === 'ROLE_ADMIN' || auth.username === post.authorUsername)

  const remove = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return
    try {
      await deletePost(id)
      navigate('/')
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  if (error) return <p className="error">{error}</p>
  if (!post) return <p>불러오는 중...</p>

  return (
    <article className="card">
      <h2>{post.title}</h2>
      <p className="meta">
        {post.authorUsername} · {fmt(post.createdAt)}
        {post.updatedAt !== post.createdAt && ` (수정 ${fmt(post.updatedAt)})`} · 조회 {post.viewCount}
      </p>
      <div className="content">{post.content}</div>
      <div className="actions">
        <Link to="/" className="btn">목록</Link>
        {canEdit && (
          <>
            <Link to={`/posts/${id}/edit`} className="btn">수정</Link>
            <button className="btn danger" onClick={remove}>삭제</button>
          </>
        )}
      </div>
    </article>
  )
}
