export type ClassStatus = 'active' | 'inactive'

import { authHeaders } from './session'

export interface Class {
  id: number
  name: string
  academicYearId: number
  subjectId: number
  room: string
  day: string
  startTime: string
  endTime: string
  status: ClassStatus
  teacherIds: number[]
}

const BASE_URL = '/api/classes'

type ApiClass = {
  id: number
  name: string
  academic_year_id: number | null
  subject_id: number | null
  room: string | null
  day: string | null
  start_time: string | null
  end_time: string | null
  status: 'active' | 'inactive'
}

function fromApi(row: ApiClass): Class {
  return {
    id: row.id,
    name: row.name,
    academicYearId: row.academic_year_id ?? 0,
    subjectId: row.subject_id ?? 0,
    room: row.room ?? '',
    day: row.day ?? '',
    startTime: row.start_time ?? '',
    endTime: row.end_time ?? '',
    status: row.status,
    teacherIds: [],
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

export async function listClasses(): Promise<Class[]> {
  const res = await fetch(BASE_URL)
  const rows = await handleResponse<ApiClass[]>(res)
  return rows.map(fromApi)
}

export async function listMyClasses(): Promise<Class[]> {
  const res = await fetch(`${BASE_URL}/mine`, { headers: authHeaders() })
  const rows = await handleResponse<ApiClass[]>(res)
  return rows.map(fromApi)
}

export async function getClass(id: number): Promise<Class> {
  const res = await fetch(`${BASE_URL}/${id}`)
  return fromApi(await handleResponse<ApiClass>(res))
}

export async function createClass(payload: { name: string; status?: string }): Promise<Class> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return fromApi(await handleResponse<ApiClass>(res))
}

export async function updateClass(id: number, payload: Record<string, unknown>): Promise<Class> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return fromApi(await handleResponse<ApiClass>(res))
}

export async function deleteClass(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
  await handleResponse<{ message: string }>(res)
}