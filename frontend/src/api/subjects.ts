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

export async function listSubjects(): Promise<Subject[]> {
  const { data } = await apiClient.get<{ subjects: Subject[] }>('/subjects')
  return data.subjects
}
