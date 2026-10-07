import { Link, useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useDeletePost, usePost } from '../hooks/usePosts'
import { formatDateTime } from '../utils/format'

export default function PostDetailPage() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const { canEdit } = useAuth()
  const deletePost = useDeletePost()
  // 삭제 직후 캐시가 비워져도 다시 조회(404)하지 않도록 쿼리를 멈춘다.
  const { data: post, isPending, isError, error } = usePost(id, !deletePost.isSuccess)

  const handleDelete = () => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    deletePost.mutate(id, {
      onSuccess: () => navigate('/posts', { replace: true }),
      onError: (err) => alert(getErrorMessage(err)),
    })
  }

  if (isPending) return <p className="py-10 text-center text-slate-500">불러오는 중…</p>
  if (isError)
    return (
      <div className="card text-center">
        <p className="mb-4 text-red-600">{getErrorMessage(error)}</p>
        <Link to="/posts" className="btn-secondary">
          목록으로
        </Link>
      </div>
    )

  return (
    <article className="card">
      <h1 className="mb-2 text-2xl font-bold break-words">{post.title}</h1>
      <div className="mb-6 flex flex-wrap gap-x-4 gap-y-1 border-b border-slate-200 pb-4 text-sm text-slate-500">
        <span>작성자 {post.authorUsername}</span>
        <span>작성 {formatDateTime(post.createdAt)}</span>
        {post.updatedAt !== post.createdAt && <span>수정 {formatDateTime(post.updatedAt)}</span>}
        <span>조회 {post.viewCount}</span>
      </div>
      <div className="min-h-40 whitespace-pre-wrap break-words leading-relaxed">{post.content}</div>
      <div className="mt-8 flex justify-between border-t border-slate-200 pt-4">
        <Link to="/posts" className="btn-secondary">
          목록
        </Link>
        {canEdit(post.authorId) && (
          <div className="flex gap-2">
            <Link to={`/posts/${post.id}/edit`} className="btn-secondary">
              수정
            </Link>
            <button onClick={handleDelete} className="btn-danger" disabled={deletePost.isPending}>
              삭제
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
