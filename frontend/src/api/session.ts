import type { SessionUser } from './auth'

const SESSION_KEY = 'edumanage_session'

export function loadSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionUser
    if (!parsed || !parsed.id || !parsed.email) return null
    return parsed
  } catch {
    return null
  }
}

export function saveSession(user: SessionUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function authHeaders(): Record<string, string> {
  const session = loadSession()
  return session && session.id ? { 'x-user-id': String(session.id) } : {}
}