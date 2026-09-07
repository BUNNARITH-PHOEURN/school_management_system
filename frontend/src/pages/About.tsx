import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

interface AboutPageProps {
  onHome: () => void
  onLogin: () => void
  onRegister: () => void
  onStudentRegister: () => void
  onStudentLogin: () => void
  onDepartments: () => void
  onContact: () => void
}

const pillars = [
  {
    icon: '🎯',
    title: 'Our Mission',
    text: 'To make school operations simple and transparent so educators spend less time on paperwork and more time supporting students.',
    color: '#3b5bdb',
  },
  {
    icon: '🔭',
    title: 'Our Vision',
    text: 'A connected digital home for every school — where students, teachers and administrators share one clear view of learning.',
    color: '#13a6df',
  },
  {
    icon: '💡',
    title: 'Our Values',
    text: 'Clarity, accessibility and respect for every learner. We build tools that work for everyone, from front office to classroom.',
    color: '#16c795',
  },
]

const team = [
  { name: 'Bunnarith Phoeurn', role: 'Founder & Lead Developer', color: '#3b5bdb' },
  { name: 'Socheata Kim', role: 'Admissions Coordinator', color: '#d97706' },
  { name: 'Rithy Chan', role: 'Curriculum Director', color: '#059669' },
  { name: 'Narith Bun', role: 'Student Services Lead', color: '#7c3aed' },
]

const highlights = [
  ['5+', 'Departments'],
  ['3', 'Academic programs'],
  ['1', 'Connected platform'],
  ['24/7', 'Student access'],
]

export default function AboutPage({ onHome, onLogin, onRegister, onStudentRegister, onStudentLogin, onDepartments, onContact }: AboutPageProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f9fc] text-[#17345f]">
      <SiteHeader
        onHome={onHome}
        onAbout={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onLogin={onLogin}
        onRegister={onStudentRegister}
        onDepartments={onDepartments}
        onContact={onContact}
        active="about"
        sectionLinks={false}
      />

      {/* Hero */}
      <section className="relative px-5 py-24 text-center text-white sm:py-32"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=85)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(19,45,86,0.72)' }} />
        <div className="relative">
          <p className="text-sm font-extrabold uppercase tracking-wide text-[#62d8ff]">About our school</p>
          <h1 className="font-heading mx-auto mt-3 max-w-2xl text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            One connected home for your school
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/85">
            EduManage brings enrollment, classes, subjects and attendance together so students and
            staff always know what's happening.
          </p>

          <div className="mx-auto mt-10 grid max-w-[680px] grid-cols-2 gap-3 sm:grid-cols-4">
            {highlights.map(([value, label]) => (
              <div key={label} className="rounded-xl bg-white/10 px-3 py-4 ring-1 ring-white/15 backdrop-blur-sm">
                <div className="font-heading text-2xl font-extrabold text-white">{value}</div>
                <div className="mt-0.5 text-xs font-semibold text-white/70">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission / Vision / Values cards */}
      <section className="px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-[1080px]">
          <div className="text-center">
            <p className="text-sm font-extrabold uppercase tracking-wide text-[#159fe0]">What drives us</p>
            <h2 className="font-heading mt-2 text-3xl font-extrabold text-[#173c73]">Mission, Vision &amp; Values</h2>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {pillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-2xl border border-white bg-white p-6 shadow-sm"
                style={{ borderColor: '#e2e7f0', boxShadow: '0 8px 30px rgba(15,23,42,0.05)' }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: pillar.color + '1a' }}>
                  {pillar.icon}
                </div>
                <h3 className="font-heading mt-4 text-lg font-bold text-[#173c73]">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#62738d]">{pillar.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Team grid */}
      <section className="bg-white px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-[1080px]">
          <div className="text-center">
            <p className="text-sm font-extrabold uppercase tracking-wide text-[#159fe0]">The people</p>
            <h2 className="font-heading mt-2 text-3xl font-extrabold text-[#173c73]">Meet our team</h2>
          </div>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-2xl border border-white p-6 text-center"
                style={{ borderColor: '#e2e7f0', boxShadow: '0 8px 30px rgba(15,23,42,0.05)' }}
              >
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: member.color, fontFamily: 'Outfit, sans-serif' }}
                >
                  {member.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <h3 className="font-heading mt-4 text-base font-bold text-[#173c73]">{member.name}</h3>
                <p className="mt-1 text-sm text-[#72819a]">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-14 lg:px-8">
        <div className="mx-auto flex max-w-[1080px] flex-col items-center justify-between gap-5 rounded-2xl px-8 py-10 text-white sm:flex-row"
          style={{ background: 'linear-gradient(135deg, #183a76 0%, #23558f 50%, #12a6df 100%)' }}>
          <div>
            <h2 className="font-heading text-2xl font-extrabold">Ready to get started?</h2>
            <p className="mt-1 text-sm text-white/70">Create a student account or explore the portal today.</p>
          </div>
          <button
            onClick={onStudentRegister}
            className="shrink-0 rounded-full bg-[#13c694] px-6 py-3 text-sm font-extrabold text-white"
          >
            Register as Student →
          </button>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}