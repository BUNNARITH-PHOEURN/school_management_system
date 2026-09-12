import axios from 'axios'
import { authHeaders, clearSession } from './session'

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(config => {
  const headers = authHeaders()
  // Axios v1 uses an AxiosHeaders object. Use its setter so the header is
  // actually serialized on the request rather than only assigned as a property.
  for (const [name, value] of Object.entries(headers)) {
    if (typeof config.headers?.set === 'function') {
      config.headers.set(name, value)
    } else {
      if (config.headers) config.headers[name] = value
    }
  }
  return config
})

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? ''
      const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register')
      if (!isAuthAttempt) {
        clearSession()
        if (typeof window !== 'undefined' && window.location.hash) {
          window.location.reload()
        }
      }
    }
    return Promise.reject(error)
  },
)

export function getApiError(error: unknown, fallback = 'Request failed') {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data && Array.isArray(data.errors)) return data.errors.join(', ')
    if (data?.error) return data.error
    if (error.response) return `Request failed (${error.response.status})`
  }
  return error instanceof Error ? error.message : fallback
}
