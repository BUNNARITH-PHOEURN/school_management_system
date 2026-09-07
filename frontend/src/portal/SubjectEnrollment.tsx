import { useEffect, useMemo, useState } from 'react'
import type { SessionUser } from '../api/auth'
import { listEnrollments, createEnrollment, type EnrollmentWithNames } from '../api/enrollments'
import { listClasses, type Class } from '../api/classes'
import { listSubjects, type Subject } from '../api/subjects'
import { listDepartments, type DepartmentRecord } from '../api/departments'
import { classSchedule, type SubjectItem } from './shared'
import Modal from '../components/Modal'
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
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState<number | 'all'>('all')
  const [view, setView] = useState<'card' | 'table'>('card')
  const [pending, setPending] = useState<SubjectItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [classRows, subjectRows, enrollmentRows, deptResult] = await Promise.all([
        listClasses(),
        listSubjects(),
        listEnrollments(),
        listDepartments(),
      ])
      setClasses(classRows)
      setSubjects(subjectRows)
      setEnrollments(enrollmentRows.filter(e => e.studentId === session.studentId))
      setDepartments(deptResult.departments)
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
    return classes
      .filter(c => c.status === 'active')
      .map(cls => {
        const subject = subjects.find(s => s.id === cls.subjectId)
        if (!subject) return null
        const enrollment = enrolledByClass.get(cls.id)
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
          day: cls.day ?? '',
          schedule: classSchedule(cls),
          room: cls.room ?? '',
        }
      })
      .filter((item): item is SubjectItem => item !== null)
  }, [enrollments, classes, subjects])
  const enrolledIds = new Set(enrollments.filter(e => e.status === 'enrolled').map(e => e.classId))
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
    `${item.subjectName} ${item.subjectCode} ${item.className}`.toLowerCase().includes(search.toLowerCase()),
  )

  const handleConfirm = async () => {
    if (!pending) return
    setSubmitting(true)
    try {
      await createEnrollment({ studentId: session.studentId as number, classId: pending.classId })
      toast('success', `Enrolled in ${pending.subjectName}.`)
      setPending(null)
      await load()
    } catch (err) {
      toast('error', getApiError(err, 'Unable to enroll in this subject.'))
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
            return (
              <div key={item.enrollmentId !== 0 ? item.enrollmentId : `${item.classId}-${item.subjectId}`} className="bg-white rounded-xl border p-5 flex flex-col" style={{ borderColor: '#e2e7f0' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3451c7', fontFamily: 'Outfit, sans-serif' }}>
                    {item.subjectName.charAt(0)}
                  </div>
                  <Badge variant="neutral">{item.credits} credits</Badge>
                </div>
                <h3 className="text-sm font-semibold mt-3" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{item.subjectName}</h3>
                <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{item.subjectCode} · {item.className}</div>
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
                  <EnrollButton item={item} enrolled={enrolled} dropped={!!dropped} onEnroll={setPending} full />
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
                <th className="px-4 py-3 font-semibold">Class</th>
                <th className="px-4 py-3 font-semibold">Credits</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Schedule</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Room</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#f0f3fa' }}>
              {filtered.map(({ item }) => {
                const enrolled = enrolledIds.has(item.classId)
                const dropped = enrollments.find(e => e.classId === item.classId && e.status === 'dropped')
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
                    <td className="px-4 py-3"><Badge variant="neutral">{item.credits}</Badge></td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell" style={{ color: '#6b7280' }}>{item.schedule}</td>
                    <td className="px-4 py-3 text-sm hidden sm:table-cell" style={{ color: '#374151' }}>{item.room || 'TBD'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <EnrollButton item={item} enrolled={enrolled} dropped={!!dropped} onEnroll={setPending} />
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
        title="Confirm Enrollment"
        width={440}
        footer={
          <>
            <button onClick={() => setPending(null)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={submitting} className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-60" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
              {submitting ? 'Enrolling…' : 'Confirm Enrollment'}
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
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border p-3" style={{ borderColor: '#e2e7f0' }}>
                  <div className="text-xs font-medium mb-0.5" style={{ color: '#9ca3af' }}>{label}</div>
                  <div style={{ color: '#1a1f36' }}>{value}</div>
                </div>
              ))}
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
              You're about to enroll in <strong style={{ color: '#1a1f36' }}>{pending.subjectName}</strong>. You can review your subjects anytime under <strong style={{ color: '#1a1f36' }}>My Subjects</strong>.
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

function EnrollButton({ item, enrolled, dropped, onEnroll, full }: {
  item: SubjectItem
  enrolled: boolean
  dropped: boolean
  onEnroll: (item: SubjectItem) => void
  full?: boolean
}) {
  const base = `${full ? 'w-full py-2' : 'px-3 py-1.5'} rounded-lg text-xs font-semibold`
  if (enrolled) {
    return (
      <button disabled className={`${base} text-white`} style={{ backgroundColor: '#059669', cursor: 'not-allowed', fontFamily: 'Outfit, sans-serif' }}>
        ✓ Enrolled
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