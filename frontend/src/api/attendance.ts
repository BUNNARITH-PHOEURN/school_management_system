export type AttendanceStatus = 'present' | 'absent' | 'late' | 'permission'

import { authHeaders } from './session'

export interface AttendanceRecord {
  id: number
  studentId: number
  classId: number
  date: string
  status: AttendanceStatus
  remarks: string
}

const BASE_URL = '/api/attendance'

export type AttendanceWithNames = AttendanceRecord & {
  studentName: string
  studentCode: string
  className: string
}

type ApiAttendance = {
  id: number
  student_id: number
  class_id: number
  date: string
  status: AttendanceStatus
  remarks: string | null
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

function fromApi(row: ApiAttendance): AttendanceWithNames {
  return {
    id: row.id,
    studentId: row.student_id,
    classId: row.class_id,
    date: formatDate(row.date),
    status: row.status,
    remarks: row.remarks ?? '',
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

export async function listAttendance(classId?: number, date?: string): Promise<AttendanceWithNames[]> {
  const params = new URLSearchParams()
  if (classId !== undefined) params.set('class_id', String(classId))
  if (date) params.set('date', date)
  const qs = params.toString()

  const res = await fetch(qs ? `${BASE_URL}?${qs}` : BASE_URL)
  const rows = await handleResponse<ApiAttendance[]>(res)
  return rows.map(fromApi)
}

export async function createAttendance(payload: {
  studentId: number
  classId: number
  date: string
  status: AttendanceStatus
  remarks?: string
}): Promise<AttendanceWithNames> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      student_id: payload.studentId,
      class_id: payload.classId,
      date: payload.date,
      status: payload.status,
      remarks: payload.remarks ?? '',
    }),
  })
  return fromApi(await handleResponse<ApiAttendance>(res))
}

export async function saveAttendance(
  records: {
    studentId: number
    classId: number
    date: string
    status: AttendanceStatus
    remarks: string
  }[],
): Promise<void> {
  const res = await fetch(`${BASE_URL}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(
      records.map((r) => ({
        student_id: r.studentId,
        class_id: r.classId,
        date: r.date,
        status: r.status,
        remarks: r.remarks,
      })),
    ),
  })
  await handleResponse<{ message: string }>(res)
}

export async function updateAttendance(
  id: number,
  payload: { status?: AttendanceStatus; remarks?: string },
): Promise<AttendanceWithNames> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return fromApi(await handleResponse<ApiAttendance>(res))
}

export async function deleteAttendance(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE', headers: authHeaders() })
  await handleResponse<{ message: string }>(res)
}