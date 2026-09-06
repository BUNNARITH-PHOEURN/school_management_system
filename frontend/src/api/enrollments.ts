export type EnrollmentStatus = 'enrolled' | 'dropped' | 'completed'

import { apiClient } from './client'

export interface Enrollment {
  id: number
  studentId: number
  classId: number
  enrolledAt: string
  status: EnrollmentStatus
}

const BASE_URL = '/enrollments'

export type EnrollmentWithNames = Enrollment & {
  studentName: string
  studentCode: string
  className: string
}

type ApiEnrollment = {
  id: number
  student_id: number
  class_id: number
  enrolled_at: string | null
  status: EnrollmentStatus
  student_name: string | null
  student_code: string | null
  class_name: string | null
}

function formatDate(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function fromApi(row: ApiEnrollment): EnrollmentWithNames {
  return {
    id: row.id,
    studentId: row.student_id,
    classId: row.class_id,
    enrolledAt: formatDate(row.enrolled_at),
    status: row.status,
    studentName: row.student_name ?? '',
    studentCode: row.student_code ?? '',
    className: row.class_name ?? '',
  }
}

export async function listEnrollments(): Promise<EnrollmentWithNames[]> {
  const { data } = await apiClient.get<ApiEnrollment[]>(BASE_URL)
  return data.map(fromApi)
}

export async function createEnrollment(payload: {
  studentId: number
  classId: number
}): Promise<EnrollmentWithNames> {
  const { data } = await apiClient.post<ApiEnrollment>(BASE_URL, {
    student_id: payload.studentId,
    class_id: payload.classId,
  })
  return fromApi(data)
}

export async function updateEnrollment(
  id: number,
  status: EnrollmentStatus,
): Promise<EnrollmentWithNames> {
  const { data } = await apiClient.put<ApiEnrollment>(`${BASE_URL}/${id}`, { status })
  return fromApi(data)
}

export async function deleteEnrollment(id: number): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`)
}