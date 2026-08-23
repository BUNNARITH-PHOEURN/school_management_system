import { useState } from 'react'
import { academicYears as initial, type AcademicYear } from '../data/mockData'
import Badge, { statusVariant } from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle } from '../components/Modal'

export default function AcademicYears() {
  const [data, setData] = useState(initial)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AcademicYear | null>(null)
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' })

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', startDate: '', endDate: '' })
    setModalOpen(true)
  }
  const openEdit = (a: AcademicYear) => {
    setEditing(a)
    setForm({ name: a.name, startDate: a.startDate, endDate: a.endDate })
    setModalOpen(true)
  }
  const handleSave = () => {
    if (editing) {
      setData(prev => prev.map(a => a.id === editing.id ? { ...a, ...form } : a))
    } else {
      const newId = Math.max(...data.map(a => a.id)) + 1
      setData(prev => [...prev, { id: newId, ...form, status: 'active' as const }])
    }
    setModalOpen(false)
  }
  const setActive = (id: number) => setData(prev => prev.map(a => ({ ...a, status: a.id === id ? 'active' : 'inactive' })))

  const activeYear = data.find(a => a.status === 'active')

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Academic Years</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>Current: <strong>{activeYear?.name ?? 'None'}</strong></p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>+ Add Year</button>
      </div>

      <div className="space-y-3">
        {data.map(year => {
          const isActive = year.status === 'active'
          const start = new Date(year.startDate)
          const end = new Date(year.endDate)
          const now = new Date()
          const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          const elapsed = Math.max(0, Math.min(totalDays, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
          const progress = Math.round((elapsed / totalDays) * 100)

          return (
            <div key={year.id} className="bg-white rounded-xl border p-6" style={{ borderColor: isActive ? '#c1ceff' : '#e2e7f0', boxShadow: isActive ? '0 0 0 1px #3b5bdb18' : 'none' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: isActive ? '#eff2ff' : '#f5f6fa' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#3b5bdb' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-base" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{year.name}</div>
                    <div className="text-xs" style={{ color: '#9ca3af' }}>{year.startDate} → {year.endDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(year.status)} dot>{year.status}</Badge>
                  {isActive && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>Current</span>}
                </div>
              </div>

              {isActive && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: '#6b7280' }}>Year progress</span>
                    <span className="font-semibold" style={{ color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>{Math.max(0, Math.min(100, progress))}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: '#f0f3fa' }}>
                    <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, progress))}%`, backgroundColor: '#3b5bdb', borderRadius: 9999, transition: 'width 1s ease' }} />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: '#f0f3fa' }}>
                <button onClick={() => openEdit(year)} className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50 transition-colors" style={{ borderColor: '#e2e7f0', color: '#374151' }}>Edit</button>
                {!isActive && (
                  <button onClick={() => setActive(year.id)} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb' }}>Set as Current</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Academic Year' : 'Add Academic Year'} width={440}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>{editing ? 'Save' : 'Add Year'}</button>
          </>
        }
      >
        <FormField label="Year Name" required><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} style={inputStyle} placeholder="e.g. 2026–2027" /></FormField>
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Start Date" required><input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
          <FormField label="End Date" required><input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
        </div>
      </Modal>
    </div>
  )
}
