import { useEffect, useState } from 'react'
import { listEnrollments, listEnrollmentsPage, createEnrollment, updateEnrollment, deleteEnrollment, approveEnrollment, rejectEnrollment, type EnrollmentWithNames, type EnrollmentStatus } from '../api/enrollments'
import { listStudents, type Student } from '../api/students'
import { listClasses, type Class } from '../api/classes'
import { listDepartments } from '../api/departments'
import Badge, { statusVariant } from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle, ConfirmDialog } from '../components/Modal'
import Pagination from '../components/Pagination'
import { useToast } from '../context/ToastContext'

const PAGE_SIZE = 10

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

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd)
}

function classesOverlap(a: Class, b: Class): boolean {
  const aDays = parseDayList(a.day || '')
  const bDays = parseDayList(b.day || '')
  if (!aDays.length || !bDays.length) return false
  const shareDay = aDays.some(d => bDays.includes(d))
  return shareDay && timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)
}

export default function Enrollments() {
  const { toast } = useToast()
  const [data, setData] = useState<EnrollmentWithNames[]>([])
  const [allEnrollments, setAllEnrollments] = useState<EnrollmentWithNames[]>([])
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
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
  const [reviewDocs, setReviewDocs] = useState({ grade12: false, transcript: false, idcopy: false })

  const load = async () => {
    setLoading(true)
    try {
      const [enrollmentsResult, allEnrollments, studentRows, classRows, deptRows] = await Promise.all([
        listEnrollmentsPage({ page, limit: PAGE_SIZE, search, status: filterStatus, classId: filterClass }),
        listEnrollments(),
        listStudents(),
        listClasses(),
        listDepartments(),
      ])
      setData(enrollmentsResult.data)
      setTotalItems(enrollmentsResult.total)
      setTotalPages(Math.max(1, enrollmentsResult.totalPages))
      setAllEnrollments(allEnrollments)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filterStatus, filterClass])

  const resetPage = () => setPage(1)
  const safePage = Math.min(page, totalPages)

  const activeClasses = classes.filter(c => c.status === 'active')

  const getDepartmentName = (id: number | null | undefined) =>
    departments.find(d => d.id === id)?.name ?? '—'

  const filtered = data

  const count = (status: EnrollmentStatus) => allEnrollments.filter(e => e.status === status).length

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
      const updated = await approveEnrollment(id, {
        docGrade12: reviewDocs.grade12,
        docTranscript: reviewDocs.transcript,
        docIdCopy: reviewDocs.idcopy,
      })
      setData(prev => prev.map(e => e.id === id ? updated : e))
      setReviewTarget(null)
      setReviewDocs({ grade12: false, transcript: false, idcopy: false })
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
      const updated = await updateEnrollment(id, { status: 'dropped' })
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
          <input value={search} onChange={e => { setSearch(e.target.value); resetPage() }} placeholder="Search by student, class or subject…" className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0' }} />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as EnrollmentStatus | 'all'); resetPage() }} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="dropped">Dropped</option>
        </select>
        <select value={filterClass} onChange={e => { setFilterClass(e.target.value === 'all' ? 'all' : Number(e.target.value)); resetPage() }} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8f9fd', borderBottom: '1px solid #e2e7f0' }}>
                {['Student', 'Class', 'Subject / Teacher', 'Requested', 'Status', 'Payment', 'Reviewed', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12" style={{ color: '#9ca3af' }}>No enrollments found</td></tr>
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
                  <td className="px-4 py-3 whitespace-nowrap">
                    {e.status === 'approved' ? (
                      <Badge variant={e.paymentStatus === 'paid' ? 'success' : 'warning'} dot>
                        {e.paymentStatus === 'paid' ? 'Paid' : `$${Number(e.amount || 0).toFixed(2)}`}
                      </Badge>
                    ) : <span className="text-xs" style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>
                    {e.status === 'pending' ? '—' : (e.reviewedByName || `${e.reviewedAt || ''}`.trim() || '—')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {e.status === 'pending' && (
                        <>
                          <button onClick={() => { setReviewTarget(e); setReviewDocs({ grade12: e.docGrade12, transcript: e.docTranscript, idcopy: e.docIdCopy }) }} className="px-2.5 py-1 text-xs font-semibold rounded-lg text-white transition-opacity hover:opacity-90"
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
                        <>
                          <button onClick={() => setReviewTarget(e)} className="px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors"
                            style={{ borderColor: '#c7d2fe', color: '#3451c7', backgroundColor: '#f5f7ff', fontFamily: 'Outfit, sans-serif' }}>
                            View
                          </button>
                          <button onClick={() => handleRemove(e.id)} className="px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors"
                            style={{ borderColor: '#e2e7f0', color: '#6b7280', backgroundColor: '#fff', fontFamily: 'Outfit, sans-serif' }}>
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} totalPages={totalPages} totalItems={totalItems} pageSize={PAGE_SIZE} onPageChange={setPage} />
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

        // Other classes the student is already approved into (exclude the one under review)
        const otherEnrollments = allEnrollments.filter(e =>
          e.studentId === reviewTarget.studentId &&
          e.id !== reviewTarget.id &&
          e.status === 'approved',
        )
        const conflicts = klass
          ? otherEnrollments
            .map(e => ({ enrollment: e, cls: classes.find(c => c.id === e.classId) }))
            .filter(x => x.cls && classesOverlap(klass, x.cls))
          : []

        // Students already enrolled in the requested class
        const roster = allEnrollments.filter(e => e.classId === reviewTarget.classId && e.status === 'approved')
        const rosterCount = roster.length
        const isPending = reviewTarget.status === 'pending'

        return (
          <Modal
            open
            onClose={() => setReviewTarget(null)}
            title={isPending ? 'Review Enrollment Request' : 'Enrollment Details'}
            width={900}
            footer={
              isPending ? (
                <>
                  <button onClick={() => setRejectTarget(reviewTarget)} className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
                    style={{ borderColor: '#fca5a5', color: '#e11d48', backgroundColor: '#fff5f5', fontFamily: 'Outfit, sans-serif' }}>
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(reviewTarget.id, reviewTarget.studentName)}
                    disabled={!reviewDocs.grade12 || !reviewDocs.transcript || !reviewDocs.idcopy}
                    className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: '#059669', fontFamily: 'Outfit, sans-serif' }}
                  >
                    Approve
                  </button>
                </>
              ) : (
                <button onClick={() => setReviewTarget(null)} className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-gray-50"
                  style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>
                  Close
                </button>
              )
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

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left column */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>Student Information</div>
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

                <div className="text-xs font-semibold uppercase tracking-wide mt-6 mb-3" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>Requested Class</div>
                <div className="rounded-lg border p-4" style={{ borderColor: '#e2e7f0', backgroundColor: '#fafbfd' }}>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {[
                      ['Class', reviewTarget.className || '—'],
                      ['Subject', reviewTarget.subjectName ? `${reviewTarget.subjectName} (${reviewTarget.subjectCode})` : '—'],
                      ['Teacher', reviewTarget.teacherNames || 'No teacher assigned'],
                      ['Room', klass?.room || '—'],
                      ['Schedule', klass?.day ? `${klass.day} · ${klass.startTime}–${klass.endTime}` : '—'],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className="text-xs font-medium mb-0.5" style={{ color: '#9ca3af' }}>{label}</div>
                        <div style={{ color: '#1a1f36' }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-xs font-semibold uppercase tracking-wide mt-6 mb-3" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>Request Details</div>
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
              </div>

              {/* Right column */}
              <div className="lg:border-l lg:pl-6" style={{ borderColor: '#f0f3fa' }}>
                {isPending && (
                  <>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>
                      Required Documents
                    </div>
                    <div className="rounded-lg border divide-y mb-6" style={{ borderColor: '#e2e7f0' }}>
                      {([
                        ['grade12', 'Grade 12 Certificate'],
                        ['transcript', 'School Transcript'],
                        ['idcopy', 'ID / Photo Copy'],
                      ] as const).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer" style={{ color: '#374151' }}>
                          <input
                            type="checkbox"
                            checked={reviewDocs[key]}
                            onChange={e => setReviewDocs(d => ({ ...d, [key]: e.target.checked }))}
                            className="rounded accent-[#059669]"
                          />
                          <span className="text-sm font-medium" style={{ color: '#1a1f36' }}>{label}</span>
                          <span className="text-xs ml-auto" style={{ color: '#9ca3af' }}>Hard copy received</span>
                        </label>
                      ))}
                    </div>
                    {(!reviewDocs.grade12 || !reviewDocs.transcript || !reviewDocs.idcopy) && (
                      <p className="text-xs mb-6" style={{ color: '#b45309' }}>
                        Check all documents to enable the Approve button.
                      </p>
                    )}
                  </>
                )}

                {/* Payment status (non-pending) */}
                {!isPending && (
                  <div className="rounded-lg border p-4 mb-6" style={{ borderColor: '#e2e7f0', backgroundColor: '#fafbfd' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>Payment</div>
                      <Badge variant={reviewTarget.paymentStatus === 'paid' ? 'success' : 'warning'} dot>{reviewTarget.paymentStatus}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        ['Amount', `$${Number(reviewTarget.amount || 0).toFixed(2)}`],
                        ['Method', reviewTarget.paymentMethod || '—'],
                        ['Reference', reviewTarget.paymentReference || '—'],
                        ['Paid At', reviewTarget.paidAt || '—'],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <div className="text-xs font-medium mb-0.5" style={{ color: '#9ca3af' }}>{label}</div>
                          <div style={{ color: '#1a1f36' }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>
                  Schedule Conflict Check
                </div>
                {conflicts.length === 0 ? (
                  <div className="flex items-center gap-2.5 rounded-lg border px-4 py-3" style={{ borderColor: '#bbe7d3', backgroundColor: '#f0fdf6' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                    <span className="text-sm font-medium" style={{ color: '#065f46' }}>
                      No overlap with {otherEnrollments.length} other approved class{otherEnrollments.length === 1 ? '' : 'es'}
                    </span>
                  </div>
                ) : (
                  <div className="rounded-lg border p-4 space-y-2.5" style={{ borderColor: '#fecaca', backgroundColor: '#fff5f5' }}>
                    <div className="flex items-center gap-2.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      <span className="text-sm font-semibold" style={{ color: '#9f1239', fontFamily: 'Outfit, sans-serif' }}>
                        {conflicts.length} schedule conflict{conflicts.length === 1 ? '' : 's'} detected
                      </span>
                    </div>
                    {conflicts.map(({ enrollment, cls }) => (
                      <div key={enrollment.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2" style={{ borderColor: '#fecaca', backgroundColor: '#fff' }}>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: '#1a1f36' }}>{enrollment.subjectName || enrollment.className}</div>
                          <div className="text-xs" style={{ color: '#6b7280' }}>
                            {cls ? `${cls.day} · ${cls.startTime}–${cls.endTime}` : enrollment.className}
                          </div>
                        </div>
                        <span className="text-xs font-semibold whitespace-nowrap" style={{ color: '#e11d48' }}>Overlaps</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-6 mb-3">
                  <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>
                    Students in this class
                  </div>
                  <Badge variant="primary">{rosterCount} enrolled</Badge>
                </div>
                {roster.length === 0 ? (
                  <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: '#e2e7f0', color: '#9ca3af', backgroundColor: '#fafbfd' }}>
                    No approved students in this class yet.
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
                    <div className="max-h-64 overflow-y-auto divide-y" style={{ borderColor: '#f0f3fa' }}>
                      {roster.map(e => (
                        <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                            {initials(e.studentName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate" style={{ color: '#1a1f36' }}>{e.studentName}</div>
                            <div className="text-xs truncate" style={{ color: '#9ca3af' }}>{e.studentCode}</div>
                          </div>
                          {e.studentId === reviewTarget.studentId && (
                            <span className="text-xs font-medium" style={{ color: '#b45309' }}>This student</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
