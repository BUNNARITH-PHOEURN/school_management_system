import { useEffect, useMemo, useState } from 'react'
import type { SessionUser } from '../api/auth'
import { listEnrollments, type EnrollmentWithNames } from '../api/enrollments'
import { listClasses, type Class } from '../api/classes'
import { listSubjects, type Subject } from '../api/subjects'
import { buildSubjectItems } from './shared'
import Badge, { statusVariant } from '../components/Badge'
import { useToast } from '../context/ToastContext'

interface EnrollmentHistoryProps {
  session: SessionUser
}

export default function EnrollmentHistory({ session }: EnrollmentHistoryProps) {
  const { toast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentWithNames[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listEnrollments(), listClasses(), listSubjects()])
      .then(([enrollmentRows, classRows, subjectRows]) => {
        setEnrollments(enrollmentRows.filter(e => e.studentId === session.studentId))
        setClasses(classRows)
        setSubjects(subjectRows)
      })
      .catch(() => toast('error', 'Unable to load enrollment history.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.studentId])

  const items = useMemo(
    () => buildSubjectItems(enrollments, classes, subjects).filter(i => i.subjectId > 0),
    [enrollments, classes, subjects],
  )
  const sorted = [...items].sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt))
  const count = { enrolled: 0, dropped: 0 }
  for (const i of items) if (i.status === 'enrolled') count.enrolled++
  else if (i.status === 'dropped') count.dropped++

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Enrollment History</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>A record of every subject you've joined</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: '#e2e7f0' }}>
          <div className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#059669' }}>{count.enrolled}</div>
          <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Enrolled</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: '#e2e7f0' }}>
          <div className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#e11d48' }}>{count.dropped}</div>
          <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Dropped</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8f9fd', borderBottom: '1px solid #e2e7f0' }}>
                {['Subject', 'Class', 'Enrolled Date', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4}><div className="p-10 text-center text-sm" style={{ color: '#9ca3af' }}>Loading…</div></td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={4}><div className="py-12 text-center text-sm" style={{ color: '#9ca3af' }}>No enrollment history yet.</div></td>
                </tr>
              ) : sorted.map(item => (
                <tr key={item.enrollmentId} className="border-t" style={{ borderColor: '#f0f3fa' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3451c7', fontFamily: 'Outfit, sans-serif' }}>
                        {item.subjectName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: '#1a1f36' }}>{item.subjectName}</div>
                        <div className="text-xs" style={{ color: '#9ca3af' }}>{item.subjectCode} · {item.credits} credits</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#374151' }}>{item.className}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>{item.enrolledAt}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant(item.status)} dot>{item.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs" style={{ color: '#9ca3af' }}>Dates shown as recorded at enrollment time.</p>
    </div>
  )
}