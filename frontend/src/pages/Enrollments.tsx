import { useEffect, useState } from 'react'
import { listEnrollments, createEnrollment, updateEnrollment, deleteEnrollment, approveEnrollment, rejectEnrollment, type EnrollmentWithNames, type EnrollmentStatus } from '../api/enrollments'
import { listStudents, type Student } from '../api/students'
import { listClasses, type Class } from '../api/classes'
import { listDepartments } from '../api/departments'
import Badge, { statusVariant } from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle, ConfirmDialog } from '../components/Modal'
import { useToast } from '../context/ToastContext'

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

export default function Enrollments() {
  const { toast } = useToast()
  const [data, setData] = useState<EnrollmentWithNames[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<EnrollmentStatus | 'all'>('all')
  const [filterClass, setFilterClass] = useState<number | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ studentId: 1, classId: 1 })
  const [reviewTarget, setReviewTarget] = useState<EnrollmentWithNames | null>(null)
  const [rejectTarget, setRejectTarget] = useState<EnrollmentWithNames | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [enrollments, studentRows, classRows, deptRows] = await Promise.all([
        listEnrollments(),
        listStudents(),
        listClasses(),
        listDepartments(),
      ])
      setData(enrollments)
      setStudents(studentRows)
      setClasses(classRows)
      setDepartments(deptRows.departments.map(d => ({ id: d.id, name: d.name })))
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to load enrollments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const activeClasses = classes.filter(c => c.status === 'active')

  const getDepartmentName = (id: number | null | undefined) =>
    departments.find(d => d.id === id)?.name ?? '—'

  const filtered = data.filter(e =>
    (filterStatus === 'all' || e.status === filterStatus) &&
    (filterClass === 'all' || e.classId === filterClass) &&
    `${e.studentName} ${e.className} ${e.subjectName} ${e.studentCode}`.toLowerCase().includes(search.toLowerCase())
  )

  const count = (status: EnrollmentStatus) => data.filter(e => e.status === status).length

  const openCreate = () => {
    setForm({ studentId: students[0]?.id ?? 1, classId: activeClasses[0]?.id ?? 1 })
    setModalOpen(true)
  }

  const handleEnroll = async () => {
    try {
      const created = await createEnrollment({ studentId: form.studentId, classId: form.classId })
      setData(prev => [created, ...prev])
      setModalOpen(false)
      toast('success', 'Enrollment request submitted for review.')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to submit enrollment.')
    }
  }

  const handleApprove = async (id: number, name: string) => {
    try {
      const updated = await approveEnrollment(id)
      setData(prev => prev.map(e => e.id === id ? updated : e))
      setReviewTarget(null)
      toast('success', `${name} enrollment approved.`)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to approve enrollment.')
    }
  }

  const handleReject = async (id: number, name: string) => {
    try {
      const updated = await rejectEnrollment(id)
      setData(prev => prev.map(e => e.id === id ? updated : e))
      setReviewTarget(null)
      setRejectTarget(null)
      toast('success', `${name} enrollment rejected.`)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to reject enrollment.')
    }
  }

  const handleDrop = async (id: number) => {
    try {
      const updated = await updateEnrollment(id, 'dropped')
      setData(prev => prev.map(e => e.id === id ? updated : e))
      toast('success', 'Enrollment dropped.')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to update enrollment.')
    }
  }

  const handleRemove = async (id: number) => {
    if (!window.confirm('Remove this enrollment?')) return
    try {
      await deleteEnrollment(id)
      setData(prev => prev.filter(e => e.id !== id))
      toast('success', 'Enrollment removed.')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to remove enrollment.')
    }
  }

  if (loading) {
    return <div className="p-6" style={{ color: '#9ca3af', fontFamily: 'Outfit, sans-serif' }}>Loading enrollments…</div>
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Enrollment Requests</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>{count('approved')} approved · {count('pending')} awaiting review</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
          + Enroll Student
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending', count: count('pending'), color: '#b45309', bg: '#fef3c7' },
          { label: 'Approved', count: count('approved'), color: '#059669', bg: '#d1fae5' },
          { label: 'Rejected', count: count('rejected'), color: '#e11d48', bg: '#ffe4e6' },
          { label: 'Dropped', count: count('dropped'), color: '#6b7280', bg: '#f3f4f6' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: '#e2e7f0' }}>
            <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color }}>{count}</div>
            <div className="text-xs" style={{ color: '#9ca3af' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3" style={{ borderColor: '#e2e7f0' }}>
        <div className="relative flex-1 min-w-40">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student, class or subject…" className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as EnrollmentStatus | 'all')} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="dropped">Dropped</option>
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8f9fd', borderBottom: '1px solid #e2e7f0' }}>
                {['Student', 'Class', 'Subject / Teacher', 'Requested', 'Status', 'Reviewed', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12" style={{ color: '#9ca3af' }}>No enrollments found</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: '#f0f3fa' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                        {initials(e.studentName)}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: '#1a1f36' }}>{e.studentName}</div>
                        <div className="text-xs" style={{ color: '#9ca3af' }}>{e.studentCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#374151' }}>{e.className}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium" style={{ color: '#1a1f36' }}>{e.subjectName || '—'}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{e.teacherNames || 'No teacher assigned'}</div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>{e.enrolledAt}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant(e.status)} dot>{e.status}</Badge></td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>
                    {e.status === 'pending' ? '—' : (e.reviewedByName || `${e.reviewedAt || ''}`.trim() || '—')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {e.status === 'pending' && (
                        <>
                          <button onClick={() => setReviewTarget(e)} className="px-2.5 py-1 text-xs font-semibold rounded-lg text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                            Review
                          </button>
                          <button onClick={() => handleRemove(e.id)} className="px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors"
                            style={{ borderColor: '#e2e7f0', color: '#6b7280', backgroundColor: '#fff', fontFamily: 'Outfit, sans-serif' }}>
                            Remove
                          </button>
                        </>
                      )}
                      {e.status === 'approved' && (
                        <button onClick={() => handleDrop(e.id)} className="px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors"
                          style={{ borderColor: '#fca5a5', color: '#e11d48', backgroundColor: '#fff5f5', fontFamily: 'Outfit, sans-serif' }}>
                          Drop
                        </button>
                      )}
                      {e.status !== 'pending' && (
                        <button onClick={() => handleRemove(e.id)} className="px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors"
                          style={{ borderColor: '#e2e7f0', color: '#6b7280', backgroundColor: '#fff', fontFamily: 'Outfit, sans-serif' }}>
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Enroll Student" width={440}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
            <button onClick={handleEnroll} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>Submit Request</button>
          </>
        }
      >
        <FormField label="Student" required>
          <select value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: Number(e.target.value) }))} className={inputClass} style={inputStyle}>
            {students.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.code})</option>)}
          </select>
        </FormField>
        <FormField label="Class" required>
          <select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: Number(e.target.value) }))} className={inputClass} style={inputStyle}>
            {activeClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
        <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
          The request will be created as <strong style={{ color: '#b45309' }}>pending</strong> and needs a moderator's approval before the student is enrolled.
        </p>
      </Modal>

      {/* Review Modal */}
      {reviewTarget && (() => {
        const student = students.find(s => s.id === reviewTarget.studentId)
        const klass = classes.find(c => c.id === reviewTarget.classId)
        return (
          <Modal
            open
            onClose={() => setReviewTarget(null)}
            title="Review Enrollment Request"
            width={620}
            footer={
              <>
                <button onClick={() => setRejectTarget(reviewTarget)} className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
                  style={{ borderColor: '#fca5a5', color: '#e11d48', backgroundColor: '#fff5f5', fontFamily: 'Outfit, sans-serif' }}>
                  Reject
                </button>
                <button onClick={() => handleApprove(reviewTarget.id, reviewTarget.studentName)} className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#059669', fontFamily: 'Outfit, sans-serif' }}>
                  Approve
                </button>
              </>
            }
          >
            {/* Student */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b" style={{ borderColor: '#f0f3fa' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                {initials(reviewTarget.studentName)}
              </div>
              <div className="flex-1">
                <div className="font-bold text-base leading-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{reviewTarget.studentName}</div>
                <div className="text-sm" style={{ color: '#9ca3af' }}>{reviewTarget.studentCode}</div>
              </div>
              <Badge variant={statusVariant(reviewTarget.status)} dot>{reviewTarget.status}</Badge>
            </div>

            <div className="mb-6">
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>Student Information</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  ['Full Name', `${student?.firstName ?? ''} ${student?.lastName ?? ''}`.trim() || '—'],
                  ['Email', student?.email || '—'],
                  ['Phone', student?.phone || '—'],
                  ['Department', getDepartmentName(student?.departmentId)],
                  ['Gender', student?.gender ? (student.gender[0].toUpperCase() + student.gender.slice(1)) : '—'],
                  ['Date of Birth', student?.dateOfBirth || '—'],
                  ['Student Status', student?.status || '—'],
                  ['Address', student?.address || '—'],
                ].map(([label, val]) => (
                  <div key={label} className={label === 'Address' ? 'col-span-2' : 'col-span-1'}>
                    <div className="text-xs font-medium mb-0.5" style={{ color: '#9ca3af' }}>{label}</div>
                    <div style={{ color: '#1a1f36' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>Requested Class</div>
              <div className="rounded-lg border p-4" style={{ borderColor: '#e2e7f0', backgroundColor: '#fafbfd' }}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    ['Class', reviewTarget.className || '—'],
                    ['Subject', reviewTarget.subjectName ? `${reviewTarget.subjectName} (${reviewTarget.subjectCode})` : '—'],
                    ['Teacher', reviewTarget.teacherNames || 'No teacher assigned'],
                    ['Room', klass?.room || '—'],
                    ['Schedule', klass?.day ? `${klass.day} · ${klass.startTime}–${klass.endTime}` : '—'],
                  ].map(([label, val]) => (
                    <div key={label} className={label === 'Teacher' ? 'col-span-1' : 'col-span-1'}>
                      <div className="text-xs font-medium mb-0.5" style={{ color: '#9ca3af' }}>{label}</div>
                      <div style={{ color: '#1a1f36' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['Requested On', reviewTarget.enrolledAt || '—'],
                ['Reviewed By', reviewTarget.reviewedByName || '—'],
                ['Reviewed On', reviewTarget.reviewedAt || '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div className="text-xs font-medium mb-0.5" style={{ color: '#9ca3af' }}>{label}</div>
                  <div style={{ color: '#1a1f36' }}>{val}</div>
                </div>
              ))}
            </div>
          </Modal>
        )
      })()}

      <ConfirmDialog
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        onConfirm={() => rejectTarget && handleReject(rejectTarget.id, rejectTarget.studentName)}
        title="Reject Enrollment Request"
        message={`Reject ${rejectTarget?.studentName ?? ''}'s enrollment request for ${rejectTarget?.className ?? ''}?`}
        danger
      />
    </div>
  )
}
