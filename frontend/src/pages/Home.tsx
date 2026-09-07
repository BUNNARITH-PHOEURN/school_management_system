import { useEffect, useState } from "react";
import { listAcademicYears } from "../api/academicYears";
import { listDepartments, type DepartmentRecord } from "../api/departments";
import { listStudents } from "../api/students";
import { listSubjects, type Subject } from "../api/subjects";
import { listTeachers } from "../api/teachers";
import { listClasses } from "../api/classes";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

interface HomeProps {
  onLogin: () => void;
  onRegister: () => void;
  onStudentRegister: () => void;
  onStudentLogin: () => void;
  onAbout: () => void;
  onDepartments: () => void;
  onContact: () => void;
}

export default function Home({ onLogin, onRegister, onStudentRegister, onStudentLogin, onAbout, onDepartments, onContact }: HomeProps) {
  const [year, setYear] = useState("2026-2027");
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState({ students: 0, teachers: 0 });
  const [classCount, setClassCount] = useState(0);

  useEffect(() => {
    Promise.allSettled([
      listAcademicYears(),
      listDepartments(),
      listSubjects(),
      listStudents(),
      listTeachers(),
      listClasses(),
    ]).then(
      ([
        years,
        departmentResult,
        subjectRows,
        studentRows,
        teacherRows,
        classRows,
      ]) => {
        if (years.status === "fulfilled")
          setYear(
            years.value.find((item) => item.status === "active")?.name ??
              "2026-2027",
          );
        if (departmentResult.status === "fulfilled")
          setDepartments(
            departmentResult.value.departments.filter(
              (item) => item.status === "active",
            ),
          );
        if (subjectRows.status === "fulfilled") setSubjects(subjectRows.value);
        setStats({
          students:
            studentRows.status === "fulfilled" ? studentRows.value.length : 0,
          teachers:
            teacherRows.status === "fulfilled" ? teacherRows.value.length : 0,
        });
        if (classRows.status === "fulfilled")
          setClassCount(classRows.value.length);
      },
    );
  }, []);

  const cards = [
    [
      "departments",
      "🏛️",
      "Departments",
      "Explore academic departments and specializations.",
    ],
    [
      "subjects",
      "📚",
      "Subjects",
      "Browse available subjects across departments.",
    ],
    [
      "classes",
      "🏫",
      "Classes",
      "View class schedules, rooms, and instructors.",
    ],
    [
      "academic-years",
      "🗓️",
      "Academic Years",
      "See current and previous academic years.",
    ],
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f9fc] text-[#17345f]">
      <SiteHeader
        onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onAbout={onAbout}
        onLogin={onLogin}
        onRegister={onStudentRegister}
        onDepartments={onDepartments}
        onContact={onContact}
        active="home"
        sectionLinks
      />

      <main>
        <section
          id="home"
          className="relative bg-gradient-to-br from-[#183a76] via-[#23558f] to-[#12a6df] text-white"
        >
          <div className="mx-auto grid min-h-[450px] max-w-[1180px] items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:px-8 lg:py-16">
            <div>
              <div className="mb-6 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                ● Enrollment open for {year}
              </div>
              <h1 className="font-heading max-w-xl text-4xl font-extrabold leading-tight sm:text-5xl">
                Welcome to <span className="text-[#62d8ff]">EduManage</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/80">
                Manage your school information, classes, enrollment, and
                attendance in one connected place.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={onStudentRegister}
                  className="rounded-full bg-[#13c694] px-5 py-3 text-sm font-extrabold text-white"
                >
                  Register as Student
                </button>
                <button
                  onClick={onStudentLogin}
                  className="rounded-full border border-white/35 bg-white/10 px-5 py-3 text-sm font-extrabold text-white"
                >
                  Student Login →
                </button>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=85"
                alt="Students collaborating at school"
                className="h-[285px] w-full rounded-[22px] object-cover ring-4 ring-white/20"
              />
            </div>
          </div>
          <div className="mx-auto grid max-w-[1180px] translate-y-8 grid-cols-2 gap-3 px-5 sm:grid-cols-4 lg:grid-cols-5 lg:px-8">
            {[
              [stats.students, "Students", "🎓"],
              [stats.teachers, "Teachers", "👨‍🏫"],
              [departments.length, "Departments", "🏛️"],
              [subjects.length, "Subjects", "📚"],
              [classCount, "Classes", "🏫"],
            ].map(([value, label, icon]) => (
              <div
                key={String(label)}
                className="rounded-xl bg-white px-3 py-4 text-center shadow-md"
              >
                <div className="text-lg">{icon}</div>
                <div className="mt-1 font-heading text-xl font-extrabold text-[#173c73]">
                  {value}
                </div>
                <div className="text-xs font-semibold text-[#72819a]">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="about"
          className="mx-auto grid max-w-[1180px] items-center gap-10 px-5 pb-20 pt-24 lg:grid-cols-2 lg:px-8"
        >
          <img
            src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1000&q=85"
            alt="Bright classroom"
            className="h-[270px] w-full rounded-2xl object-cover lg:h-[320px]"
          />
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide text-[#159fe0]">
              About our school
            </p>
            <h2 className="font-heading mt-3 text-3xl font-extrabold text-[#173c73]">
              Building tomorrow's leaders
            </h2>
            <p className="mt-5 leading-7 text-[#62738d]">
              EduManage brings the essential work of a modern school together,
              helping educators spend less time searching and more time
              supporting students.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["🎯", "Mission"],
                ["🔭", "Vision"],
                ["💡", "Values"],
              ].map(([icon, label]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#e1e7f0] bg-white p-4 text-center shadow-sm"
                >
                  <div className="text-xl">{icon}</div>
                  <div className="font-heading mt-2 text-sm font-bold text-[#173c73]">
                    {label}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#72819a]">
                    {label === "Mission"
                      ? "Simple school operations, more time for learning"
                      : label === "Vision"
                        ? "One digital home for every school"
                        : "Clarity, access and respect for all"}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={onAbout}
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#159fe0] hover:text-[#173c73]"
            >
              View our full story →
            </button>
          </div>
        </section>

        <section id="academics" className="bg-[#eef3f9] px-5 py-16 lg:px-8">
          <div className="mx-auto max-w-[1080px] text-center">
            <p className="text-sm font-extrabold uppercase tracking-wide text-[#159fe0]">
              Explore
            </p>
            <h2 className="font-heading mt-2 text-3xl font-extrabold text-[#173c73]">
              Academic Information
            </h2>
            <div className="mt-8 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
              {cards.map(([id, icon, title, text]) => (
                <a
                  href={`#${id}`}
                  key={id}
                  className="rounded-xl border border-[#e1e7f0] bg-white p-5 shadow-sm"
                >
                  {id === "departments" ? (
                    <div className="flex min-h-8 flex-wrap items-center gap-1.5">
                      {departments.slice(0, 3).map((department) => (
                        <span
                          key={department.id}
                          className="rounded-lg bg-[#eff2ff] px-2.5 py-1.5 text-xs font-extrabold text-[#3b5bdb]"
                        >
                          {department.code}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-2xl">{icon}</div>
                  )}
                  <h3 className="font-heading mt-4 text-base font-bold text-[#173c73]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#72819a]">
                    {text}
                  </p>
                  <span className="mt-4 inline-block text-sm font-bold text-[#159fe0]">
                    View More →
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="departments" className="bg-[#f7f9fc] px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-[1180px]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-wide text-[#159fe0]">
                  Programs
                </p>
                <h2 className="font-heading mt-2 text-3xl font-extrabold text-[#173c73]">
                  Our Departments
                </h2>
              </div>
              <a
                href="#departments"
                className="mb-1 text-sm font-bold text-[#159fe0] hover:text-[#173c73]"
              >
                View All <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {departments.slice(0, 4).map((department, index) => (
                <article
                  key={department.id}
                  className="min-h-[250px] rounded-2xl border border-[#e1e7f0] bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="text-3xl">
                    {["💻", "📊", "🌐", "📚"][index % 4]}
                  </div>
                  <h3 className="font-heading mt-4 text-base font-bold text-[#173c73]">
                    {department.name}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-[#72819a]">
                    {department.description ||
                      "Explore academic opportunities in this department."}
                  </p>
                  <div className="mt-5 text-xs font-semibold text-[#526681]">
                    {
                      subjects.filter(
                        (subject) => subject.department_id === department.id,
                      ).length
                    }{" "}
                    subjects
                  </div>
                </article>
              ))}
            </div>
            {departments.length === 0 && (
              <div className="mt-9 rounded-2xl border border-dashed border-[#d9e2ee] bg-white py-12 text-center text-sm text-[#72819a]">
                No active departments available yet.
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
