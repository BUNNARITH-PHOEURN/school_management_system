import { useEffect, useState } from 'react'
import type { SessionUser } from '../api/auth'
import type { StudentProfile } from '../api/student'
import { getStudentProfile } from '../api/student'
import StudentSidebar, { type StudentPage } from '../components/StudentSidebar'
import StudentDashboard from './StudentDashboard'
import StudentProfilePage from './StudentProfilePage'
import SubjectEnrollment from './SubjectEnrollment'
import MySubjects from './MySubjects'
import EnrollmentHistory from './EnrollmentHistory'
import Notifications from './Notifications'
import SettingsPage from './SettingsPage'

const VALID_PAGES: StudentPage[] = [
  'dashboard', 'profile', 'enroll', 'subjects', 'history', 'notifications', 'settings',
]

const PAGE_TITLES: Record<StudentPage, [string, string]> = {
  dashboard: ['Dashboard', 'Overview'],
  profile: ['My Profile', 'Account'],
  enroll: ['Subject Enrollment', 'Academics'],
  subjects: ['My Subjects', 'Academics'],
  history: ['Enrollment History', 'Academics'],
  notifications: ['Notifications', 'Account'],
  settings: ['Settings', 'Account'],
}

function getPageFromHash(): StudentPage {
  const value = window.location.hash.replace(/^#\/?/, '')
  const match = value.match(/^student\/([a-z-]+)/)
  return match && (VALID_PAGES as string[]).includes(match[1]) ? (match[1] as StudentPage) : 'dashboard'
}

interface StudentPortalProps {
  session: SessionUser
  onLogout: () => void
}

const pageComponents: Record<StudentPage, (props: React.PropsWithChildren<{ session: SessionUser; profile: StudentProfile | null; refreshProfile: () => void; onNavigate: (p: StudentPage) => void }>) => React.ReactElement> = {
  dashboard: ({ session, profile, onNavigate }) => <StudentDashboard session={session} profile={profile} onNavigate={onNavigate} />,
  profile: ({ session, profile, refreshProfile }) => <StudentProfilePage session={session} profile={profile} onProfileUpdate={refreshProfile} />,
  enroll: ({ session }) => <SubjectEnrollment session={session} />,
  subjects: ({ session }) => <MySubjects session={session} />,
  history: ({ session }) => <EnrollmentHistory session={session} />,
  notifications: () => <Notifications />,
  settings: ({ session }) => <SettingsPage session={session} />,
}

export default function StudentPortal({ session, onLogout }: StudentPortalProps) {
  const [currentPage, setCurrentPage] = useState<StudentPage>(() => getPageFromHash())
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const navigate = (page: StudentPage) => {
    if (window.location.hash !== `#/student/${page}`) {
      window.location.hash = `/student/${page}`
    }
    setCurrentPage(page)
  }

  const refreshProfile = () => {
    if (!session.studentId) return
    getStudentProfile(session.studentId).then(setProfile).catch(() => {})
  }

  useEffect(() => {
    const onHash = () => setCurrentPage(getPageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    refreshProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.studentId])

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) setMobileOpen(v => !v)
    else setCollapsed(v => !v)
  }

  const [crumbGroup, crumbLabel] = PAGE_TITLES[currentPage]
  const initials = session.name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const Page = pageComponents[currentPage]

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f0f3fa' }}>
      <StudentSidebar
        user={session}
        profile={profile}
        currentPage={currentPage}
        onNavigate={navigate}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onLogout={onLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
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

          {/* Notification bell */}
          <button
            onClick={() => navigate('notifications')}
            className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Notifications"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e11d48' }} />
          </button>

          {/* Profile menu */}
          <div className="relative ml-1">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
            >
              {session.avatarUrl ? (
                <img src={session.avatarUrl} alt="Profile" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#3b5bdb', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
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
                    <button onClick={() => { setMenuOpen(false); navigate('settings') }} className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50" style={{ color: '#374151' }}>
                      Settings
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
          <Page
            session={session}
            profile={profile}
            refreshProfile={refreshProfile}
            onNavigate={navigate}
          >
            {null}
          </Page>
        </main>
      </div>
    </div>
  )
}