import { useEffect, useMemo, useState } from 'react'
import type { SessionUser } from '../api/auth'
import { listEnrollments, updateEnrollment, type EnrollmentWithNames } from '../api/enrollments'
import { listClasses, type Class } from '../api/classes'
import { listSubjects, type Subject } from '../api/subjects'
import { buildSubjectItems, formatDate } from './shared'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import { useToast } from '../context/ToastContext'
import { getApiError } from '../api/client'

interface MySubjectsProps {
  session: SessionUser
}

export default function MySubjects({ session }: MySubjectsProps) {
  const { toast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentWithNames[]>([])
  const [loading, setLoading] = useState(true)
  const [dropping, setDropping] = useState<{ id: number; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [classRows, subjectRows, enrollmentRows] = await Promise.all([
        listClasses(),
        listSubjects(),
        listEnrollments(),
      ])
      setClasses(classRows)
      setSubjects(subjectRows)
      setEnrollments(enrollmentRows.filter(e => e.studentId === session.studentId))
    } catch {
      toast('error', 'Unable to load your subjects.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.studentId])

  const items = useMemo(
    () => buildSubjectItems(enrollments, classes, subjects).filter(i => i.subjectId > 0),
    [enrollments, classes, subjects],
  )
  const activeItems = items.filter(i => i.status === 'enrolled')
  const totalCredits = activeItems.reduce((sum, i) => sum + i.credits, 0)

  const handleDrop = async () => {
    if (!dropping) return
    setSubmitting(true)
    try {
      await updateEnrollment(dropping.id, 'dropped')
      toast('success', `Dropped ${dropping.name}.`)
      setDropping(null)
      await load()
    } catch (err) {
      toast('error', getApiError(err, 'Unable to drop this subject.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>My Subjects</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>
            {activeItems.length} enrolled · {totalCredits} total credits
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-xl border h-40 animate-pulse" style={{ borderColor: '#e2e7f0', backgroundColor: '#f8f9fd' }} />
          ))}
        </div>
      ) : activeItems.length === 0 ? (
        <div className="bg-white rounded-xl border py-14 text-center" style={{ borderColor: '#e2e7f0' }}>
          <div className="text-3xl mb-3">🎒</div>
          <p className="text-sm font-medium" style={{ color: '#374151' }}>You haven't enrolled in any subjects yet</p>
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Head over to Subject Enrollment to browse available classes.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeItems.map(item => (
            <div key={item.enrollmentId} className="bg-white rounded-xl border p-5 flex flex-col" style={{ borderColor: '#e2e7f0' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3451c7', fontFamily: 'Outfit, sans-serif' }}>
                  {item.subjectName.charAt(0)}
                </div>
                <Badge variant="success">Enrolled</Badge>
              </div>
              <h3 className="text-sm font-semibold mt-3" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{item.subjectName}</h3>
              <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{item.subjectCode} · {item.credits} credits</div>
              <div className="mt-3 space-y-1.5 text-xs" style={{ color: '#6b7280' }}>
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  {item.schedule}
                </div>
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" /></svg>
                  {item.room || 'Room TBD'}
                </div>
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  Enrolled {formatDate(item.enrolledAt)}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex-1 flex items-end" style={{ borderColor: '#f0f3fa' }}>
                <button
                  onClick={() => setDropping({ id: item.enrollmentId, name: item.subjectName })}
                  className="w-full py-2 rounded-lg text-xs font-semibold transition-colors"
                  style={{ fontFamily: 'Outfit, sans-serif', color: '#e11d48', backgroundColor: '#fff5f5', border: '1px solid #fecaca' }}
                >
                  Drop Subject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={dropping !== null}
        onClose={() => setDropping(null)}
        title="Drop Subject"
        width={400}
        footer={
          <>
            <button onClick={() => setDropping(null)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>
              Keep Subject
            </button>
            <button onClick={handleDrop} disabled={submitting} className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-60" style={{ backgroundColor: '#e11d48', fontFamily: 'Outfit, sans-serif' }}>
              {submitting ? 'Dropping…' : 'Yes, Drop it'}
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>
          Are you sure you want to drop <strong style={{ color: '#1a1f36' }}>{dropping?.name}</strong>? You can re-enroll later if you change your mind.
        </p>
      </Modal>
    </div>
  )
}