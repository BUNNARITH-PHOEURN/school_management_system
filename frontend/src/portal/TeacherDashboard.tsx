import { useEffect, useMemo, useState } from 'react'
import type { SessionUser } from '../api/auth'
import { listMyClasses, type Class } from '../api/classes'
import { listSubjects, type Subject } from '../api/subjects'
import { listEnrollments, type EnrollmentWithNames } from '../api/enrollments'
import { listAttendance, type AttendanceWithNames } from '../api/attendance'
import { listTeachers, type Teacher } from '../api/teachers'
import Badge from '../components/Badge'
import type { TeacherPage } from '../components/TeacherSidebar'

interface TeacherDashboardProps {
  session: SessionUser
  onNavigate: (page: TeacherPage) => void
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

export default function TeacherDashboard({ session, onNavigate }: TeacherDashboardProps) {
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentWithNames[]>([])
  const [attendance, setAttendance] = useState<AttendanceWithNames[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listMyClasses(), listSubjects(), listEnrollments(), listAttendance(), listTeachers()])
      .then(([classRows, subjectRows, enrollmentRows, attendanceRows, teacherRows]) => {
        setClasses(classRows)
        setSubjects(subjectRows)
        setEnrollments(enrollmentRows)
        setAttendance(attendanceRows)
        setTeachers(teacherRows)
      })
      .finally(() => setLoading(false))
  }, [session.teacherId])

  const myTeacher = teachers.find(t => t.id === session.teacherId)
  const studentCount = useMemo(() => {
    const ids = new Set<number>()
    for (const e of enrollments) {
      if (e.status === 'approved' && classes.some(c => c.id === e.classId)) ids.add(e.studentId)
    }
    return ids.size
  }, [enrollments, classes])

  const myClassIds = useMemo(() => new Set(classes.map(c => c.id)), [classes])
  const presentCount = attendance.filter(a => myClassIds.has(a.classId) && a.status === 'present').length
  const totalRecords = attendance.filter(a => myClassIds.has(a.classId)).length
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0

  const firstName = session.name.split(' ')[0]
  const todayKey = new Date().toISOString().slice(0, 10)
  const todayCount = attendance.filter(a => myClassIds.has(a.classId) && a.date === todayKey).length

  const upcoming = useMemo(() => {
    return [...classes].sort((a, b) => (a.day || '').localeCompare(b.day || '')).slice(0, 5)
  }, [classes])

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div className="rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(120deg,#13203b,#0e4d3a 55%,#0e8a6a)' }}>
        <div className="p-6 sm:p-8 text-white">
          <div className="flex items-center gap-4">
            {session.avatarUrl ? (
              <img src={session.avatarUrl} alt={session.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white/40 flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ backgroundColor: '#059669', fontFamily: 'Outfit, sans-serif', border: '2px solid rgba(255,255,255,0.4)' }}>
                {session.name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-medium" style={{ color: '#a7f3d0' }}>Welcome back 👋</div>
              <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>{firstName}</h1>
              <div className="text-xs sm:text-sm mt-1 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <span>Teacher</span>
                {myTeacher?.specialization && <span>· {myTeacher.specialization}</span>}
                <span>· Teacher Portal</span>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="My Courses" value={classes.length} icon="🏫" color="#059669" sub="Classes you teach" />
            <StatCard label="Students" value={studentCount} icon="🎓" color="#3b5bdb" sub="Across your classes" />
            <StatCard label="Attendance Rate" value={`${attendanceRate}%`} icon="📊" color="#d97706" sub={`${totalRecords} records`} />
            <StatCard label="Recorded Today" value={todayCount} icon="📝" color="#7c3aed" sub="Attendance entries" />
          </div>

          <div className="bg-white rounded-xl border" style={{ borderColor: '#e2e7f0' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#f0f3fa' }}>
              <div>
                <h2 className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>My Courses</h2>
                <p className="text-xs" style={{ color: '#9ca3af' }}>Classes assigned to you this term</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => onNavigate('schedule')} className="text-xs font-semibold" style={{ color: '#059669' }}>View schedule →</button>
                <button onClick={() => onNavigate('courses')} className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ backgroundColor: '#059669', fontFamily: 'Outfit, sans-serif' }}>
                  My Courses
                </button>
              </div>
            </div>
            {upcoming.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-2xl mb-2">🏫</div>
                <p className="text-sm" style={{ color: '#6b7280' }}>No courses assigned to you yet.</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#f5f6fa' }}>
                {upcoming.map(cls => (
                  <div key={cls.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ backgroundColor: '#e7f7f0', color: '#059669', fontFamily: 'Outfit, sans-serif' }}>
                      {(subjects.find(s => s.id === cls.subjectId)?.name || cls.name).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: '#1a1f36' }}>{cls.name}</div>
                      <div className="text-xs truncate" style={{ color: '#9ca3af' }}>{cls.day}{cls.startTime ? ` · ${cls.startTime.slice(0, 5)}–${cls.endTime.slice(0, 5)}` : ''} · {cls.room || 'Room TBD'}</div>
                    </div>
                    <Badge variant={cls.status === 'active' ? 'success' : 'neutral'}>{cls.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}