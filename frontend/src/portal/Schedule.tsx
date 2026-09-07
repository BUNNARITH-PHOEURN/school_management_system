import { useEffect, useMemo, useState } from 'react'
import type { SessionUser } from '../api/auth'
import { listEnrollments, type EnrollmentWithNames } from '../api/enrollments'
import { listClasses, type Class } from '../api/classes'
import { listSubjects, type Subject } from '../api/subjects'
import { buildSubjectItems, type SubjectItem } from './shared'
import ScheduleGrid, { type ScheduleSlot } from './ScheduleGrid'
import type { StudentPage } from '../components/StudentSidebar'

interface ScheduleProps {
  session: SessionUser
  onNavigate: (page: StudentPage) => void
}

export default function Schedule({ session, onNavigate }: ScheduleProps) {
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentWithNames[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [classRows, subjectRows, enrollmentRows] = await Promise.all([
        listClasses(),
        listSubjects(),
        listEnrollments(),
      ])
      setClasses(classRows)
      setSubjects(subjectRows)
      setEnrollments(enrollmentRows.filter(e => e.studentId === session.studentId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your schedule.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.studentId])

  const items = useMemo(
    () => buildSubjectItems(enrollments, classes, subjects).filter(i => i.status === 'approved' && i.subjectId > 0 && i.startTime && i.endTime),
    [enrollments, classes, subjects],
  )

  const slots = useMemo<ScheduleSlot[]>(
    () => items.map(item => ({
      id: `e${item.enrollmentId}`,
      name: item.subjectName,
      detail: item.className,
      day: item.day,
      startTime: item.startTime,
      endTime: item.endTime,
      room: item.room,
      colorKey: item.subjectId,
    })),
    [items],
  )

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>My Schedule</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>
            {items.length} subject{items.length === 1 ? '' : 's'} · weekly calendar
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border h-80 animate-pulse" style={{ borderColor: '#e2e7f0', backgroundColor: '#f8f9fd' }} />
      ) : error ? (
        <div className="bg-white rounded-xl border px-4 py-10 text-center text-sm" style={{ borderColor: '#fecaca', color: '#9f1239' }}>
          {error}
        </div>
      ) : slots.length === 0 ? (
        <div className="bg-white rounded-xl border py-14 text-center" style={{ borderColor: '#e2e7f0' }}>
          <div className="text-3xl mb-3">📅</div>
          <p className="text-sm font-medium" style={{ color: '#374151' }}>No scheduled classes yet</p>
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Your approved subjects will appear here as a weekly calendar.</p>
          <button
            onClick={() => onNavigate('enroll')}
            className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg text-white"
            style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}
          >
            Enroll in Subjects
          </button>
        </div>
      ) : (
        <ScheduleGrid slots={slots} />
      )}

      {items.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(item => (
            <div key={item.enrollmentId} className="bg-white rounded-xl border px-4 py-3 flex items-center gap-3" style={{ borderColor: '#e2e7f0' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3451c7', fontFamily: 'Outfit, sans-serif' }}>
                {item.subjectName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{item.subjectName}</div>
                <div className="text-xs truncate" style={{ color: '#9ca3af' }}>{item.schedule}{item.room ? ` · ${item.room}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}