interface Props {
  page: number // 0부터 시작
  totalPages: number
  onChange: (page: number) => void
}

const WINDOW = 5 // 한 번에 보여줄 페이지 번호 개수

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null

  const start = Math.floor(page / WINDOW) * WINDOW
  const end = Math.min(start + WINDOW, totalPages)
  const pages = Array.from({ length: end - start }, (_, i) => start + i)

  const base = 'min-w-9 rounded px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <nav className="mt-6 flex justify-center gap-1">
      <button className={`${base} hover:bg-slate-200`} disabled={page === 0} onClick={() => onChange(page - 1)}>
        ‹ 이전
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`${base} ${p === page ? 'bg-indigo-600 font-semibold text-white' : 'hover:bg-slate-200'}`}
        >
          {p + 1}
        </button>
      ))}
      <button
        className={`${base} hover:bg-slate-200`}
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        다음 ›
      </button>
    </nav>
  )
}
