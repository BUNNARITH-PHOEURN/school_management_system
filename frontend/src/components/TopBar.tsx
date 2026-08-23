import { useState } from 'react'
import type { Page } from './Sidebar'

const breadcrumbs: Record<Page, string[]> = {
  dashboard: ['Dashboard'],
  users: ['Administration', 'Users'],
  departments: ['Administration', 'Departments'],
  'academic-years': ['Administration', 'Academic Years'],
  students: ['People', 'Students'],
  teachers: ['People', 'Teachers'],
  'teacher-assignments': ['Academics', 'Teacher Assignments'],
  subjects: ['Academics', 'Subjects'],
  classes: ['Academics', 'Classes'],
  enrollments: ['Academics', 'Enrollments'],
  attendance: ['Tracking', 'Attendance'],
  reports: ['Tracking', 'Reports'],
  profile: ['Account', 'Profile'],
}

interface TopBarProps {
  currentPage: Page
  onToggleSidebar: () => void
  onLogout: () => void
  onNavigate: (page: Page) => void
}

export default function TopBar({ currentPage, onToggleSidebar, onLogout, onNavigate }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const crumbs = breadcrumbs[currentPage] ?? []

  return (
    <header className="h-14 bg-white border-b flex items-center px-4 gap-3 flex-shrink-0" style={{ borderColor: '#e2e7f0', zIndex: 10 }}>
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
        aria-label="Toggle sidebar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm flex-1 overflow-hidden">
        {crumbs.map((crumb, i) => (
          <span key={crumb} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <span style={{ color: '#d1d5db' }} className="flex-shrink-0">/</span>}
            <span
              className="truncate"
              style={{
                color: i === crumbs.length - 1 ? '#1a1f36' : '#9ca3af',
                fontFamily: i === crumbs.length - 1 ? 'Outfit, sans-serif' : undefined,
                fontWeight: i === crumbs.length - 1 ? 600 : 400,
                fontSize: '0.875rem',
              }}
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Search shortcut */}
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors hover:bg-gray-50" style={{ borderColor: '#e2e7f0', color: '#9ca3af' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <span>Search</span>
          <kbd className="px-1 rounded text-xs" style={{ backgroundColor: '#f0f3fa', color: '#9ca3af' }}>⌘K</kbd>
        </button>

        {/* Notification */}
        <button className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
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
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#3b5bdb', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
              AC
            </div>
            <span className="hidden sm:block text-sm font-medium" style={{ color: '#1a1f36', fontFamily: 'Outfit, sans-serif' }}>Alexandra</span>
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
                  <div className="text-sm font-semibold mt-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Alexandra Chen</div>
                  <div className="text-xs" style={{ color: '#9ca3af' }}>admin@school.edu</div>
                </div>
                <div className="py-1">
                  <button onClick={() => { setMenuOpen(false); onNavigate('profile') }} className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50" style={{ color: '#374151' }}>
                    Profile Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50" style={{ color: '#374151' }}>
                    Help & Support
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
      </div>
    </header>
  )
}
