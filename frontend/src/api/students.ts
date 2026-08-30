import type { Student } from '../data/mockData'

const BASE_URL = '/api/students'

type ApiStudent = {
  id: number
  code: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  department_id: number | null
  gender: 'male' | 'female' | 'other' | null
  date_of_birth: string | null
  address: string | null
  status: 'active' | 'inactive'
  enrolled_at: string | null
}

export type StudentPayload = Partial<{
  firstName: string
  lastName: string
  email: string
  phone: string
  departmentId: number
  gender: string
  dateOfBirth: string
  address: string
  status: string
}>

function toApiPayload(payload: StudentPayload): Record<string, unknown> {
  const api: Record<string, unknown> = {}
  if (payload.firstName !== undefined) api.first_name = payload.firstName
  if (payload.lastName !== undefined) api.last_name = payload.lastName
  if (payload.email !== undefined) api.email = payload.email
  if (payload.phone !== undefined) api.phone = payload.phone
  if (payload.departmentId !== undefined) api.department_id = payload.departmentId
  if (payload.gender !== undefined) api.gender = payload.gender
  if (payload.dateOfBirth !== undefined) api.date_of_birth = payload.dateOfBirth || null
  if (payload.address !== undefined) api.address = payload.address
  if (payload.status !== undefined) api.status = payload.status
  return api
}

function fromApi(row: ApiStudent): Student {
  return {
    id: row.id,
    code: row.code ?? '',
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone ?? '',
    departmentId: row.department_id ?? 1,
    gender: (row.gender ?? 'male') as Student['gender'],
    dateOfBirth: row.date_of_birth ?? '',
    address: row.address ?? '',
    status: row.status,
    enrolledAt: row.enrolled_at ?? '',
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

export async function listStudents(): Promise<Student[]> {
  const res = await fetch(BASE_URL)
  const rows = await handleResponse<ApiStudent[]>(res)
  return rows.map(fromApi)
}

export async function createStudent(payload: StudentPayload): Promise<Student> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toApiPayload(payload)),
  })
  return fromApi(await handleResponse<ApiStudent>(res))
}

export async function updateStudent(
  id: number,
  payload: StudentPayload,
): Promise<Student> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toApiPayload(payload)),
  })
  return fromApi(await handleResponse<ApiStudent>(res))
}

export async function deleteStudent(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
  await handleResponse<{ message: string }>(res)
}
