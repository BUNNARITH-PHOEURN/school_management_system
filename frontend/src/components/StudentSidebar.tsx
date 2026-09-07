import { type ReactNode } from 'react'
import type { SessionUser } from '../api/auth'
import type { StudentProfile } from '../api/student'

export type StudentPage =
  | 'dashboard'
  | 'profile'
  | 'enroll'
  | 'subjects'
  | 'history'
  | 'notifications'
  | 'settings'

interface NavGroup {
  label: string
  items: { id: StudentPage; label: string; icon: ReactNode }[]
}

const Ico = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <Ico d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" /> },
    ],
  },
  {
    label: 'Academics',
    items: [
      { id: 'enroll', label: 'Subject Enrollment', icon: <Ico d="M12 5v14M5 12h14" /> },
      { id: 'subjects', label: 'My Subjects', icon: <Ico d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /> },
      { id: 'history', label: 'Enrollment History', icon: <Ico d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8 M3 3v5h5" /> },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'profile', label: 'My Profile', icon: <Ico d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /> },
      { id: 'notifications', label: 'Notifications', icon: <Ico d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" /> },
      { id: 'settings', label: 'Settings', icon: <Ico d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /> },
    ],
  },
]

interface StudentSidebarProps {
  user: SessionUser
  profile: StudentProfile | null
  currentPage: StudentPage
  onNavigate: (page: StudentPage) => void
  collapsed: boolean
  mobileOpen: boolean
  onMobileClose: () => void
  onLogout: () => void
}

export default function StudentSidebar({
  user,
  profile,
  currentPage,
  onNavigate,
  collapsed,
  mobileOpen,
  onMobileClose,
  onLogout,
}: StudentSidebarProps) {
  const nav = (page: StudentPage) => { onNavigate(page); onMobileClose() }
  const w = collapsed ? 64 : 248
  const initials = (user.name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?')

  const content = (
    <aside
      style={{ backgroundColor: '#13203b', width: w, minWidth: w, maxWidth: w }}
      className="h-full flex flex-col transition-all duration-200"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3b5bdb' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-bold text-sm leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>EduManage</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Student Portal</div>
          </div>
        )}
      </div>

      {/* Student identity */}
      {!collapsed && profile && (
        <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover border-2 flex-shrink-0" style={{ borderColor: 'rgba(59,91,219,0.6)' }} />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: '#3b5bdb', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>{user.name}</div>
              <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{profile.code} · {profile.departmentName}</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto sidebar-nav py-3 space-y-0.5">
        {navGroups.map(group => (
          <div key={group.label} className="mb-2">
            {!collapsed && (
              <div className="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'Outfit, sans-serif' }}>
                {group.label}
              </div>
            )}
            {group.items.map(item => {
              const active = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => nav(item.id)}
                  title={collapsed ? item.label : undefined}
                  className="w-full flex items-center gap-3 transition-all duration-100 relative"
                  style={{
                    padding: collapsed ? '9px 0' : '8px 16px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                    backgroundColor: active ? 'rgba(59,91,219,0.22)' : 'transparent',
                    borderRight: `3px solid ${active ? '#3b5bdb' : 'transparent'}`,
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
                >
                  <span style={{ color: active ? '#7a9cff' : 'rgba(255,255,255,0.38)', flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && (
                    <span className="text-sm font-medium whitespace-nowrap" style={{ fontFamily: 'Outfit, sans-serif' }}>{item.label}</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Logout + profile */}
      <div className="border-t p-3 flex-shrink-0 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => { onLogout(); onMobileClose() }}
          className="w-full flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(225,29,72,0.15)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
        >
          <span style={{ color: '#f87171', flexShrink: 0 }}>
            <Ico d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
          </span>
          {!collapsed && (
            <span className="text-sm font-medium" style={{ fontFamily: 'Outfit, sans-serif' }}>Logout</span>
          )}
        </button>
        {!collapsed && (
          <div className="text-center text-xs pt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            © 2026 EduManage
          </div>
        )}
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen flex-shrink-0" style={{ width: w, transition: 'width 0.2s' }}>
        {content}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 lg:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={onMobileClose} />
          <div className="fixed left-0 top-0 bottom-0 z-50 h-screen lg:hidden" style={{ width: 248 }}>
            {content}
          </div>
        </>
      )}
    </>
  )
}