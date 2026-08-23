import { useState } from 'react'
import { classes as initial, subjects, academicYears, teachers, getSubjectName, getAcademicYearName, getTeacherName, type Class } from '../data/mockData'
import Badge, { statusVariant } from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle } from '../components/Modal'

export default function Classes() {
  const [data, setData] = useState(initial)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Class | null>(null)
  const [form, setForm] = useState({ name: '', academicYearId: 2, subjectId: 1, room: '', day: '', startTime: '', endTime: '', teacherIds: [1] as number[] })

  const filtered = data.filter(c =>
    (filterStatus === 'all' || c.status === filterStatus) &&
    `${c.name} ${c.room} ${getSubjectName(c.subjectId)}`.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setEditing(null); setForm({ name: '', academicYearId: 2, subjectId: 1, room: '', day: '', startTime: '08:00', endTime: '09:30', teacherIds: [1] }); setModalOpen(true) }
  const openEdit = (c: Class) => { setEditing(c); setForm({ name: c.name, academicYearId: c.academicYearId, subjectId: c.subjectId, room: c.room, day: c.day, startTime: c.startTime, endTime: c.endTime, teacherIds: c.teacherIds }); setModalOpen(true) }
  const handleSave = () => {
    if (editing) setData(prev => prev.map(c => c.id === editing.id ? { ...c, ...form } : c))
    else setData(prev => [...prev, { id: Math.max(...prev.map(c => c.id)) + 1, ...form, status: 'active' as const }])
    setModalOpen(false)
  }
  const toggleStatus = (id: number) => setData(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Classes</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>{data.filter(c => c.status === 'active').length} active classes this year</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>+ Add Class</button>
      </div>

      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3" style={{ borderColor: '#e2e7f0' }}>
        <div className="relative flex-1 min-w-40">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classes…" className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-16" style={{ color: '#9ca3af' }}>
            <div className="text-3xl mb-2">📅</div>
            <div style={{ fontFamily: 'Outfit, sans-serif' }}>No classes found</div>
          </div>
        ) : filtered.map(cls => (
          <div key={cls.id} className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e7f0' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{cls.name}</div>
              <Badge variant={statusVariant(cls.status)} dot>{cls.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Subject', val: getSubjectName(cls.subjectId) },
                { label: 'Academic Year', val: getAcademicYearName(cls.academicYearId) },
                { label: 'Room', val: cls.room },
                { label: 'Schedule', val: cls.day },
                { label: 'Time', val: `${cls.startTime} – ${cls.endTime}` },
                { label: 'Teachers', val: cls.teacherIds.map(id => getTeacherName(id)).join(', ') },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div className="text-xs mb-0.5" style={{ color: '#9ca3af' }}>{label}</div>
                  <div className="text-sm font-medium" style={{ color: '#374151' }}>{val}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-3 border-t" style={{ borderColor: '#f0f3fa' }}>
              <button onClick={() => openEdit(cls)} className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50" style={{ borderColor: '#e2e7f0', color: '#374151' }}>Edit</button>
              <button onClick={() => toggleStatus(cls.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border" style={{ borderColor: cls.status === 'active' ? '#fca5a5' : '#e2e7f0', color: cls.status === 'active' ? '#e11d48' : '#059669' }}>
                {cls.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Class' : 'Add Class'} width={560}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>{editing ? 'Save' : 'Add Class'}</button>
          </>
        }
      >
        <FormField label="Class Name" required><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} style={inputStyle} placeholder="e.g. Algebra I — Section A" /></FormField>
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Academic Year"><select value={form.academicYearId} onChange={e => setForm(f => ({ ...f, academicYearId: Number(e.target.value) }))} className={inputClass} style={inputStyle}>{academicYears.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></FormField>
          <FormField label="Subject"><select value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: Number(e.target.value) }))} className={inputClass} style={inputStyle}>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></FormField>
        </div>
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Room"><input value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
          <FormField label="Day(s)"><input value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))} className={inputClass} style={inputStyle} placeholder="e.g. Monday / Wednesday" /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Start Time"><input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
          <FormField label="End Time"><input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
        </div>
        <FormField label="Assign Teacher">
          <select value={form.teacherIds[0]} onChange={e => setForm(f => ({ ...f, teacherIds: [Number(e.target.value)] }))} className={inputClass} style={inputStyle}>
            {teachers.filter(t => t.status === 'active').map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
          </select>
        </FormField>
      </Modal>
    </div>
  )
}
