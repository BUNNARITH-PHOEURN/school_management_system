import { useEffect, useRef, useState } from 'react'
import Sidebar, { type Page } from './components/Sidebar'
import TopBar from './components/TopBar'
import { ToastProvider } from './context/ToastContext'
import Login from './pages/Login'
import Home from './pages/Home'
import About from './pages/About'
import DepartmentsPage from './pages/DepartmentsPage'
import ContactPage from './pages/ContactPage'
import StudentRegister from './pages/StudentRegister'
import StudentLogin from './pages/StudentLogin'
import StudentPortal from './portal/StudentPortal'
import TeacherPortal from './portal/TeacherPortal'
import { checkSession, type SessionUser } from './api/auth'
import { loadSession, saveSession, clearSession } from './api/session'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Departments from './pages/Departments'
import AcademicYears from './pages/AcademicYears'
import Students from './pages/Students'
import Teachers from './pages/Teachers'
import Subjects from './pages/Subjects'
import SubjectFees from './pages/SubjectFees'
import Classes from './pages/Classes'
import Enrollments from './pages/Enrollments'
import Payments from './pages/Payments'
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
  subjects: Subjects,
  'subject-fees': SubjectFees,
  classes: Classes,
  enrollments: Enrollments,
  payments: Payments,
  attendance: Attendance,
  reports: Reports,
  profile: Profile,
}

const VALID_PAGES: Page[] = [
  'dashboard', 'users', 'departments', 'academic-years',
  'students', 'teachers', 'subjects',
  'classes', 'enrollments', 'subject-fees', 'attendance', 'payments', 'reports', 'profile',
]

function getPageFromHash(): Page {
  const value = window.location.hash.replace(/^#\/?/, '')
  const found = VALID_PAGES.find(p => p === value)
  return found ? found : 'dashboard'
}

function AppShell() {
  const [session, setSession] = useState<SessionUser | null>(() => loadSession())
  const initialSessionRef = useRef(session)
  const [showLogin, setShowLogin] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [publicView, setPublicView] = useState<'home' | 'about' | 'departments' | 'contact' | 'admin-login' | 'student-register' | 'student-login'>('home')
  const [currentPage, setCurrentPage] = useState<Page>(() => getPageFromHash())
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggedOutView, setLoggedOutView] = useState<'landing' | 'login'>('landing')

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

  const handleStudentSession = (user: SessionUser) => {
    saveSession(user)
    setSession(user)
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
    setShowLogin(false)
    setPublicView('home')
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
    if (publicView === 'student-register') {
      return (
        <StudentRegister
          onSuccess={handleStudentSession}
          onSignIn={() => { setRegistering(false); setPublicView('admin-login') }}
          onHome={() => setPublicView('home')}
        />
      )
    }
    if (publicView === 'student-login') {
      return (
        <StudentLogin
          onLogin={handleStudentSession}
          onGoRegister={() => setPublicView('student-register')}
          onHome={() => setPublicView('home')}
        />
      )
    }
    if (publicView === 'contact') {
      return (
        <ContactPage
          onHome={() => setPublicView('home')}
          onAbout={() => setPublicView('about')}
          onDepartments={() => setPublicView('departments')}
          onLogin={() => { setRegistering(false); setShowLogin(true); setPublicView('home') }}
          onRegister={() => { setRegistering(true); setShowLogin(true); setPublicView('home') }}
          onStudentRegister={() => setPublicView('student-register')}
        />
      )
    }
    if (publicView === 'departments') {
      return (
        <DepartmentsPage
          onHome={() => setPublicView('home')}
          onAbout={() => setPublicView('about')}
          onContact={() => setPublicView('contact')}
          onLogin={() => { setRegistering(false); setShowLogin(true); setPublicView('home') }}
          onRegister={() => { setRegistering(true); setShowLogin(true); setPublicView('home') }}
          onStudentRegister={() => setPublicView('student-register')}
        />
      )
    }
    if (publicView === 'about') {
      return (
        <About
          onHome={() => setPublicView('home')}
          onLogin={() => { setRegistering(false); setShowLogin(true); setPublicView('home') }}
          onRegister={() => { setRegistering(true); setShowLogin(true); setPublicView('home') }}
          onStudentRegister={() => setPublicView('student-register')}
          onStudentLogin={() => setPublicView('student-login')}
          onDepartments={() => setPublicView('departments')}
          onContact={() => setPublicView('contact')}
        />
      )
    }
    if (!showLogin) {
      return (
        <Home
          onLogin={() => { setRegistering(false); setShowLogin(true) }}
          onRegister={() => { setRegistering(true); setShowLogin(true) }}
          onStudentRegister={() => setPublicView('student-register')}
          onStudentLogin={() => setPublicView('student-login')}
          onEnroll={() => {
            window.location.hash = '/student/enroll'
            setPublicView('student-login')
          }}
          onAbout={() => setPublicView('about')}
          onDepartments={() => setPublicView('departments')}
          onContact={() => setPublicView('contact')}
        />
      )
    }
    return <Login initialRegistering={registering} onLogin={handleLogin} />
  }

  if (session.role === 'student') {
    return <StudentPortal session={session} onLogout={handleLogout} />
  }

  if (session.role === 'teacher') {
    return <TeacherPortal session={session} onLogout={handleLogout} />
  }

  const PageComponent = pageComponents[currentPage]
  const page = currentPage === 'profile'
    ? <Profile onSessionUpdate={user => { saveSession(user); setSession(user) }} />
    : <PageComponent />

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
          {page}
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
