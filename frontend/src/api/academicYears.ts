import { apiClient } from './client'

export type AcademicYearStatus = 'active' | 'inactive'

export interface AcademicYear {
  id: number
  name: string
  startDate: string
  endDate: string
  status: AcademicYearStatus
}

type ApiAcademicYear = {
  id: number
  name: string
  start_date: string
  end_date: string
  status: AcademicYearStatus
}

const BASE_URL = '/academicYears'

function fromApi(row: ApiAcademicYear): AcademicYear {
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date.slice(0, 10),
    endDate: row.end_date.slice(0, 10),
    status: row.status,
  }
}

export async function listAcademicYears(): Promise<AcademicYear[]> {
  const { data } = await apiClient.get<{ data: ApiAcademicYear[] }>(BASE_URL)
  return data.data.map(fromApi)
}

export async function createAcademicYear(payload: Omit<AcademicYear, 'id' | 'status'> & { status?: AcademicYearStatus }): Promise<AcademicYear> {
  const { data } = await apiClient.post<{ data: ApiAcademicYear }>(BASE_URL, {
    name: payload.name, start_date: payload.startDate, end_date: payload.endDate, status: payload.status,
  })
  return fromApi(data.data)
}

export async function updateAcademicYear(id: number, payload: Partial<Omit<AcademicYear, 'id'>>): Promise<AcademicYear> {
  const { data } = await apiClient.put<{ data: ApiAcademicYear }>(`${BASE_URL}/${id}`, {
    name: payload.name, start_date: payload.startDate, end_date: payload.endDate, status: payload.status,
  })
  return fromApi(data.data)
}

export async function deleteAcademicYear(id: number): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`)
}
