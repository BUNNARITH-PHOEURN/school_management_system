import { useState } from 'react'

const preferenceItems = [
  { key: 'emailNotif', label: 'Email Notifications', desc: 'Receive email updates about attendance and reports', defaultOn: true },
  { key: 'reportReminder', label: 'Report Reminders', desc: 'Weekly attendance report digest every Monday', defaultOn: false },
  { key: 'loginAlerts', label: 'Login Alerts', desc: 'Notify me of new sign-ins to my account', defaultOn: true },
]

function ToggleRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
  const [checked, setChecked] = useState(defaultOn)
  return (
    <div className="flex items-center justify-between py-3.5 border-b last:border-0" style={{ borderColor: '#f0f3fa' }}>
      <div>
        <div className="text-sm font-medium" style={{ color: '#1a1f36' }}>{label}</div>
        <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{desc}</div>
      </div>
      <button
        onClick={() => setChecked(v => !v)}
        role="switch"
        aria-checked={checked}
        className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ml-4"
        style={{ backgroundColor: checked ? '#3b5bdb' : '#e2e7f0' }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? '20px' : '2px' }}
        />
      </button>
    </div>
  )
}

export default function Profile() {
  const [form, setForm] = useState({ name: 'Alexandra Chen', email: 'admin@school.edu', phone: '+1 555-0001', bio: 'System administrator for EduManage. Oversees all user accounts and system configurations.' })
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [saved, setSaved] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePwSave = (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.next !== pwForm.confirm) { setPwError('New passwords do not match.'); return }
    if (pwForm.next.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    setPwSaved(true)
    setPwForm({ current: '', next: '', confirm: '' })
    setTimeout(() => setPwSaved(false), 3000)
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors"
  const inputSty = { borderColor: '#e2e7f0', color: '#1a1f36' }

  return (
    <div className="p-6 max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Profile & Account</h1>
        <p className="text-sm" style={{ color: '#9ca3af' }}>Manage your personal information and account security</p>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#e2e7f0' }}>
        <div className="flex items-center gap-5">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{ backgroundColor: '#3b5bdb', color: 'white', fontFamily: 'Outfit, sans-serif' }}
            >
              AC
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
              style={{ backgroundColor: '#059669' }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="white"><circle cx="4" cy="4" r="3" /></svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg leading-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{form.name}</div>
            <div className="text-sm mt-0.5" style={{ color: '#6b7280' }}>{form.email}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#dde4ff', color: '#3451c7', fontFamily: 'Outfit, sans-serif' }}>Admin</span>
              <span className="text-xs" style={{ color: '#9ca3af' }}>Member since Jan 2023</span>
            </div>
          </div>
          <button className="px-4 py-2 text-sm font-medium rounded-lg border hover:bg-gray-50 transition-colors flex-shrink-0" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>
            Change Photo
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b" style={{ borderColor: '#e2e7f0' }}>
        {([['profile', 'Profile Info'], ['password', 'Password'], ['preferences', 'Preferences']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
            style={{
              borderColor: activeTab === key ? '#3b5bdb' : 'transparent',
              color: activeTab === key ? '#3b5bdb' : '#6b7280',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Profile Info */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border p-6 space-y-4" style={{ borderColor: '#e2e7f0' }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} style={inputSty} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} style={inputSty} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} style={inputSty} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Role</label>
              <input value="Admin" disabled className={inputCls} style={{ ...inputSty, backgroundColor: '#f8f9fd', color: '#9ca3af' }} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                className={inputCls + " resize-none"}
                style={inputSty}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm transition-opacity" style={{ color: '#059669', fontFamily: 'Outfit, sans-serif', opacity: saved ? 1 : 0 }}>✓ Changes saved</span>
            <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition-opacity hover:opacity-90" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>Save Changes</button>
          </div>
        </form>
      )}

      {/* Password */}
      {activeTab === 'password' && (
        <form onSubmit={handlePwSave} className="bg-white rounded-xl border p-6 space-y-4" style={{ borderColor: '#e2e7f0' }}>
          <div className="p-3.5 rounded-lg text-sm" style={{ backgroundColor: '#f8f9fd', color: '#6b7280' }}>
            <strong style={{ color: '#1a1f36' }}>Password requirements:</strong> Minimum 8 characters.
          </div>
          {([['current', 'Current Password'], ['next', 'New Password'], ['confirm', 'Confirm New Password']] as const).map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>{label}</label>
              <input
                type="password"
                value={pwForm[key]}
                onChange={e => { setPwError(''); setPwForm(f => ({ ...f, [key]: e.target.value })) }}
                placeholder="••••••••"
                className={inputCls}
                style={{ ...inputSty, borderColor: pwError && key !== 'current' ? '#fca5a5' : '#e2e7f0' }}
              />
            </div>
          ))}
          {pwError && <p className="text-sm" style={{ color: '#e11d48' }}>{pwError}</p>}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm transition-opacity" style={{ color: '#059669', fontFamily: 'Outfit, sans-serif', opacity: pwSaved ? 1 : 0 }}>✓ Password updated</span>
            <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition-opacity hover:opacity-90" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>Update Password</button>
          </div>
        </form>
      )}

      {/* Preferences */}
      {activeTab === 'preferences' && (
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#e2e7f0' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Notification Preferences</h3>
          {preferenceItems.map(item => (
            <ToggleRow key={item.key} label={item.label} desc={item.desc} defaultOn={item.defaultOn} />
          ))}

          <h3 className="text-sm font-semibold mt-6 mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Danger Zone</h3>
          <div className="rounded-lg border p-4 flex items-center justify-between" style={{ borderColor: '#fca5a5', backgroundColor: '#fff5f5' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: '#9f1239' }}>Deactivate Account</div>
              <div className="text-xs mt-0.5" style={{ color: '#f87171' }}>Permanently disable your account. Contact IT to restore.</div>
            </div>
            <button className="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors" style={{ borderColor: '#f87171', color: '#e11d48', backgroundColor: 'white' }}>
              Deactivate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
