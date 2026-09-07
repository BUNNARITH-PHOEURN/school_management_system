import { useEffect, useState } from 'react'
import type { SessionUser } from '../api/auth'
import TeacherSidebar, { type TeacherPage } from '../components/TeacherSidebar'
import TeacherDashboard from './TeacherDashboard'
import TeacherSchedule from './TeacherSchedule'
import TeacherCourses from './TeacherCourses'
import TeacherAttendance from './TeacherAttendance'

const VALID_PAGES: TeacherPage[] = [
  'dashboard', 'schedule', 'courses', 'attendance', 'profile',
]

const PAGE_TITLES: Record<TeacherPage, [string, string]> = {
  dashboard: ['Dashboard', 'Overview'],
  schedule: ['My Schedule', 'Academics'],
  courses: ['My Courses', 'Academics'],
  attendance: ['Attendance', 'Academics'],
  profile: ['My Profile', 'Account'],
}

function getPageFromHash(): TeacherPage {
  const value = window.location.hash.replace(/^#\/?/, '')
  const match = value.match(/^teacher\/([a-z-]+)/)
  return match && (VALID_PAGES as string[]).includes(match[1]) ? (match[1] as TeacherPage) : 'dashboard'
}

interface TeacherPortalProps {
  session: SessionUser
  onLogout: () => void
}

const pageComponents: Record<TeacherPage, React.ComponentType<{ session: SessionUser; onNavigate: (p: TeacherPage) => void }>> = {
  dashboard: ({ session, onNavigate }) => <TeacherDashboard session={session} onNavigate={onNavigate} />,
  schedule: ({ session }) => <TeacherSchedule session={session} />,
  courses: ({ session }) => <TeacherCourses session={session} />,
  attendance: ({ session }) => <TeacherAttendance session={session} />,
  profile: () => <div className="p-6" style={{ color: '#9ca3af' }}>Profile coming soon.</div>,
}

export default function TeacherPortal({ session, onLogout }: TeacherPortalProps) {
  const [currentPage, setCurrentPage] = useState<TeacherPage>(() => getPageFromHash())
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const navigate = (page: TeacherPage) => {
    if (window.location.hash !== `#/teacher/${page}`) {
      window.location.hash = `/teacher/${page}`
    }
    setCurrentPage(page)
  }

  useEffect(() => {
    const onHash = () => setCurrentPage(getPageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) setMobileOpen(v => !v)
    else setCollapsed(v => !v)
  }

  const [crumbGroup, crumbLabel] = PAGE_TITLES[currentPage]
  const initials = session.name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const Page = pageComponents[currentPage]

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f0f3fa' }}>
      <TeacherSidebar
        user={session}
        currentPage={currentPage}
        onNavigate={navigate}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onLogout={onLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-white border-b flex items-center px-4 gap-3 flex-shrink-0" style={{ borderColor: '#e2e7f0', zIndex: 10 }}>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <nav className="flex items-center gap-1.5 text-sm flex-1 overflow-hidden">
            <span className="truncate flex-shrink-0" style={{ color: '#9ca3af' }}>{crumbGroup}</span>
            <span style={{ color: '#d1d5db' }} className="flex-shrink-0">/</span>
            <span className="truncate text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{crumbLabel}</span>
          </nav>

          <div className="relative ml-1">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
            >
              {session.avatarUrl ? (
                <img src={session.avatarUrl} alt="Profile" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#059669', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
                  {initials}
                </div>
              )}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border z-20 overflow-hidden" style={{ borderColor: '#e2e7f0', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: '#f0f3fa' }}>
                    <div className="text-xs" style={{ color: '#9ca3af' }}>Signed in as</div>
                    <div className="text-sm font-semibold mt-0.5 truncate" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{session.name}</div>
                    <div className="text-xs truncate" style={{ color: '#9ca3af' }}>{session.email}</div>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { setMenuOpen(false); navigate('profile') }} className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50" style={{ color: '#374151' }}>
                      My Profile
                    </button>
                    <div className="my-1 border-t" style={{ borderColor: '#f0f3fa' }} />
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-red-50"
                      style={{ color: '#e11d48' }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Page session={session} onNavigate={navigate} />
        </main>
      </div>
    </div>
  )
}