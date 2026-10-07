import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api.js'

// 신규 작성(/posts/new)과 수정(/posts/:id/edit)을 하나의 폼으로 처리
export default function PostFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const loadedFor = useRef(null)

  useEffect(() => {
    if (!isEdit || loadedFor.current === id) return
    loadedFor.current = id
    api.getPost(id, false)
      .then((p) => { setTitle(p.title); setContent(p.content) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const saved = isEdit ? await api.updatePost(id, { title, content }) : await api.createPost({ title, content })
      navigate(`/posts/${saved.id}`, { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  if (loading) return <p className="center muted">불러오는 중…</p>

  return (
    <form className="card" onSubmit={onSubmit}>
      <h1>{isEdit ? '게시글 수정' : '새 글 작성'}</h1>
      <label>제목
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} autoFocus />
      </label>
      <label>내용
        <textarea rows={12} value={content} onChange={(e) => setContent(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <Link to={isEdit ? `/posts/${id}` : '/'} className="btn">취소</Link>
        <span className="spacer" />
        <button className="btn primary" disabled={busy}>{busy ? '저장 중…' : '저장'}</button>
      </div>
    </form>
  )
}
