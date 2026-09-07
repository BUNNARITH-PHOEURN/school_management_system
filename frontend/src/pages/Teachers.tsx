import { useEffect, useState } from 'react'
import { getDepartmentName, type Status } from '../data/mockData'
import { createTeacher, listTeachers, listTeachersPage, updateTeacher, type Teacher } from '../api/teachers'
import { listDepartments, type DepartmentRecord } from '../api/departments'
import { listUsers, type UserRecord } from '../api/users'
import { listClasses, type Class } from '../api/classes'
import { listSubjects, type Subject } from '../api/subjects'
import { listEnrollments, type EnrollmentWithNames } from '../api/enrollments'
import { listAttendance, type AttendanceWithNames, type AttendanceStatus } from '../api/attendance'
import Badge, { statusVariant } from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle, ConfirmDialog } from '../components/Modal'
import Autocomplete, { type AutocompleteOption } from '../components/Autocomplete'
import Pagination from '../components/Pagination'
import { SkeletonTable, EmptyState } from '../components/Skeleton'
import { useToast } from '../context/ToastContext'
import ScheduleGrid, { type ScheduleSlot } from '../portal/ScheduleGrid'

const PAGE_SIZE = 7

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

const ATTENDANCE_COLORS: Record<AttendanceStatus, { bg: string; fg: string; label: string }> = {
  present: { bg: '#d1fae5', fg: '#065f46', label: 'Present' },
  absent: { bg: '#ffe4e6', fg: '#9f1239', label: 'Absent' },
  late: { bg: '#fef3c7', fg: '#92400e', label: 'Late' },
  permission: { bg: '#dbe4ff', fg: '#3451c7', label: 'Permission' },
}

