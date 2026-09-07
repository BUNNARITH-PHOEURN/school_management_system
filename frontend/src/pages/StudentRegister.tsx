import { useEffect, useRef, useState } from 'react'
import { register, type SessionUser } from '../api/auth'
import { listDepartments, type DepartmentRecord } from '../api/departments'
import { getApiError } from '../api/client'
import { getNextStudentCode } from '../api/student'

interface StudentRegisterProps {
  onSuccess: (user: SessionUser) => void
  onSignIn: () => void
  onHome: () => void
}

const STEPS = ['Account Information', 'Student Information', 'Profile Photo', 'Confirmation'] as const

type StepIndex = 0 | 1 | 2 | 3

interface FormState {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  studentCode: string
  dateOfBirth: string
  gender: string
  phone: string
  address: string
  departmentId: number | null
  photo: string
  agreeTerms: boolean
}

const EMPTY_FORM: FormState = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  studentCode: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  address: '',
  departmentId: null,
  photo: '',
  agreeTerms: false,
}

const inputCls =
  'w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors'
const labelCls = 'block text-sm font-medium mb-1.5'
const btnBase =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all'

function Field({
  label,
  required,
  error,
  children,
  hint,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className={labelCls} style={{ color: '#374151' }}>
        {label}
        {required && <span style={{ color: '#e11d48' }}> *</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>{hint}</p>
      )}
      {error && (
        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#e11d48' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

function ProgressSteps({ current }: { current: StepIndex }) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex items-center">
        {STEPS.map((label, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'todo'
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 w-16 sm:w-auto">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                  style={{
                    backgroundColor:
                      state === 'done' ? '#3b5bdb' : state === 'current' ? '#eff2ff' : '#e7ebf3',
                    color: state === 'done' ? '#fff' : state === 'current' ? '#3b5bdb' : '#9ca3af',
                    border: state === 'current' ? '2px solid #3b5bdb' : '2px solid transparent',
                    boxShadow: state === 'current' ? '0 0 0 4px rgba(59,91,219,0.15)' : 'none',
                  }}
                >
                  {state === 'done' ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className="hidden sm:block text-xs font-medium whitespace-nowrap"
                  style={{
                    color: state === 'current' || state === 'done' ? '#3451c7' : '#9ca3af',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  {label.split(' ').pop() === 'Information' ? label : label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2 -mt-5 rounded-full transition-all"
                  style={{ backgroundColor: i < current ? '#3b5bdb' : '#e7ebf3' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PhotoPicker({
  value,
  onChange,
  error,
  setError,
}: {
  value: string
  onChange: (dataUrl: string) => void
  error: string
  setError: (message: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setError('Please choose a JPG, PNG, or GIF image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be smaller than 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => { onChange(String(reader.result || '')); setError('') }
    reader.onerror = () => setError('Unable to read this photo.')
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif"
        onChange={handleFile}
        className="sr-only"
        id="reg-photo-input"
      />
      {value ? (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative">
            <img
              src={value}
              alt="Profile preview"
              className="w-28 h-28 rounded-full object-cover border-4 border-white"
              style={{ boxShadow: '0 8px 24px rgba(15,23,42,0.18)' }}
            />
            <span
              className="absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center"
              style={{ backgroundColor: '#059669' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          </div>
          <div className="text-center sm:text-left">
            <div className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>
              Photo ready
            </div>
            <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>
              Looks good. You can still change it.
            </div>
            <div className="flex gap-2 mt-3 justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={btnBase + ' py-2'}
                style={{ backgroundColor: '#eff2ff', color: '#3451c7' }}
              >
                Change Photo
              </button>
              <button
                type="button"
                onClick={() => { onChange(''); setError('') }}
                className={btnBase + ' py-2'}
                style={{ backgroundColor: 'transparent', color: '#e11d48', border: '1px solid #fca5a5' }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed rounded-xl py-10 flex flex-col items-center gap-3 transition-colors hover:border-[#3b5bdb]"
          style={{ borderColor: '#c8d2e5', backgroundColor: '#fafbff' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#eff2ff' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#3451c7' }}>
              Upload Photo
            </div>
            <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>
              JPG, PNG or GIF · Max 5 MB
            </div>
          </div>
        </button>
      )}
      <div className="mt-3 text-xs text-center sm:text-left" style={{ color: '#9ca3af' }}>
        Recommended 400×400px for the best result.
      </div>
    </div>
  )
}

export default function StudentRegister({ onSuccess, onSignIn, onHome }: StudentRegisterProps) {
  const [step, setStep] = useState<StepIndex>(0)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitError, setSubmitError] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [nextCode, setNextCode] = useState('')
  const [successUser, setSuccessUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    listDepartments()
      .then(res => setDepartments(res.departments.filter(d => d.status === 'active')))
      .catch(() => setDepartments([]))
  }, [])

  useEffect(() => {
    getNextStudentCode()
      .then(setNextCode)
      .catch(() => setNextCode(''))
  }, [])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(prev => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const activeDepartments = departments.filter(d => d.status === 'active')

  function validateStep(current: StepIndex): boolean {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (current === 0) {
      if (form.fullName.trim().length < 2) e.fullName = 'Full name must be at least 2 characters.'
      if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Please enter a valid email address.'
      if (form.password.length < 8) e.password = 'Password must be at least 8 characters.'
      if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match.'
    }
    if (current === 1) {
      if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required.'
      else if (form.dateOfBirth > new Date().toISOString().slice(0, 10)) e.dateOfBirth = 'Date of birth cannot be in the future.'
      if (!form.gender) e.gender = 'Please select a gender.'
      if (form.phone.trim().length < 6) e.phone = 'Please enter a valid phone number.'
      if (!form.address.trim()) e.address = 'Address is required.'
      if (form.departmentId === null) e.departmentId = 'Please select a department.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const nextStep = () => {
    if (!validateStep(step)) return
    setSubmitError('')
    setStep(s => Math.min(s + 1, 3) as StepIndex)
  }

  const goToStep = (target: StepIndex) => {
    setErrors({})
    setSubmitError('')
    setStep(target)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    if (!form.agreeTerms) {
      setSubmitError('Please agree to the Terms of Service and Privacy Policy to continue.')
      return
    }
    setLoading(true)
    try {
      const user = await register(
        form.fullName.trim(),
        form.email.trim(),
        form.password,
        {
          departmentId: form.departmentId,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          phone: form.phone.trim(),
          address: form.address.trim(),
          photo: form.photo || undefined,
        },
      )
      setSuccessUser(user)
      window.setTimeout(() => onSuccess(user), 3200)
    } catch (err) {
      setSubmitError(getApiError(err, 'Unable to create your account. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  if (successUser) {
    return (
      <SuccessScreen user={successUser} studentCode={nextCode} onDone={() => onSuccess(successUser)} onHome={onHome} />
    )
  }

  const summaryAccount: [string, string][] = [
    ['Full Name', form.fullName.trim()],
    ['Email', form.email.trim()],
  ]
  const summaryStudent: [string, string][] = [
    ['Student Code', nextCode || 'Auto-generated'],
    ['Date of Birth', form.dateOfBirth],
    ['Gender', form.gender ? form.gender.charAt(0).toUpperCase() + form.gender.slice(1) : '—'],
    ['Phone', form.phone.trim()],
    ['Address', form.address.trim()],
    ['Department', departments.find(d => d.id === form.departmentId)?.name ?? '—'],
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f0f3fa' }}>
      {/* Top bar */}
      <header className="w-full flex items-center justify-between px-5 py-4 sm:px-8">
        <button onClick={onHome} className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3b5bdb' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-sm leading-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>EduManage</div>
            <div className="text-xs" style={{ color: '#9ca3af' }}>Student Registration</div>
          </div>
        </button>
        {step === 0 && (
          <button onClick={onSignIn} className="text-sm font-medium" style={{ color: '#3b5bdb' }}>
            Already have an account? <span className="font-semibold">Sign in</span>
          </button>
        )}
      </header>

      <main className="flex-1 w-full flex flex-col items-center px-4 pb-12">
        {/* Progress indicator */}
        <div className="w-full max-w-xl pt-2 pb-8">
          <ProgressSteps current={step} />
        </div>

        {/* Card */}
        <div className="w-full max-w-xl bg-white rounded-2xl border" style={{ borderColor: '#e2e7f0', boxShadow: '0 10px 40px rgba(15,23,42,0.06)' }}>
          <form onSubmit={step === 3 ? handleSubmit : e => e.preventDefault()}>
            {/* Step titles */}
            <div className="px-6 pt-6 sm:px-8">
              <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>
                {STEPS[step]}
              </h1>
              <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
                {step === 0 && 'Start by creating your student account credentials.'}
                {step === 1 && 'Tell us a little about yourself and your program.'}
                {step === 2 && 'Add a profile photo — this will appear on your student ID.'}
                {step === 3 && 'Review everything before creating your account.'}
              </p>
            </div>

            <div className="px-6 py-6 sm:px-8">
              {step === 0 && (
                <div className="space-y-4">
                  <Field label="Full Name" required error={errors.fullName}>
                    <input
                      value={form.fullName}
                      onChange={e => set('fullName', e.target.value)}
                      placeholder="e.g. Socheata Kim"
                      className={inputCls}
                      style={{ borderColor: errors.fullName ? '#fca5a5' : '#e2e7f0', color: '#1a1f36' }}
                    />
                  </Field>
                  <Field label="Email Address" required error={errors.email}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="you@example.com"
                      className={inputCls}
                      style={{ borderColor: errors.email ? '#fca5a5' : '#e2e7f0', color: '#1a1f36' }}
                    />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Password" required error={errors.password}>
                      <input
                        type="password"
                        value={form.password}
                        onChange={e => set('password', e.target.value)}
                        placeholder="At least 8 characters"
                        className={inputCls}
                        style={{ borderColor: errors.password ? '#fca5a5' : '#e2e7f0', color: '#1a1f36' }}
                      />
                    </Field>
                    <Field label="Confirm Password" required error={errors.confirmPassword}>
                      <input
                        type="password"
                        value={form.confirmPassword}
                        onChange={e => set('confirmPassword', e.target.value)}
                        placeholder="Re-enter your password"
                        className={inputCls}
                        style={{ borderColor: errors.confirmPassword ? '#fca5a5' : '#e2e7f0', color: '#1a1f36' }}
                      />
                    </Field>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Student Code" hint="Auto-generated — you can't change this">
                      <input
                        value={nextCode || 'STU-…'}
                        readOnly
                        className={inputCls}
                        style={{ borderColor: '#e2e7f0', color: '#3451c7', backgroundColor: '#f8f9fd', fontWeight: 600, letterSpacing: '0.02em' }}
                      />
                    </Field>
                    <Field label="Date of Birth" required error={errors.dateOfBirth}>
                      <input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={e => set('dateOfBirth', e.target.value)}
                        className={inputCls}
                        style={{ borderColor: errors.dateOfBirth ? '#fca5a5' : '#e2e7f0', color: '#1a1f36' }}
                      />
                    </Field>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Gender" required error={errors.gender}>
                      <select
                        value={form.gender}
                        onChange={e => set('gender', e.target.value)}
                        className={inputCls}
                        style={{ borderColor: errors.gender ? '#fca5a5' : '#e2e7f0', color: form.gender ? '#1a1f36' : '#9ca3af' }}
                      >
                        <option value="">Select gender…</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>
                    <Field label="Phone Number" required error={errors.phone}>
                      <input
                        value={form.phone}
                        onChange={e => set('phone', e.target.value)}
                        placeholder="+855 12 345 678"
                        className={inputCls}
                        style={{ borderColor: errors.phone ? '#fca5a5' : '#e2e7f0', color: '#1a1f36' }}
                      />
                    </Field>
                  </div>
                  <Field label="Address" required error={errors.address}>
                    <input
                      value={form.address}
                      onChange={e => set('address', e.target.value)}
                      placeholder="Street, district, city"
                      className={inputCls}
                      style={{ borderColor: errors.address ? '#fca5a5' : '#e2e7f0', color: '#1a1f36' }}
                    />
                  </Field>
                  <Field label="Department" required error={errors.departmentId}>
                    <select
                      value={form.departmentId ?? ''}
                      onChange={e => set('departmentId', e.target.value ? Number(e.target.value) : null)}
                      className={inputCls}
                      style={{ borderColor: errors.departmentId ? '#fca5a5' : '#e2e7f0', color: form.departmentId === null ? '#9ca3af' : '#1a1f36' }}
                    >
                      <option value="">Select department…</option>
                      {activeDepartments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}

              {step === 2 && (
                <PhotoPicker value={form.photo} onChange={v => set('photo', v)} error={photoError} setError={setPhotoError} />
              )}

              {step === 3 && (
                <div className="space-y-4">
                  {/* Account */}
                  <SummarySection title="Account Information" onEdit={() => goToStep(0)} rows={summaryAccount} />
                  {/* Student */}
                  <SummarySection title="Student Information" onEdit={() => goToStep(1)} rows={summaryStudent} />
                  {/* Photo */}
                  <div className="rounded-xl border p-4" style={{ borderColor: '#e2e7f0' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Profile Photo</h3>
                      <button type="button" onClick={() => goToStep(2)} className="text-xs font-semibold" style={{ color: '#3b5bdb' }}>
                        Edit
                      </button>
                    </div>
                    {form.photo ? (
                      <img src={form.photo} alt="Profile preview" className="w-16 h-16 rounded-full object-cover border border-[#e2e7f0]" />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#eff2ff', color: '#9ca3af', fontFamily: 'Outfit, sans-serif' }}>
                          {form.fullName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                        </div>
                        <span className="text-sm" style={{ color: '#9ca3af' }}>No photo uploaded</span>
                      </div>
                    )}
                  </div>

                  {/* Terms */}
                  <label className="flex items-start gap-3 rounded-xl p-4 cursor-pointer" style={{ backgroundColor: '#f8f9fd' }}>
                    <input
                      type="checkbox"
                      checked={form.agreeTerms}
                      onChange={e => set('agreeTerms', e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded"
                      style={{ accentColor: '#3b5bdb' }}
                    />
                    <span className="text-sm leading-relaxed" style={{ color: '#374151' }}>
                      I agree to the{' '}
                      <a href="#" className="font-medium" style={{ color: '#3b5bdb' }}>Terms of Service</a>{' '}
                      and{' '}
                      <a href="#" className="font-medium" style={{ color: '#3b5bdb' }}>Privacy Policy</a>
                    </span>
                  </label>
                  {submitError && (
                    <div className="rounded-lg px-3.5 py-2.5 text-sm" style={{ backgroundColor: '#fff1f2', color: '#9f1239', border: '1px solid #ffe4e6' }}>
                      {submitError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer nav */}
            <div className="px-6 py-5 border-t flex items-center justify-between gap-3" style={{ borderColor: '#f0f3fa' }}>
              <div className="flex-1">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => goToStep((step - 1) as StepIndex)}
                    className={btnBase}
                    style={{ backgroundColor: '#fff', color: '#374151', border: '1px solid #e2e7f0' }}
                  >
                    Back
                  </button>
                ) : (
                  <button type="button" onClick={onHome} className="text-sm" style={{ color: '#6b7280' }}>
                    ← Back to home
                  </button>
                )}
              </div>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className={btnBase}
                  style={{ backgroundColor: '#3b5bdb', color: '#fff' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3451c7')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#3b5bdb')}
                >
                  Continue
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className={btnBase}
                  style={{
                    backgroundColor: loading ? '#6b8ff8' : '#3b5bdb',
                    color: '#fff',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget.style.backgroundColor = '#3451c7') }}
                  onMouseLeave={e => { if (!loading) (e.currentTarget.style.backgroundColor = '#3b5bdb') }}
                >
                  {loading && (
                    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                  )}
                  {loading ? 'Creating account…' : 'Create Student Account'}
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="mt-6 text-xs text-center" style={{ color: '#9ca3af' }}>
          © 2026 EduManage · School Management System
        </p>
      </main>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

function SummarySection({
  title,
  onEdit,
  rows,
}: {
  title: string
  onEdit: () => void
  rows: [string, string][]
}) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: '#e2e7f0' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{title}</h3>
        <button type="button" onClick={onEdit} className="text-xs font-semibold flex items-center gap-1" style={{ color: '#3b5bdb' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="text-xs font-medium mb-0.5" style={{ color: '#9ca3af' }}>{label}</div>
            <div className="text-sm truncate" style={{ color: '#1a1f36' }}>{value || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SuccessScreen({ user, studentCode, onDone, onHome }: { user: SessionUser; studentCode: string; onDone: () => void; onHome: () => void }) {
  const firstName = user.name.split(' ')[0]
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#f0f3fa' }}>
      <div className="w-full max-w-md bg-white rounded-2xl border p-8 text-center" style={{ borderColor: '#e2e7f0', boxShadow: '0 10px 40px rgba(15,23,42,0.08)', animation: 'popIn 0.35s ease' }}>
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
          style={{ backgroundColor: '#ecfdf5', border: '6px solid #d1fae5' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mt-5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>
          Success! Your account is ready
        </h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: '#6b7280' }}>
          Welcome to EduManage, <strong style={{ color: '#1a1f36' }}>{firstName}</strong>. Your student
          account was created successfully and you will be redirected to your dashboard in a moment.
        </p>
        {studentCode && (
          <div className="mt-5 rounded-lg p-4" style={{ backgroundColor: '#eff2ff', border: '1px solid #c1ceff' }}>
            <div className="text-xs font-medium" style={{ color: '#6b7280' }}>Your Student Code</div>
            <div className="text-xl font-bold mt-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#3451c7' }}>{studentCode}</div>
            <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>Use this code when referring to your enrollment.</div>
          </div>
        )}
        <div className="mt-5 p-3 rounded-lg text-xs" style={{ backgroundColor: '#f8f9fd', color: '#9ca3af' }}>
          A confirmation email was sent to <span style={{ color: '#3451c7' }}>{user.email}</span>
        </div>
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={onDone}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3451c7')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#3b5bdb')}
          >
            Go to Student Dashboard →
          </button>
          <button onClick={onHome} className="text-sm font-medium pt-1" style={{ color: '#6b7280' }}>
            Back to home
          </button>
        </div>
      </div>
    </div>
  )
}