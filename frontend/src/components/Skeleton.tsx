export function SkeletonRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-t" style={{ borderColor: '#f0f3fa' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className="h-3.5 rounded-full"
            style={{ backgroundColor: '#f0f3fa', width: `${60 + Math.random() * 30}%`, animation: 'pulse 1.5s ease-in-out infinite' }}
          />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} cols={cols} />)}
    </>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border p-5 space-y-3" style={{ borderColor: '#e2e7f0' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>
      <div className="h-4 w-2/3 rounded-full" style={{ backgroundColor: '#f0f3fa', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div className="h-3 w-1/2 rounded-full" style={{ backgroundColor: '#f0f3fa', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div className="h-3 w-3/4 rounded-full" style={{ backgroundColor: '#f0f3fa', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  )
}

export function EmptyState({ icon, title, description, action }: { icon: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-base font-semibold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: '#374151' }}>{title}</div>
      {description && <p className="text-sm max-w-xs" style={{ color: '#9ca3af' }}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
