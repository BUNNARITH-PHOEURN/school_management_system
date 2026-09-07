import { useEffect, useMemo, useState } from 'react'
import type { SessionUser } from '../api/auth'
import { listMyClasses, type Class } from '../api/classes'
import { listSubjects, type Subject } from '../api/subjects'
import ScheduleGrid, { type ScheduleSlot } from './ScheduleGrid'

interface TeacherScheduleProps {
  session: SessionUser
}

export default function TeacherSchedule({ session }: TeacherScheduleProps) {
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([listMyClasses(), listSubjects()])
      .then(([classRows, subjectRows]) => {
        setClasses(classRows)
        setSubjects(subjectRows)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load your schedule.'))
      .finally(() => setLoading(false))
  }, [session.teacherId])

  const slots = useMemo<ScheduleSlot[]>(
    () => classes.map((cls, i) => {
      const subject = subjects.find(s => s.id === cls.subjectId)
      return {
        id: `c${cls.id}`,
        name: cls.name,
        detail: subject ? `${subject.code}` : undefined,
        day: cls.day,
        startTime: cls.startTime,
        endTime: cls.endTime,
        room: cls.room,
        colorKey: cls.subjectId || i,
      }
    }),
    [classes, subjects],
  )

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>My Schedule</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>
          {classes.length} class{classes.length === 1 ? '' : 'es'} · weekly calendar
        </p>
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
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Courses assigned to you will appear here as a weekly calendar.</p>
        </div>
      ) : (
        <ScheduleGrid slots={slots} />
      )}

      {classes.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map(cls => {
            const subject = subjects.find(s => s.id === cls.subjectId)
            return (
              <div key={cls.id} className="bg-white rounded-xl border px-4 py-3 flex items-center gap-3" style={{ borderColor: '#e2e7f0' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#e7f7f0', color: '#059669', fontFamily: 'Outfit, sans-serif' }}>
                  {cls.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{cls.name}</div>
                  <div className="text-xs truncate" style={{ color: '#9ca3af' }}>
                    {subject?.code ? `${subject.code} · ` : ''}{cls.day}{cls.startTime ? ` · ${cls.startTime.slice(0, 5)}–${cls.endTime.slice(0, 5)}` : ''}{cls.room ? ` · ${cls.room}` : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}