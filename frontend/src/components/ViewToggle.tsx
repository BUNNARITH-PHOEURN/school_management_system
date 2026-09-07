export type ViewMode = 'card' | 'table'

interface ViewToggleProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="ml-auto flex items-center gap-1 rounded-lg border p-0.5" style={{ borderColor: '#e2e7f0' }}>
      <button
        onClick={() => onChange('card')}
        className={`p-1.5 rounded-md transition-colors ${view === 'card' ? 'text-white' : 'text-gray-400 hover:bg-gray-100'}`}
        style={view === 'card' ? { backgroundColor: '#3b5bdb' } : undefined}
        title="Card view"
        aria-label="Card view"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
      </button>
      <button
        onClick={() => onChange('table')}
        className={`p-1.5 rounded-md transition-colors ${view === 'table' ? 'text-white' : 'text-gray-400 hover:bg-gray-100'}`}
        style={view === 'table' ? { backgroundColor: '#3b5bdb' } : undefined}
        title="Table view"
        aria-label="Table view"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
      </button>
    </div>
  )
}