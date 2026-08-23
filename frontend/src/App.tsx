import { useState } from 'react'
import Sidebar, { type Page } from './components/Sidebar'
import TopBar from './components/TopBar'
import { ToastProvider } from './context/ToastContext'
import Login from './pages/Login'
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

function AppShell() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleToggleSidebar = () => {
    // On mobile: toggle overlay; on desktop: collapse/expand
    if (window.innerWidth < 1024) {
      setMobileOpen(v => !v)
    } else {
      setSidebarCollapsed(v => !v)
    }
  }

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />
  }

  const PageComponent = pageComponents[currentPage]

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f0f3fa' }}>
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar
          currentPage={currentPage}
          onToggleSidebar={handleToggleSidebar}
          onLogout={() => setIsLoggedIn(false)}
          onNavigate={setCurrentPage}
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
