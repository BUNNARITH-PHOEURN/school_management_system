import { useEffect, useState } from 'react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { listDepartments, type DepartmentRecord } from '../api/departments'
import { listSubjects, type Subject } from '../api/subjects'

interface DepartmentsPageProps {
  onHome: () => void
  onAbout: () => void
  onContact: () => void
  onLogin: () => void
  onRegister: () => void
  onStudentRegister: () => void
}

export default function DepartmentsPage({ onHome, onAbout, onContact, onLogin, onRegister, onStudentRegister }: DepartmentsPageProps) {
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listDepartments(), listSubjects()])
      .then(([deptRows, subjectRows]) => {
        setDepartments(deptRows.departments.filter(d => d.status === 'active'))
        setSubjects(subjectRows)
        setLoading(false)
      })
      .catch(() => {
        setDepartments([])
        setLoading(false)
      })
  }, [])

  const countFor = (id: number) => subjects.filter(s => s.department_id === id).length

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f9fc] text-[#17345f]">
      <SiteHeader
        onHome={onHome}
        onAbout={onAbout}
        onLogin={onLogin}
        onRegister={onStudentRegister}
        onDepartments={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onContact={onContact}
        active="departments"
        sectionLinks={false}
      />

      {/* Hero */}
      <section className="relative px-5 py-20 text-center text-white sm:py-24"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=85)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(19,45,86,0.75)' }} />
        <div className="relative">
          <p className="text-sm font-extrabold uppercase tracking-wide text-[#62d8ff]">Programs</p>
          <h1 className="font-heading mx-auto mt-3 max-w-2xl text-3xl font-extrabold sm:text-4xl">
            Our Departments
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/85">
            Explore the programs we offer — each department is home to subjects,
            students and teachers working together.
          </p>
        </div>
      </section>

      {/* Department cards */}
      <section className="px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-[1080px]">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-extrabold text-[#173c73]">
              All Departments
            </h2>
            <span className="rounded-full bg-[#eff2ff] px-3 py-1 text-xs font-bold text-[#3b5bdb]">
              {departments.length} {departments.length === 1 ? 'department' : 'departments'}
            </span>
          </div>

          {loading ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-44 animate-pulse rounded-2xl bg-[#e4eaf3]" />
              ))}
            </div>
          ) : departments.length === 0 ? (
            <div className="mt-9 rounded-2xl border border-dashed border-[#d9e2ee] bg-white py-14 text-center text-sm text-[#72819a]">
              No active departments available yet.
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {departments.map((department) => (
                <article
                  key={department.id}
                  className="flex flex-col rounded-2xl border border-[#e1e7f0] bg-white p-6 shadow-sm transition-transform hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-[#eff2ff] px-2.5 py-1 text-xs font-extrabold text-[#3b5bdb]">
                      {department.code}
                    </span>
                    <span className="text-lg">🏛️</span>
                  </div>
                  <h3 className="font-heading mt-4 text-lg font-bold text-[#173c73]">
                    {department.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-[#72819a]">
                    {department.description || 'Explore academic opportunities in this department.'}
                  </p>
                  <div className="mt-5 flex items-center gap-4 border-t pt-4 text-xs font-semibold text-[#526681]" style={{ borderColor: '#eef2f7' }}>
                    <span><strong style={{ color: '#173c73' }}>{department.student_count ?? 0}</strong> Students</span>
                    <span><strong style={{ color: '#173c73' }}>{department.teacher_count ?? 0}</strong> Teachers</span>
                    <span><strong style={{ color: '#173c73' }}>{countFor(department.id)}</strong> Subjects</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-14 lg:px-8">
        <div className="mx-auto flex max-w-[1080px] flex-col items-center justify-between gap-5 rounded-2xl px-8 py-10 text-white sm:flex-row"
          style={{ background: 'linear-gradient(135deg, #183a76 0%, #23558f 50%, #12a6df 100%)' }}>
          <div>
            <h2 className="font-heading text-2xl font-extrabold">Find your program</h2>
            <p className="mt-1 text-sm text-white/70">Create a student account to start enrolling.</p>
          </div>
          <button
            onClick={onStudentRegister}
            className="shrink-0 rounded-full bg-[#13c694] px-6 py-3 text-sm font-extrabold text-white"
          >
            Register as Student →
          </button>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}