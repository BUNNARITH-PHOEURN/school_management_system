import { useEffect, useState } from 'react'
import { updateStudent } from '../api/students'
import type { SessionUser } from '../api/auth'
import type { StudentProfile, StudentGender } from '../api/student'
import Modal, { FormField, inputClass, inputStyle } from '../components/Modal'
import Badge from '../components/Badge'
import { getApiError } from '../api/client'
import { useToast } from '../context/ToastContext'

interface StudentProfilePageProps {
  session: SessionUser
  profile: StudentProfile | null
  onProfileUpdate: () => void
}

export default function StudentProfilePage({ session, profile, onProfileUpdate }: StudentProfilePageProps) {
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(session.avatarUrl || '')
  const [form, setForm] = useState({ phone: '', address: '', gender: '' as StudentGender, dateOfBirth: '' })

  useEffect(() => {
    setPhotoUrl(session.avatarUrl || '')
  }, [session.avatarUrl])

  useEffect(() => {
    if (profile) {
      setForm({
        phone: profile.phone,
        address: profile.address,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
      })
    }
  }, [profile])

  if (!profile) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="rounded-xl border h-64 animate-pulse" style={{ borderColor: '#e2e7f0', backgroundColor: '#f8f9fd' }} />
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateStudent(profile.id, {
        phone: form.phone,
        address: form.address,
        gender: form.gender ?? '',
        dateOfBirth: form.dateOfBirth,
      })
      toast('success', 'Profile updated successfully.')
      setEditing(false)
      onProfileUpdate()
    } catch (err) {
      toast('error', getApiError(err, 'Unable to update profile.'))
    } finally {
      setSaving(false)
    }
  }

  const infoRows: [string, string][] = [
    ['Email Address', profile.email],
    ['Phone Number', profile.phone || '—'],
    ['Date of Birth', profile.dateOfBirth || '—'],
    ['Gender', profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : '—'],
    ['Address', profile.address || '—'],
    ['Department', profile.departmentName],
  ]

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>My Profile</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>Your personal and academic information</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white flex-shrink-0"
          style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit Profile
        </button>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#e2e7f0' }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {photoUrl ? (
            <img src={photoUrl} alt={profile.firstName} className="w-20 h-20 rounded-full object-cover border-4 border-white flex-shrink-0" style={{ boxShadow: '0 8px 24px rgba(15,23,42,0.15)' }} />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0" style={{ backgroundColor: '#3b5bdb', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{profile.firstName} {profile.lastName}</h2>
              <Badge variant="primary">{profile.code}</Badge>
              <Badge variant="success" dot>{profile.status}</Badge>
            </div>
            <div className="text-sm mt-1" style={{ color: '#6b7280' }}>{profile.email}</div>
            <div className="text-sm mt-1" style={{ color: '#6b7280' }}>{profile.departmentName}</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Contact & personal */}
        <div className="bg-white rounded-xl border" style={{ borderColor: '#e2e7f0' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#f0f3fa' }}>
            <h3 className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Contact Information</h3>
          </div>
          <div className="p-5 space-y-4">
            {infoRows.slice(0, 5).map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>{label}</span>
                <span className="text-sm text-right" style={{ color: '#1a1f36' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Academic info */}
        <div className="bg-white rounded-xl border" style={{ borderColor: '#e2e7f0' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#f0f3fa' }}>
            <h3 className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Academic Information</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>Department</span>
              <span className="text-sm text-right" style={{ color: '#1a1f36' }}>{profile.departmentName}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>Student Code</span>
              <span className="text-sm text-right font-mono" style={{ color: '#1a1f36' }}>{profile.code}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>Enrolled</span>
              <span className="text-sm text-right" style={{ color: '#1a1f36' }}>{profile.enrolledAt || '—'}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>Account Role</span>
              <span className="text-sm text-right" style={{ color: '#1a1f36' }}>Student</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit Profile"
        footer={
          <>
            <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-60" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Phone"><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
          <FormField label="Gender">
            <select value={form.gender ?? ''} onChange={e => setForm(f => ({ ...f, gender: (e.target.value || null) as StudentGender }))} className={inputClass} style={inputStyle}>
              <option value="">Other</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </FormField>
          <FormField label="Date of Birth"><input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
        </div>
        <FormField label="Address"><input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
      </Modal>
    </div>
  )
}