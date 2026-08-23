import { useState } from 'react'
import { users as initial, type User, type Role } from '../data/mockData'
import Badge, { statusVariant } from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle, ConfirmDialog } from '../components/Modal'

export default function Users() {
  const [data, setData] = useState(initial)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'moderator' as Role, password: '' })

  const filtered = data.filter(u => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase()))

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', role: 'moderator', password: '' }); setModalOpen(true) }
  const openEdit = (u: User) => { setEditing(u); setForm({ name: u.name, email: u.email, role: u.role, password: '' }); setModalOpen(true) }
  const handleSave = () => {
    if (editing) setData(prev => prev.map(u => u.id === editing.id ? { ...u, name: form.name, email: form.email, role: form.role } : u))
    else setData(prev => [...prev, { id: Math.max(...prev.map(u => u.id)) + 1, name: form.name, email: form.email, role: form.role, status: 'active' as const, createdAt: new Date().toISOString().slice(0, 10), lastLogin: '—' }])
    setModalOpen(false)
  }
  const toggleStatus = (id: number) => setData(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Users</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>System user accounts and permissions</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>+ Add User</button>
      </div>

      <div className="bg-white rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: '#e2e7f0' }}>
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0' }} />
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#f8f9fd', borderBottom: '1px solid #e2e7f0' }}>
              {['User', 'Role', 'Status', 'Created', 'Last Login', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: '#f0f3fa' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: u.role === 'admin' ? '#dde4ff' : '#f3f4f6', color: u.role === 'admin' ? '#3451c7' : '#374151', fontFamily: 'Outfit, sans-serif' }}>
                      {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: '#1a1f36' }}>{u.name}</div>
                      <div className="text-xs" style={{ color: '#9ca3af' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ backgroundColor: u.role === 'admin' ? '#dde4ff' : '#f3f4f6', color: u.role === 'admin' ? '#3451c7' : '#374151', fontFamily: 'Outfit, sans-serif' }}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3"><Badge variant={statusVariant(u.status)} dot>{u.status}</Badge></td>
                <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>{u.createdAt}</td>
                <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>{u.lastLogin}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)} className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50" style={{ borderColor: '#e2e7f0', color: '#374151' }}>Edit</button>
                    {u.role !== 'admin' && (
                      <button onClick={() => setConfirmId(u.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border" style={{ borderColor: u.status === 'active' ? '#fca5a5' : '#e2e7f0', color: u.status === 'active' ? '#e11d48' : '#059669' }}>
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'Add User'} width={440}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>{editing ? 'Save' : 'Create User'}</button>
          </>
        }
      >
        <FormField label="Full Name" required><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
        <FormField label="Email Address" required><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
        <FormField label="Role" required>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))} className={inputClass} style={inputStyle}>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
          </select>
        </FormField>
        {!editing && (
          <FormField label="Password" required><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={inputClass} style={inputStyle} placeholder="Min. 8 characters" /></FormField>
        )}
      </Modal>

      <ConfirmDialog open={confirmId !== null} onClose={() => setConfirmId(null)} onConfirm={() => { if (confirmId) { toggleStatus(confirmId); setConfirmId(null) } }}
        title="Change User Status" message={`Toggle status for this user?`} danger={data.find(u => u.id === confirmId)?.status === 'active'} />
    </div>
  )
}
