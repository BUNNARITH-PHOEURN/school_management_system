import { apiClient } from './client'

export type TeacherStatus = 'active' | 'inactive'
export interface Teacher {
  id: number; code: string; firstName: string; lastName: string; email: string; phone: string
  departmentId: number; gender: 'male' | 'female' | 'other'; specialization: string; status: TeacherStatus; joinedAt: string
}
export type TeacherPayload = Partial<Omit<Teacher, 'id' | 'code' | 'joinedAt'>>
type ApiTeacher = { id: number; code: string | null; first_name: string; last_name: string; email: string; phone: string | null; department_id: number | null; gender: Teacher['gender'] | null; specialization: string | null; status: TeacherStatus; joined_at: string | null }
const BASE_URL = '/teachers'
const fromApi = (row: ApiTeacher): Teacher => ({ id: row.id, code: row.code ?? '', firstName: row.first_name, lastName: row.last_name, email: row.email, phone: row.phone ?? '', departmentId: row.department_id ?? 0, gender: row.gender ?? 'other', specialization: row.specialization ?? '', status: row.status, joinedAt: row.joined_at ?? '' })
const toApi = (payload: TeacherPayload) => ({ first_name: payload.firstName, last_name: payload.lastName, email: payload.email, phone: payload.phone, department_id: payload.departmentId, gender: payload.gender, specialization: payload.specialization, status: payload.status })
export async function listTeachers() { return (await apiClient.get<ApiTeacher[]>(BASE_URL)).data.map(fromApi) }
export async function createTeacher(payload: TeacherPayload) { return fromApi((await apiClient.post<ApiTeacher>(BASE_URL, toApi(payload))).data) }
export async function updateTeacher(id: number, payload: TeacherPayload) { return fromApi((await apiClient.put<ApiTeacher>(`${BASE_URL}/${id}`, toApi(payload))).data) }
export async function deleteTeacher(id: number) { await apiClient.delete(`${BASE_URL}/${id}`) }
