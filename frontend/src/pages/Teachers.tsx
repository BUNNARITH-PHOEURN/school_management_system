import { useState } from 'react'
import { teachers as initialTeachers, departments, getDepartmentName, type Teacher, type Status } from '../data/mockData'
import Badge, { statusVariant } from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle, ConfirmDialog } from '../components/Modal'
import Pagination from '../components/Pagination'
import { SkeletonTable, EmptyState } from '../components/Skeleton'
import { useToast } from '../context/ToastContext'

const PAGE_SIZE = 7

export default function Teachers() {
  const { toast } = useToast()
  const [data, setData] = useState(initialTeachers)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | Status>('all')
  const [filterDept, setFilterDept] = useState<number | 'all'>('all')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Teacher | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null)
  const [form, setForm] = useState<{
    firstName: string; lastName: string; email: string; phone: string
    departmentId: number; gender: 'male' | 'female'; specialization: string
  }>({ firstName: '', lastName: '', email: '', phone: '', departmentId: 1, gender: 'male', specialization: '' })

  const filtered = data.filter(t =>
    (filterStatus === 'all' || t.status === filterStatus) &&
    (filterDept === 'all' || t.departmentId === filterDept) &&
    `${t.firstName} ${t.lastName} ${t.code} ${t.email} ${t.specialization}`.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const openCreate = () => {
    setEditing(null)
    setForm({ firstName: '', lastName: '', email: '', phone: '', departmentId: 1, gender: 'male', specialization: '' })
    setModalOpen(true)
  }
  const openEdit = (t: Teacher) => {
    setEditing(t)
    setForm({ firstName: t.firstName, lastName: t.lastName, email: t.email, phone: t.phone, departmentId: t.departmentId, gender: t.gender, specialization: t.specialization })
    setModalOpen(true)
  }
  const handleSave = () => {
    if (editing) {
      setData(prev => prev.map(t => t.id === editing.id ? { ...t, ...form } : t))
      toast('success', 'Teacher record updated.')
    } else {
      const newId = Math.max(...data.map(t => t.id)) + 1
      setData(prev => [...prev, { id: newId, code: `TCH-${String(newId).padStart(3, '0')}`, ...form, photo: undefined, status: 'active' as const, joinedAt: new Date().toISOString().slice(0, 10) }])
      toast('success', 'Teacher added successfully.')
    }
    setModalOpen(false)
  }
  const toggleStatus = (id: number) => {
    const t = data.find(x => x.id === id)
    const next = t?.status === 'active' ? 'inactive' : 'active'
    setData(prev => prev.map(x => x.id === id ? { ...x, status: next } : x))
    toast(next === 'active' ? 'success' : 'info', `Teacher ${next === 'active' ? 'activated' : 'deactivated'}.`)
    setConfirmId(null)
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Teachers</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            <span className="font-semibold" style={{ color: '#1a1f36' }}>{data.filter(t => t.status === 'active').length}</span> active staff members
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white flex-shrink-0" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Teacher
        </button>
      </div>

      <div className="bg-white rounded-xl border p-3.5 flex flex-wrap gap-3" style={{ borderColor: '#e2e7f0' }}>
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search teachers…" className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#1a1f36' }} />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as 'all' | Status); setPage(1) }} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={filterDept} onChange={e => { setFilterDept(e.target.value === 'all' ? 'all' : Number(e.target.value)); setPage(1) }} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8f9fd', borderBottom: '1px solid #e2e7f0' }}>
                {['Teacher', 'Code', 'Department', 'Specialization', 'Phone', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon="👨‍🏫" title="No teachers found" description="Try adjusting your filters." /></td></tr>
              ) : paginated.map(t => (
                <tr key={t.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: '#f0f3fa' }}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#d1fae5', color: '#065f46', fontFamily: 'Outfit, sans-serif' }}>
                        {t.firstName.replace('Dr. ', '')[0]}{t.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: '#1a1f36' }}>{t.firstName} {t.lastName}</div>
                        <div className="text-xs" style={{ color: '#9ca3af' }}>{t.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap" style={{ color: '#6b7280' }}>{t.code}</td>
                  <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: '#374151' }}>{getDepartmentName(t.departmentId)}</td>
                  <td className="px-4 py-3.5 text-xs max-w-36 truncate" style={{ color: '#6b7280' }}>{t.specialization}</td>
                  <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: '#6b7280' }}>{t.phone}</td>
                  <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: '#6b7280' }}>{t.joinedAt}</td>
                  <td className="px-4 py-3.5"><Badge variant={statusVariant(t.status)} dot>{t.status}</Badge></td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1.5">
                      <button onClick={() => setViewTeacher(t)} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50 transition-colors" style={{ borderColor: '#e2e7f0', color: '#374151' }}>View</button>
                      <button onClick={() => openEdit(t)} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50 transition-colors" style={{ borderColor: '#e2e7f0', color: '#374151' }}>Edit</button>
                      <button onClick={() => setConfirmId(t.id)} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap" style={{ borderColor: t.status === 'active' ? '#fca5a5' : '#d1fae5', color: t.status === 'active' ? '#e11d48' : '#059669', backgroundColor: t.status === 'active' ? '#fff5f5' : '#f0fdf4' }}>
                        {t.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit — ${editing.firstName} ${editing.lastName}` : 'Add New Teacher'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>{editing ? 'Save Changes' : 'Add Teacher'}</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="First Name" required><input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
          <FormField label="Last Name" required><input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
        </div>
        <FormField label="Email" required><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Phone"><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
          <FormField label="Gender"><select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as 'male' | 'female' }))} className={inputClass} style={inputStyle}><option value="male">Male</option><option value="female">Female</option></select></FormField>
        </div>
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Department" required><select value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: Number(e.target.value) }))} className={inputClass} style={inputStyle}>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></FormField>
          <FormField label="Specialization"><input value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
        </div>
      </Modal>

      {viewTeacher && (
        <Modal open onClose={() => setViewTeacher(null)} title="Teacher Profile">
          <div className="flex items-center gap-4 mb-5 pb-5 border-b" style={{ borderColor: '#f0f3fa' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: '#d1fae5', color: '#065f46', fontFamily: 'Outfit, sans-serif' }}>
              {viewTeacher.firstName.replace('Dr. ', '')[0]}{viewTeacher.lastName[0]}
            </div>
            <div>
              <div className="font-bold text-lg" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{viewTeacher.firstName} {viewTeacher.lastName}</div>
              <div className="text-sm" style={{ color: '#6b7280' }}>{viewTeacher.code} · {viewTeacher.specialization}</div>
              <div className="mt-1.5"><Badge variant={statusVariant(viewTeacher.status)} dot>{viewTeacher.status}</Badge></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[['Email', viewTeacher.email], ['Phone', viewTeacher.phone], ['Department', getDepartmentName(viewTeacher.departmentId)], ['Gender', viewTeacher.gender], ['Joined', viewTeacher.joinedAt]].map(([label, val]) => (
              <div key={label}><div className="text-xs font-medium mb-0.5" style={{ color: '#9ca3af' }}>{label}</div><div style={{ color: '#1a1f36' }}>{val}</div></div>
            ))}
          </div>
        </Modal>
      )}

      <ConfirmDialog open={confirmId !== null} onClose={() => setConfirmId(null)} onConfirm={() => confirmId !== null && toggleStatus(confirmId)}
        title="Change Teacher Status" message={`${data.find(t => t.id === confirmId)?.status === 'active' ? 'Deactivate' : 'Activate'} this teacher?`}
        danger={data.find(t => t.id === confirmId)?.status === 'active'} />
    </div>
  )
}
