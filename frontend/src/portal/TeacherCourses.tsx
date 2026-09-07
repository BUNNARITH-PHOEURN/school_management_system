import { useEffect, useMemo, useState } from 'react'
import type { SessionUser } from '../api/auth'
import { listMyClasses, type Class } from '../api/classes'
import { listSubjects, type Subject } from '../api/subjects'
import { listEnrollments, type EnrollmentWithNames } from '../api/enrollments'
import { listAttendance, type AttendanceWithNames, type AttendanceStatus } from '../api/attendance'
import { listTeachers, type Teacher } from '../api/teachers'
import Badge from '../components/Badge'
import Modal from '../components/Modal'

interface TeacherCoursesProps {
  session: SessionUser
}

const ATTENDANCE_COLORS: Record<AttendanceStatus, { bg: string; fg: string; label: string }> = {
  present: { bg: '#d1fae5', fg: '#065f46', label: 'Present' },
  absent: { bg: '#ffe4e6', fg: '#9f1239', label: 'Absent' },
  late: { bg: '#fef3c7', fg: '#92400e', label: 'Late' },
  permission: { bg: '#dbe4ff', fg: '#3451c7', label: 'Permission' },
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

function formatTime(value: string): string {
  return value ? value.slice(0, 5) : ''
}

export default function TeacherCourses({ session }: TeacherCoursesProps) {
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentWithNames[]>([])
  const [attendance, setAttendance] = useState<AttendanceWithNames[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [attendanceView, setAttendanceView] = useState<{ student: EnrollmentWithNames; className: string } | null>(null)

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

  const subjectName = (id: number) => subjects.find(s => s.id === id)?.name ?? 'Subject'
  const subjectCode = (id: number) => subjects.find(s => s.id === id)?.code ?? ''

  const courses = useMemo(() => {
    const roster = (classId: number) => enrollments.filter(e => e.classId === classId && e.status === 'approved')
    return classes.map(cls => {
      const students = roster(cls.id)
      const present = attendance.filter(a => a.classId === cls.id && a.status === 'present').length
      const total = attendance.filter(a => a.classId === cls.id).length
      const rate = total > 0 ? Math.round((present / total) * 100) : 0
      return { cls, students, present, total, rate }
    }).filter(c =>
      `${c.cls.name} ${subjectName(c.cls.subjectId)}`.toLowerCase().includes(search.toLowerCase()),
    )
  }, [classes, enrollments, attendance, subjects, search])

  const filteredStudents = useMemo(() => {
    if (!attendanceView) return []
    const studentId = attendanceView.student.studentId
    return attendance
      .filter(r => r.studentId === studentId && r.classId === attendanceView.student.classId)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [attendance, attendanceView])

  const attendanceSummary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, permission: 0 }
    for (const r of filteredStudents) counts[r.status]++
    const total = filteredStudents.length
    const rate = total > 0 ? Math.round((counts.present / total) * 100) : 0
    return { ...counts, total, rate }
  }, [filteredStudents])

  const myTeacher = teachers.find(t => t.id === session.teacherId)

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>My Courses</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>
            {classes.length} class{classes.length === 1 ? '' : 'es'} · {myTeacher ? myTeacher.specialization : 'Teacher'} department
          </p>
        </div>
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your courses…" className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0' }} />
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-xl border h-48 animate-pulse" style={{ borderColor: '#e2e7f0', backgroundColor: '#f8f9fd' }} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border py-14 text-center" style={{ borderColor: '#e2e7f0' }}>
          <div className="text-3xl mb-3">🏫</div>
          <p className="text-sm font-medium" style={{ color: '#374151' }}>{classes.length === 0 ? 'No courses assigned to you yet' : 'No courses match your search'}</p>
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Courses you teach will appear here with their students.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {courses.map(({ cls, students, present, total, rate }) => (
            <div key={cls.id} className="bg-white rounded-xl border overflow-hidden flex flex-col" style={{ borderColor: '#e2e7f0' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: '#f0f3fa' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{cls.name}</div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: '#9ca3af' }}>
                      {subjectCode(cls.subjectId)} · {cls.day}{cls.startTime ? ` · ${formatTime(cls.startTime)}–${formatTime(cls.endTime)}` : ''}
                    </div>
                  </div>
                  <Badge variant={cls.status === 'active' ? 'success' : 'neutral'}>{cls.status}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: '#6b7280' }}>
                  <span>{cls.room || 'Room TBD'}</span>
                  <span>{students.length} students</span>
                  <span>{total} attendance records</span>
                </div>
              </div>

              <div className="flex-1">
                <div className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>
                  Students ({students.length})
                </div>
                {students.length === 0 ? (
                  <div className="px-5 pb-4 text-sm" style={{ color: '#9ca3af' }}>No approved students in this class yet.</div>
                ) : (
                  <div className="max-h-52 overflow-y-auto divide-y" style={{ borderColor: '#f0f3fa' }}>
                    {students.map(e => {
                      const recs = attendance.filter(r => r.studentId === e.studentId && r.classId === cls.id)
                      const p = recs.filter(r => r.status === 'present').length
                      const studentRate = recs.length > 0 ? Math.round((p / recs.length) * 100) : null
                      return (
                        <div key={e.id} className="flex items-center gap-3 px-5 py-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                            {initials(e.studentName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate" style={{ color: '#1a1f36' }}>{e.studentName}</div>
                            <div className="text-xs truncate" style={{ color: '#9ca3af' }}>{e.studentCode}</div>
                          </div>
                          {studentRate !== null && (
                            <span className="text-xs font-semibold flex-shrink-0" style={{ color: studentRate >= 80 ? '#059669' : studentRate >= 60 ? '#d97706' : '#e11d48' }}>
                              {studentRate}%
                            </span>
                          )}
                          <button onClick={() => setAttendanceView({ student: e, className: cls.name })} className="px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex-shrink-0"
                            style={{ borderColor: '#c7d2fe', color: '#3451c7', backgroundColor: '#f5f7ff', fontFamily: 'Outfit, sans-serif' }}>
                            Attendance
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: '#f0f3fa' }}>
                <span className="text-xs" style={{ color: '#9ca3af' }}>Class attendance rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#e5e7eb' }}>
                    <div className="h-full rounded-full" style={{ width: `${rate}%`, backgroundColor: rate >= 80 ? '#059669' : rate >= 60 ? '#d97706' : '#e11d48' }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: '#1a1f36' }}>{rate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Per-student attendance modal */}
      <Modal
        open={attendanceView !== null}
        onClose={() => setAttendanceView(null)}
        title="Student Attendance"
        width={640}
        footer={
          <button onClick={() => setAttendanceView(null)} className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-gray-50"
            style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>
            Close
          </button>
        }
      >
        {attendanceView && (
          <>
            <div className="flex items-center gap-4 mb-5 pb-5 border-b" style={{ borderColor: '#f0f3fa' }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                {initials(attendanceView.student.studentName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{attendanceView.student.studentName}</div>
                <div className="text-xs truncate" style={{ color: '#9ca3af' }}>{attendanceView.student.studentCode} · {attendanceView.className}</div>
              </div>
              <Badge variant={attendanceSummary.total > 0 ? 'primary' : 'neutral'}>{attendanceSummary.rate}% rate</Badge>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-5">
              {(['present', 'absent', 'late', 'permission'] as AttendanceStatus[]).map(status => (
                <div key={status} className="rounded-lg border px-3 py-2.5 text-center" style={{ borderColor: '#e2e7f0' }}>
                  <div className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: ATTENDANCE_COLORS[status].fg }}>{attendanceSummary[status]}</div>
                  <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: '#9ca3af' }}>{ATTENDANCE_COLORS[status].label}</div>
                </div>
              ))}
            </div>

            {filteredStudents.length === 0 ? (
              <div className="rounded-lg border px-4 py-10 text-center text-sm" style={{ borderColor: '#e2e7f0', color: '#9ca3af', backgroundColor: '#fafbfd' }}>
                No attendance records for this student in this class.
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
                <div className="max-h-64 overflow-y-auto divide-y" style={{ borderColor: '#f0f3fa' }}>
                  {filteredStudents.map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="text-sm font-medium" style={{ color: '#1a1f36' }}>{r.date}</div>
                      {r.remarks && <div className="text-xs truncate flex-1 text-right" style={{ color: '#9ca3af' }}>{r.remarks}</div>}
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: ATTENDANCE_COLORS[r.status].bg, color: ATTENDANCE_COLORS[r.status].fg, fontFamily: 'Outfit, sans-serif' }}>
                        {ATTENDANCE_COLORS[r.status].label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}