export type Status = 'active' | 'inactive'

import { apiClient } from './client'

export interface Student {
  id: number
  code: string
  firstName: string
  lastName: string
  email: string
  phone: string
  departmentId: number | null
  gender: 'male' | 'female'
  dateOfBirth: string
  address: string
  photo?: string
  status: Status
  enrolledAt: string
}

const BASE_URL = '/students'

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
  departmentId: number | null
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
    departmentId: row.department_id,
    gender: (row.gender ?? 'male') as Student['gender'],
    dateOfBirth: row.date_of_birth ?? '',
    address: row.address ?? '',
    status: row.status,
    enrolledAt: row.enrolled_at ?? '',
  }
}

export async function listStudents(): Promise<Student[]> {
  const { data } = await apiClient.get<ApiStudent[]>(BASE_URL)
  return data.map(fromApi)
}

export async function createStudent(payload: StudentPayload): Promise<Student> {
  const { data } = await apiClient.post<ApiStudent>(BASE_URL, toApiPayload(payload))
  return fromApi(data)
}

export async function updateStudent(
  id: number,
  payload: StudentPayload,
): Promise<Student> {
  const { data } = await apiClient.put<ApiStudent>(`${BASE_URL}/${id}`, toApiPayload(payload))
  return fromApi(data)
}

export async function deleteStudent(id: number): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`)
}
