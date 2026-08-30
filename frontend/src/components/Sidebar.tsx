import { type ReactNode } from 'react'
import type { SessionUser } from '../api/auth'

export type Page =
  | 'dashboard' | 'users' | 'departments' | 'academic-years'
  | 'students' | 'teachers' | 'teacher-assignments' | 'subjects'
  | 'classes' | 'enrollments' | 'attendance' | 'reports' | 'profile'

interface NavGroup {
  label: string
  items: { id: Page; label: string; icon: ReactNode }[]
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
    label: 'Administration',
    items: [
      { id: 'users', label: 'Users', icon: <Ico d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" /> },
      { id: 'departments', label: 'Departments', icon: <Ico d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
      { id: 'academic-years', label: 'Academic Years', icon: <Ico d="M8 2v4 M16 2v4 M3 10h18 M21 8H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1z" /> },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'students', label: 'Students', icon: <Ico d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" /> },
      { id: 'teachers', label: 'Teachers', icon: <Ico d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" /> },
    ],
  },
  {
    label: 'Academics',
    items: [
      { id: 'subjects', label: 'Subjects', icon: <Ico d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /> },
      { id: 'classes', label: 'Classes', icon: <Ico d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /> },
      { id: 'teacher-assignments', label: 'Assignments', icon: <Ico d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2" /> },
      { id: 'enrollments', label: 'Enrollments', icon: <Ico d="M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /> },
    ],
  },
  {
    label: 'Tracking',
    items: [
      { id: 'attendance', label: 'Attendance', icon: <Ico d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /> },
      { id: 'reports', label: 'Reports', icon: <Ico d="M18 20V10 M12 20V4 M6 20v-6" /> },
    ],
  },
]

interface SidebarProps {
  user: SessionUser
  currentPage: Page
  onNavigate: (page: Page) => void
  collapsed: boolean
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ user, currentPage, onNavigate, collapsed, mobileOpen, onMobileClose }: SidebarProps) {
  const nav = (page: Page) => { onNavigate(page); onMobileClose() }
  const w = collapsed ? 64 : 240
  const initials = user.name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const roleLabel = user.role === 'admin' ? 'Admin' : 'Moderator'

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
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>School System</div>
          </div>
        )}
      </div>

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

      {/* Bottom profile */}
      <div className="border-t p-3 flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => nav('profile')}
          className="w-full flex items-center gap-3 rounded-lg p-2 transition-colors"
          style={{ backgroundColor: currentPage === 'profile' ? 'rgba(59,91,219,0.22)' : 'transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = currentPage === 'profile' ? 'rgba(59,91,219,0.22)' : 'transparent' }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#3b5bdb', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
            {initials}
          </div>
          {!collapsed && (
            <div className="text-left overflow-hidden">
              <div className="text-sm font-medium text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>{user.name}</div>
              <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{roleLabel}</div>
            </div>
          )}
        </button>
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
          <div className="fixed left-0 top-0 bottom-0 z-50 h-screen lg:hidden" style={{ width: 240 }}>
            {content}
          </div>
        </>
      )}
    </>
  )
}
