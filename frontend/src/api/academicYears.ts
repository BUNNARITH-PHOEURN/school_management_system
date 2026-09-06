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

const BASE_URL = '/api/academicYears'

function fromApi(row: ApiAcademicYear): AcademicYear {
  return { id: row.id, name: row.name, startDate: row.start_date, endDate: row.end_date, status: row.status }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.message || body?.error || `Request failed (${res.status})`)
  return body as T
}

export async function listAcademicYears(): Promise<AcademicYear[]> {
  const body = await request<{ data: ApiAcademicYear[] }>(BASE_URL)
  return body.data.map(fromApi)
}

export async function createAcademicYear(payload: Omit<AcademicYear, 'id' | 'status'> & { status?: AcademicYearStatus }): Promise<AcademicYear> {
  const body = await request<{ data: ApiAcademicYear }>(BASE_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: payload.name, start_date: payload.startDate, end_date: payload.endDate, status: payload.status }),
  })
  return fromApi(body.data)
}

export async function updateAcademicYear(id: number, payload: Partial<Omit<AcademicYear, 'id'>>): Promise<AcademicYear> {
  const body = await request<{ data: ApiAcademicYear }>(`${BASE_URL}/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: payload.name, start_date: payload.startDate, end_date: payload.endDate, status: payload.status }),
  })
  return fromApi(body.data)
}

export async function deleteAcademicYear(id: number): Promise<void> {
  await request(`${BASE_URL}/${id}`, { method: 'DELETE' })
}
