interface Props {
  page: number // 0-based
  totalPages: number
  onChange: (page: number) => void
}

const WINDOW = 5

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null

  const start = Math.floor(page / WINDOW) * WINDOW
  const end = Math.min(start + WINDOW, totalPages)
  const pages = Array.from({ length: end - start }, (_, i) => start + i)

  const base = 'min-w-9 rounded-md px-3 py-1.5 text-sm'
  return (
    <nav className="flex justify-center gap-1">
      <button className={`${base} hover:bg-slate-200 disabled:opacity-40`} disabled={page === 0} onClick={() => onChange(page - 1)}>
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`${base} ${p === page ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200'}`}
          onClick={() => onChange(p)}
        >
          {p + 1}
        </button>
      ))}
      <button
        className={`${base} hover:bg-slate-200 disabled:opacity-40`}
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        ›
      </button>
    </nav>
  )
}
