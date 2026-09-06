import { useState } from 'react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

interface ContactPageProps {
  onHome: () => void
  onAbout: () => void
  onDepartments: () => void
  onLogin: () => void
  onRegister: () => void
  onStudentRegister: () => void
}

const infoCards = [
  { icon: '📍', title: 'Visit Us', lines: ['Phnom Penh, Cambodia', 'St. 271, Sangkat Kakab'] },
  { icon: '📧', title: 'Email Us', lines: ['info@edumanage.edu', 'support@edumanage.edu'] },
  { icon: '📞', title: 'Call Us', lines: ['+855 12 345 678', 'Mon–Fri, 8:00 – 17:00'] },
]

const inputCls = 'w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors'

export default function ContactPage({ onHome, onAbout, onDepartments, onLogin, onRegister, onStudentRegister }: ContactPageProps) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim()) || !form.message.trim()) {
      setError('Please fill in your name, a valid email, and a message.')
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f9fc] text-[#17345f]">
      <SiteHeader
        onHome={onHome}
        onAbout={onAbout}
        onLogin={onLogin}
        onRegister={onStudentRegister}
        onDepartments={onDepartments}
        onContact={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        active="contact"
        sectionLinks={false}
      />

      {/* Hero */}
      <section className="relative px-5 py-20 text-center text-white sm:py-24"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=85)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(19,45,86,0.78)' }} />
        <div className="relative">
          <p className="text-sm font-extrabold uppercase tracking-wide text-[#62d8ff]">We're here to help</p>
          <h1 className="font-heading mx-auto mt-3 max-w-2xl text-3xl font-extrabold sm:text-4xl">
            Contact Us
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/85">
            Questions about enrollment, subjects or your account? Send us a message and we'll get back to you.
          </p>
        </div>
      </section>

      {/* Info cards + form */}
      <section className="px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-[1080px]">
          <div className="grid gap-5 sm:grid-cols-3">
            {infoCards.map(card => (
              <div key={card.title} className="rounded-2xl border border-[#e1e7f0] bg-white p-6 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: '#eff2ff' }}>
                  {card.icon}
                </div>
                <h3 className="font-heading mt-4 text-base font-bold text-[#173c73]">{card.title}</h3>
                {card.lines.map(line => (
                  <p key={line} className="mt-1 text-sm text-[#72819a]">{line}</p>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {/* Form */}
            <div className="rounded-2xl border border-[#e1e7f0] bg-white p-8 shadow-sm">
              <h2 className="font-heading text-xl font-bold text-[#173c73]">Send us a message</h2>
              <p className="mt-1 text-sm text-[#72819a]">We usually reply within 1–2 business days.</p>
              {sent ? (
                <div className="mt-5 rounded-xl p-6 text-center" style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  <div className="text-3xl">✅</div>
                  <h3 className="font-heading mt-2 text-lg font-bold text-[#065f46]">Message sent!</h3>
                  <p className="mt-1 text-sm text-[#047857]">Thanks {form.name.trim().split(' ')[0]} — we'll be in touch soon.</p>
                  <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }} className="mt-4 text-sm font-bold text-[#059669] hover:underline">
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#374151]">Your name</label>
                      <input value={form.name} onChange={set('name')} placeholder="Socheata Kim" className={inputCls} style={{ borderColor: error && !form.name.trim() ? '#fca5a5' : '#e2e7f0' }} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#374151]">Email address</label>
                      <input value={form.email} onChange={set('email')} placeholder="you@example.com" className={inputCls} style={{ borderColor: error && !/^\S+@\S+\.\S+$/.test(form.email.trim()) ? '#fca5a5' : '#e2e7f0' }} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#374151]">Subject</label>
                    <input value={form.subject} onChange={set('subject')} placeholder="Enrollment question" className={inputCls} style={{ borderColor: '#e2e7f0' }} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#374151]">Message</label>
                    <textarea value={form.message} onChange={set('message')} rows={5} placeholder="How can we help?" className={inputCls} style={{ borderColor: error && !form.message.trim() ? '#fca5a5' : '#e2e7f0', resize: 'vertical' }} />
                  </div>
                  {error && <p className="text-sm text-[#cb3d56]">{error}</p>}
                  <button type="submit" className="w-full rounded-lg py-3 text-sm font-bold text-white" style={{ backgroundColor: '#173c73' }}>
                    Send Message →
                  </button>
                </form>
              )}
            </div>

            {/* Map / info panel */}
            <div className="flex flex-col gap-5">
              <div className="relative flex-1 overflow-hidden rounded-2xl border border-[#e1e7f0] min-h-[240px]">
                <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#e4eaf3' }}>
                  <div className="text-center">
                    <div className="text-3xl">🏫</div>
                    <div className="mt-2 text-sm font-bold text-[#173c73]">EduManage Campus</div>
                    <div className="text-xs text-[#72819a]">St. 271, Sangkat Kakab, Phnom Penh</div>
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 rounded-lg bg-[#0d172b] px-3 py-1.5 text-xs font-bold text-white">📍 Map</div>
              </div>
              <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #183a76 0%, #23558f 50%, #12a6df 100%)' }}>
                <h3 className="font-heading text-lg font-bold text-white">Prefer to get started now?</h3>
                <p className="mt-1 text-sm text-white/75">Create your student account and start enrolling in classes today.</p>
                <button onClick={onStudentRegister} className="mt-4 rounded-full bg-[#13c694] px-5 py-2.5 text-sm font-extrabold text-white">
                  Register as Student →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}