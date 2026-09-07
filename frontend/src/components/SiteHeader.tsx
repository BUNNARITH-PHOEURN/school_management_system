interface SiteHeaderProps {
  onHome: () => void
  onAbout: () => void
  onLogin: () => void
  onRegister: () => void
  onDepartments?: () => void
  onContact?: () => void
  active?: 'home' | 'about' | 'departments' | 'contact'
  sectionLinks?: boolean
}

export default function SiteHeader({
  onHome,
  onAbout,
  onLogin,
  onRegister,
  onDepartments,
  onContact,
  active = 'home',
  sectionLinks = true,
}: SiteHeaderProps) {
  const sectionLink = (id: string, label: string) =>
    sectionLinks ? (
      <a href={`#${id}`} className="transition-colors hover:text-[#173c73]">{label}</a>
    ) : (
      <button onClick={onHome} className="transition-colors hover:text-[#173c73]">{label}</button>
    )

  const departmentsNav = onDepartments ? (
    <button
      onClick={onDepartments}
      className="transition-colors hover:text-[#173c73]"
      style={{ color: active === 'departments' ? '#173c73' : undefined }}
    >
      Departments
    </button>
  ) : (
    sectionLink('departments', 'Departments')
  )

  const contactNav = onContact ? (
    <button
      onClick={onContact}
      className="transition-colors hover:text-[#173c73]"
      style={{ color: active === 'contact' ? '#173c73' : undefined }}
    >
      Contact
    </button>
  ) : (
    sectionLink('contact', 'Contact')
  )

  return (
    <header className="sticky top-0 z-20 border-b border-[#e5eaf2] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-5 lg:px-8">
        <button onClick={onHome} className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#234783] text-lg text-white">✦</span>
          <span className="font-heading text-xl font-extrabold">EduManage</span>
        </button>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-[#60718b] md:flex">
          <button
            onClick={onHome}
            className="transition-colors hover:text-[#173c73]"
            style={{ color: active === 'home' ? '#173c73' : undefined }}
          >
            Home
          </button>
          <button
            onClick={onAbout}
            className="transition-colors hover:text-[#173c73]"
            style={{ color: active === 'about' ? '#173c73' : undefined }}
          >
            About
          </button>
          {departmentsNav}
          {contactNav}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={onLogin} className="px-3 py-2 text-sm font-bold">Login</button>
          <button
            onClick={onRegister}
            className="rounded-full bg-[#173c73] px-5 py-2.5 text-sm font-bold text-white"
          >
            Register
          </button>
        </div>
      </div>
    </header>
  )
}