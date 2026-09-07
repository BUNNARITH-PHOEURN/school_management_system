import { apiClient } from './client'

export interface Subject {
  id: number
  code: string
  name: string
  credits: number
  description: string | null
  department_id: number | null
  status: 'active' | 'inactive'
}

export type SubjectPayload = { name: string; code: string; credits: number; description: string; department_id: number; status?: Subject['status'] }

export async function listSubjects(): Promise<Subject[]> {
  const { data } = await apiClient.get<{ subjects: Subject[] }>('/subjects')
  return data.subjects
}

export async function listSubjectsPage(params: { page: number; limit: number; search?: string; departmentId?: number | 'all' }): Promise<{ data: Subject[]; total: number; page: number; totalPages: number }> {
  const query: Record<string, string> = { page: String(params.page), limit: String(params.limit) }
  if (params.search) query.search = params.search
  if (params.departmentId && params.departmentId !== 'all') query.department_id = String(params.departmentId)
  const { data } = await apiClient.get<{ data: Subject[]; total: number; page: number; totalPages: number }>('/subjects', { params: query })
  return data
}

export async function createSubject(payload: SubjectPayload): Promise<Subject> {
  const { data } = await apiClient.post<{ subject: Subject }>('/subjects', payload)
  return data.subject
}

export async function updateSubject(id: number, payload: Partial<SubjectPayload>): Promise<Subject> {
  const { data } = await apiClient.put<{ subject: Subject }>(`/subjects/${id}`, payload)
  return data.subject
}

export async function updateSubjectStatus(id: number, status: Subject['status']): Promise<Subject> {
  const { data } = await apiClient.patch<{ subject: Subject }>(`/subjects/${id}/status`, { status })
  return data.subject
}

export async function deleteSubject(id: number): Promise<void> {
  await apiClient.delete(`/subjects/${id}`)
}
