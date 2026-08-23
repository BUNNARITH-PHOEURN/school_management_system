import { useState } from 'react'
import { enrollments as initial, students, classes, getStudentName, getClassName, type Enrollment, type EnrollmentStatus } from '../data/mockData'
import Badge, { statusVariant } from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle } from '../components/Modal'

export default function Enrollments() {
  const [data, setData] = useState(initial)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<EnrollmentStatus | 'all'>('all')
  const [filterClass, setFilterClass] = useState<number | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ studentId: 1, classId: 1 })

  const filtered = data.filter(e =>
    (filterStatus === 'all' || e.status === filterStatus) &&
    (filterClass === 'all' || e.classId === filterClass) &&
    `${getStudentName(e.studentId)} ${getClassName(e.classId)}`.toLowerCase().includes(search.toLowerCase())
  )

  const handleEnroll = () => {
    const already = data.find(e => e.studentId === form.studentId && e.classId === form.classId && e.status === 'enrolled')
    if (already) return
    setData(prev => [...prev, { id: Math.max(...prev.map(e => e.id)) + 1, ...form, enrolledAt: new Date().toISOString().slice(0, 10), status: 'enrolled' as const }])
    setModalOpen(false)
  }
  const updateStatus = (id: number, status: EnrollmentStatus) => setData(prev => prev.map(e => e.id === id ? { ...e, status } : e))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Enrollments</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>{data.filter(e => e.status === 'enrolled').length} active enrollments</p>
        </div>
        <button onClick={() => { setForm({ studentId: students[0].id, classId: classes[0].id }); setModalOpen(true) }} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
          + Enroll Student
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Enrolled', count: data.filter(e => e.status === 'enrolled').length, color: '#059669', bg: '#d1fae5' },
          { label: 'Dropped', count: data.filter(e => e.status === 'dropped').length, color: '#e11d48', bg: '#ffe4e6' },
          { label: 'Completed', count: data.filter(e => e.status === 'completed').length, color: '#3b5bdb', bg: '#dde4ff' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: '#e2e7f0' }}>
            <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color }}>{count}</div>
            <div className="text-xs" style={{ color: '#9ca3af' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3" style={{ borderColor: '#e2e7f0' }}>
        <div className="relative flex-1 min-w-40">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student or class…" className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as EnrollmentStatus | 'all')} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Status</option>
          <option value="enrolled">Enrolled</option>
          <option value="dropped">Dropped</option>
          <option value="completed">Completed</option>
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#f8f9fd', borderBottom: '1px solid #e2e7f0' }}>
              {['Student', 'Class', 'Enrolled Date', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12" style={{ color: '#9ca3af' }}>No enrollments found</td></tr>
            ) : filtered.map(e => {
              const student = students.find(s => s.id === e.studentId)
              return (
                <tr key={e.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: '#f0f3fa' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                        {student?.firstName[0]}{student?.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: '#1a1f36' }}>{getStudentName(e.studentId)}</div>
                        <div className="text-xs" style={{ color: '#9ca3af' }}>{student?.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#374151' }}>{getClassName(e.classId)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>{e.enrolledAt}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant(e.status)} dot>{e.status}</Badge></td>
                  <td className="px-4 py-3">
                    <select value={e.status} onChange={ev => updateStatus(e.id, ev.target.value as EnrollmentStatus)}
                      className="px-2 py-1 text-xs rounded-lg border outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
                      <option value="enrolled">Enrolled</option>
                      <option value="dropped">Dropped</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Enroll Student" width={440}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
            <button onClick={handleEnroll} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>Enroll</button>
          </>
        }
      >
        <FormField label="Student" required>
          <select value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: Number(e.target.value) }))} className={inputClass} style={inputStyle}>
            {students.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.code})</option>)}
          </select>
        </FormField>
        <FormField label="Class" required>
          <select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: Number(e.target.value) }))} className={inputClass} style={inputStyle}>
            {classes.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
      </Modal>
    </div>
  )
}
