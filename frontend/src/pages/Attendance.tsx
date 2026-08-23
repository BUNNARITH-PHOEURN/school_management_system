import { useState } from 'react'
import { attendance as initial, students, classes, enrollments, type AttendanceStatus } from '../data/mockData'
import { useToast } from '../context/ToastContext'

const statusConfig: Record<AttendanceStatus, { label: string; color: string; activeBg: string; activeBorder: string }> = {
  present: { label: 'Present', color: '#065f46', activeBg: '#d1fae5', activeBorder: '#6ee7b7' },
  absent: { label: 'Absent', color: '#9f1239', activeBg: '#ffe4e6', activeBorder: '#fca5a5' },
  late: { label: 'Late', color: '#92400e', activeBg: '#fef3c7', activeBorder: '#fcd34d' },
  permission: { label: 'Permission', color: '#1e40af', activeBg: '#dbeafe', activeBorder: '#93c5fd' },
}

export default function Attendance() {
  const { toast } = useToast()
  const [records, setRecords] = useState(initial)
  const [selectedClass, setSelectedClass] = useState(2)
  const [selectedDate, setSelectedDate] = useState('2026-08-16')
  const [saved, setSaved] = useState(false)

  const activeClasses = classes.filter(c => c.status === 'active')
  const enrolledStudentIds = enrollments.filter(e => e.classId === selectedClass && e.status === 'enrolled').map(e => e.studentId)
  const todayRecords = records.filter(r => r.classId === selectedClass && r.date === selectedDate)

  const getRecord = (studentId: number) => todayRecords.find(r => r.studentId === studentId)
  const getStatus = (studentId: number): AttendanceStatus | null => getRecord(studentId)?.status ?? null
  const getRemarks = (studentId: number): string => getRecord(studentId)?.remarks ?? ''

  const setStatus = (studentId: number, status: AttendanceStatus) => {
    setSaved(false)
    setRecords(prev => {
      const existing = prev.find(r => r.studentId === studentId && r.classId === selectedClass && r.date === selectedDate)
      if (existing) return prev.map(r => (r.studentId === studentId && r.classId === selectedClass && r.date === selectedDate) ? { ...r, status } : r)
      return [...prev, { id: Math.max(...prev.map(r => r.id)) + 1, studentId, classId: selectedClass, date: selectedDate, status, remarks: '' }]
    })
  }
  const setRemarks = (studentId: number, remarks: string) => {
    setRecords(prev => prev.map(r => (r.studentId === studentId && r.classId === selectedClass && r.date === selectedDate) ? { ...r, remarks } : r))
  }

  const markAll = (status: AttendanceStatus) => {
    setSaved(false)
    setRecords(prev => {
      const updated = [...prev]
      for (const sid of enrolledStudentIds) {
        const idx = updated.findIndex(r => r.studentId === sid && r.classId === selectedClass && r.date === selectedDate)
        if (idx >= 0) updated[idx] = { ...updated[idx], status }
        else updated.push({ id: Math.max(...updated.map(r => r.id)) + 1, studentId: sid, classId: selectedClass, date: selectedDate, status, remarks: '' })
      }
      return updated
    })
    toast('info', `All students marked as ${status}.`)
  }

  const handleSave = () => {
    setSaved(true)
    toast('success', `Attendance saved for ${selectedDate}.`)
  }

  const countByStatus = (s: AttendanceStatus) => todayRecords.filter(r => r.status === s).length
  const marked = todayRecords.length
  const presentRate = enrolledStudentIds.length > 0 ? Math.round((countByStatus('present') / enrolledStudentIds.length) * 100) : 0

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Attendance</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>Record daily attendance by class</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs px-3 py-2 rounded-lg font-medium" style={{ backgroundColor: '#d1fae5', color: '#065f46', fontFamily: 'Outfit, sans-serif' }}>
              ✓ Attendance saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={marked === 0}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}
          >
            Save Attendance
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-4 items-end" style={{ borderColor: '#e2e7f0' }}>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b7280' }}>Class</label>
          <select value={selectedClass} onChange={e => { setSelectedClass(Number(e.target.value)); setSaved(false) }}
            className="px-3 py-2 rounded-lg border text-sm outline-none min-w-56" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
            {activeClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b7280' }}>Date</label>
          <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSaved(false) }}
            className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs" style={{ color: '#9ca3af' }}>Quick mark:</span>
          {(['present', 'absent'] as AttendanceStatus[]).map(s => (
            <button key={s} onClick={() => markAll(s)} className="px-3 py-2 text-xs font-semibold rounded-lg border transition-all" style={{ borderColor: statusConfig[s].activeBorder, color: statusConfig[s].color, backgroundColor: statusConfig[s].activeBg }}>
              All {statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(statusConfig) as [AttendanceStatus, typeof statusConfig[AttendanceStatus]][]).map(([key, cfg]) => (
          <div key={key} className="bg-white rounded-xl border p-4" style={{ borderColor: '#e2e7f0' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: cfg.color }}>{countByStatus(key)}</div>
                <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{cfg.label}</div>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: cfg.activeBg }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Student attendance grid */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
        <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: '#f0f3fa', backgroundColor: '#f8f9fd' }}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>
              Students ({enrolledStudentIds.length})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full" style={{ backgroundColor: '#f0f3fa' }}>
                <div style={{ height: '100%', width: `${presentRate}%`, backgroundColor: '#059669', borderRadius: 9999 }} />
              </div>
              <span className="text-xs font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#059669' }}>{presentRate}% present</span>
            </div>
            <span className="text-xs" style={{ color: '#9ca3af' }}>{marked}/{enrolledStudentIds.length} marked</span>
          </div>
        </div>

        {enrolledStudentIds.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#9ca3af' }}>
            <div className="text-3xl mb-2">📋</div>
            <div className="font-medium" style={{ fontFamily: 'Outfit, sans-serif' }}>No enrolled students for this class</div>
            <div className="text-xs mt-1">Select a different class or enroll students first.</div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#f5f6fa' }}>
            {enrolledStudentIds.map(sid => {
              const student = students.find(s => s.id === sid)
              if (!student) return null
              const currentStatus = getStatus(sid)
              return (
                <div key={sid} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  {/* Student info */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <div className="w-44 flex-shrink-0">
                    <div className="text-sm font-medium" style={{ color: '#1a1f36' }}>{student.firstName} {student.lastName}</div>
                    <div className="text-xs" style={{ color: '#9ca3af' }}>{student.code}</div>
                  </div>

                  {/* Status buttons */}
                  <div className="flex gap-2 flex-1 flex-wrap">
                    {(Object.keys(statusConfig) as AttendanceStatus[]).map(s => {
                      const active = currentStatus === s
                      const cfg = statusConfig[s]
                      return (
                        <button
                          key={s}
                          onClick={() => setStatus(sid, s)}
                          className="flex-1 min-w-16 py-1.5 text-xs font-semibold rounded-lg border transition-all"
                          style={{
                            backgroundColor: active ? cfg.activeBg : '#f9fafb',
                            color: active ? cfg.color : '#9ca3af',
                            borderColor: active ? cfg.activeBorder : '#e2e7f0',
                            fontFamily: 'Outfit, sans-serif',
                          }}
                        >
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Remarks */}
                  <input
                    value={getRemarks(sid)}
                    onChange={e => setRemarks(sid, e.target.value)}
                    placeholder="Remarks…"
                    className="hidden sm:block w-32 px-2.5 py-1.5 text-xs rounded-lg border outline-none transition-colors flex-shrink-0"
                    style={{ borderColor: '#e2e7f0', color: '#374151' }}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
