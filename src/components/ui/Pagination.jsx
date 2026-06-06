import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null
  const { page, totalPages, total, limit } = meta
  const from = (page - 1) * limit + 1
  const to   = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between mt-6">
      <span className="text-xs text-slate-500">
        Showing <span className="text-slate-300 font-medium">{from}–{to}</span> of{' '}
        <span className="text-slate-300 font-medium">{total}</span> results
      </span>
      <div className="flex items-center gap-2">
        <button
          className="btn-icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p = i + 1
          if (totalPages > 5) {
            if (page <= 3)        p = i + 1
            else if (page >= totalPages - 2) p = totalPages - 4 + i
            else                  p = page - 2 + i
          }
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={p === page
                ? 'w-8 h-8 rounded-lg text-xs font-semibold bg-brand-500 text-white'
                : 'w-8 h-8 rounded-lg text-xs btn-secondary'}
            >
              {p}
            </button>
          )
        })}
        <button
          className="btn-icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
