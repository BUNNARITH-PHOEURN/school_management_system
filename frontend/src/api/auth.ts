const BASE_URL = '/api/auth'

export type Role = 'admin' | 'moderator'

export interface SessionUser {
  id: number
  name: string
  email: string
  role: Role
  status: 'active' | 'inactive'
  lastLogin: string | null
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const message =
      body && Array.isArray(body.errors)
        ? body.errors.join(', ')
        : body?.error || `Request failed (${res.status})`
    throw new Error(message)
  }
  return body as T
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await handleResponse<{ user: SessionUser }>(res)
  return body.user
}

export async function checkSession(userId: number): Promise<SessionUser> {
  const res = await fetch(`${BASE_URL}/me`, {
    headers: { 'x-user-id': String(userId) },
  })
  const body = await handleResponse<{ user: SessionUser }>(res)
  return body.user
}