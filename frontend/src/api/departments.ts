import { apiClient } from './client'

export interface DepartmentRecord {
  id: number
  code: string
  name: string
  description: string | null
  status: 'active' | 'inactive'
  created_at?: string
  student_count: number
  teacher_count: number
}
export const listDepartments = async () => (await apiClient.get<{ departments: DepartmentRecord[] }>('/departments')).data
export const createDepartment = async (data: { name: string; code: string; description: string }) => (await apiClient.post<{ department: DepartmentRecord }>('/departments', data)).data
export const updateDepartment = async (id: number, data: { name: string; code: string; description: string }) => (await apiClient.put<{ department: DepartmentRecord }>(`/departments/${id}`, data)).data
export const updateDepartmentStatus = async (id: number, status: DepartmentRecord['status']) => (await apiClient.patch<{ department: DepartmentRecord }>(`/departments/${id}/status`, { status })).data