import { useEffect, useMemo, useState } from 'react'
import { listAcademicYears, type AcademicYear } from '../api/academicYears'
import { listTeachers, type Teacher } from '../api/teachers'
import { listSubjects, type Subject } from '../api/subjects'
import { createClass, listClasses, updateClass, type Class } from '../api/classes'
import { listEnrollments, type EnrollmentWithNames } from '../api/enrollments'
import { listAttendance, type AttendanceWithNames, type AttendanceStatus } from '../api/attendance'
import Badge, { statusVariant } from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle } from '../components/Modal'
import ViewToggle from '../components/ViewToggle'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 8

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

function parseDayList(day: string): string[] {
  return day.split('/').map(d => d.trim()).filter(Boolean)
}

function timeToMinutes(value: string): number {
  if (!value) return 0
  const [h, m] = value.slice(0, 5).split(':').map(Number)
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
}

function schedulesOverlap(aDay: string, aStart: string, aEnd: string, bDay: string, bStart: string, bEnd: string): boolean {
  const aDays = parseDayList(aDay)
  const bDays = parseDayList(bDay)
  if (!aDays.length || !bDays.length) return false
  const shareDay = aDays.some(d => bDays.includes(d))
  return shareDay && timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd)
}

const ATTENDANCE_COLORS: Record<AttendanceStatus, { bg: string; fg: string; label: string }> = {
  present: { bg: '#d1fae5', fg: '#065f46', label: 'Present' },
  absent: { bg: '#ffe4e6', fg: '#9f1239', label: 'Absent' },
  late: { bg: '#fef3c7', fg: '#92400e', label: 'Late' },
  permission: { bg: '#dbe4ff', fg: '#3451c7', label: 'Permission' },
}

