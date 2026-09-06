import { apiClient } from './client'
import type { Role } from './auth'

export interface UserRecord {
  id: number
  name: string
  email: string
  role: Role
  status: 'active' | 'inactive'
  createdAt: string | null
  lastLogin: string | null
}

export const listUsers = async () => (await apiClient.get<{ users: UserRecord[] }>('/users')).data
export const createUser = async (data: { name: string; email: string; role: Role; password: string }) => (await apiClient.post<{ user: UserRecord }>('/users', data)).data
export const updateUser = async (id: number, data: { name: string; email: string; role: Role }) => (await apiClient.put<{ user: UserRecord }>(`/users/${id}`, data)).data
export const updateUserStatus = async (id: number, status: UserRecord['status']) => (await apiClient.patch<{ user: UserRecord }>(`/users/${id}/status`, { status })).data