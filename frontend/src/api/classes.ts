export type ClassStatus = 'active' | 'inactive'

import { apiClient } from './client'

export interface Class {
  id: number
  name: string
  academicYearId: number
  subjectId: number
  room: string
  day: string
  startTime: string
  endTime: string
  status: ClassStatus
  teacherIds: number[]
}

const BASE_URL = '/classes'

type ApiClass = {
  id: number
  name: string
  academic_year_id: number | null
  subject_id: number | null
  room: string | null
  day: string | null
  start_time: string | null
  end_time: string | null
  status: 'active' | 'inactive'
}

type ClassPayload = Partial<{
  name: string
  academicYearId: number
  subjectId: number
  room: string
  day: string
  startTime: string
  endTime: string
  status: string
}>

function toApiPayload(payload: ClassPayload): Record<string, unknown> {
  const api: Record<string, unknown> = {}
  if (payload.name !== undefined) api.name = payload.name
  if (payload.academicYearId !== undefined) api.academic_year_id = payload.academicYearId
  if (payload.subjectId !== undefined) api.subject_id = payload.subjectId
  if (payload.room !== undefined) api.room = payload.room
  if (payload.day !== undefined) api.day = payload.day
  if (payload.startTime !== undefined) api.start_time = payload.startTime
  if (payload.endTime !== undefined) api.end_time = payload.endTime
  if (payload.status !== undefined) api.status = payload.status
  return api
}

function fromResponse(response: { data: ApiClass }): Class {
  return fromApi(response.data)
}

function fromApi(row: ApiClass): Class {
  return {
    id: row.id,
    name: row.name,
    academicYearId: row.academic_year_id ?? 0,
    subjectId: row.subject_id ?? 0,
    room: row.room ?? '',
    day: row.day ?? '',
    startTime: row.start_time ?? '',
    endTime: row.end_time ?? '',
    status: row.status,
    teacherIds: [],
  }
}

export async function listClasses(): Promise<Class[]> {
  const { data } = await apiClient.get<{ data: ApiClass[] }>(BASE_URL)
  return data.data.map(fromApi)
}

export async function listMyClasses(): Promise<Class[]> {
  const { data } = await apiClient.get<ApiClass[]>(`${BASE_URL}/mine`)
  return data.map(fromApi)
}

export async function getClass(id: number): Promise<Class> {
  const { data } = await apiClient.get<{ data: ApiClass }>(`${BASE_URL}/${id}`)
  return fromApi(data.data)
}

export async function createClass(payload: ClassPayload): Promise<Class> {
  const { data } = await apiClient.post<{ data: ApiClass }>(BASE_URL, toApiPayload(payload))
  return fromResponse(data)
}

export async function updateClass(id: number, payload: ClassPayload): Promise<Class> {
  const { data } = await apiClient.put<{ data: ApiClass }>(`${BASE_URL}/${id}`, toApiPayload(payload))
  return fromResponse(data)
}

export async function deleteClass(id: number): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`)
}
