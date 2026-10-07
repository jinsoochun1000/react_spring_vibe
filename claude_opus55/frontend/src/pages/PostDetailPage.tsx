import { Link, useNavigate, useParams } from 'react-router-dom'
import { toApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useDeletePost, usePost } from '../hooks/usePosts'
import { formatDateTime } from '../utils/format'

export default function PostDetailPage() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const { data: post, isPending, isError, error } = usePost(id)
  const deletePost = useDeletePost()

  if (isPending) return <p className="text-center text-slate-500">불러오는 중...</p>
  if (isError)
    return (
      <div className="card p-8 text-center">
        <p className="mb-4 text-rose-600">{toApiError(error).message}</p>
        <Link to="/posts" className="btn-secondary">
          목록으로
        </Link>
      </div>
    )

  const canEdit = !!user && (user.id === post.authorId || isAdmin)

  const onDelete = () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return
    deletePost.mutate(id, {
      onSuccess: () => navigate('/posts', { replace: true }),
      onError: (err) => alert(toApiError(err).message),
    })
  }

  return (
    <article className="card">
      <header className="border-b border-slate-200 p-6">
        <h1 className="mb-3 text-2xl font-bold break-words">{post.title}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
          <span>작성자 {post.authorName}</span>
          <span>작성 {formatDateTime(post.createdAt)}</span>
          {post.updatedAt !== post.createdAt && <span>수정 {formatDateTime(post.updatedAt)}</span>}
          <span>조회 {post.viewCount}</span>
        </div>
      </header>
      <div className="min-h-40 p-6 leading-relaxed break-words whitespace-pre-wrap">{post.content}</div>
      <footer className="flex justify-between border-t border-slate-200 p-4">
        <Link to="/posts" className="btn-secondary">
          목록
        </Link>
        {canEdit && (
          <div className="flex gap-2">
            <Link to={`/posts/${post.id}/edit`} className="btn-secondary">
              수정
            </Link>
            <button className="btn-danger" onClick={onDelete} disabled={deletePost.isPending}>
              {deletePost.isPending ? '삭제 중...' : '삭제'}
            </button>
          </div>
        )}
      </footer>
    </article>
  )
}
