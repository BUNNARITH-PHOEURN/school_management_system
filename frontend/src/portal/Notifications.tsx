import { useState } from 'react'
import Badge from '../components/Badge'

interface NotificationItem {
  id: number
  icon: string
  color: string
  title: string
  body: string
  time: string
  unread: boolean
  tag?: string
}

const SEED: NotificationItem[] = [
  { id: 1, icon: '🎓', color: '#3b5bdb', title: 'Welcome to EduManage', body: 'Your student account is ready. Start by browsing available subjects and enrolling in your classes.', time: 'Just now', unread: true, tag: 'Account' },
  { id: 2, icon: '📚', color: '#059669', title: 'Enrollment is open', body: 'New classes are now available for enrollment this term. Check Subject Enrollment to see what\'s new.', time: '2 hours ago', unread: true, tag: 'Academics' },
  { id: 3, icon: '🗓️', color: '#d97706', title: 'Academic calendar updated', body: 'The midterm exam schedule has been published. Please review your subject schedule for details.', time: 'Yesterday', unread: false, tag: 'Schedule' },
  { id: 4, icon: '📄', color: '#2563eb', title: 'Profile completion', body: 'Add a profile photo to complete your student profile and make it easy for instructors to recognize you.', time: '2 days ago', unread: false, tag: 'Profile' },
  { id: 5, icon: '🔔', color: '#7c3aed', title: 'Tips & announcements', body: 'Check the Student Portal regularly for subject announcements and school news.', time: '3 days ago', unread: false },
]

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>(SEED)
  const [selected, setSelected] = useState<NotificationItem | null>(null)
  const unreadCount = items.filter(i => i.unread).length

  const markAllRead = () => setItems(prev => prev.map(i => ({ ...i, unread: false })))

  const open = (item: NotificationItem) => {
    setSelected(item)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, unread: false } : i))
  }

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Notifications</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>
            <span className="font-semibold" style={{ color: '#1a1f36' }}>{unreadCount}</span> unread
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors" style={{ borderColor: '#e2e7f0', color: '#3b5bdb', backgroundColor: 'white' }}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => open(item)}
            className="w-full text-left rounded-xl border p-4 flex items-start gap-4 transition-colors hover:bg-white"
            style={{
              borderColor: item.unread ? '#c1ceff' : '#e2e7f0',
              backgroundColor: item.unread ? '#f8faff' : 'white',
            }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: item.color + '1a' }}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold truncate" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{item.title}</span>
                {item.unread && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#3b5bdb' }} />}
                {item.tag && <Badge variant="primary">{item.tag}</Badge>}
              </div>
              <p className="text-sm mt-1 line-clamp-2" style={{ color: '#6b7280' }}>{item.body}</p>
              <div className="text-xs mt-1.5" style={{ color: '#9ca3af' }}>{item.time}</div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(15,23,42,0.5)' }} onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-1.5 rounded-md text-gray-400 hover:bg-gray-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: selected.color + '1a' }}>
              {selected.icon}
            </div>
            <h3 className="text-base font-bold mt-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{selected.title}</h3>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{selected.time}</p>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: '#374151' }}>{selected.body}</p>
          </div>
        </div>
      )}
    </div>
  )
}