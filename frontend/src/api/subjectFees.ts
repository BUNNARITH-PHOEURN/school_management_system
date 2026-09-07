import { apiClient } from './client'

export interface SubjectFee {
  id: number
  subjectId: number
  academicYearId: number
  fee: number
  subjectCode: string
  subjectName: string
  academicYearName: string
}

type ApiSubjectFee = {
  id: number
  subject_id: number
  academic_year_id: number
  fee: string | number
  subject_code: string
  subject_name: string
  academic_year_name: string
}

function fromApi(row: ApiSubjectFee): SubjectFee {
  return {
    id: row.id,
    subjectId: row.subject_id,
    academicYearId: row.academic_year_id,
    fee: Number(row.fee),
    subjectCode: row.subject_code,
    subjectName: row.subject_name,
    academicYearName: row.academic_year_name,
  }
}

export async function listSubjectFees(): Promise<SubjectFee[]> {
  const { data } = await apiClient.get<{ fees: ApiSubjectFee[] }>('/subject-fees')
  return data.fees.map(fromApi)
}

export async function listSubjectFeesPage(params: { page: number; limit: number; search?: string }): Promise<{ data: SubjectFee[]; total: number; page: number; totalPages: number }> {
  const query: Record<string, string> = { page: String(params.page), limit: String(params.limit) }
  if (params.search) query.search = params.search
  const { data } = await apiClient.get<{ data: ApiSubjectFee[]; total: number; page: number; totalPages: number }>('/subject-fees', { params: query })
  return { ...data, data: data.data.map(fromApi) }
}

export async function upsertSubjectFee(payload: {
  subjectId: number
  academicYearId: number
  fee: number
}): Promise<SubjectFee> {
  const { data } = await apiClient.post<{ fee: ApiSubjectFee }>('/subject-fees', {
    subject_id: payload.subjectId,
    academic_year_id: payload.academicYearId,
    fee: payload.fee,
  })
  return fromApi(data.fee)
}

export async function deleteSubjectFee(id: number): Promise<void> {
  await apiClient.delete(`/subject-fees/${id}`)
}