import { useEffect, useState } from 'react'
import { listClasses, type Class } from '../api/classes'
import { listStudents, type Student } from '../api/students'
import { listAttendance, type AttendanceStatus, type AttendanceWithNames } from '../api/attendance'
import { useToast } from '../context/ToastContext'

const statusColors: Record<AttendanceStatus, { bg: string; color: string }> = {
  present: { bg: '#d1fae5', color: '#065f46' },
  absent: { bg: '#ffe4e6', color: '#9f1239' },
  late: { bg: '#fef3c7', color: '#92400e' },
  permission: { bg: '#dbeafe', color: '#1e40af' },
}

export default function Reports() {
  const { toast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<AttendanceWithNames[]>([])
  const [loading, setLoading] = useState(true)
  const [filterClass, setFilterClass] = useState<number | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | 'all'>('all')

  useEffect(() => {
    (async () => {
      try {
        const [classRows, studentRows, attendanceRows] = await Promise.all([
          listClasses(),
          listStudents(),
          listAttendance(),
        ])
        setClasses(classRows)
        setStudents(studentRows)
        setAttendance(attendanceRows)
      } catch (err) {
        toast('error', err instanceof Error ? err.message : 'Failed to load data.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const activeClasses = classes.filter(c => c.status === 'active')

  const filtered = attendance.filter(r =>
    (filterClass === 'all' || r.classId === filterClass) &&
    (filterStatus === 'all' || r.status === filterStatus)
  )

  // Per-student summary
  const studentSummary = students.filter(s => s.status === 'active').map(s => {
    const records = attendance.filter(r => r.studentId === s.id && (filterClass === 'all' || r.classId === filterClass))
    const present = records.filter(r => r.status === 'present').length
    const absent = records.filter(r => r.status === 'absent').length
    const late = records.filter(r => r.status === 'late').length
    const permission = records.filter(r => r.status === 'permission').length
    const total = records.length
    const rate = total > 0 ? Math.round((present / total) * 100) : null
    return { ...s, present, absent, late, permission, total, rate }
  }).filter(s => s.total > 0)

  const totalPresent = filtered.filter(r => r.status === 'present').length
  const totalAbsent = filtered.filter(r => r.status === 'absent').length
  const totalLate = filtered.filter(r => r.status === 'late').length
  const totalPermission = filtered.filter(r => r.status === 'permission').length
  const overallRate = filtered.length > 0 ? Math.round((totalPresent / filtered.length) * 100) : 0

  if (loading) {
    return <div className="p-6" style={{ color: '#9ca3af', fontFamily: 'Outfit, sans-serif' }}>Loading reports…</div>
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Reports</h1>
        <p className="text-sm" style={{ color: '#9ca3af' }}>Attendance analysis and summary</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overall Rate', value: `${overallRate}%`, sub: 'Attendance rate', color: '#3b5bdb', bg: '#eff2ff' },
          { label: 'Present', value: totalPresent, sub: 'Total records', color: '#059669', bg: '#d1fae5' },
          { label: 'Absent', value: totalAbsent, sub: 'Total records', color: '#e11d48', bg: '#ffe4e6' },
          { label: 'Late / Permission', value: totalLate + totalPermission, sub: 'Combined', color: '#d97706', bg: '#fef3c7' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e7f0' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: item.bg }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            </div>
            <div className="text-2xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{item.value}</div>
            <div className="text-xs" style={{ color: '#9ca3af' }}>{item.label} · {item.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3" style={{ borderColor: '#e2e7f0' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: '#6b7280' }}>Class:</span>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
            <option value="all">All Classes</option>
            {activeClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: '#6b7280' }}>Status:</span>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as AttendanceStatus | 'all')} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
            <option value="all">All</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="permission">Permission</option>
          </select>
        </div>
        <span className="ml-auto text-xs self-center" style={{ color: '#9ca3af' }}>{filtered.length} records</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Attendance log table */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#f0f3fa', backgroundColor: '#f8f9fd' }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Attendance Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #f0f3fa' }}>
                  {['Student', 'Class', 'Date', 'Status', 'Remarks'].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10" style={{ color: '#9ca3af' }}>No records</td></tr>
                ) : filtered.slice(0, 20).map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: '#f5f6fa' }}>
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: '#1a1f36' }}>{r.studentName}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: '#6b7280' }}>{r.className}</td>
                    <td className="px-4 py-2.5 text-xs font-mono" style={{ color: '#6b7280' }}>{r.date}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: statusColors[r.status].bg, color: statusColors[r.status].color, fontFamily: 'Outfit, sans-serif' }}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: '#9ca3af' }}>{r.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-student summary */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#f0f3fa', backgroundColor: '#f8f9fd' }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Student Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #f0f3fa' }}>
                  {['Student', 'P', 'A', 'L', 'Perm', 'Rate'].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentSummary.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10" style={{ color: '#9ca3af' }}>No data</td></tr>
                ) : studentSummary.map(s => (
                  <tr key={s.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: '#f5f6fa' }}>
                    <td className="px-4 py-2.5">
                      <div className="text-xs font-medium" style={{ color: '#1a1f36' }}>{s.firstName} {s.lastName}</div>
                      <div className="text-xs" style={{ color: '#9ca3af' }}>{s.code}</div>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: '#059669' }}>{s.present}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: '#e11d48' }}>{s.absent}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: '#d97706' }}>{s.late}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: '#2563eb' }}>{s.permission}</td>
                    <td className="px-4 py-2.5">
                      {s.rate !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: '#f0f3fa' }}>
                            <div style={{ height: '100%', width: `${s.rate}%`, backgroundColor: s.rate >= 80 ? '#059669' : s.rate >= 60 ? '#d97706' : '#e11d48', borderRadius: 9999 }} />
                          </div>
                          <span className="text-xs font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: s.rate >= 80 ? '#059669' : s.rate >= 60 ? '#d97706' : '#e11d48' }}>{s.rate}%</span>
                        </div>
                      ) : <span style={{ color: '#9ca3af' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}