import type { SessionUser } from './auth'

const SESSION_KEY = 'edumanage_session'

interface StoredSession {
  user: SessionUser
  token: string
}

function isStoredSession(value: unknown): value is StoredSession {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as StoredSession).token !== undefined &&
    !!((value as StoredSession).user) &&
    !!((value as StoredSession).user.id)
  )
}

export function loadSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isStoredSession(parsed)) return null
    if (!parsed.user.email) return null
    return parsed.user
  } catch {
    return null
  }
}

export function getToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    return isStoredSession(parsed) ? parsed.token : null
  } catch {
    return null
  }
}

export function saveSession(user: SessionUser, token?: string) {
  const storedToken = token !== undefined ? token : (getToken() ?? '')
  const stored: StoredSession = { user, token: storedToken }
  localStorage.setItem(SESSION_KEY, JSON.stringify(stored))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}