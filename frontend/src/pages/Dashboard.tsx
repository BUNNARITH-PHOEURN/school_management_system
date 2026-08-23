import { students, teachers, subjects, classes, attendance, enrollments } from '../data/mockData'
import Badge, { statusVariant } from '../components/Badge'

const activeStudents = students.filter(s => s.status === 'active').length
const activeTeachers = teachers.filter(t => t.status === 'active').length
const activeSubjects = subjects.filter(s => s.status === 'active').length
const activeClasses = classes.filter(c => c.status === 'active').length

const recentAttendance = [...attendance].reverse().slice(0, 6)

function StatCard({ label, value, icon, color, sub }: { label: string; value: number; icon: string; color: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border" style={{ borderColor: '#e2e7f0' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: color + '18' }}>
          {icon}
        </div>
        <span className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{value}</span>
      </div>
      <div className="text-sm font-semibold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{label}</div>
      <div className="text-xs" style={{ color: '#9ca3af' }}>{sub}</div>
    </div>
  )
}

const attendanceData = [
  { day: 'Mon', present: 28, total: 32 },
  { day: 'Tue', present: 30, total: 32 },
  { day: 'Wed', present: 25, total: 32 },
  { day: 'Thu', present: 31, total: 32 },
  { day: 'Fri', present: 26, total: 32 },
]

function AttendanceBar({ day, present, total }: { day: string; present: number; total: number }) {
  const pct = (present / total) * 100
  const color = pct >= 90 ? '#059669' : pct >= 75 ? '#d97706' : '#e11d48'
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-xs font-semibold" style={{ color: '#1a1f36', fontFamily: 'Outfit, sans-serif' }}>{present}</span>
      <div className="w-8 rounded-full overflow-hidden" style={{ height: 80, backgroundColor: '#f0f3fa', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ height: `${pct}%`, backgroundColor: color, borderRadius: '4px 4px 0 0', transition: 'height 0.6s ease' }} />
      </div>
      <span className="text-xs" style={{ color: '#9ca3af' }}>{day}</span>
    </div>
  )
}

const recentStudents = [...students].sort((a, b) => b.id - a.id).slice(0, 5)

export default function Dashboard() {
  const totalAttendance = attendance.length
  const presentCount = attendance.filter(a => a.status === 'present').length
  const absentCount = attendance.filter(a => a.status === 'absent').length
  const lateCount = attendance.filter(a => a.status === 'late').length
  const permCount = attendance.filter(a => a.status === 'permission').length
  const presentRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Dashboard</h1>
        <p className="text-sm" style={{ color: '#9ca3af' }}>Academic Year 2025–2026 overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Students" value={activeStudents} icon="🎓" color="#3b5bdb" sub="Across all departments" />
        <StatCard label="Active Teachers" value={activeTeachers} icon="👨‍🏫" color="#059669" sub="Currently on staff" />
        <StatCard label="Subjects" value={activeSubjects} icon="📚" color="#d97706" sub="Active this year" />
        <StatCard label="Active Classes" value={activeClasses} icon="🏫" color="#7c3aed" sub="Scheduled sessions" />
      </div>

      {/* Middle row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Attendance chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border" style={{ borderColor: '#e2e7f0' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Weekly Attendance</h2>
              <p className="text-xs" style={{ color: '#9ca3af' }}>CS Intro — Section A, this week</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{presentRate}%</div>
              <div className="text-xs" style={{ color: '#9ca3af' }}>avg attendance</div>
            </div>
          </div>
          <div className="flex items-end justify-around gap-2" style={{ height: 120 }}>
            {attendanceData.map(d => <AttendanceBar key={d.day} {...d} />)}
          </div>
        </div>

        {/* Attendance summary */}
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: '#e2e7f0' }}>
          <h2 className="text-sm font-semibold mb-5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Attendance Summary</h2>
          <div className="space-y-3">
            {[
              { label: 'Present', count: presentCount, color: '#059669', bg: '#d1fae5' },
              { label: 'Absent', count: absentCount, color: '#e11d48', bg: '#ffe4e6' },
              { label: 'Late', count: lateCount, color: '#d97706', bg: '#fef3c7' },
              { label: 'Permission', count: permCount, color: '#2563eb', bg: '#dbeafe' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm" style={{ color: '#374151' }}>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 rounded-full" style={{ width: 60, backgroundColor: '#f0f3fa', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${totalAttendance > 0 ? (item.count / totalAttendance) * 100 : 0}%`, backgroundColor: item.color, borderRadius: 9999 }} />
                  </div>
                  <span className="text-sm font-semibold w-4 text-right" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{item.count}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t" style={{ borderColor: '#f0f3fa' }}>
            <div className="flex justify-between text-xs">
              <span style={{ color: '#9ca3af' }}>Total records</span>
              <span className="font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{totalAttendance}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent students */}
        <div className="bg-white rounded-xl border" style={{ borderColor: '#e2e7f0' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#f0f3fa' }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Recent Students</h2>
            <span className="text-xs font-medium" style={{ color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>{activeStudents} active</span>
          </div>
          <div className="divide-y" style={{ borderColor: '#f5f6fa' }}>
            {recentStudents.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-6 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                  {s.firstName[0]}{s.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: '#1a1f36' }}>{s.firstName} {s.lastName}</div>
                  <div className="text-xs truncate" style={{ color: '#9ca3af' }}>{s.code} · {s.email}</div>
                </div>
                <Badge variant={statusVariant(s.status)} dot>{s.status}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-xl border" style={{ borderColor: '#e2e7f0' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: '#f0f3fa' }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Enrollment Overview</h2>
          </div>
          <div className="p-6 space-y-4">
            {classes.filter(c => c.status === 'active').slice(0, 4).map(cls => {
              const enrolled = enrollments.filter(e => e.classId === cls.id && e.status === 'enrolled').length
              const capacity = 15
              const pct = Math.round((enrolled / capacity) * 100)
              return (
                <div key={cls.id}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-medium truncate pr-2" style={{ color: '#374151' }}>{cls.name}</span>
                    <span className="text-xs flex-shrink-0" style={{ color: '#9ca3af' }}>{enrolled}/{capacity}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: '#f0f3fa' }}>
                    <div
                      style={{ height: '100%', width: `${pct}%`, backgroundColor: pct > 80 ? '#e11d48' : '#3b5bdb', borderRadius: 9999, transition: 'width 0.6s ease' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="px-6 pb-5 pt-2 border-t" style={{ borderColor: '#f0f3fa' }}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{enrollments.filter(e => e.status === 'enrolled').length}</div>
                <div className="text-xs" style={{ color: '#9ca3af' }}>Enrolled</div>
              </div>
              <div>
                <div className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{enrollments.filter(e => e.status === 'dropped').length}</div>
                <div className="text-xs" style={{ color: '#9ca3af' }}>Dropped</div>
              </div>
              <div>
                <div className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{enrollments.filter(e => e.status === 'completed').length}</div>
                <div className="text-xs" style={{ color: '#9ca3af' }}>Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