export default function Teachers() {
  const { toast } = useToast()
  const [data, setData] = useState<Teacher[]>([])
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [users, setUsers] = useState<UserRecord[]>([])
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | Status>('all')
  const [filterDept, setFilterDept] = useState<number | 'all'>('all')
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Teacher | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentWithNames[]>([])
  const [attendance, setAttendance] = useState<AttendanceWithNames[]>([])
  const [form, setForm] = useState<{
    userId: number; firstName: string; lastName: string; email: string; phone: string
    departmentId: number; gender: 'male' | 'female' | 'other'; specialization: string
  }>({ userId: 0, firstName: '', lastName: '', email: '', phone: '', departmentId: 1, gender: 'male', specialization: '' })

  const departmentName = (id: number) => departments.find(d => d.id === id)?.name ?? getDepartmentName(id)
  const subjectName = (id: number) => subjects.find(s => s.id === id)?.name ?? 'Subject'
  const subjectCode = (id: number) => subjects.find(s => s.id === id)?.code ?? ''

  const teacherClasses = viewTeacher ? classes.filter(c => c.teacherIds.includes(viewTeacher.id)) : []
  const teacherSlots: ScheduleSlot[] = teacherClasses.map((cls, i) => ({
    id: `c${cls.id}`,
    name: cls.name,
    detail: subjectCode(cls.subjectId) || undefined,
    day: cls.day,
    startTime: cls.startTime,
    endTime: cls.endTime,
    room: cls.room,
    colorKey: cls.subjectId || i,
  }))
  const availableUsers = users.filter(u =>
    u.teacherId === editing?.id || (u.role === 'moderator' && u.status === 'active')
  )
  const userOptions: AutocompleteOption[] = availableUsers.map(u => {
    const linkedTeacher = u.teacherId ? data.find(t => t.id === u.teacherId) : undefined
    return { id: u.id, label: u.name, sublabel: `${u.email}${linkedTeacher ? ` · linked to ${linkedTeacher.firstName} ${linkedTeacher.lastName}` : ''}` }
  })
  const safePage = Math.min(page, totalPages)
  const paginated = data

  const applyUser = (userId: number) => {
    const u = users.find(x => x.id === userId)
    if (!u) { setForm(f => ({ ...f, userId: 0 })); return }
    const nameParts = u.name.trim().split(/\s+/)
    setForm(f => ({
      ...f,
      userId,
      firstName: nameParts.shift() ?? f.firstName,
      lastName: nameParts.length ? nameParts.join(' ') : f.lastName,
      email: u.email,
    }))
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ userId: 0, firstName: '', lastName: '', email: '', phone: '', departmentId: 1, gender: 'male', specialization: '' })
    setModalOpen(true)
  }
  const openEdit = (t: Teacher) => {
    setEditing(t)
    const linked = users.find(u => u.teacherId === t.id)
    setForm({ userId: linked?.id ?? 0, firstName: t.firstName, lastName: t.lastName, email: t.email, phone: t.phone, departmentId: t.departmentId, gender: t.gender, specialization: t.specialization })
    setModalOpen(true)
  }
  useEffect(() => {
    Promise.all([listTeachersPage({ page, limit: PAGE_SIZE, search, status: filterStatus, departmentId: filterDept }), listDepartments(), listUsers(), listClasses(), listSubjects(), listEnrollments(), listAttendance()])
      .then(([teacherResult, departmentBody, userBody, classRows, subjectRows, enrollmentRows, attendanceRows]) => {
        setData(teacherResult.data)
        setTotalItems(teacherResult.total)
        setTotalPages(Math.max(1, teacherResult.totalPages))
        setDepartments(departmentBody.departments)
        setUsers(userBody.users)
        setClasses(classRows)
        setSubjects(subjectRows)
        setEnrollments(enrollmentRows)
        setAttendance(attendanceRows)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to load teachers'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filterStatus, filterDept])
  const handleSave = async () => {
    if (!form.departmentId || !departments.some(d => d.id === form.departmentId)) {
      setError('Please create and select a valid department before adding a teacher.')
      return
    }
    try {
      const saved = editing
        ? await updateTeacher(editing.id, form)
        : await createTeacher({ ...form, status: 'active' })
      setData(prev => editing ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev])
      toast('success', editing ? 'Teacher record updated.' : 'Teacher added successfully.')
      setModalOpen(false)
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save teacher') }
  }
  const toggleStatus = async (id: number) => {
    const t = data.find(x => x.id === id)
    const next = t?.status === 'active' ? 'inactive' : 'active'
    if (!t) return
    try {
      const saved = await updateTeacher(id, { status: next })
      setData(prev => prev.map(x => x.id === id ? saved : x))
      toast(next === 'active' ? 'success' : 'info', `Teacher ${next === 'active' ? 'activated' : 'deactivated'}.`)
      setConfirmId(null)
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update teacher') }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Teachers</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            <span className="font-semibold" style={{ color: '#1a1f36' }}>{data.filter(t => t.status === 'active').length}</span> active staff members
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white flex-shrink-0" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Teacher
        </button>
      </div>

      <div className="bg-white rounded-xl border p-3.5 flex flex-wrap gap-3" style={{ borderColor: '#e2e7f0' }}>
        {error && <div className="w-full rounded-lg p-3 text-sm" style={{ backgroundColor: '#fff1f2', color: '#9f1239' }}>{error}</div>}
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search teachers…" className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#1a1f36' }} />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as 'all' | Status); setPage(1) }} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={filterDept} onChange={e => { setFilterDept(e.target.value === 'all' ? 'all' : Number(e.target.value)); setPage(1) }} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8f9fd', borderBottom: '1px solid #e2e7f0' }}>
                {['Teacher', 'Code', 'Department', 'Specialization', 'Phone', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon="👨‍🏫" title="No teachers found" description="Try adjusting your filters." /></td></tr>
              ) : paginated.map(t => (
                <tr key={t.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: '#f0f3fa' }}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#d1fae5', color: '#065f46', fontFamily: 'Outfit, sans-serif' }}>
                        {t.firstName.replace('Dr. ', '')[0]}{t.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: '#1a1f36' }}>{t.firstName} {t.lastName}</div>
                        <div className="text-xs" style={{ color: '#9ca3af' }}>{t.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap" style={{ color: '#6b7280' }}>{t.code}</td>
                  <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: '#374151' }}>{departmentName(t.departmentId)}</td>
                  <td className="px-4 py-3.5 text-xs max-w-36 truncate" style={{ color: '#6b7280' }}>{t.specialization}</td>
                  <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: '#6b7280' }}>{t.phone}</td>
                  <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: '#6b7280' }}>{t.joinedAt}</td>
                  <td className="px-4 py-3.5"><Badge variant={statusVariant(t.status)} dot>{t.status}</Badge></td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1.5">
                      <button onClick={() => setViewTeacher(t)} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50 transition-colors" style={{ borderColor: '#e2e7f0', color: '#374151' }}>View</button>
                      <button onClick={() => openEdit(t)} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50 transition-colors" style={{ borderColor: '#e2e7f0', color: '#374151' }}>Edit</button>
                      <button onClick={() => setConfirmId(t.id)} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap" style={{ borderColor: t.status === 'active' ? '#fca5a5' : '#d1fae5', color: t.status === 'active' ? '#e11d48' : '#059669', backgroundColor: t.status === 'active' ? '#fff5f5' : '#f0fdf4' }}>
                        {t.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} totalPages={totalPages} totalItems={totalItems} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit — ${editing.firstName} ${editing.lastName}` : 'Add New Teacher'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>{editing ? 'Save Changes' : 'Add Teacher'}</button>
          </>
        }
      >
        <FormField label="Link User Account"><Autocomplete
          options={userOptions}
          value={form.userId}
          onChange={applyUser}
          placeholder="Search or select a user…"
          inputClass={inputClass}
          inputStyle={inputStyle}
        />
        {form.userId > 0 && <p className="text-xs mt-1.5" style={{ color: '#6b7280' }}>Linked to user account — name and email are pulled from the user.</p>}
        </FormField>
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="First Name" required><input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
          <FormField label="Last Name" required><input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
        </div>
        <FormField label="Email" required><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Phone"><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
          <FormField label="Gender"><select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as 'male' | 'female' | 'other' }))} className={inputClass} style={inputStyle}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></FormField>
        </div>
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Department" required><select value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: Number(e.target.value) }))} className={inputClass} style={inputStyle}>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></FormField>
          <FormField label="Specialization"><input value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
        </div>
      </Modal>

      {viewTeacher && (
        <Modal open onClose={() => setViewTeacher(null)} title="Teacher Profile" width={900}>
          <div className="flex items-center gap-4 mb-5 pb-5 border-b" style={{ borderColor: '#f0f3fa' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ backgroundColor: '#d1fae5', color: '#065f46', fontFamily: 'Outfit, sans-serif' }}>
              {viewTeacher.firstName.replace('Dr. ', '')[0]}{viewTeacher.lastName[0]}
            </div>
            <div>
              <div className="font-bold text-lg" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{viewTeacher.firstName} {viewTeacher.lastName}</div>
              <div className="text-sm" style={{ color: '#6b7280' }}>{viewTeacher.code} · {viewTeacher.specialization}</div>
              <div className="mt-1.5"><Badge variant={statusVariant(viewTeacher.status)} dot>{viewTeacher.status}</Badge></div>
            </div>
            <Badge variant="primary">{teacherClasses.length} courses</Badge>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Teacher information */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>Teacher Information</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[['Email', viewTeacher.email], ['Phone', viewTeacher.phone], ['Department', getDepartmentName(viewTeacher.departmentId)], ['Gender', viewTeacher.gender], ['Joined', viewTeacher.joinedAt]].map(([label, val]) => (
                  <div key={label}><div className="text-xs font-medium mb-0.5" style={{ color: '#9ca3af' }}>{label}</div><div style={{ color: '#1a1f36' }}>{val}</div></div>
                ))}
              </div>

              <div className="text-xs font-semibold uppercase tracking-wide mt-6 mb-3" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>
                Assigned Courses
              </div>
              {teacherClasses.length === 0 ? (
                <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: '#e2e7f0', color: '#9ca3af', backgroundColor: '#fafbfd' }}>
                  No courses assigned to this teacher.
                </div>
              ) : (
                <div className="space-y-3">
                  {teacherClasses.map(cls => {
                    const students = enrollments.filter(e => e.classId === cls.id && e.status === 'approved')
                    const present = attendance.filter(a => a.classId === cls.id && a.status === 'present').length
                    const total = attendance.filter(a => a.classId === cls.id).length
                    const rate = total > 0 ? Math.round((present / total) * 100) : 0
                    return (
                      <div key={cls.id} className="rounded-lg border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
                        <div className="flex items-center justify-between gap-3 px-4 py-2.5" style={{ backgroundColor: '#f8f9fd', borderBottom: '1px solid #e2e7f0' }}>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{cls.name}</div>
                            <div className="text-xs truncate" style={{ color: '#9ca3af' }}>
                              {subjectName(cls.subjectId)} ({subjectCode(cls.subjectId)}) · {cls.day}{cls.startTime ? ` · ${cls.startTime.slice(0, 5)}–${cls.endTime.slice(0, 5)}` : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="primary">{students.length}</Badge>
                            <Badge variant={rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'danger'}>{rate}%</Badge>
                          </div>
                        </div>
                        {students.length === 0 ? (
                          <div className="px-4 py-3 text-sm" style={{ color: '#9ca3af' }}>No approved students yet.</div>
                        ) : (
                          <div className="max-h-32 overflow-y-auto divide-y" style={{ borderColor: '#f0f3fa' }}>
                            {students.map(e => (
                              <div key={e.id} className="flex items-center gap-3 px-4 py-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                                  {initials(e.studentName)}
                                </div>
                                <div className="text-xs font-medium truncate" style={{ color: '#374151' }}>{e.studentName}</div>
                                <div className="text-xs ml-auto truncate" style={{ color: '#9ca3af' }}>{e.studentCode}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="lg:border-l lg:pl-6" style={{ borderColor: '#f0f3fa' }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>
                Weekly Schedule
              </div>
              {teacherSlots.length === 0 ? (
                <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: '#e2e7f0', color: '#9ca3af', backgroundColor: '#fafbfd' }}>
                  No scheduled classes for this teacher.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[560px]">
                    <ScheduleGrid slots={teacherSlots} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog open={confirmId !== null} onClose={() => setConfirmId(null)} onConfirm={() => confirmId !== null && toggleStatus(confirmId)}
        title="Change Teacher Status" message={`${data.find(t => t.id === confirmId)?.status === 'active' ? 'Deactivate' : 'Activate'} this teacher?`}
        danger={data.find(t => t.id === confirmId)?.status === 'active'} />
    </div>
  )
}
