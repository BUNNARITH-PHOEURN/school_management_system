export interface ScheduleSlot {
  id: string
  name: string
  detail?: string
  day: string
  startTime: string
  endTime: string
  room?: string
  colorKey?: number
}

const DAY_KEYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' } as const
const COLORS = [
  { bg: '#dbe4ff', fg: '#3451c7' },
  { bg: '#c7f4e3', fg: '#0b6e4f' },
  { bg: '#fde4c8', fg: '#b45309' },
  { bg: '#ffd9e4', fg: '#be185d' },
  { bg: '#ddd6fe', fg: '#5b21b6' },
  { bg: '#fde9d0', fg: '#b45309' },
  { bg: '#c7e9fb', fg: '#0369a1' },
]

function parseDayList(day: string): string[] {
  return day.split('/').map(d => d.trim()).filter(d => (DAY_KEYS as string[]).includes(d))
}

function timeToMinutes(value: string): number {
  if (!value) return 0
  const [h, m] = value.slice(0, 5).split(':').map(Number)
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
}

function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour12} ${ampm}` : `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
}

interface ScheduleGridProps {
  slots: ScheduleSlot[]
}

export default function ScheduleGrid({ slots }: ScheduleGridProps) {
  const dayOrder: Record<string, number> = {}
  DAY_KEYS.forEach((d, i) => { dayOrder[d] = i })

  const parsed = slots.flatMap((slot, slotIndex) => {
    const start = timeToMinutes(slot.startTime)
    const end = timeToMinutes(slot.endTime)
    return parseDayList(slot.day).map(day => ({ slot, day, dayIndex: dayOrder[day] ?? -1, start, end, slotIndex }))
  }).filter(s => s.dayIndex >= 0 && s.start < s.end)
    .sort((a, b) => a.dayIndex - b.dayIndex || a.start - b.start)

  if (parsed.length === 0) return null

  let min = 8 * 60
  let max = 17 * 60
  for (const s of parsed) {
    min = Math.min(min, s.start)
    max = Math.max(max, s.end)
  }
  const gridStart = Math.floor(min / 60) * 60
  const gridEnd = Math.ceil(max / 60) * 60
  const hours = (gridEnd - gridStart) / 60
  const maxDayIndex = parsed.reduce((m, s) => Math.max(m, s.dayIndex), 0)
  const visibleDays = maxDayIndex >= 5 ? DAY_KEYS : DAY_KEYS.slice(0, 5)

  const byDay: Record<number, typeof parsed> = {}
  for (const s of parsed) { (byDay[s.dayIndex] = byDay[s.dayIndex] || []).push(s) }

  return (
    <div className="bg-white rounded-xl border overflow-x-auto" style={{ borderColor: '#e2e7f0' }}>
      <div className="min-w-[640px]">
      <div className="flex" style={{ borderBottom: '1px solid #e2e7f0' }}>
        <div className="flex-shrink-0" style={{ width: 64, backgroundColor: '#f8f9fd' }} />
        {visibleDays.map(day => (
          <div key={day} className="flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: '#f8f9fd', color: '#6b7280', fontFamily: 'Outfit, sans-serif', borderLeft: '1px solid #e2e7f0' }}>
            {DAY_SHORT[day as keyof typeof DAY_SHORT]}
          </div>
        ))}
      </div>

      <div className="flex">
        <div className="flex-shrink-0" style={{ width: 64 }}>
          {Array.from({ length: hours }).map((_, i) => (
            <div key={i} className="flex items-start justify-end pr-2 text-[10px]" style={{ height: 56, paddingTop: 4, color: '#9ca3af' }}>
              {i === 0 ? '' : minutesToLabel(gridStart + i * 60)}
            </div>
          ))}
        </div>

        {visibleDays.map(day => (
          <div key={day} className="flex-1 relative" style={{ borderLeft: '1px solid #e2e7f0' }}>
            {Array.from({ length: hours }).map((_, i) => (
              <div key={i} className="border-b" style={{ height: 56, borderColor: '#f0f3fa', backgroundColor: i % 2 === 0 ? '#fcfcfe' : '#ffffff' }} />
            ))}
            {(byDay[DAY_KEYS.indexOf(day)] || []).map((s, blockIdx) => {
              const color = COLORS[s.slot.colorKey ?? s.slotIndex % COLORS.length]
              const top = ((s.start - gridStart) / 60) * 56
              const height = Math.max(((s.end - s.start) / 60) * 56, 40)
              // If another slot overlaps on this day, offset this block so both are visible.
              const sameStart = (byDay[DAY_KEYS.indexOf(day)] || []).filter(o => o.start === s.start && o.end === s.end)
              const overlapping = sameStart.length > 1
              const idx = sameStart.indexOf(s)
              const widthFactor = overlapping ? Math.max(0.48, 1 / sameStart.length) : 1
              const leftPct = overlapping ? idx * 50 : 0
              return (
                <div
                  key={s.slot.id + '-' + s.dayIndex}
                  className="absolute rounded-lg px-2 py-1.5 overflow-hidden"
                  title={`${s.slot.name} · ${s.slot.room || 'Room TBD'}`}
                  style={{
                    top, height,
                    left: overlapping ? `calc(${leftPct}% + 4px)` : 4,
                    right: overlapping ? 'auto' : 4,
                    width: overlapping ? `calc(${widthFactor * 100}% - 8px)` : undefined,
                    backgroundColor: color.bg, color: color.fg, border: `1px solid ${color.bg}`,
                  }}
                >
                  <div className="text-xs font-bold truncate leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>{s.slot.name}</div>
                  <div className="text-[10px] truncate leading-tight" style={{ opacity: 0.85 }}>
                    {minutesToLabel(s.start)} – {minutesToLabel(s.end)}
                  </div>
                  {s.slot.detail && <div className="text-[10px] truncate leading-tight" style={{ opacity: 0.85 }}>{s.slot.detail}</div>}
                  <div className="text-[10px] truncate leading-tight hidden sm:block" style={{ opacity: 0.7 }}>{s.slot.room || 'Room TBD'}</div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}