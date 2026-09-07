import { apiClient } from './client'

export interface TeacherAssignment {
  class_id: number
  teacher_id: number
  class_name: string
  teacher_code: string
  first_name: string
  last_name: string
  specialization: string | null
  teacher_status: 'active' | 'inactive'
}

export async function listTeacherAssignments(): Promise<TeacherAssignment[]> {
  const { data } = await apiClient.get<{ assignments: TeacherAssignment[] }>('/teacher-assignments')
  return data.assignments
}

export async function assignTeacher(classId: number, teacherId: number): Promise<void> {
  await apiClient.post('/teacher-assignments', { class_id: classId, teacher_id: teacherId })
}

export async function removeTeacherAssignment(classId: number, teacherId: number): Promise<void> {
  await apiClient.delete(`/teacher-assignments/${classId}/${teacherId}`)
}
