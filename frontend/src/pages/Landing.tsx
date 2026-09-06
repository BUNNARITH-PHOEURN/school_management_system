import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import {
  departments,
  subjects,
  classes,
  academicYears,
  students,
  teachers,
} from '../data/mockData'

// ── Reveal-on-scroll hook ──────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}

// ── Animated reveal wrapper ────────────────────────────────────────
function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const { ref, visible } = useReveal(0.12)
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s cubic-bezier(.22,1,.36,1) ${delay}s, transform 0.7s cubic-bezier(.22,1,.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

// ── Section headings ───────────────────────────────────────────────
function SectionHeading({
  label,
  title,
  subtitle,
}: {
  label: string
  title: string
  subtitle: string
}) {
  return (
    <Reveal className="text-center mb-14">
      <span
        className="inline-block text-xs font-semibold tracking-widest uppercase mb-3 px-3 py-1 rounded-full"
        style={{
          backgroundColor: '#eff2ff',
          color: '#3b5bdb',
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        {label}
      </span>
      <h2
        className="text-3xl md:text-4xl font-bold mb-3"
        style={{ fontFamily: 'Outfit, sans-serif', color: '#13203b' }}
      >
        {title}
      </h2>
      <p className="text-base max-w-xl mx-auto" style={{ color: '#6b7280' }}>
        {subtitle}
      </p>
    </Reveal>
  )
}

// ── Stat counter ───────────────────────────────────────────────────
function StatCounter({
  value,
  label,
  delay,
}: {
  value: string
  label: string
  delay: number
}) {
  return (
    <Reveal delay={delay}>
      <div className="text-center">
        <div
          className="text-4xl md:text-5xl font-extrabold mb-1"
          style={{
            fontFamily: 'Outfit, sans-serif',
            color: '#fff',
            textShadow: '0 2px 12px rgba(59,91,219,.35)',
          }}
        >
          {value}
        </div>
        <div
          className="text-sm font-medium"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          {label}
        </div>
      </div>
    </Reveal>
  )
}

// ── Card colors for tabs ───────────────────────────────────────────
const TAB_COLORS = {
  departments: { bg: '#eff2ff', border: '#c1ceff', accent: '#3b5bdb', icon: '🏛️' },
  subjects: { bg: '#ecfdf5', border: '#a7f3d0', accent: '#059669', icon: '📚' },
  classes: { bg: '#fef3c7', border: '#fde68a', accent: '#d97706', icon: '🏫' },
  years: { bg: '#fff1f2', border: '#fecdd3', accent: '#e11d48', icon: '📅' },
} as const

type TabKey = keyof typeof TAB_COLORS

// ── Smooth nav offset (sticky bar height) ──────────────────────────
const NAV_H = 72

interface LandingProps {
  onLoginClick: () => void
}

export default function Landing({ onLoginClick }: LandingProps) {
  const [activeSection, setActiveSection] = useState('home')
  const [scrolled, setScrolled] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('departments')

  // ── Scroll tracking ──────────────────────────────────────────────
  useEffect(() => {
    const sections = [
      'home',
      'about',
      'academics',
      'contact',
    ]

    const onScroll = () => {
      setScrolled(window.scrollY > 20)

      const scrollY = window.scrollY + NAV_H + 80
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= scrollY) {
          setActiveSection(id)
          break
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Smooth scroll ────────────────────────────────────────────────
  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const top = el.offsetTop - NAV_H
    window.scrollTo({ top, behavior: 'smooth' })
    setMobileNavOpen(false)
  }, [])

  // ── Nav links ────────────────────────────────────────────────────
  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'academics', label: 'Departments' },
    { id: 'academics', label: 'Subjects' },
    { id: 'academics', label: 'Classes' },
    { id: 'academics', label: 'Academic Years' },
    { id: 'contact', label: 'Contact' },
  ]
  // deduplicate by id+label for the active highlight
  const uniqueLinks = [
    ...new Map(navLinks.map((l) => [l.label, l])).values(),
  ]

  // ── Tab data ─────────────────────────────────────────────────────
  const tabData: Record<TabKey, { label: string; tagline: string; items: { title: string; desc: string; meta?: string }[] }> = {
    departments: {
      label: 'Departments',
      tagline: 'Academic faculties & fields',
      items: departments.map((d) => ({
        title: d.name,
        desc: d.description,
        meta: d.code,
      })),
    },
    subjects: {
      label: 'Subjects',
      tagline: 'Courses offered to students',
      items: subjects.map((s) => ({
        title: s.name,
        desc: s.description,
        meta: `${s.code} · ${s.credits} credits`,
      })),
    },
    classes: {
      label: 'Classes',
      tagline: 'Scheduled sessions & rooms',
      items: classes.map((c) => ({
        title: c.name,
        desc: `${c.room} · ${c.day}`,
        meta: `${c.startTime} – ${c.endTime}`,
      })),
    },
    years: {
      label: 'Academic Years',
      tagline: 'School year calendars',
      items: academicYears.map((y) => ({
        title: y.name,
        desc: `${y.startDate} to ${y.endDate}`,
        meta: y.status,
      })),
    },
  }

  const activeTabData = tabData[activeTab]
  const tc = TAB_COLORS[activeTab]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fc' }}>
      {/* ═══════════════════════════════════════════════════════════════
          NAV BAR
      ═══════════════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0)',
          backdropFilter: scrolled ? 'blur(14px)' : 'blur(0px)',
          borderBottom: scrolled ? '1px solid #e2e7f0' : '1px solid transparent',
          boxShadow: scrolled ? '0 1px 24px rgba(19,32,59,0.06)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[72px]">
          {/* Logo */}
          <button
            onClick={() => scrollTo('home')}
            className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#3b5bdb' }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div>
              <div
                className="text-sm font-bold leading-tight"
                style={{ fontFamily: 'Outfit, sans-serif', color: '#13203b' }}
              >
                Group 4 UP School
              </div>
              <div
                className="text-[10px]"
                style={{ color: '#6b7280' }}
              >
                School Management System
              </div>
            </div>
          </button>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {uniqueLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.id)}
                className="relative px-3 py-2 text-sm font-medium transition-colors rounded-lg cursor-pointer"
                style={{
                  color:
                    activeSection === link.id ? '#3b5bdb' : '#4b5563',
                  backgroundColor:
                    activeSection === link.id ? '#eff2ff' : 'transparent',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                {link.label}
                {activeSection === link.id && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                    style={{ backgroundColor: '#3b5bdb' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* CTA buttons + mobile hamburger */}
          <div className="flex items-center gap-2">
            <button
              onClick={onLoginClick}
              className="hidden sm:inline-flex px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
              style={{
                fontFamily: 'Outfit, sans-serif',
                color: '#3b5bdb',
                border: '1.5px solid #c1ceff',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#eff2ff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Register
            </button>
            <button
              onClick={onLoginClick}
              className="hidden sm:inline-flex px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all cursor-pointer"
              style={{
                fontFamily: 'Outfit, sans-serif',
                backgroundColor: '#3b5bdb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3451c7'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b5bdb'
              }}
            >
              Login
            </button>
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg cursor-pointer"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#374151"
                strokeWidth="2"
                strokeLinecap="round"
              >
                {mobileNavOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileNavOpen && (
          <div
            className="lg:hidden px-4 pb-4 pt-2 space-y-1 border-t"
            style={{
              backgroundColor: '#fff',
              borderColor: '#e2e7f0',
            }}
          >
            {uniqueLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.id)}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium cursor-pointer"
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  color: activeSection === link.id ? '#3b5bdb' : '#374151',
                  backgroundColor: activeSection === link.id ? '#eff2ff' : 'transparent',
                }}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-2 flex gap-2">
              <button
                onClick={onLoginClick}
                className="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer"
                style={{ fontFamily: 'Outfit, sans-serif', color: '#3b5bdb', border: '1.5px solid #c1ceff' }}
              >
                Register
              </button>
              <button
                onClick={onLoginClick}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
                style={{ fontFamily: 'Outfit, sans-serif', backgroundColor: '#3b5bdb' }}
              >
                Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════════════════════
          HERO — HOME
      ═══════════════════════════════════════════════════════════════ */}
      <section
        id="home"
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, #0d1726 0%, #13203b 40%, #1a2d52 100%)',
          paddingTop: NAV_H,
        }}
      >
        {/* Decorative shapes — Cambodia / rice field vibe */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ overflow: 'hidden' }}
        >
          {/* Angkor Wat silhouette approximation */}
          <svg
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
            width="900"
            height="220"
            viewBox="0 0 900 220"
            fill="none"
            style={{ opacity: 0.06 }}
          >
            <path
              d="M450 0l60 80h50v40l40 100h250v50H0v-50h200l40-100V80h50z"
              fill="white"
            />
            <path
              d="M450 10l50 65h40v35l35 85h210v45H50v-45h225l35-85V75h40z"
              fill="white"
            />
            {/* Tower spires */}
            <rect x="430" y="-20" width="12" height="60" rx="6" fill="white" />
            <rect x="458" y="-20" width="12" height="60" rx="6" fill="white" />
            <rect x="444" y="-30" width="12" height="70" rx="6" fill="white" />
          </svg>

          {/* Rice field horizontal waves */}
          <svg
            className="absolute bottom-0 left-0 right-0"
            width="100%"
            height="120"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            style={{ opacity: 0.08 }}
          >
            <path d="M0,80 C360,20 720,100 1080,40 C1260,10 1380,60 1440,80 L1440,120 L0,120z" fill="white" />
            <path d="M0,95 C300,60 600,110 900,70 C1200,30 1380,90 1440,95 L1440,120 L0,120z" fill="white" />
          </svg>

          {/* Golden accents */}
          <div
            className="absolute top-20 right-[15%] w-2 h-2 rounded-full"
            style={{ backgroundColor: '#f59e0b', opacity: 0.5 }}
          />
          <div
            className="absolute top-32 right-[22%] w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#f59e0b', opacity: 0.35 }}
          />
          <div
            className="absolute bottom-28 left-[10%] w-2 h-2 rounded-full"
            style={{ backgroundColor: '#f59e0b', opacity: 0.4 }}
          />
          <div
            className="absolute top-24 left-[20%] w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#3b5bdb', opacity: 0.4 }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 md:pt-28 md:pb-36">
          <div className="max-w-2xl">
            <Reveal>
              <span
                className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase mb-6 px-4 py-1.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(59,91,219,0.18)',
                  color: '#7a9cff',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#3b5bdb' }} />
                Welcome to Group 4
              </span>
            </Reveal>

            <Reveal delay={0.1}>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
                style={{ fontFamily: 'Outfit, sans-serif', color: '#fff' }}
              >
                Shaping Cambodia's{' '}
                <span style={{ color: '#7a9cff' }}>Future Leaders</span>{' '}
                Through Education
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p
                className="text-lg md:text-xl leading-relaxed mb-10 max-w-xl"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                Empowering students across the Kingdom of Cambodia with modern school management —
                attendance, enrollment, scheduling, and reporting — all in one place.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onLoginClick}
                  className="px-7 py-3.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer"
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    backgroundColor: '#3b5bdb',
                    boxShadow: '0 4px 24px rgba(59,91,219,0.35)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3451c7'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b5bdb'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Get Started →
                </button>
                <button
                  onClick={() => scrollTo('about')}
                  className="px-7 py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    color: 'rgba(255,255,255,0.7)',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  }}
                >
                  Learn More
                </button>
              </div>
            </Reveal>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-2xl">
            <StatCounter value={String(departments.length)} label="Departments" delay={0.35} />
            <StatCounter value={String(subjects.length)} label="Subjects" delay={0.45} />
            <StatCounter value={String(classes.length)} label="Classes" delay={0.55} />
            <StatCounter value={String(students.length)} label="Students" delay={0.65} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ABOUT
      ═══════════════════════════════════════════════════════════════ */}
      <section id="about" className="py-24 md:py-32" style={{ backgroundColor: '#f8f9fc' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="About Us"
            title="Rooted in Cambodian Heritage"
            subtitle="Building on centuries of Khmer excellence to deliver modern education management for tomorrow's leaders."
          />

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                ),
                title: 'Angkor-Inspired Vision',
                desc: 'Just as Angkor Wat stands as a testament to Khmer ingenuity, we build enduring systems that support every student\'s journey from enrollment to graduation.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
                title: 'Community First',
                desc: 'From Phnom Penh to Siem Reap, our platform connects teachers, students, and administrators — strengthening Cambodia\'s growing education network.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                ),
                title: 'Efficient & Modern',
                desc: 'Real-time attendance tracking, class scheduling, enrollment management, and detailed reporting — saving hours of administrative work every week.',
              },
            ].map((card, i) => (
              <Reveal key={card.title} delay={i * 0.1}>
                <div
                  className="rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 h-full"
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #e8ecf8',
                    boxShadow: '0 1px 4px rgba(19,32,59,0.04)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(19,32,59,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(19,32,59,0.04)'
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: '#f5f7ff' }}
                  >
                    {card.icon}
                  </div>
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ fontFamily: 'Outfit, sans-serif', color: '#13203b' }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>
                    {card.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ACADEMICS — TABS
      ═══════════════════════════════════════════════════════════════ */}
      <section id="academics" className="py-24 md:py-32" style={{ backgroundColor: '#fff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Academics"
            title="Explore Our Academic World"
            subtitle="Discover the departments, subjects, classes, and academic years that make up our vibrant learning community."
          />

          {/* Tab bar */}
          <Reveal>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {(Object.keys(tabData) as TabKey[]).map((key) => {
                const active = activeTab === key
                const colors = TAB_COLORS[key]
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className="relative px-5 py-3 rounded-xl text-left transition-all cursor-pointer"
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      color: active ? colors.accent : '#4b5563',
                      backgroundColor: active ? colors.bg : '#f8f9fc',
                      border: `1.5px solid ${active ? colors.border : '#e8ecf8'}`,
                      boxShadow: active ? `0 4px 16px ${colors.border}` : 'none',
                      minWidth: 150,
                    }}
                  >
                    <span
                      className="block text-sm font-bold mb-0.5"
                      style={{ color: active ? colors.accent : '#374151' }}
                    >
                      <span className="mr-1.5">{colors.icon}</span>
                      {tabData[key].label}
                    </span>
                    <span
                      className="block text-[11px] font-normal leading-tight"
                      style={{ color: '#6b7280' }}
                    >
                      {tabData[key].tagline}
                    </span>
                  </button>
                )
              })}
            </div>
          </Reveal>

          {/* Active tab header */}
          <Reveal>
            <div className="flex items-center gap-3 mb-8 max-w-2xl mx-auto">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: tc.bg, border: `1.5px solid ${tc.border}` }}
              >
                {tc.icon}
              </div>
              <div>
                <h3
                  className="text-xl font-bold leading-tight"
                  style={{ fontFamily: 'Outfit, sans-serif', color: '#13203b' }}
                >
                  {activeTabData.label}
                </h3>
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  {activeTabData.items.length} {activeTabData.tagline.toLowerCase()}
                </p>
              </div>
            </div>
          </Reveal>

          {/* Tab content cards */}
          <div
            key={activeTab}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {activeTabData.items.map((item, i) => (
              <Reveal key={`${activeTab}-${item.title}`} delay={i * 0.07}>
                <div
                  className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col"
                  style={{
                    backgroundColor: '#fff',
                    border: `1.5px solid ${tc.border}`,
                    boxShadow: '0 1px 4px rgba(19,32,59,0.03)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(19,32,59,0.08)'
                    e.currentTarget.style.borderColor = tc.accent
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(19,32,59,0.03)'
                    e.currentTarget.style.borderColor = tc.border
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4
                      className="font-bold text-base"
                      style={{ fontFamily: 'Outfit, sans-serif', color: '#13203b' }}
                    >
                      {item.title}
                    </h4>
                    <span
                      className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md flex-shrink-0 ml-2"
                      style={{
                        backgroundColor: tc.bg,
                        color: tc.accent,
                      }}
                    >
                      {item.meta}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>
                    {item.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Academic Years highlight row */}
          <Reveal delay={0.15}>
            <div
              className="mt-8 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              style={{
                backgroundColor: '#eff2ff',
                border: '1px solid #c1ceff',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#fff' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="flex-1">
                <h4
                  className="font-bold text-sm mb-0.5"
                  style={{ fontFamily: 'Outfit, sans-serif', color: '#13203b' }}
                >
                  Current Academic Year: {academicYears.find((y) => y.status === 'active')?.name ?? 'N/A'}
                </h4>
                <p className="text-sm" style={{ color: '#4b5563' }}>
                  {academicYears.find((y) => y.status === 'active')?.startDate ?? ''} to{' '}
                  {academicYears.find((y) => y.status === 'active')?.endDate ?? ''} — {teachers.length} faculty members,{' '}
                  {students.filter((s) => s.status === 'active').length} active students
                </p>
              </div>
              <button
                onClick={onLoginClick}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer flex-shrink-0"
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  backgroundColor: '#3b5bdb',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3451c7'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b5bdb'
                }}
              >
                Login to manage
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CONTACT
      ═══════════════════════════════════════════════════════════════ */}
      <section id="contact" className="py-24 md:py-32" style={{ backgroundColor: '#f8f9fc' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Get in Touch"
            title="Contact Us"
            subtitle="Have questions about enrollment or the system? We're here to help."
          />

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                ),
                title: 'Address',
                lines: ['Street 215, Sangkat Boeung Keng Kang', 'Phnom Penh, Cambodia'],
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                ),
                title: 'Email',
                lines: ['info@group4upschool.edu.kh', 'admin@group4upschool.edu.kh'],
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                ),
                title: 'Phone',
                lines: ['+855 23 888 000', 'Mon – Fri, 07:00 – 17:00'],
              },
            ].map((card, i) => (
              <Reveal key={card.title} delay={i * 0.1}>
                <div
                  className="rounded-2xl p-6 text-center h-full transition-all duration-300 hover:-translate-y-1"
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #e8ecf8',
                    boxShadow: '0 1px 4px rgba(19,32,59,0.04)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(19,32,59,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(19,32,59,0.04)'
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#f5f7ff' }}
                  >
                    {card.icon}
                  </div>
                  <h4
                    className="font-bold text-sm mb-2"
                    style={{ fontFamily: 'Outfit, sans-serif', color: '#13203b' }}
                  >
                    {card.title}
                  </h4>
                  {card.lines.map((line, li) => (
                    <p key={li} className="text-sm" style={{ color: '#6b7280' }}>
                      {line}
                    </p>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════ */}
      <footer
        className="border-t py-10"
        style={{ backgroundColor: '#13203b', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#3b5bdb' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <span
              className="text-sm font-bold"
              style={{ fontFamily: 'Outfit, sans-serif', color: '#fff' }}
            >
              Group 4 UP School
            </span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            © 2026 Group 4 UP School. All rights reserved. Built with ❤️ in Cambodia.
          </p>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════
          SCROLL-TO-TOP FAB
      ═══════════════════════════════════════════════════════════════ */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer z-50"
        style={{
          backgroundColor: '#3b5bdb',
          boxShadow: '0 4px 20px rgba(59,91,219,0.35)',
          opacity: scrolled ? 1 : 0,
          transform: scrolled ? 'translateY(0)' : 'translateY(20px)',
          pointerEvents: scrolled ? 'auto' : 'none',
        }}
        aria-label="Scroll to top"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </div>
  )
}
