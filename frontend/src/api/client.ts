import axios from 'axios'
import { authHeaders } from './session'

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(config => {
  Object.assign(config.headers, authHeaders())
  return config
})

export function getApiError(error: unknown, fallback = 'Request failed') {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data && Array.isArray(data.errors)) return data.errors.join(', ')
    if (data?.error) return data.error
    if (error.response) return `Request failed (${error.response.status})`
  }
  return error instanceof Error ? error.message : fallback
}