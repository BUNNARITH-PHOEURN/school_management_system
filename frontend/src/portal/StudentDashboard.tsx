import { useEffect, useState } from 'react'
import type { SessionUser } from '../api/auth'
import type { StudentProfile } from '../api/student'
import { listEnrollments, type EnrollmentWithNames } from '../api/enrollments'
import { listClasses, type Class } from '../api/classes'
import { listSubjects, type Subject } from '../api/subjects'
import { buildSubjectItems, type SubjectItem } from './shared'
import Badge from '../components/Badge'
import type { StudentPage } from '../components/StudentSidebar'

interface StudentDashboardProps {
  session: SessionUser
  profile: StudentProfile | null
  onNavigate: (page: StudentPage) => void
}

function StatCard({ label, value, icon, color, sub }: { label: string; value: string | number; icon: string; color: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl p-5 border" style={{ borderColor: '#e2e7f0' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: color + '18' }}>
          {icon}
        </div>
        <span className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{value}</span>
      </div>
      <div className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{label}</div>
      <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{sub}</div>
    </div>
  )
}

export default function StudentDashboard({ session, profile, onNavigate }: StudentDashboardProps) {
  const [enrollments, setEnrollments] = useState<EnrollmentWithNames[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listEnrollments(), listClasses(), listSubjects()])
      .then(([enrollmentRows, classRows, subjectRows]) => {
        setEnrollments(enrollmentRows.filter(e => e.studentId === session.studentId))
        setClasses(classRows)
        setSubjects(subjectRows)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session.studentId])

  const myEnrollments = enrollments.filter(e => e.status === 'enrolled')
  const items = buildSubjectItems(enrollments, classes, subjects)
  const activeItems = items.filter(i => i.status === 'enrolled')
  const totalCredits = activeItems.reduce((sum, i) => sum + i.credits, 0)
  const available = classes.filter(c => c.status === 'active').length - myEnrollments.length

  const firstName = session.name.split(' ')[0]
  const scheduleItems = [...activeItems].sort((a, b) => (a.day || '').localeCompare(b.day || '')).slice(0, 5)

  return (
    <div className="p-5 sm:p-6 space-y-5">
      {/* Welcome banner */}
      <div className="rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(120deg,#13203b,#1c3570 55%,#2b5bd7)' }}>
        <div className="p-6 sm:p-8 text-white">
          <div className="flex items-center gap-4">
            {session.avatarUrl ? (
              <img src={session.avatarUrl} alt={session.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white/40 flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif', border: '2px solid rgba(255,255,255,0.4)' }}>
                {session.name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-medium" style={{ color: '#aebfe8' }}>Welcome back 👋</div>
              <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>{firstName}</h1>
              <div className="text-xs sm:text-sm mt-1 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <span>{profile?.code}</span>
                {profile?.departmentName && <span>· {profile.departmentName}</span>}
                <span>· Student Portal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border h-32 animate-pulse" style={{ borderColor: '#e2e7f0', backgroundColor: '#f8f9fd' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Enrolled Subjects" value={myEnrollments.length} icon="📚" color="#3b5bdb" sub="Currently active" />
            <StatCard label="Total Credits" value={totalCredits} icon="⭐" color="#d97706" sub="Enrolled this term" />
            <StatCard label="Available Classes" value={Math.max(0, available)} icon="🏫" color="#059669" sub="Open for enrollment" />
            <StatCard label="Member Since" value={profile?.enrolledAt ? profile.enrolledAt.split('-')[0] : '—'} icon="🎓" color="#7c3aed" sub={profile ? formatJoined(profile.enrolledAt) : ''} />
          </div>

          {/* My schedule */}
          <div className="bg-white rounded-xl border hidden sm:block" style={{ borderColor: '#e2e7f0' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#f0f3fa' }}>
              <div>
                <h2 className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>My Subject Schedule</h2>
                <p className="text-xs" style={{ color: '#9ca3af' }}>Your enrolled classes this term</p>
              </div>
              <button onClick={() => onNavigate('subjects')} className="text-xs font-semibold" style={{ color: '#3b5bdb' }}>
                View all →
              </button>
            </div>
            {scheduleItems.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-2xl mb-2">🎒</div>
                <p className="text-sm mb-3" style={{ color: '#6b7280' }}>You haven't enrolled in any subjects yet.</p>
                <button
                  onClick={() => onNavigate('enroll')}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white"
                  style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}
                >
                  Browse Subjects
                </button>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#f5f6fa' }}>
                {scheduleItems.map(item => (
                  <ScheduleRow key={item.enrollmentId} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Mobile schedule + CTAs */}
          <div className="grid sm:hidden grid-cols-1 gap-4">
            <button onClick={() => onNavigate('enroll')} className="rounded-xl border p-4 text-left flex items-center gap-3" style={{ borderColor: '#e2e7f0', backgroundColor: 'white' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: '#eff2ff' }}>📝</div>
              <div>
                <div className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Enroll in Subjects</div>
                <div className="text-xs" style={{ color: '#9ca3af' }}>Browse and join new classes</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function ScheduleRow({ item }: { item: SubjectItem }) {
  return (
    <div className="flex items-center gap-4 px-6 py-3.5">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3451c7', fontFamily: 'Outfit, sans-serif' }}>
        {item.subjectName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: '#1a1f36' }}>{item.subjectName}</div>
        <div className="text-xs truncate" style={{ color: '#9ca3af' }}>{item.className} · {item.schedule}{item.room ? ` · ${item.room}` : ''}</div>
      </div>
      <Badge variant="primary">{item.credits} credits</Badge>
    </div>
  )
}

function formatJoined(value: string): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}