import { useEffect, useMemo, useState } from 'react'
import type { SessionUser } from '../api/auth'
import { listEnrollments, createEnrollment, updateEnrollment, payEnrollment, type EnrollmentWithNames } from '../api/enrollments'
import { listClasses, type Class } from '../api/classes'
import { listSubjects, type Subject } from '../api/subjects'
import { listDepartments, type DepartmentRecord } from '../api/departments'
import { listAcademicYears, type AcademicYear } from '../api/academicYears'
import { listSubjectFees, type SubjectFee } from '../api/subjectFees'
import { classSchedule, type SubjectItem } from './shared'
import Modal, { FormField, inputClass, inputStyle } from '../components/Modal'
import Badge from '../components/Badge'
import ViewToggle from '../components/ViewToggle'
import { useToast } from '../context/ToastContext'
import { getApiError } from '../api/client'

interface SubjectEnrollmentProps {
  session: SessionUser
}

export default function SubjectEnrollment({ session }: SubjectEnrollmentProps) {
  const { toast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentWithNames[]>([])
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [subjectFees, setSubjectFees] = useState<SubjectFee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState<number | 'all'>('all')
  const [filterYear, setFilterYear] = useState<number | 'all'>('all')
  const [view, setView] = useState<'card' | 'table'>('card')
  const [pending, setPending] = useState<SubjectItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [docs, setDocs] = useState({ grade12: false, transcript: false, idcopy: false })
  const [notes, setNotes] = useState('')
  const [paying, setPaying] = useState<EnrollmentWithNames | null>(null)
  const [payForm, setPayForm] = useState({ method: 'Credit Card', reference: '' })

  const openPending = (item: SubjectItem) => {
    setPending(item)
    setDocs({
      grade12: !!item.docGrade12,
      transcript: !!item.docTranscript,
      idcopy: !!item.docIdCopy,
    })
    setNotes(item.notes ?? '')
  }

  const closePending = () => {
    setPending(null)
    setDocs({ grade12: false, transcript: false, idcopy: false })
    setNotes('')
  }

  const allDocs = docs.grade12 && docs.transcript && docs.idcopy

  const handleConfirm = async (asDraft: boolean) => {
    if (!pending) return
    if (!asDraft && !allDocs) {
      toast('error', 'Please confirm you have all the required documents.')
      return
    }
    setSubmitting(true)
    try {
      const existing = pending.enrollmentId > 0
      if (existing) {
        await updateEnrollment(pending.enrollmentId, {
          docGrade12: docs.grade12,
          docTranscript: docs.transcript,
          docIdCopy: docs.idcopy,
          docsDeclared: asDraft ? allDocs : true,
          notes: notes.trim() || undefined,
        } as { docGrade12: boolean; docTranscript: boolean; docIdCopy: boolean; docsDeclared: boolean; notes?: string })
      } else {
        await createEnrollment({
          studentId: session.studentId as number,
          classId: pending.classId,
          docsDeclared: asDraft ? allDocs : true,
          notes: notes.trim() || undefined,
        })
      }
      toast('success', asDraft
        ? `Draft saved for ${pending.subjectName}. Complete your documents before the deadline.`
        : `${existing ? 'Enrollment updated for' : 'Enrollment request for'} ${pending.subjectName} submitted for review.`)
      closePending()
      await load()
    } catch (err) {
      toast('error', getApiError(err, 'Unable to save enrollment.'))
    } finally {
      setSubmitting(false)
    }
  }

  const load = async () => {
    setLoading(true)
    try {
      const [classRows, subjectRows, enrollmentRows, deptResult, yearRows, feeRows] = await Promise.all([
        listClasses(),
        listSubjects(),
        listEnrollments(),
        listDepartments(),
        listAcademicYears(),
        listSubjectFees(),
      ])
      setClasses(classRows)
      setSubjects(subjectRows)
      setEnrollments(enrollmentRows.filter(e => e.studentId === session.studentId))
      setDepartments(deptResult.departments)
      setAcademicYears(yearRows)
      setSubjectFees(feeRows)
    } catch {
      toast('error', 'Unable to load available subjects.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.studentId])

  const allItems = useMemo(() => {
    const enrolledByClass = new Map<number, EnrollmentWithNames>(enrollments.map(e => [e.classId, e]))
    const feeBySubjectYear = new Map<string, number>()
    for (const f of subjectFees) {
      feeBySubjectYear.set(`${f.subjectId}-${f.academicYearId}`, f.fee)
    }
    return classes
      .filter(c => c.status === 'active')
      .map(cls => {
        const subject = subjects.find(s => s.id === cls.subjectId)
        if (!subject) return null
        const enrollment = enrolledByClass.get(cls.id)
        const yearId = cls.academicYearId ?? 0
        const currentFee = feeBySubjectYear.get(`${subject.id}-${yearId}`) ?? 0
        return {
          enrollmentId: enrollment?.id ?? 0,
          status: enrollment?.status ?? '',
          enrolledAt: enrollment?.enrolledAt ?? '',
          classId: cls.id,
          className: cls.name,
          subjectId: subject.id,
          subjectName: subject.name,
          subjectCode: subject.code,
          credits: subject.credits,
          academicYearId: yearId,
          day: cls.day ?? '',
          schedule: classSchedule(cls),
          room: cls.room ?? '',
          startTime: cls.startTime ?? '',
          endTime: cls.endTime ?? '',
          amount: enrollment ? (enrollment.amount ?? currentFee) : currentFee,
          paymentStatus: (enrollment?.paymentStatus ?? 'unpaid') as string,
        }
      })
      .filter((item): item is SubjectItem => item !== null)
  }, [enrollments, classes, subjects, subjectFees])
  const enrolledIds = new Set(enrollments.filter(e => e.status === 'approved').map(e => e.classId))
  const pendingByClass = new Map(enrollments.filter(e => e.status === 'pending').map(e => [e.classId, e.status]))
  const subjectDept = new Map(subjects.map(s => [s.id, s.department_id]))

  const availableItems = useMemo(() => {
    return adminItems(allItems).filter(item => {
      const cls = classes.find(c => c.id === item.classId)
      return cls && cls.status === 'active'
    })
  }, [allItems, classes])

  const filtered = availableItems.map(item => {
    const deptId = subjectDept.get(item.subjectId)
    return { item, deptId }
  }).filter(({ item, deptId }) =>
    (filterDept === 'all' || deptId === filterDept) &&
    (filterYear === 'all' || item.academicYearId === filterYear) &&
    `${item.subjectName} ${item.subjectCode} ${item.className}`.toLowerCase().includes(search.toLowerCase()),
  )

  const handlePay = async () => {
    if (!paying) return
    setSubmitting(true)
    try {
      await payEnrollment(paying.id, { method: payForm.method, reference: payForm.reference.trim() || undefined })
      toast('success', `Payment recorded for ${paying.subjectName}.`)
      setPaying(null)
      setPayForm({ method: 'Credit Card', reference: '' })
      await load()
    } catch (err) {
      toast('error', getApiError(err, 'Unable to process payment.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Subject Enrollment</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>Browse available subjects and enroll in the ones you need</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-3.5 flex flex-wrap items-center gap-3" style={{ borderColor: '#e2e7f0' }}>
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search subjects…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: '#e2e7f0', color: '#1a1f36' }}
          />
        </div>
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ borderColor: '#e2e7f0', color: '#374151' }}
        >
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select
          value={filterYear}
          onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ borderColor: '#e2e7f0', color: '#374151' }}
        >
          <option value="all">All Academic Years</option>
          {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="rounded-xl border h-44 animate-pulse" style={{ borderColor: '#e2e7f0', backgroundColor: '#f8f9fd' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border py-14 text-center" style={{ borderColor: '#e2e7f0' }}>
          <div className="text-3xl mb-3">📚</div>
          <p className="text-sm font-medium" style={{ color: '#374151' }}>No subjects found</p>
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Try adjusting your search or department filter.</p>
        </div>
      ) : view === 'card' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ item }) => {
            const enrolled = enrolledIds.has(item.classId)
            const dropped = enrollments.find(e => e.classId === item.classId && e.status === 'dropped')
            const pending = pendingByClass.has(item.classId)
            return (
              <div key={item.enrollmentId !== 0 ? item.enrollmentId : `${item.classId}-${item.subjectId}`} className="bg-white rounded-xl border p-5 flex flex-col" style={{ borderColor: '#e2e7f0' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3451c7', fontFamily: 'Outfit, sans-serif' }}>
                    {item.subjectName.charAt(0)}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="neutral">{item.credits} credits</Badge>
                    <Badge variant={item.amount > 0 ? 'primary' : 'neutral'}>
                      {item.amount > 0 ? `$${Number(item.amount).toFixed(2)}` : 'Free'}
                    </Badge>
                  </div>
                </div>
                <h3 className="text-sm font-semibold mt-3" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{item.subjectName}</h3>
                <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{item.subjectCode} · {item.className}</div>
                <div className="text-[11px] mt-0.5" style={{ color: '#9ca3af' }}>
                  {academicYears.find(y => y.id === item.academicYearId)?.name || 'Academic year TBD'}
                </div>
                <div className="mt-3 space-y-1.5 text-xs" style={{ color: '#6b7280' }}>
                  <div className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {item.schedule}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" /></svg>
                    {item.room || 'Room TBD'}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex-1 flex items-end" style={{ borderColor: '#f0f3fa' }}>
                  <EnrollButton item={item} enrolled={enrolled} pending={pending} dropped={!!dropped} onEnroll={openPending} onPay={() => setPaying(enrollments.find(e => e.id === item.enrollmentId) ?? null)} full />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs" style={{ backgroundColor: '#f8f9fd', color: '#6b7280' }}>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Academic Year</th>
                <th className="px-4 py-3 font-semibold">Class</th>
                <th className="px-4 py-3 font-semibold">Credits</th>
                <th className="px-4 py-3 font-semibold">Fee</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Schedule</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Room</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#f0f3fa' }}>
              {filtered.map(({ item }) => {
                const enrolled = enrolledIds.has(item.classId)
                const dropped = enrollments.find(e => e.classId === item.classId && e.status === 'dropped')
const pending = pendingByClass.has(item.classId)
                return (
                  <tr key={item.enrollmentId !== 0 ? item.enrollmentId : `${item.classId}-${item.subjectId}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3451c7', fontFamily: 'Outfit, sans-serif' }}>
                          {item.subjectName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{item.subjectName}</div>
                          <div className="text-xs truncate" style={{ color: '#9ca3af' }}>{item.subjectCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: '#374151' }}>{item.className}</td>
                    <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: '#6b7280' }}>{academicYears.find(y => y.id === item.academicYearId)?.name || '—'}</td>
                    <td className="px-4 py-3"><Badge variant="neutral">{item.credits}</Badge></td>
                    <td className="px-4 py-3">
                      {item.amount > 0
                        ? <Badge variant="primary">${Number(item.amount).toFixed(2)}</Badge>
                        : <Badge variant="neutral">Free</Badge>}
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell" style={{ color: '#6b7280' }}>{item.schedule}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell" style={{ color: '#374151' }}>{item.room || 'TBD'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <EnrollButton item={item} enrolled={enrolled} pending={pending} dropped={!!dropped} onEnroll={openPending} onPay={() => setPaying(enrollments.find(e => e.id === item.enrollmentId) ?? null)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation modal */}
      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending && pending.enrollmentId > 0 ? 'Update Enrollment' : 'Confirm Enrollment'}
        width={440}
        footer={
          <>
            <button onClick={() => setPending(null)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>
              Cancel
            </button>
            <button onClick={() => handleConfirm(true)} disabled={submitting} className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors" style={{ borderColor: '#e2e7f0', color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>
              {submitting ? 'Saving…' : 'Save Draft'}
            </button>
            <button onClick={() => handleConfirm(false)} disabled={submitting || !allDocs} className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-60" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </>
        }
      >
        {pending && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl p-4" style={{ backgroundColor: '#f8f9fd' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3451c7', fontFamily: 'Outfit, sans-serif' }}>
                {pending.subjectName.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{pending.subjectName}</div>
                <div className="text-xs" style={{ color: '#9ca3af' }}>{pending.subjectCode} · {pending.credits} credits</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Class', pending.className],
                ['Schedule', pending.schedule],
                ['Room', pending.room || 'TBD'],
                ['Fee', pending.amount > 0 ? `$${Number(pending.amount).toFixed(2)}` : 'Free'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border p-3" style={{ borderColor: '#e2e7f0' }}>
                  <div className="text-xs font-medium mb-0.5" style={{ color: '#9ca3af' }}>{label}</div>
                  <div style={{ color: '#1a1f36' }}>{value}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>
                Required Documents
              </div>
              <div className="rounded-lg border divide-y" style={{ borderColor: '#e2e7f0' }}>
                {([
                  ['grade12', 'Grade 12 Certificate'],
                  ['transcript', 'School Transcript'],
                  ['idcopy', 'ID / Photo Copy'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer" style={{ color: '#374151' }}>
                    <input
                      type="checkbox"
                      checked={docs[key]}
                      onChange={e => setDocs(d => ({ ...d, [key]: e.target.checked }))}
                      className="rounded accent-[#3b5bdb]"
                    />
                    <span className="text-sm font-medium" style={{ color: '#1a1f36' }}>{label}</span>
                    <span className="text-xs ml-auto" style={{ color: '#9ca3af' }}>I have this document</span>
                  </label>
                ))}
              </div>
              {(!docs.grade12 || !docs.transcript || !docs.idcopy) && (
                <p className="text-xs mt-1.5" style={{ color: '#b45309' }}>
                  Confirm all documents to submit. You can also save a draft and complete it later before the deadline.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b7280' }}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Anything the reviewer should know…"
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2"
                style={{ borderColor: '#e2e7f0', color: '#1a1f36', resize: 'vertical' }}
              />
            </div>

            <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
              {pending.enrollmentId > 0
                ? <>You're updating your request for <strong style={{ color: '#1a1f36' }}>{pending.subjectName}</strong>. Complete your documents and submit, or save a draft to finish later before the deadline.</>
                : <>You're requesting to enroll in <strong style={{ color: '#1a1f36' }}>{pending.subjectName}</strong>. A moderator will verify your documents before approval, then you can pay the fee online.</>}
            </p>
          </div>
        )}
      </Modal>

      {/* Payment modal */}
      <Modal
        open={paying !== null}
        onClose={() => setPaying(null)}
        title="Online Payment"
        width={440}
        footer={
          <>
            <button onClick={() => setPaying(null)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
            <button onClick={handlePay} disabled={submitting} className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-60" style={{ backgroundColor: '#059669', fontFamily: 'Outfit, sans-serif' }}>
              {submitting ? 'Processing…' : 'Confirm Payment'}
            </button>
          </>
        }
      >
        {paying && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl p-4" style={{ backgroundColor: '#f8f9fd' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3451c7', fontFamily: 'Outfit, sans-serif' }}>
                {paying.subjectName.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{paying.subjectName}</div>
                <div className="text-xs" style={{ color: '#9ca3af' }}>{paying.className}</div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3" style={{ borderColor: '#e2e7f0' }}>
              <span className="text-sm" style={{ color: '#6b7280' }}>Amount due</span>
              <span className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>${Number(paying.amount || 0).toFixed(2)}</span>
            </div>
            <FormField label="Payment Method" required>
              <select value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))} className={inputClass} style={inputStyle}>
                <option>Credit Card</option>
                <option>Bank Transfer</option>
                <option>Mobile Money</option>
              </select>
            </FormField>
            <FormField label="Transaction Reference">
              <input value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} className={inputClass} style={inputStyle} placeholder="e.g. receipt / transaction id" />
            </FormField>
            <p className="text-xs" style={{ color: '#9ca3af' }}>
              This is a simulated payment. Once confirmed, your enrollment is marked as paid.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

function adminItems(items: SubjectItem[]): SubjectItem[] {
  const byClass = new Map<number, SubjectItem>()
  for (const item of items) {
    if (!byClass.has(item.classId)) byClass.set(item.classId, item)
  }
  return Array.from(byClass.values())
}

function EnrollButton({ item, enrolled, pending, dropped, onEnroll, onPay, full }: {
  item: SubjectItem
  enrolled: boolean
  pending: boolean
  dropped: boolean
  onEnroll: (item: SubjectItem) => void
  onPay: () => void
  full?: boolean
}) {
  const base = `${full ? 'w-full py-2' : 'px-3 py-1.5'} rounded-lg text-xs font-semibold`
  if (enrolled) {
    if (item.paymentStatus === 'unpaid') {
      return (
        <button onClick={onPay} className={`${base} text-white transition-opacity hover:opacity-90`} style={{ backgroundColor: '#b45309', fontFamily: 'Outfit, sans-serif' }}>
          Pay Now · ${Number(item.amount || 0).toFixed(2)}
        </button>
      )
    }
    return (
      <button disabled className={`${base} text-white`} style={{ backgroundColor: '#059669', cursor: 'not-allowed', fontFamily: 'Outfit, sans-serif' }}>
        ✓ Approved · Paid
      </button>
    )
  }
  if (pending) {
    return (
      <button onClick={() => onEnroll(item)} className={`${base} text-white transition-opacity hover:opacity-90`} style={{ backgroundColor: '#b45309', fontFamily: 'Outfit, sans-serif' }}>
        ⏳ Pending — Complete Docs
      </button>
    )
  }
  return (
    <button
      onClick={() => onEnroll(item)}
      className={`${base} text-white transition-opacity hover:opacity-90`}
      style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}
    >
      {dropped ? 'Re-enroll' : 'Enroll'}
    </button>
  )
}