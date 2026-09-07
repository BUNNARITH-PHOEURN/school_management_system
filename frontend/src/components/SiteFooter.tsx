export default function SiteFooter() {
  return (
    <footer id="contact" className="bg-[#0d172b] px-5 py-12 text-white lg:px-8">
      <div className="mx-auto flex max-w-[1180px] justify-between gap-6">
        <div>
          <div className="font-heading text-xl font-extrabold">EduManage</div>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/55">
            A modern school management platform for students, teachers, and administrators.
          </p>
        </div>
        <div className="text-sm text-white/55">
          <div className="mb-2 font-bold text-white">Contact</div>
          <div>Phnom Penh, Cambodia</div>
          <div>info@edumanage.edu</div>
        </div>
      </div>
    </footer>
  )
}