import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import Pagination from '../components/Pagination'
import { usePostList } from '../hooks/usePosts'
import { formatDateTime } from '../utils/format'

const PAGE_SIZE = 10

export default function PostListPage() {
  const { isAuthenticated } = useAuth()
  // page/keyword 를 URL 에 두면 새로고침·뒤로가기 시에도 상태가 유지된다.
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? 0)
  const keyword = searchParams.get('keyword') ?? ''
  const [input, setInput] = useState(keyword)

  const { data, isPending, isError, error, isPlaceholderData } = usePostList({
    page,
    size: PAGE_SIZE,
    keyword,
  })

  const updateParams = (next: { page?: number; keyword?: string }) => {
    const params: Record<string, string> = {}
    const k = next.keyword ?? keyword
    const p = next.page ?? page
    if (k) params.keyword = k
    if (p > 0) params.page = String(p)
    setSearchParams(params)
  }

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    updateParams({ keyword: input.trim(), page: 0 })
  }

  return (
    <div className="card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">
          게시글 목록
          {data && <span className="ml-2 text-sm font-normal text-slate-500">총 {data.totalElements}건</span>}
        </h1>
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              className="input w-48"
              placeholder="제목 또는 작성자"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn-secondary">
              검색
            </button>
          </form>
          {isAuthenticated && (
            <Link to="/posts/new" className="btn-primary">
              글쓰기
            </Link>
          )}
        </div>
      </div>

      {isPending && <p className="py-10 text-center text-slate-500">불러오는 중…</p>}
      {isError && <p className="py-10 text-center text-red-600">{getErrorMessage(error)}</p>}

      {data && (
        <>
          <table className={`w-full text-sm ${isPlaceholderData ? 'opacity-60' : ''}`}>
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="w-16 py-2 text-center">번호</th>
                <th className="py-2">제목</th>
                <th className="w-28 py-2">작성자</th>
                <th className="w-20 py-2 text-center">조회</th>
                <th className="hidden w-36 py-2 sm:table-cell">작성일</th>
              </tr>
            </thead>
            <tbody>
              {data.content.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    게시글이 없습니다.
                  </td>
                </tr>
              )}
              {data.content.map((post) => (
                <tr key={post.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 text-center text-slate-500">{post.id}</td>
                  <td className="py-2.5">
                    <Link to={`/posts/${post.id}`} className="hover:text-indigo-600 hover:underline">
                      {post.title}
                    </Link>
                  </td>
                  <td className="py-2.5">{post.authorUsername}</td>
                  <td className="py-2.5 text-center">{post.viewCount}</td>
                  <td className="hidden py-2.5 text-slate-500 sm:table-cell">{formatDateTime(post.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => updateParams({ page: p })} />
        </>
      )}
    </div>
  )
}
