import { useState } from 'react'
import { subjects as initial, departments, getDepartmentName, type Subject } from '../data/mockData'
import Badge, { statusVariant } from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle, ConfirmDialog } from '../components/Modal'

export default function Subjects() {
  const [data, setData] = useState(initial)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState<number | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', code: '', credits: 3, description: '', departmentId: 1 })

  const filtered = data.filter(s =>
    (filterDept === 'all' || s.departmentId === filterDept) &&
    `${s.name} ${s.code}`.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setEditing(null); setForm({ name: '', code: '', credits: 3, description: '', departmentId: 1 }); setModalOpen(true) }
  const openEdit = (s: Subject) => { setEditing(s); setForm({ name: s.name, code: s.code, credits: s.credits, description: s.description, departmentId: s.departmentId }); setModalOpen(true) }
  const handleSave = () => {
    if (editing) setData(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s))
    else setData(prev => [...prev, { id: Math.max(...prev.map(s => s.id)) + 1, ...form, status: 'active' as const }])
    setModalOpen(false)
  }
  const toggleStatus = (id: number) => setData(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Subjects</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>{data.filter(s => s.status === 'active').length} active subjects</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>+ Add Subject</button>
      </div>

      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3" style={{ borderColor: '#e2e7f0' }}>
        <div className="relative flex-1 min-w-40">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects…" className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0' }} />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#f8f9fd', borderBottom: '1px solid #e2e7f0' }}>
              {['Subject', 'Code', 'Department', 'Credits', 'Description', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12" style={{ color: '#9ca3af' }}>No subjects found</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: '#f0f3fa' }}>
                <td className="px-4 py-3 font-medium" style={{ color: '#1a1f36' }}>{s.name}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: '#6b7280' }}>{s.code}</td>
                <td className="px-4 py-3 text-xs" style={{ color: '#374151' }}>{getDepartmentName(s.departmentId)}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>{s.credits} cr</span>
                </td>
                <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: '#6b7280' }}>{s.description}</td>
                <td className="px-4 py-3"><Badge variant={statusVariant(s.status)} dot>{s.status}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50" style={{ borderColor: '#e2e7f0', color: '#374151' }}>Edit</button>
                    <button onClick={() => setConfirmId(s.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border" style={{ borderColor: s.status === 'active' ? '#fca5a5' : '#e2e7f0', color: s.status === 'active' ? '#e11d48' : '#059669' }}>
                      {s.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Subject' : 'Add Subject'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>{editing ? 'Save' : 'Add Subject'}</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Subject Name" required><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
          <FormField label="Subject Code" required><input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className={inputClass} style={inputStyle} /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Department" required><select value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: Number(e.target.value) }))} className={inputClass} style={inputStyle}>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></FormField>
          <FormField label="Credits"><input type="number" min={1} max={6} value={form.credits} onChange={e => setForm(f => ({ ...f, credits: Number(e.target.value) }))} className={inputClass} style={inputStyle} /></FormField>
        </div>
        <FormField label="Description"><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass + " resize-none"} style={inputStyle} rows={3} /></FormField>
      </Modal>

      <ConfirmDialog open={confirmId !== null} onClose={() => setConfirmId(null)} onConfirm={() => { if (confirmId) { toggleStatus(confirmId); setConfirmId(null) } }}
        title="Change Subject Status" message={`Toggle status for this subject?`} danger={data.find(s => s.id === confirmId)?.status === 'active'} />
    </div>
  )
}
