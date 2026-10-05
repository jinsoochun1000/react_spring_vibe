import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { PostPage } from '../api/types'
import { formatDate } from '../format'

export function PostListPage() {
  const [params, setParams] = useSearchParams()
  const rawPage = Number(params.get('page') ?? '0')
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 0

  const query = useQuery({
    queryKey: ['posts', page],
    queryFn: () => api<PostPage>(`/api/posts?page=${page}&size=10`),
  })

  function setPage(next: number) {
    if (next <= 0) {
      setParams({})
      return
    }
    setParams({ page: String(next) })
  }

  const posts = query.data

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">글 목록</h1>
          <p className="mt-1 text-sm text-stone-500">
            {posts ? `전체 ${posts.totalElements}건` : '불러오는 중'}
          </p>
        </div>
        <Link
          to="/posts/new"
          className="rounded-full bg-teal-800 px-4 py-2 text-sm text-white"
        >
          글쓰기
        </Link>
      </div>

      {query.isLoading ? <p className="text-sm text-stone-500">글을 불러오는 중입니다.</p> : null}
      {query.isError ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {query.error instanceof Error ? query.error.message : '목록을 불러오지 못했습니다.'}
        </p>
      ) : null}

      {posts && posts.content.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <p className="text-stone-600">아직 글이 없습니다.</p>
          <Link to="/posts/new" className="mt-4 inline-block text-sm text-teal-800">
            첫 글을 작성하세요
          </Link>
        </div>
      ) : null}

      {posts && posts.content.length > 0 ? (
        <ul className="space-y-3">
          {posts.content.map((post) => (
            <li key={post.id}>
              <Link
                to={`/posts/${post.id}`}
                className="block rounded-2xl border border-stone-200 bg-white px-5 py-4 hover:border-teal-800"
              >
                <h2 className="text-lg font-medium">{post.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{post.content}</p>
                <p className="mt-3 text-xs text-stone-500">
                  {post.author} · {formatDate(post.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {posts && posts.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 0}
            onClick={() => setPage(page - 1)}
            className="rounded-full border border-stone-300 px-3 py-1 disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-stone-600">
            {page + 1} / {posts.totalPages}
          </span>
          <button
            type="button"
            disabled={page + 1 >= posts.totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-full border border-stone-300 px-3 py-1 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      ) : null}
    </section>
  )
}
