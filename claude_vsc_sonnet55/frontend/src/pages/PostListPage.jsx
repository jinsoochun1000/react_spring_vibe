import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { errorMessage, fetchPosts } from '../api'

const fmt = (s) => s?.replace('T', ' ').slice(0, 16)

export default function PostListPage({ auth }) {
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') || 0)
  const keyword = params.get('keyword') || ''
  const [input, setInput] = useState(keyword)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPosts({ page, size: 10, keyword })
      .then((d) => { setData(d); setError('') })
      .catch((e) => setError(errorMessage(e)))
  }, [page, keyword])

  const search = (e) => {
    e.preventDefault()
    setParams(input.trim() ? { keyword: input.trim() } : {})
  }
  const goto = (p) => setParams({ ...(keyword && { keyword }), page: p })

  return (
    <section>
      <div className="toolbar">
        <form onSubmit={search} className="search">
          <input placeholder="제목 검색" value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="btn">검색</button>
        </form>
        {auth && <Link to="/posts/new" className="btn primary">글쓰기</Link>}
      </div>

      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr><th className="num">번호</th><th>제목</th><th>작성자</th><th>작성일</th><th className="num">조회</th></tr>
        </thead>
        <tbody>
          {data?.items.map((p) => (
            <tr key={p.id}>
              <td className="num">{p.id}</td>
              <td><Link to={`/posts/${p.id}`}>{p.title}</Link></td>
              <td>{p.authorUsername}</td>
              <td>{fmt(p.createdAt)}</td>
              <td className="num">{p.viewCount}</td>
            </tr>
          ))}
          {data?.items.length === 0 && <tr><td colSpan="5" className="empty">게시글이 없습니다.</td></tr>}
        </tbody>
      </table>

      {data && data.totalPages > 1 && (
        <div className="pager">
          <button className="btn" disabled={page === 0} onClick={() => goto(page - 1)}>이전</button>
          <span>{page + 1} / {data.totalPages}</span>
          <button className="btn" disabled={page + 1 >= data.totalPages} onClick={() => goto(page + 1)}>다음</button>
        </div>
      )}
    </section>
  )
}
