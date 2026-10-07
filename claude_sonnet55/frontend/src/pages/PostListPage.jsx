import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import { formatDate } from '../format.js'

export default function PostListPage() {
  // 검색어/페이지는 URL 쿼리에 보관 → 새로고침·뒤로가기에도 유지
  const [params, setParams] = useSearchParams()
  const keyword = params.get('keyword') || ''
  const page = Number(params.get('page') || 0)

  const [input, setInput] = useState(keyword)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setError('')
    api.listPosts({ keyword, page })
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
    return () => { cancelled = true }
  }, [keyword, page])

  const go = (next) => setParams({ ...(next.keyword ? { keyword: next.keyword } : {}), page: String(next.page ?? 0) })

  function onSearch(e) {
    e.preventDefault()
    go({ keyword: input.trim(), page: 0 })
  }

  return (
    <>
      <div className="toolbar">
        <form onSubmit={onSearch} className="search">
          <input placeholder="제목 검색" value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="btn">검색</button>
        </form>
        <Link to="/posts/new" className="btn primary">글쓰기</Link>
      </div>

      {error && <p className="error">{error}</p>}

      <table className="table">
        <thead>
          <tr><th className="num">번호</th><th>제목</th><th>작성자</th><th>작성일</th><th className="num">조회</th></tr>
        </thead>
        <tbody>
          {data?.content.map((p) => (
            <tr key={p.id}>
              <td className="num">{p.id}</td>
              <td><Link to={`/posts/${p.id}`}>{p.title}</Link></td>
              <td>{p.authorName}</td>
              <td>{formatDate(p.createdAt)}</td>
              <td className="num">{p.viewCount}</td>
            </tr>
          ))}
          {data && data.content.length === 0 && (
            <tr><td colSpan="5" className="center muted">게시글이 없습니다</td></tr>
          )}
          {!data && !error && <tr><td colSpan="5" className="center muted">불러오는 중…</td></tr>}
        </tbody>
      </table>

      {data && data.totalPages > 1 && (
        <nav className="pager">
          <button className="btn" disabled={page === 0} onClick={() => go({ keyword, page: page - 1 })}>이전</button>
          <span>{page + 1} / {data.totalPages}</span>
          <button className="btn" disabled={page + 1 >= data.totalPages} onClick={() => go({ keyword, page: page + 1 })}>다음</button>
        </nav>
      )}
    </>
  )
}
