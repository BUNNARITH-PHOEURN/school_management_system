import { useState } from 'react'
import { login, type SessionUser } from '../api/auth'
import { getApiError } from '../api/client'

interface StudentLoginProps {
  onLogin: (user: SessionUser) => void
  onGoRegister: () => void
  onHome: () => void
}

export default function StudentLogin({ onLogin, onGoRegister, onHome }: StudentLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    try {
      const user = await login(email.trim(), password)
      onLogin(user)
    } catch (err) {
      setError(getApiError(err, 'Invalid email or password.'))
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all'

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] flex-shrink-0 p-12" style={{ backgroundColor: '#13203b' }}>
        <button onClick={onHome} className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3b5bdb' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div>
            <div className="text-white font-bold text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>EduManage</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>School Management System</div>
          </div>
        </button>

        <div>
          <div className="w-16 h-1 rounded-full mb-6" style={{ backgroundColor: '#3b5bdb' }} />
          <h2 className="text-3xl font-bold text-white mb-4 leading-snug" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Welcome back, student
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Browse subjects, enroll in classes, and track your academic journey — all from your student portal.
          </p>
        </div>

        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © 2026 EduManage. All rights reserved.
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: '#f0f3fa' }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <button onClick={onHome} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3b5bdb' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <span className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>EduManage</span>
            </button>
            <button onClick={onHome} className="text-sm" style={{ color: '#6b7280' }}>← Home</button>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Student Sign In</h1>
          <p className="text-sm mb-8" style={{ color: '#6b7280' }}>Access your student portal to manage enrollment</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
                style={{ borderColor: '#e2e7f0', color: '#1a1f36' }}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" style={{ color: '#374151' }}>Password</label>
                <button type="button" className="text-xs" style={{ color: '#3b5bdb' }}>Forgot password?</button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
                style={{ borderColor: '#e2e7f0', color: '#1a1f36' }}
              />
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-lg text-sm" style={{ backgroundColor: '#fff1f2', color: '#9f1239', border: '1px solid #ffe4e6' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ backgroundColor: loading ? '#6b8ff8' : '#3b5bdb', fontFamily: 'Outfit, sans-serif', cursor: loading ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget.style.backgroundColor = '#3451c7') }}
              onMouseLeave={e => { if (!loading) (e.currentTarget.style.backgroundColor = '#3b5bdb') }}
            >
              {loading ? 'Signing in…' : 'Sign in to Student Portal'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: '#6b7280' }}>
            New here?{' '}
            <button onClick={onGoRegister} className="font-medium" style={{ color: '#3b5bdb' }}>
              Register as a student
            </button>
          </p>

          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#eff2ff', border: '1px solid #c1ceff' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#3451c7', fontFamily: 'Outfit, sans-serif' }}>Demo admin login</p>
            <p className="text-xs" style={{ color: '#6b7280' }}>Email: admin@school.edu · Password: password</p>
          </div>
        </div>
      </div>
    </div>
  )
}