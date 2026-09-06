export type AttendanceStatus = 'present' | 'absent' | 'late' | 'permission'

import { apiClient } from './client'

export interface AttendanceRecord {
  id: number
  studentId: number
  classId: number
  date: string
  status: AttendanceStatus
  remarks: string
}

const BASE_URL = '/attendance'

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

export async function listAttendance(classId?: number, date?: string): Promise<AttendanceWithNames[]> {
  const params: Record<string, string> = {}
  if (classId !== undefined) params.class_id = String(classId)
  if (date) params.date = date

  const { data } = await apiClient.get<ApiAttendance[]>(BASE_URL, { params })
  return data.map(fromApi)
}

export async function createAttendance(payload: {
  studentId: number
  classId: number
  date: string
  status: AttendanceStatus
  remarks?: string
}): Promise<AttendanceWithNames> {
  const { data } = await apiClient.post<ApiAttendance>(BASE_URL, {
    student_id: payload.studentId,
    class_id: payload.classId,
    date: payload.date,
    status: payload.status,
    remarks: payload.remarks ?? '',
  })
  return fromApi(data)
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
  await apiClient.post(`${BASE_URL}/batch`, records.map((r) => ({
    student_id: r.studentId,
    class_id: r.classId,
    date: r.date,
    status: r.status,
    remarks: r.remarks,
  })))
}

export async function updateAttendance(
  id: number,
  payload: { status?: AttendanceStatus; remarks?: string },
): Promise<AttendanceWithNames> {
  const { data } = await apiClient.put<ApiAttendance>(`${BASE_URL}/${id}`, payload)
  return fromApi(data)
}

export async function deleteAttendance(id: number): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`)
}