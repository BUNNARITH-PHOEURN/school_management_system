import { apiClient } from './client'

export type Role = 'admin' | 'moderator' | 'teacher' | 'student'

export interface SessionUser {
  id: number
  name: string
  email: string
  role: Role
  status: 'active' | 'inactive'
  lastLogin: string | null
  phone?: string
  bio?: string
  createdAt?: string | null
  avatarUrl?: string
  studentId?: number
  teacherId?: number
}

export interface StudentRegistration {
  studentCode?: string
  departmentId?: number | null
  dateOfBirth?: string
  gender?: string
  phone?: string
  address?: string
  photo?: string
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const { data } = await apiClient.post<{ user: SessionUser }>('/auth/login', { email, password })
  return data.user
}

export async function register(
  name: string,
  email: string,
  password: string,
  student?: StudentRegistration,
): Promise<SessionUser> {
  const payload: Record<string, unknown> = { name, email, password }
  if (student) {
    if (student.studentCode) payload.student_code = student.studentCode
    payload.department_id = student.departmentId ?? null
    if (student.dateOfBirth) payload.date_of_birth = student.dateOfBirth
    if (student.gender) payload.gender = student.gender
    if (student.phone) payload.phone = student.phone
    if (student.address) payload.address = student.address
    if (student.photo) payload.photo = student.photo
  }
  const { data } = await apiClient.post<{ user: SessionUser }>('/auth/register', payload)
  return data.user
}

export async function checkSession(userId: number): Promise<SessionUser> {
  const { data } = await apiClient.get<{ user: SessionUser }>('/auth/me', { headers: { 'x-user-id': String(userId) } })
  return data.user
}

export async function updateProfile(data: { name: string; email: string; phone: string; bio: string; avatarUrl: string }): Promise<SessionUser> {
  const response = await apiClient.put<{ user: SessionUser }>('/auth/me', data)
  return response.data.user
}

export async function updatePassword(current: string, next: string): Promise<void> {
  await apiClient.put('/auth/password', { current, next })
}

export async function deactivateAccount(): Promise<void> {
  await apiClient.delete('/auth/me')
}

