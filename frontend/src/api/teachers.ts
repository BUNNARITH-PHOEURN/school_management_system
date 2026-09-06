export type TeacherStatus = 'active' | 'inactive'
export interface Teacher {
  id: number; code: string; firstName: string; lastName: string; email: string; phone: string
  departmentId: number; gender: 'male' | 'female' | 'other'; specialization: string; status: TeacherStatus; joinedAt: string
}
export type TeacherPayload = Partial<Omit<Teacher, 'id' | 'code' | 'joinedAt'>>
type ApiTeacher = { id: number; code: string | null; first_name: string; last_name: string; email: string; phone: string | null; department_id: number | null; gender: Teacher['gender'] | null; specialization: string | null; status: TeacherStatus; joined_at: string | null }
const BASE_URL = '/api/teachers'
const fromApi = (row: ApiTeacher): Teacher => ({ id: row.id, code: row.code ?? '', firstName: row.first_name, lastName: row.last_name, email: row.email, phone: row.phone ?? '', departmentId: row.department_id ?? 0, gender: row.gender ?? 'other', specialization: row.specialization ?? '', status: row.status, joinedAt: row.joined_at ?? '' })
const toApi = (payload: TeacherPayload) => ({ first_name: payload.firstName, last_name: payload.lastName, email: payload.email, phone: payload.phone, department_id: payload.departmentId, gender: payload.gender, specialization: payload.specialization, status: payload.status })
async function request<T>(url: string, options?: RequestInit): Promise<T> { const res = await fetch(url, options); const body = await res.json().catch(() => null); if (!res.ok) throw new Error(body?.errors?.join(', ') || body?.error || `Request failed (${res.status})`); return body as T }
export async function listTeachers() { return (await request<ApiTeacher[]>(BASE_URL)).map(fromApi) }
export async function createTeacher(payload: TeacherPayload) { return fromApi(await request<ApiTeacher>(BASE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toApi(payload)) })) }
export async function updateTeacher(id: number, payload: TeacherPayload) { return fromApi(await request<ApiTeacher>(`${BASE_URL}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toApi(payload)) })) }
export async function deleteTeacher(id: number) { await request(`${BASE_URL}/${id}`, { method: 'DELETE' }) }
