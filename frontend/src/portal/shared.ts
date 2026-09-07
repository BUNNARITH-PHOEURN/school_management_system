import type { Class } from '../api/classes'
import type { Subject } from '../api/subjects'
import type { EnrollmentWithNames } from '../api/enrollments'

export function formatTime(value: string): string {
  return value ? value.slice(0, 5) : ''
}

export function classSchedule(cls: Class): string {
  const parts: string[] = []
  if (cls.day) parts.push(cls.day)
  if (cls.startTime && cls.endTime) parts.push(`${formatTime(cls.startTime)} – ${formatTime(cls.endTime)}`)
  return parts.join(' · ') || 'Schedule TBD'
}

export interface SubjectItem {
  enrollmentId: number
  status: string
  enrolledAt: string
  classId: number
  className: string
  subjectId: number
  subjectName: string
  subjectCode: string
  credits: number
  academicYearId: number
  day: string
  schedule: string
  room: string
  startTime: string
  endTime: string
  amount: number
  paymentStatus: string
  docGrade12?: boolean
  docTranscript?: boolean
  docIdCopy?: boolean
  docsDeclared?: boolean
  notes?: string | null
}

export function buildSubjectItems(
  enrollments: EnrollmentWithNames[],
  classes: Class[],
  subjects: Subject[],
): SubjectItem[] {
  const subjectById = new Map(subjects.map(s => [s.id, s]))
  return enrollments.map(enrollment => {
    const cls = classes.find(c => c.id === enrollment.classId)
    const subject = cls ? subjectById.get(cls.subjectId) : undefined
    return {
      enrollmentId: enrollment.id,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      classId: enrollment.classId,
      className: cls?.name ?? enrollment.className ?? 'Class',
      subjectId: cls?.subjectId ?? 0,
      subjectName: subject?.name ?? (cls ? cls.name : 'Subject'),
      subjectCode: subject?.code ?? '',
      credits: subject?.credits ?? 0,
      academicYearId: cls?.academicYearId ?? 0,
      day: cls?.day ?? '',
      schedule: cls ? classSchedule(cls) : 'Schedule TBD',
      room: cls?.room ?? '',
      startTime: cls?.startTime ?? '',
      endTime: cls?.endTime ?? '',
      amount: enrollment.amount ?? 0,
      paymentStatus: enrollment.paymentStatus ?? 'unpaid',
      docGrade12: enrollment.docGrade12,
      docTranscript: enrollment.docTranscript,
      docIdCopy: enrollment.docIdCopy,
      docsDeclared: enrollment.docsDeclared,
      notes: enrollment.notes,
    }
  })
}

export function initials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

export function formatDate(value: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}