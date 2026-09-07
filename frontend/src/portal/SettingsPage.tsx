import { useState } from 'react'
import type { SessionUser } from '../api/auth'
import { updatePassword } from '../api/auth'
import { getApiError } from '../api/client'

interface SettingsPageProps {
  session: SessionUser
}

const preferenceItems = [
  { key: 'emailNotif', label: 'Email Notifications', desc: 'Receive email updates about your subjects and enrollment', defaultOn: true },
  { key: 'enrollReminder', label: 'Enrollment Reminders', desc: 'Get reminded when new subjects are available for enrollment', defaultOn: true },
  { key: 'scheduleAlerts', label: 'Schedule Alerts', desc: 'Notify me of schedule changes to my enrolled subjects', defaultOn: true },
  { key: 'newsletter', label: 'School Newsletter', desc: 'Weekly news and announcements from your department', defaultOn: false },
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
        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: checked ? '20px' : '2px' }} />
      </button>
    </div>
  )
}

export default function SettingsPage({ session }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<'preferences' | 'password'>('preferences')
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const inputCls = 'w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors'
  const inputSty = { borderColor: '#e2e7f0', color: '#1a1f36' }

  const handlePwSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.next !== pwForm.confirm) { setPwError('New passwords do not match.'); return }
    if (pwForm.next.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    setSaving(true)
    try {
      await updatePassword(pwForm.current, pwForm.next)
      setPwSaved(true)
      setPwForm({ current: '', next: '', confirm: '' })
      window.setTimeout(() => setPwSaved(false), 3000)
    } catch (err) {
      setPwError(getApiError(err, 'Unable to update password.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>Manage your preferences and account security</p>
      </div>

      {/* Account card */}
      <div className="bg-white rounded-xl border p-5 flex items-center gap-4" style={{ borderColor: '#e2e7f0' }}>
        {session.avatarUrl ? (
          <img src={session.avatarUrl} alt={session.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: '#3b5bdb', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
            {session.name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{session.name}</div>
          <div className="text-xs truncate" style={{ color: '#9ca3af' }}>{session.email}</div>
        </div>
        <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#dde4ff', color: '#3451c7', fontFamily: 'Outfit, sans-serif' }}>
          Student
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: '#e2e7f0' }}>
        {([['preferences', 'Preferences'], ['password', 'Password']] as const).map(([key, label]) => (
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

      {activeTab === 'preferences' && (
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#e2e7f0' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Notification Preferences</h3>
          <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>Choose what you'd like to hear about.</p>
          {preferenceItems.map(item => (
            <ToggleRow key={item.key} label={item.label} desc={item.desc} defaultOn={item.defaultOn} />
          ))}
        </div>
      )}

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
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-60" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
              {saving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}