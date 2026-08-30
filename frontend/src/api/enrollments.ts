export type EnrollmentStatus = 'enrolled' | 'dropped'

export interface Enrollment {
  id: number
  studentId: number
  classId: number
  enrolledAt: string
  status: EnrollmentStatus
}

const BASE_URL = '/api/enrollments'

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

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const message =
      body && Array.isArray(body.errors)
        ? body.errors.join(', ')
        : body?.error || `Request failed (${res.status})`
    throw new Error(message)
  }
  return body as T
}

export async function listEnrollments(): Promise<EnrollmentWithNames[]> {
  const res = await fetch(BASE_URL)
  const rows = await handleResponse<ApiEnrollment[]>(res)
  return rows.map(fromApi)
}

export async function createEnrollment(payload: {
  studentId: number
  classId: number
}): Promise<EnrollmentWithNames> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student_id: payload.studentId,
      class_id: payload.classId,
    }),
  })
  return fromApi(await handleResponse<ApiEnrollment>(res))
}

export async function updateEnrollment(
  id: number,
  status: EnrollmentStatus,
): Promise<EnrollmentWithNames> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  return fromApi(await handleResponse<ApiEnrollment>(res))
}

export async function deleteEnrollment(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
  await handleResponse<{ message: string }>(res)
}