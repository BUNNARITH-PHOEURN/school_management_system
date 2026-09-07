import { useEffect, useRef, useState, type CSSProperties } from 'react'

export interface AutocompleteOption {
  id: number
  label: string
  sublabel?: string
}

interface AutocompleteProps {
  options: AutocompleteOption[]
  value: number
  onChange: (id: number) => void
  placeholder?: string
  inputClass?: string
  inputStyle?: CSSProperties
}

export default function Autocomplete({ options, value, onChange, placeholder, inputClass, inputStyle }: AutocompleteProps) {
  const selected = options.find(o => o.id === value)
  const [query, setQuery] = useState(selected ? selected.label : '')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = options.filter(o =>
    `${o.label} ${o.sublabel ?? ''}`.toLowerCase().includes(query.toLowerCase().trim())
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (o: AutocompleteOption) => {
    onChange(o.id)
    setQuery(o.label)
    setOpen(false)
  }

  const clear = () => {
    onChange(0)
    setQuery('')
    setOpen(true)
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        className={inputClass}
        style={inputStyle}
        value={query}
        placeholder={placeholder ?? 'Search or select…'}
        onFocus={() => { setOpen(true); setActive(0) }}
        onChange={e => { setQuery(e.target.value); setOpen(true); setActive(0) }}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(i => Math.min(i + 1, filtered.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
          else if (e.key === 'Enter') { if (open && filtered[active]) { e.preventDefault(); select(filtered[active]) } }
          else if (e.key === 'Escape') setOpen(false)
        }}
      />
      {value > 0 && (
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={e => { e.preventDefault(); clear() }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear selection"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      )}
      {open && (
        <ul className="absolute z-30 mt-1 w-full bg-white rounded-lg border shadow-lg max-h-56 overflow-auto py-1" style={{ borderColor: '#e2e7f0' }}>
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm" style={{ color: '#9ca3af' }}>No users match</li>
          ) : filtered.map((o, i) => (
            <li
              key={o.id}
              onMouseDown={e => { e.preventDefault(); select(o) }}
              onMouseEnter={() => setActive(i)}
              className="px-3 py-2 cursor-pointer"
              style={{ backgroundColor: i === active ? '#f0f3fa' : 'transparent' }}
            >
              <div className="text-sm" style={{ color: '#1a1f36' }}>{o.label}</div>
              {o.sublabel && <div className="text-xs" style={{ color: '#9ca3af' }}>{o.sublabel}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}