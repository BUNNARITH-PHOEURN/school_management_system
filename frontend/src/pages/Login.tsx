import { useState } from 'react'

interface LoginProps {
  onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('admin@school.edu')
  const [password, setPassword] = useState('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (email === 'admin@school.edu' && password === 'password') {
        onLogin()
      } else {
        setError('Invalid email or password. Try admin@school.edu / password')
      }
    }, 800)
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f0f3fa' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12" style={{ backgroundColor: '#13203b' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3b5bdb' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div>
            <div className="text-white font-bold text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>EduManage</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>School Management System</div>
          </div>
        </div>

        <div>
          <div className="mb-8">
            <div className="w-16 h-1 rounded-full mb-6" style={{ backgroundColor: '#3b5bdb' }} />
            <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif', lineHeight: 1.2 }}>
              Centralize your school operations
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Manage students, teachers, classes, attendance, and reports — all in one place.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: '👥', label: 'Student & teacher management' },
              { icon: '📅', label: 'Attendance tracking & reports' },
              { icon: '📚', label: 'Class scheduling & enrollment' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © 2026 EduManage. All rights reserved.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3b5bdb' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <span className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>EduManage</span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-8" style={{ color: '#6b7280' }}>Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@school.edu"
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
                style={{ borderColor: '#e2e7f0', color: '#1a1f36' }}
                onFocus={e => (e.target.style.borderColor = '#3b5bdb')}
                onBlur={e => (e.target.style.borderColor = '#e2e7f0')}
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
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
                style={{ borderColor: '#e2e7f0', color: '#1a1f36' }}
                onFocus={e => (e.target.style.borderColor = '#3b5bdb')}
                onBlur={e => (e.target.style.borderColor = '#e2e7f0')}
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
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#eff2ff', border: '1px solid #c1ceff' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#3451c7', fontFamily: 'Outfit, sans-serif' }}>Demo credentials</p>
            <p className="text-xs" style={{ color: '#6b7280' }}>Email: admin@school.edu</p>
            <p className="text-xs" style={{ color: '#6b7280' }}>Password: password</p>
          </div>
        </div>
      </div>
    </div>
  )
}
