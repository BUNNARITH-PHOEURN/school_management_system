interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  const pages: (number | '…')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: '#e2e7f0' }}>
      <span className="text-xs" style={{ color: '#9ca3af' }}>
        Showing <strong style={{ color: '#374151' }}>{from}–{to}</strong> of <strong style={{ color: '#374151' }}>{totalItems}</strong>
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="w-7 h-7 rounded flex items-center justify-center transition-colors disabled:opacity-30"
          style={{ color: '#374151' }}
          onMouseEnter={e => { if (page > 1) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f0f3fa' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-xs" style={{ color: '#9ca3af' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className="w-7 h-7 rounded text-xs font-medium transition-colors"
              style={{ backgroundColor: page === p ? '#3b5bdb' : 'transparent', color: page === p ? '#fff' : '#6b7280', fontFamily: 'Outfit, sans-serif' }}
              onMouseEnter={e => { if (page !== p) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f0f3fa' }}
              onMouseLeave={e => { if (page !== p) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="w-7 h-7 rounded flex items-center justify-center transition-colors disabled:opacity-30"
          style={{ color: '#374151' }}
          onMouseEnter={e => { if (page < totalPages) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f0f3fa' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </div>
  )
}
