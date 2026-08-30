import { useEffect, useRef, useState } from 'react'
import Sidebar, { type Page } from './components/Sidebar'
import TopBar from './components/TopBar'
import { ToastProvider } from './context/ToastContext'
import Login from './pages/Login'
import { checkSession, type SessionUser } from './api/auth'
import { loadSession, saveSession, clearSession } from './api/session'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Departments from './pages/Departments'
import AcademicYears from './pages/AcademicYears'
import Students from './pages/Students'
import Teachers from './pages/Teachers'
import TeacherAssignments from './pages/TeacherAssignments'
import Subjects from './pages/Subjects'
import Classes from './pages/Classes'
import Enrollments from './pages/Enrollments'
import Attendance from './pages/Attendance'
import Reports from './pages/Reports'
import Profile from './pages/Profile'

const pageComponents: Record<Page, React.ComponentType> = {
  dashboard: Dashboard,
  users: Users,
  departments: Departments,
  'academic-years': AcademicYears,
  students: Students,
  teachers: Teachers,
  'teacher-assignments': TeacherAssignments,
  subjects: Subjects,
  classes: Classes,
  enrollments: Enrollments,
  attendance: Attendance,
  reports: Reports,
  profile: Profile,
}

const VALID_PAGES: Page[] = [
  'dashboard', 'users', 'departments', 'academic-years',
  'students', 'teachers', 'teacher-assignments', 'subjects',
  'classes', 'enrollments', 'attendance', 'reports', 'profile',
]

function getPageFromHash(): Page {
  const value = window.location.hash.replace(/^#\/?/, '')
  const found = VALID_PAGES.find(p => p === value)
  return found ? found : 'dashboard'
}

function AppShell() {
  const [session, setSession] = useState<SessionUser | null>(() => loadSession())
  const initialSessionRef = useRef(session)
  const [currentPage, setCurrentPage] = useState<Page>(() => getPageFromHash())
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Keep the current page in the URL hash so it survives refresh,
  // and so the browser back/forward buttons move between pages.
  const navigate = (page: Page) => {
    if (window.location.hash !== `#/${page}`) {
      window.location.hash = `/${page}`
    }
    setCurrentPage(page)
  }

  useEffect(() => {
    const onHashChange = () => setCurrentPage(getPageFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // On first load, check the saved session against the server.
  // If the account was deactivated or removed, sign the user out.
  useEffect(() => {
    const saved = initialSessionRef.current
    if (!saved) return
    checkSession(saved.id)
      .then(fresh => {
        saveSession(fresh)
        setSession(fresh)
      })
      .catch(() => {
        clearSession()
        setSession(null)
      })
  }, [])

  const handleLogin = (user: SessionUser) => {
    saveSession(user)
    setSession(user)
    navigate('dashboard')
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
  }

  const handleToggleSidebar = () => {
    // On mobile: toggle overlay; on desktop: collapse/expand
    if (window.innerWidth < 1024) {
      setMobileOpen(v => !v)
    } else {
      setSidebarCollapsed(v => !v)
    }
  }

  if (!session) {
    return <Login onLogin={handleLogin} />
  }

  const PageComponent = pageComponents[currentPage]

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f0f3fa' }}>
      <Sidebar
        user={session}
        currentPage={currentPage}
        onNavigate={navigate}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar
          user={session}
          currentPage={currentPage}
          onToggleSidebar={handleToggleSidebar}
          onLogout={handleLogout}
          onNavigate={navigate}
        />
        <main className="flex-1 overflow-y-auto">
          <PageComponent />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  )
}
