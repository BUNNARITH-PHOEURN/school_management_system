import { apiClient } from './client'

export type Role = 'admin' | 'moderator'

export interface SessionUser {
  id: number
  name: string
  email: string
  role: Role
  status: 'active' | 'inactive'
  lastLogin: string | null
  phone?: string
  bio?: string
  createdAt?: string | null
  avatarUrl?: string
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const { data } = await apiClient.post<{ user: SessionUser }>('/auth/login', { email, password })
  return data.user
}

export async function checkSession(userId: number): Promise<SessionUser> {
  const { data } = await apiClient.get<{ user: SessionUser }>('/auth/me', { headers: { 'x-user-id': String(userId) } })
  return data.user
}

export async function updateProfile(data: { name: string; email: string; phone: string; bio: string; avatarUrl: string }): Promise<SessionUser> {
  const response = await apiClient.put<{ user: SessionUser }>('/auth/me', data)
  return response.data.user
}

export async function updatePassword(current: string, next: string): Promise<void> {
  await apiClient.put('/auth/password', { current, next })
}

export async function deactivateAccount(): Promise<void> {
  await apiClient.delete('/auth/me')
}