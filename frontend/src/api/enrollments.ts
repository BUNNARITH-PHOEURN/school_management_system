export type EnrollmentStatus = 'pending' | 'approved' | 'rejected' | 'dropped'
export type PaymentStatus = 'unpaid' | 'paid'

import { apiClient } from './client'

export interface Enrollment {
  id: number
  studentId: number
  classId: number
  enrolledAt: string
  status: EnrollmentStatus
  reviewedById: number | null
  reviewedAt: string | null
  notes: string | null
  docsDeclared: boolean
  docGrade12: boolean
  docTranscript: boolean
  docIdCopy: boolean
  amount: number
  paymentStatus: PaymentStatus
  paymentMethod: string | null
  paymentReference: string | null
  paidAt: string | null
}

const BASE_URL = '/enrollments'

export type EnrollmentWithNames = Enrollment & {
  studentName: string
  studentCode: string
  className: string
  subjectCode: string
  subjectName: string
  teacherNames: string
  reviewedByName: string | null
}

type ApiEnrollment = {
  id: number
  student_id: number
  class_id: number
  enrolled_at: string | null
  status: EnrollmentStatus
  reviewed_by: number | null
  reviewed_at: string | null
  notes: string | null
  docs_declared: number | null
  doc_grade12: number | null
  doc_transcript: number | null
  doc_idcopy: number | null
  amount: string | number | null
  payment_status: PaymentStatus
  payment_method: string | null
  payment_reference: string | null
  paid_at: string | null
  student_name: string | null
  student_code: string | null
  class_name: string | null
  subject_code: string | null
  subject_name: string | null
  teacher_names: string | null
  reviewed_by_name: string | null
}

function formatDate(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function toBool(value: number | null | undefined): boolean {
  return value === 1
}

function fromApi(row: ApiEnrollment): EnrollmentWithNames {
  return {
    id: row.id,
    studentId: row.student_id,
    classId: row.class_id,
    enrolledAt: formatDate(row.enrolled_at),
    status: row.status,
    reviewedById: row.reviewed_by ?? null,
    reviewedAt: row.reviewed_at ? formatDate(row.reviewed_at) : null,
    notes: row.notes ?? null,
    docsDeclared: toBool(row.docs_declared),
    docGrade12: toBool(row.doc_grade12),
    docTranscript: toBool(row.doc_transcript),
    docIdCopy: toBool(row.doc_idcopy),
    amount: Number(row.amount ?? 0),
    paymentStatus: row.payment_status ?? 'unpaid',
    paymentMethod: row.payment_method ?? null,
    paymentReference: row.payment_reference ?? null,
    paidAt: row.paid_at ? formatDate(row.paid_at) : null,
    studentName: row.student_name ?? '',
    studentCode: row.student_code ?? '',
    className: row.class_name ?? '',
    subjectCode: row.subject_code ?? '',
    subjectName: row.subject_name ?? '',
    teacherNames: row.teacher_names ?? '',
    reviewedByName: row.reviewed_by_name ?? null,
  }
}

export async function listEnrollments(): Promise<EnrollmentWithNames[]> {
  const { data } = await apiClient.get<ApiEnrollment[]>(BASE_URL)
  return data.map(fromApi)
}

export async function listEnrollmentsPage(params: { page: number; limit: number; search?: string; status?: string; paymentStatus?: string; classId?: number | 'all' }): Promise<{ data: EnrollmentWithNames[]; total: number; page: number; totalPages: number }> {
  const query: Record<string, string> = { page: String(params.page), limit: String(params.limit) }
  if (params.search) query.search = params.search
  if (params.status) query.status = params.status
  if (params.paymentStatus) query.payment_status = params.paymentStatus
  if (params.classId && params.classId !== 'all') query.class_id = String(params.classId)
  const { data } = await apiClient.get<{ data: ApiEnrollment[]; total: number; page: number; totalPages: number }>(BASE_URL, { params: query })
  return { ...data, data: data.data.map(fromApi) }
}

export async function createEnrollment(payload: {
  studentId: number
  classId: number
  notes?: string
  docsDeclared?: boolean
}): Promise<EnrollmentWithNames> {
  const { data } = await apiClient.post<ApiEnrollment>(BASE_URL, {
    student_id: payload.studentId,
    class_id: payload.classId,
    notes: payload.notes ?? null,
    docs_declared: payload.docsDeclared ? 1 : 0,
  })
  return fromApi(data)
}

export async function approveEnrollment(
  id: number,
  docs?: { docGrade12?: boolean; docTranscript?: boolean; docIdCopy?: boolean },
): Promise<EnrollmentWithNames> {
  const { data } = await apiClient.patch<ApiEnrollment>(`${BASE_URL}/${id}/approve`, {
    doc_grade12: docs?.docGrade12 ? 1 : 0,
    doc_transcript: docs?.docTranscript ? 1 : 0,
    doc_idcopy: docs?.docIdCopy ? 1 : 0,
  })
  return fromApi(data)
}

export async function rejectEnrollment(id: number): Promise<EnrollmentWithNames> {
  const { data } = await apiClient.patch<ApiEnrollment>(`${BASE_URL}/${id}/reject`)
  return fromApi(data)
}

export async function payEnrollment(
  id: number,
  payload: { method: string; reference?: string },
): Promise<EnrollmentWithNames> {
  const { data } = await apiClient.patch<ApiEnrollment>(`${BASE_URL}/${id}/pay`, {
    method: payload.method,
    reference: payload.reference ?? null,
  })
  return fromApi(data)
}

export async function updateEnrollment(
  id: number,
  payload: {
    status?: EnrollmentStatus
    docGrade12?: boolean
    docTranscript?: boolean
    docIdCopy?: boolean
    docsDeclared?: boolean
    notes?: string
  },
): Promise<EnrollmentWithNames> {
  const body: Record<string, unknown> = {}
  if (payload.status !== undefined) body.status = payload.status
  if (payload.docGrade12 !== undefined) body.doc_grade12 = payload.docGrade12 ? 1 : 0
  if (payload.docTranscript !== undefined) body.doc_transcript = payload.docTranscript ? 1 : 0
  if (payload.docIdCopy !== undefined) body.doc_idcopy = payload.docIdCopy ? 1 : 0
  if (payload.docsDeclared !== undefined) body.docs_declared = payload.docsDeclared ? 1 : 0
  if (payload.notes !== undefined) body.notes = payload.notes
  const { data } = await apiClient.put<ApiEnrollment>(`${BASE_URL}/${id}`, body)
  return fromApi(data)
}

export async function deleteEnrollment(id: number): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`)
}