import { useEffect, useState } from 'react'
import { listDepartments, type DepartmentRecord } from '../api/departments'
import { createSubject, listSubjects, listSubjectsPage, updateSubject, updateSubjectStatus, type Subject } from '../api/subjects'
import Badge, { statusVariant } from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle, ConfirmDialog } from '../components/Modal'
import ViewToggle from '../components/ViewToggle'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 12

export default function Subjects() {
  const [data, setData] = useState<Subject[]>([])
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState<number | 'all'>('all')
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [view, setView] = useState<'card' | 'table'>('table')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', code: '', credits: 3, description: '', department_id: 0 })

  const getDepartmentName = (id: number | null) => departments.find(department => department.id === id)?.name ?? 'Unassigned'

  const resetPage = () => setPage(1)
  const filtered = data
  const safePage = Math.min(page, totalPages)

  const openCreate = () => { setEditing(null); setForm({ name: '', code: '', credits: 3, description: '', department_id: departments[0]?.id ?? 0 }); setModalOpen(true) }
  const openEdit = (s: Subject) => { setEditing(s); setForm({ name: s.name, code: s.code, credits: s.credits, description: s.description ?? '', department_id: s.department_id ?? 0 }); setModalOpen(true) }
  useEffect(() => {
    Promise.all([listSubjectsPage({ page, limit: PAGE_SIZE, search, departmentId: filterDept }), listDepartments()])
      .then(([result, departmentResult]) => { setData(result.data); setTotalItems(result.total); setTotalPages(Math.max(1, result.totalPages)); setDepartments(departmentResult.departments) })
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to load subjects'))
  }, [page, search, filterDept])
  const handleSave = async () => {
    try {
      const saved = editing ? await updateSubject(editing.id, form) : await createSubject({ ...form, status: 'active' })
      setData(prev => editing ? prev.map(s => s.id === saved.id ? saved : s) : [...prev, saved])
      setModalOpen(false)
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save subject') }
  }
  const toggleStatus = async (id: number) => {
    const subject = data.find(s => s.id === id)
    if (!subject) return
    try {
      const saved = await updateSubjectStatus(id, subject.status === 'active' ? 'inactive' : 'active')
      setData(prev => prev.map(s => s.id === id ? saved : s))
      setConfirmId(null)
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update subject') }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Subjects</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>{data.filter(s => s.status === 'active').length} active subjects</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>+ Add Subject</button>
      </div>
      {error && <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: '#fff1f2', color: '#9f1239' }}>{error}</div>}

      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3" style={{ borderColor: '#e2e7f0' }}>
        <div className="relative flex-1 min-w-40">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); resetPage() }} placeholder="Search subjects…" className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0' }} />
        </div>
        <select value={filterDept} onChange={e => { setFilterDept(e.target.value === 'all' ? 'all' : Number(e.target.value)); resetPage() }} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === 'card' ? (
        filtered.length === 0 ? (
          <div className="bg-white rounded-xl border py-14 text-center" style={{ borderColor: '#e2e7f0' }}>
            <div className="text-3xl mb-2">📚</div>
            <div className="text-sm font-medium" style={{ fontFamily: 'Outfit, sans-serif', color: '#374151' }}>No subjects found</div>
            <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>Try adjusting your search or department filter.</div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(s => (
              <div key={s.id} className="bg-white rounded-xl border p-5 flex flex-col" style={{ borderColor: '#e2e7f0' }}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                    {s.name.charAt(0)}
                  </div>
                  <Badge variant={statusVariant(s.status)} dot>{s.status}</Badge>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{s.name}</div>
                  <span className="text-xs font-mono" style={{ color: '#9ca3af' }}>{s.code}</span>
                </div>
                <div className="text-xs mt-1" style={{ color: '#6b7280' }}>{getDepartmentName(s.department_id)}</div>
                <p className="text-xs mt-3 mb-4 flex-1" style={{ color: '#6b7280', lineHeight: 1.6 }}>{s.description || 'No description provided.'}</p>
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: '#f0f3fa' }}>
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>{s.credits} credits</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50" style={{ borderColor: '#e2e7f0', color: '#374151' }}>Edit</button>
                    <button onClick={() => setConfirmId(s.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border" style={{ borderColor: s.status === 'active' ? '#fca5a5' : '#e2e7f0', color: s.status === 'active' ? '#e11d48' : '#059669' }}>
                      {s.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
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
                <td className="px-4 py-3 text-xs" style={{ color: '#374151' }}>{getDepartmentName(s.department_id)}</td>
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
      )}

      <Pagination page={safePage} totalPages={totalPages} totalItems={totalItems} pageSize={PAGE_SIZE} onPageChange={setPage} />

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
          <FormField label="Department" required><select value={form.department_id || ''} onChange={e => setForm(f => ({ ...f, department_id: Number(e.target.value) }))} className={inputClass} style={inputStyle}><option value="">Select department</option>{departments.filter(d => d.status === 'active').map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></FormField>
          <FormField label="Credits"><input type="number" min={1} max={6} value={form.credits} onChange={e => setForm(f => ({ ...f, credits: Number(e.target.value) }))} className={inputClass} style={inputStyle} /></FormField>
        </div>
        <FormField label="Description"><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass + " resize-none"} style={inputStyle} rows={3} /></FormField>
      </Modal>

      <ConfirmDialog open={confirmId !== null} onClose={() => setConfirmId(null)} onConfirm={() => { if (confirmId) toggleStatus(confirmId) }}
        title="Change Subject Status" message={`Toggle status for this subject?`} danger={data.find(s => s.id === confirmId)?.status === 'active'} />
    </div>
  )
}