export default function Classes() {
  const [data, setData] = useState<Class[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentWithNames[]>([])
  const [attendance, setAttendance] = useState<AttendanceWithNames[]>([])
  const [attendanceView, setAttendanceView] = useState<EnrollmentWithNames | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [view, setView] = useState<'card' | 'table'>('card')
  const [modalOpen, setModalOpen] = useState(false)
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false)
  const [teacherSearch, setTeacherSearch] = useState('')
  const [editing, setEditing] = useState<Class | null>(null)
  const [form, setForm] = useState({ name: '', academicYearId: 0, subjectId: 0, room: '', day: '', startTime: '', endTime: '', teacherIds: [] as number[] })

  const toggleTeacher = (id: number) =>
    setForm(f => ({ ...f, teacherIds: f.teacherIds.includes(id) ? f.teacherIds.filter(tid => tid !== id) : [...f.teacherIds, id] }))
  const closeModal = () => { setModalOpen(false); setTeacherDropdownOpen(false); setTeacherSearch('') }

  const activeTeachers = useMemo(() => teachers.filter(teacher => teacher.status === 'active'), [teachers])
  const teacherOptions = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase()
    const list = q ? activeTeachers.filter(t => `${t.firstName} ${t.lastName} ${t.specialization} ${t.code}`.toLowerCase().includes(q)) : activeTeachers
    const selected = list.filter(t => form.teacherIds.includes(t.id))
    const rest = list.filter(t => !form.teacherIds.includes(t.id))
    return [...selected, ...rest]
  }, [activeTeachers, teacherSearch, form.teacherIds])

  // For each selected teacher, find other classes that clash with this class's schedule.
  const teacherConflicts = useMemo(() => {
    if (!form.day || !form.startTime || !form.endTime || form.teacherIds.length === 0) return []
    const otherClasses = data.filter(c => c.id !== editing?.id)
    const out: { teacherId: number; teacherName: string; cls: Class }[] = []
    for (const teacherId of form.teacherIds) {
      const teacher = teachers.find(t => t.id === teacherId)
      for (const cls of otherClasses) {
        if (!cls.teacherIds.includes(teacherId)) continue
        if (schedulesOverlap(form.day, form.startTime, form.endTime, cls.day, cls.startTime, cls.endTime)) {
          out.push({ teacherId, teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : `Teacher #${teacherId}`, cls })
        }
      }
    }
    return out
  }, [form.day, form.startTime, form.endTime, form.teacherIds, data, editing, teachers])

  const subjectName = (id: number) => subjects.find(subject => subject.id === id)?.name ?? 'Unknown subject'
  const academicYearName = (id: number) => academicYears.find(year => year.id === id)?.name ?? 'Unknown academic year'
  const teacherName = (id: number) => {
    const teacher = teachers.find(item => item.id === id)
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unassigned'
  }

  // Students currently approved into the class being edited
  const classStudents = useMemo(() => {
    if (!editing) return []
    return enrollments.filter(e => e.classId === editing.id && e.status === 'approved')
  }, [enrollments, editing])
  const assignedTeachers = useMemo(() => {
    if (!editing) return []
    return editing.teacherIds.map(id => teachers.find(t => t.id === id)).filter(Boolean) as Teacher[]
  }, [editing, teachers])

  // Attendance records for the student/class pair currently being inspected
  const attendanceRecords = useMemo(() => {
    if (!attendanceView) return []
    return attendance
      .filter(r => r.studentId === attendanceView.studentId && r.classId === attendanceView.classId)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [attendance, attendanceView])

  const attendanceSummary = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, permission: 0 } as Record<AttendanceStatus, number>
    for (const r of attendanceRecords) counts[r.status]++
    const total = attendanceRecords.length
    const rate = total > 0 ? Math.round((counts.present / total) * 100) : 0
    return { ...counts, total, rate }
  }, [attendanceRecords])

  const filtered = data.filter(c =>
    (filterStatus === 'all' || c.status === filterStatus) &&
    `${c.name} ${c.room} ${subjectName(c.subjectId)}`.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const displayData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const openCreate = () => {
    setEditing(null)
    setForm({
      name: '',
      academicYearId: academicYears.find(year => year.status === 'active')?.id ?? academicYears[0]?.id ?? 0,
      subjectId: subjects.find(subject => subject.status === 'active')?.id ?? subjects[0]?.id ?? 0,
      room: '', day: '', startTime: '08:00', endTime: '09:30',
      teacherIds: teachers.filter(teacher => teacher.status === 'active').slice(0, 1).map(teacher => teacher.id),
    })
    setTeacherDropdownOpen(false)
    setTeacherSearch('')
    setModalOpen(true)
  }
  const openEdit = (c: Class) => { setEditing(c); setForm({ name: c.name, academicYearId: c.academicYearId, subjectId: c.subjectId, room: c.room, day: c.day, startTime: c.startTime, endTime: c.endTime, teacherIds: c.teacherIds }); setTeacherDropdownOpen(false); setTeacherSearch(''); setModalOpen(true) }
  useEffect(() => {
    Promise.all([listClasses(), listAcademicYears(), listSubjects(), listTeachers(), listEnrollments(), listAttendance()])
      .then(([classes, years, subjectRows, teacherRows, enrollmentRows, attendanceRows]) => {
        setData(classes)
        setAcademicYears(years)
        setSubjects(subjectRows)
        setTeachers(teacherRows)
        setEnrollments(enrollmentRows)
        setAttendance(attendanceRows)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to load classes'))
  }, [])
  const handleSave = async () => {
    if (teacherConflicts.length > 0) {
      const names = [...new Set(teacherConflicts.map(c => c.teacherName))].join(', ')
      setError(`Cannot save: schedule conflict — ${names} already teach another class at this time.`)
      return
    }
    try {
      const payload = { ...form, status: editing?.status ?? 'active' as const }
      const saved = editing ? await updateClass(editing.id, payload) : await createClass(payload)
      setData(prev => editing ? prev.map(c => c.id === saved.id ? saved : c) : [...prev, saved])
      closeModal()
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save class') }
  }
  const toggleStatus = async (id: number) => {
    const current = data.find(c => c.id === id)
    if (!current) return
    try {
      const saved = await updateClass(id, { status: current.status === 'active' ? 'inactive' : 'active' })
      setData(prev => prev.map(c => c.id === id ? saved : c))
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update class') }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Classes</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>{data.filter(c => c.status === 'active').length} active classes this year</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>+ Add Class</button>
      </div>

      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3" style={{ borderColor: '#e2e7f0' }}>
        <div className="relative flex-1 min-w-40">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search classes…" className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0' }} />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as 'all' | 'active' | 'inactive'); setPage(1) }} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {error && <div className="col-span-2 rounded-lg p-3 text-sm" style={{ backgroundColor: '#fff1f2', color: '#9f1239' }}>{error}</div>}
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-16" style={{ color: '#9ca3af' }}>
            <div className="text-3xl mb-2">📅</div>
            <div style={{ fontFamily: 'Outfit, sans-serif' }}>No classes found</div>
          </div>
        ) : view === 'card' ? displayData.map(cls => (
          <div key={cls.id} className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e7f0' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{cls.name}</div>
              <Badge variant={statusVariant(cls.status)} dot>{cls.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Subject', val: subjectName(cls.subjectId) },
                { label: 'Academic Year', val: academicYearName(cls.academicYearId) },
                { label: 'Room', val: cls.room },
                { label: 'Schedule', val: cls.day },
                { label: 'Time', val: `${cls.startTime} – ${cls.endTime}` },
                { label: 'Teachers', val: cls.teacherIds.map(teacherName).join(', ') || 'Unassigned' },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div className="text-xs mb-0.5" style={{ color: '#9ca3af' }}>{label}</div>
                  <div className="text-sm font-medium" style={{ color: '#374151' }}>{val}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-3 border-t" style={{ borderColor: '#f0f3fa' }}>
              <button onClick={() => openEdit(cls)} className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50" style={{ borderColor: '#e2e7f0', color: '#374151' }}>Edit</button>
              <button onClick={() => toggleStatus(cls.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border" style={{ borderColor: cls.status === 'active' ? '#fca5a5' : '#e2e7f0', color: cls.status === 'active' ? '#e11d48' : '#059669' }}>
                {cls.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-2 bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f8f9fd', borderBottom: '1px solid #e2e7f0' }}>
                  {['Class', 'Subject', 'Academic Year', 'Room', 'Time', 'Teachers', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayData.map(cls => (
                  <tr key={cls.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: '#f0f3fa' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: '#1a1f36' }}>{cls.name}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#374151' }}>{subjectName(cls.subjectId)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>{academicYearName(cls.academicYearId)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>{cls.room}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>{cls.day}{cls.startTime ? ` ${cls.startTime} – ${cls.endTime}` : ''}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>{cls.teacherIds.map(teacherName).join(', ') || 'Unassigned'}</td>
                    <td className="px-4 py-3"><Badge variant={statusVariant(cls.status)} dot>{cls.status}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(cls)} className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50" style={{ borderColor: '#e2e7f0', color: '#374151' }}>Edit</button>
                        <button onClick={() => toggleStatus(cls.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border" style={{ borderColor: cls.status === 'active' ? '#fca5a5' : '#e2e7f0', color: cls.status === 'active' ? '#e11d48' : '#059669' }}>
                          {cls.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={safePage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      <Modal open={modalOpen} onClose={() => closeModal()} title={editing ? 'Edit Class' : 'Add Class'} width={880}
        footer={
          <>
            <button onClick={() => closeModal()} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>{editing ? 'Save' : 'Add Class'}</button>
          </>
        }
      >
        <FormField label="Class Name" required><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} style={inputStyle} placeholder="e.g. Algebra I — Section A" /></FormField>
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Academic Year"><select value={form.academicYearId || ''} onChange={e => setForm(f => ({ ...f, academicYearId: Number(e.target.value) }))} className={inputClass} style={inputStyle}>
            <option value="">Select academic year</option>
            {academicYears.map(year => <option key={year.id} value={year.id}>{year.name} {year.status === 'active' ? '(Active)' : ''}</option>)}
          </select></FormField>
          <FormField label="Subject"><select value={form.subjectId || ''} onChange={e => setForm(f => ({ ...f, subjectId: Number(e.target.value) }))} className={inputClass} style={inputStyle}>
            <option value="">Select subject</option>
            {subjects.filter(subject => subject.status === 'active').map(subject => <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>)}
          </select></FormField>
        </div>
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Room"><input value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
          <FormField label="Day(s)"><input value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))} className={inputClass} style={inputStyle} placeholder="e.g. Monday / Wednesday" /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Start Time"><input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
          <FormField label="End Time"><input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Assign Teacher(s)</label>
          {form.teacherIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.teacherIds.map(id => {
                const teacher = teachers.find(t => t.id === id)
                if (!teacher) return null
                return (
                  <span key={id} className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                    {teacher.firstName} {teacher.lastName}
                    <button type="button" onClick={() => toggleTeacher(id)} className="hover:text-red-500 transition-colors" aria-label={`Remove ${teacher.firstName}`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </span>
                )
              })}
            </div>
          )}
          {teacherConflicts.length > 0 && (
            <div className="rounded-lg border p-3 mb-2 space-y-2" style={{ borderColor: '#fecaca', backgroundColor: '#fff5f5' }}>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <span className="text-xs font-semibold" style={{ color: '#9f1239', fontFamily: 'Outfit, sans-serif' }}>
                  Schedule conflict detected
                </span>
              </div>
              {teacherConflicts.map(({ teacherId, teacherName, cls }) => (
                <div key={teacherId + '-' + cls.id} className="text-xs" style={{ color: '#6b7280' }}>
                  <strong style={{ color: '#9f1239' }}>{teacherName}</strong> already teaches{' '}
                  <strong style={{ color: '#1a1f36' }}>{cls.name}</strong> on{' '}
                  <span style={{ color: '#374151' }}>{cls.day} · {cls.startTime.slice(0, 5)}–{cls.endTime.slice(0, 5)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="relative">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                value={teacherSearch}
                onChange={e => { setTeacherSearch(e.target.value); setTeacherDropdownOpen(true) }}
                onFocus={() => setTeacherDropdownOpen(true)}
                placeholder="Search teacher…"
                className={inputClass}
                style={{ ...inputStyle, paddingLeft: '2.25rem' }}
              />
            </div>
            {teacherDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setTeacherDropdownOpen(false)} />
                <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border shadow-lg overflow-hidden" style={{ borderColor: '#e2e7f0', boxShadow: '0 12px 35px rgba(15,23,42,0.12)' }}>
                  {teacherOptions.length === 0 ? (
                    <div className="px-3 py-3 text-sm" style={{ color: '#9ca3af' }}>No teachers match “{teacherSearch}”</div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto divide-y" style={{ borderColor: '#f5f6fa' }}>
                      {teacherOptions.map(teacher => {
                        const checked = form.teacherIds.includes(teacher.id)
                        const clashes = form.day && form.startTime && form.endTime
                          ? data
                            .filter(c => c.id !== editing?.id && c.teacherIds.includes(teacher.id))
                            .some(c => schedulesOverlap(form.day, form.startTime, form.endTime, c.day, c.startTime, c.endTime))
                          : false
                        return (
                          <label key={teacher.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors" style={{ color: '#374151' }}>
                            <input type="checkbox" checked={checked} onChange={() => { toggleTeacher(teacher.id); setTeacherSearch('') }} className="rounded accent-[#3b5bdb]" />
                            <span className="text-sm font-medium" style={{ color: '#1a1f36' }}>{teacher.firstName} {teacher.lastName}</span>
                            {clashes && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: '#ffe4e6', color: '#9f1239', fontFamily: 'Outfit, sans-serif' }}>
                                Schedule clash
                              </span>
                            )}
                            <span className="text-xs ml-auto truncate" style={{ color: '#9ca3af' }}>{teacher.specialization}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {editing && (
          <div className="grid lg:grid-cols-2 gap-6 mt-2">
            {/* Teachers in this class */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>
                  Teachers in this class
                </div>
                <Badge variant="primary">{assignedTeachers.length}</Badge>
              </div>
              {assignedTeachers.length === 0 ? (
                <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: '#e2e7f0', color: '#9ca3af', backgroundColor: '#fafbfd' }}>
                  No teachers assigned.
                </div>
              ) : (
                <div className="rounded-lg border divide-y" style={{ borderColor: '#e2e7f0' }}>
                  {assignedTeachers.map(teacher => (
                    <div key={teacher.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                        {initials(`${teacher.firstName} ${teacher.lastName}`)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate" style={{ color: '#1a1f36' }}>{teacher.firstName} {teacher.lastName}</div>
                        <div className="text-xs truncate" style={{ color: '#9ca3af' }}>{teacher.specialization || teacher.code}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Students in this class */}
            <div className="lg:border-l lg:pl-6" style={{ borderColor: '#f0f3fa' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>
                  Students in this class
                </div>
                <Badge variant="primary">{classStudents.length} enrolled</Badge>
              </div>
              {classStudents.length === 0 ? (
                <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: '#e2e7f0', color: '#9ca3af', backgroundColor: '#fafbfd' }}>
                  No approved students in this class yet.
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
                  <div className="max-h-44 overflow-y-auto divide-y" style={{ borderColor: '#f0f3fa' }}>
                    {classStudents.map(e => (
                      <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                          {initials(e.studentName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate" style={{ color: '#1a1f36' }}>{e.studentName}</div>
                          <div className="text-xs truncate" style={{ color: '#9ca3af' }}>{e.studentCode}</div>
                        </div>
                        <button onClick={() => setAttendanceView(e)} className="px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex-shrink-0"
                          style={{ borderColor: '#c7d2fe', color: '#3451c7', backgroundColor: '#f5f7ff', fontFamily: 'Outfit, sans-serif' }}>
                          Attendance
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Attendance view for a student in the class */}
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
                {initials(attendanceView.studentName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{attendanceView.studentName}</div>
                <div className="text-xs truncate" style={{ color: '#9ca3af' }}>{attendanceView.studentCode} · {attendanceView.className || editing?.name}</div>
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

            {attendanceRecords.length === 0 ? (
              <div className="rounded-lg border px-4 py-10 text-center text-sm" style={{ borderColor: '#e2e7f0', color: '#9ca3af', backgroundColor: '#fafbfd' }}>
                No attendance records for this student in this class.
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
                <div className="max-h-64 overflow-y-auto divide-y" style={{ borderColor: '#f0f3fa' }}>
                  {attendanceRecords.map(r => (
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
