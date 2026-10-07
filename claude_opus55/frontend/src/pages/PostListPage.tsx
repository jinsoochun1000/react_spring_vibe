import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import Pagination from '../components/Pagination'
import { usePostList } from '../hooks/usePosts'
import { formatDateTime } from '../utils/format'

const PAGE_SIZE = 10

export default function PostListPage() {
  const { user } = useAuth()
  // 페이지/검색어를 URL 쿼리스트링에 보관 → 새로고침, 뒤로가기 시에도 상태 유지
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(Number(searchParams.get('page') ?? 0) || 0, 0)
  const keyword = searchParams.get('keyword') ?? ''
  const [input, setInput] = useState(keyword)

  const { data, isPending, isError, error, isFetching } = usePostList({ page, size: PAGE_SIZE, keyword: keyword || undefined })

  const updateParams = (next: { page?: number; keyword?: string }) => {
    const params = new URLSearchParams()
    const kw = next.keyword ?? keyword
    if (kw) params.set('keyword', kw)
    if (next.page) params.set('page', String(next.page))
    setSearchParams(params)
  }

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    updateParams({ keyword: input.trim(), page: 0 })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          게시글 목록
          {data && <span className="ml-2 text-base font-normal text-slate-500">총 {data.totalElements}건</span>}
        </h1>
        {user && (
          <Link to="/posts/new" className="btn-primary">
            + 새 글 작성
          </Link>
        )}
      </div>

      <form onSubmit={onSearch} className="flex gap-2">
        <input className="input" placeholder="제목으로 검색" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn-secondary shrink-0">검색</button>
      </form>

      <div className={`card overflow-hidden transition-opacity ${isFetching && !isPending ? 'opacity-60' : ''}`}>
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="w-16 px-3 py-2 text-center font-medium">번호</th>
              <th className="px-3 py-2 text-left font-medium">제목</th>
              <th className="hidden w-28 px-3 py-2 text-center font-medium sm:table-cell">작성자</th>
              <th className="hidden w-20 px-3 py-2 text-center font-medium sm:table-cell">조회</th>
              <th className="hidden w-36 px-3 py-2 text-center font-medium md:table-cell">작성일</th>
            </tr>
          </thead>
          <tbody>
            {isPending && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-500">
                  불러오는 중...
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-rose-600">
                  {toApiError(error).message}
                </td>
              </tr>
            )}
            {data?.content.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-500">
                  {keyword ? `'${keyword}' 검색 결과가 없습니다.` : '등록된 게시글이 없습니다.'}
                </td>
              </tr>
            )}
            {data?.content.map((post) => (
              <tr key={post.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5 text-center text-slate-500">{post.id}</td>
                <td className="px-3 py-2.5">
                  <Link to={`/posts/${post.id}`} className="hover:text-indigo-600 hover:underline">
                    {post.title}
                  </Link>
                </td>
                <td className="hidden px-3 py-2.5 text-center sm:table-cell">{post.authorName}</td>
                <td className="hidden px-3 py-2.5 text-center text-slate-500 sm:table-cell">{post.viewCount}</td>
                <td className="hidden px-3 py-2.5 text-center text-slate-500 md:table-cell">{formatDateTime(post.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => updateParams({ page: p })} />}
    </div>
  )
}
