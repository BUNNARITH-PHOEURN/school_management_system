import { useState } from 'react'
import { departments as initial, students, teachers, type Department } from '../data/mockData'
import Badge, { statusVariant } from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle, ConfirmDialog } from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { EmptyState } from '../components/Skeleton'

export default function Departments() {
  const { toast } = useToast()
  const [data, setData] = useState(initial)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', code: '', description: '' })

  const filtered = data.filter(d => `${d.name} ${d.code} ${d.description}`.toLowerCase().includes(search.toLowerCase()))

  const openCreate = () => { setEditing(null); setForm({ name: '', code: '', description: '' }); setModalOpen(true) }
  const openEdit = (d: Department) => { setEditing(d); setForm({ name: d.name, code: d.code, description: d.description }); setModalOpen(true) }
  const handleSave = () => {
    if (editing) {
      setData(prev => prev.map(d => d.id === editing.id ? { ...d, ...form } : d))
      toast('success', 'Department updated.')
    } else {
      setData(prev => [...prev, { id: Math.max(...prev.map(d => d.id)) + 1, ...form, status: 'active' as const, createdAt: new Date().toISOString().slice(0, 10) }])
      toast('success', 'Department created.')
    }
    setModalOpen(false)
  }
  const toggleStatus = (id: number) => {
    const d = data.find(x => x.id === id)
    const next = d?.status === 'active' ? 'inactive' : 'active'
    setData(prev => prev.map(x => x.id === id ? { ...x, status: next } : x))
    toast(next === 'active' ? 'success' : 'info', `Department ${next}.`)
    setConfirmId(null)
  }

  const getStudentCount = (id: number) => students.filter(s => s.departmentId === id && s.status === 'active').length
  const getTeacherCount = (id: number) => teachers.filter(t => t.departmentId === id && t.status === 'active').length

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Departments</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>{data.filter(d => d.status === 'active').length} active departments</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Department
        </button>
      </div>

      <div className="bg-white rounded-xl border p-3.5" style={{ borderColor: '#e2e7f0' }}>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search departments…" className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0' }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border" style={{ borderColor: '#e2e7f0' }}>
          <EmptyState icon="🏫" title="No departments found" description="Try a different search term." />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(dept => (
            <div key={dept.id} className="bg-white rounded-xl border p-5 flex flex-col" style={{ borderColor: dept.status === 'active' ? '#e2e7f0' : '#f0f3fa' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                  {dept.code.slice(0, 3)}
                </div>
                <Badge variant={statusVariant(dept.status)} dot>{dept.status}</Badge>
              </div>
              <div className="font-semibold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{dept.name}</div>
              <div className="text-xs font-mono mb-2" style={{ color: '#9ca3af' }}>{dept.code}</div>
              <p className="text-xs mb-4 flex-1" style={{ color: '#6b7280', lineHeight: 1.6 }}>{dept.description}</p>

              <div className="flex gap-3 mb-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#eff2ff' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" /></svg>
                  </div>
                  <span style={{ color: '#374151' }}><strong>{getStudentCount(dept.id)}</strong> students</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#d1fae5' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2z" /></svg>
                  </div>
                  <span style={{ color: '#374151' }}><strong>{getTeacherCount(dept.id)}</strong> teachers</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: '#f0f3fa' }}>
                <button onClick={() => openEdit(dept)} className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50 transition-colors" style={{ borderColor: '#e2e7f0', color: '#374151' }}>Edit</button>
                <button onClick={() => setConfirmId(dept.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors" style={{ borderColor: dept.status === 'active' ? '#fca5a5' : '#d1fae5', color: dept.status === 'active' ? '#e11d48' : '#059669' }}>
                  {dept.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <span className="text-xs ml-auto" style={{ color: '#9ca3af' }}>{dept.createdAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Department' : 'Add Department'} width={460}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>{editing ? 'Save Changes' : 'Create'}</button>
          </>
        }
      >
        <FormField label="Department Name" required><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} style={inputStyle} placeholder="e.g. Mathematics" /></FormField>
        <FormField label="Department Code" required><input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className={inputClass} style={inputStyle} placeholder="e.g. MATH" /></FormField>
        <FormField label="Description"><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass + " resize-none"} style={inputStyle} rows={3} placeholder="Brief description…" /></FormField>
      </Modal>

      <ConfirmDialog open={confirmId !== null} onClose={() => setConfirmId(null)} onConfirm={() => confirmId !== null && toggleStatus(confirmId)}
        title="Change Department Status" message={`${data.find(d => d.id === confirmId)?.status === 'active' ? 'Deactivate' : 'Activate'} this department?`}
        danger={data.find(d => d.id === confirmId)?.status === 'active'} />
    </div>
  )
}
