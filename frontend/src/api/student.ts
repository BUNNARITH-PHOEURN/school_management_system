import { apiClient } from './client'
import { listDepartments } from './departments'
import { listEnrollments, type EnrollmentWithNames } from './enrollments'

export type StudentGender = 'male' | 'female' | 'other' | null

export interface StudentProfile {
  id: number
  code: string
  firstName: string
  lastName: string
  email: string
  phone: string
  departmentId: number | null
  departmentName: string
  gender: StudentGender
  dateOfBirth: string
  address: string
  status: 'active' | 'inactive'
  enrolledAt: string
}

type ApiStudentRow = {
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

export async function getNextStudentCode(): Promise<string> {
  const { data } = await apiClient.get<{ code: string }>('/students/next-code')
  return data.code
}

export async function getStudentProfile(id: number): Promise<StudentProfile> {
  const { data } = await apiClient.get<ApiStudentRow>(`/students/${id}`)
  const { departments } = await listDepartments()
  const dept = departments.find(d => d.id === data.department_id)
  return {
    id: data.id,
    code: data.code ?? '',
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    phone: data.phone ?? '',
    departmentId: data.department_id,
    departmentName: dept?.name ?? 'Unassigned',
    gender: (data.gender ?? null) as StudentGender,
    dateOfBirth: data.date_of_birth ? data.date_of_birth.slice(0, 10) : '',
    address: data.address ?? '',
    status: data.status,
    enrolledAt: data.enrolled_at ? data.enrolled_at.slice(0, 10) : '',
  }
}

export async function listStudentEnrollments(studentId: number): Promise<EnrollmentWithNames[]> {
  const enrollments = await listEnrollments()
  return enrollments.filter(e => e.studentId === studentId)
}