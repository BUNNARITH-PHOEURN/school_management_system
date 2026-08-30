import { useCallback, useEffect, useState } from 'react'
import { departments, getDepartmentName, type Student, type Status } from '../data/mockData'
import { listStudents, createStudent, updateStudent } from '../api/students'
import Badge, { statusVariant } from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle, ConfirmDialog } from '../components/Modal'
import Pagination from '../components/Pagination'
import { SkeletonTable, EmptyState } from '../components/Skeleton'
import { useToast } from '../context/ToastContext'

const PAGE_SIZE = 8

export default function Students() {
  const { toast } = useToast()
  const [data, setData] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | Status>('all')
  const [filterDept, setFilterDept] = useState<number | 'all'>('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [viewStudent, setViewStudent] = useState<Student | null>(null)
  const [form, setForm] = useState<{
    firstName: string; lastName: string; email: string; phone: string
    departmentId: number; gender: 'male' | 'female'; dateOfBirth: string; address: string
  }>({ firstName: '', lastName: '', email: '', phone: '', departmentId: 1, gender: 'male', dateOfBirth: '', address: '' })

  const loadStudents = useCallback(async () => {
    setLoading(true)
    try {
      const students = await listStudents()
      setData(students)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to load students.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const filtered = data.filter(s =>
    (filterStatus === 'all' || s.status === filterStatus) &&
    (filterDept === 'all' || s.departmentId === filterDept) &&
    `${s.firstName} ${s.lastName} ${s.code} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const resetPage = () => setPage(1)

  const openCreate = () => {
    setEditing(null)
    setForm({ firstName: '', lastName: '', email: '', phone: '', departmentId: 1, gender: 'male', dateOfBirth: '', address: '' })
    setModalOpen(true)
  }
  const openEdit = (s: Student) => {
    setEditing(s)
    setForm({ firstName: s.firstName, lastName: s.lastName, email: s.email, phone: s.phone, departmentId: s.departmentId, gender: s.gender, dateOfBirth: s.dateOfBirth, address: s.address })
    setModalOpen(true)
  }
  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateStudent(editing.id, form)
        setData(prev => prev.map(s => s.id === updated.id ? updated : s))
        toast('success', 'Student updated successfully.')
      } else {
        const created = await createStudent({
          ...form,
          status: 'active',
          dateOfBirth: form.dateOfBirth,
        })
        setData(prev => [created, ...prev])
        toast('success', `Student added successfully (${created.code}).`)
      }
      setModalOpen(false)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to save student.')
    } finally {
      setSaving(false)
    }
  }
  const toggleStatus = async (id: number) => {
    const student = data.find(s => s.id === id)
    if (!student) return
    const next = student.status === 'active' ? 'inactive' : 'active'
    try {
      const updated = await updateStudent(id, { status: next })
      setData(prev => prev.map(s => s.id === id ? updated : s))
      toast(next === 'active' ? 'success' : 'info', `Student ${next === 'active' ? 'activated' : 'deactivated'}.`)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to update status.')
    } finally {
      setConfirmId(null)
    }
  }

  const activeCount = data.filter(s => s.status === 'active').length

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Students</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            <span className="font-semibold" style={{ color: '#1a1f36' }}>{activeCount}</span> active · {data.length} total
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white flex-shrink-0" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-3.5 flex flex-wrap items-center gap-3" style={{ borderColor: '#e2e7f0' }}>
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); resetPage() }} placeholder="Search by name, code, or email…" className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none transition-colors" style={{ borderColor: '#e2e7f0', color: '#1a1f36' }} />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as 'all' | Status); resetPage() }} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={filterDept} onChange={e => { setFilterDept(e.target.value === 'all' ? 'all' : Number(e.target.value)); resetPage() }} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {(search || filterStatus !== 'all' || filterDept !== 'all') && (
          <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterDept('all'); resetPage() }} className="text-sm px-3 py-2 rounded-lg transition-colors hover:bg-gray-50" style={{ color: '#6b7280', border: '1px solid #e2e7f0' }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8f9fd', borderBottom: '1px solid #e2e7f0' }}>
                {['Student', 'Code', 'Department', 'Contact', 'Enrolled', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable rows={6} cols={7} />
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon="🎓"
                      title={search ? 'No students match your search' : 'No students yet'}
                      description={search ? 'Try adjusting your search or filters.' : 'Click "Add Student" to enroll the first student.'}
                      action={search ? undefined : (
                        <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>Add Student</button>
                      )}
                    />
                  </td>
                </tr>
              ) : paginated.map(s => (
                <tr key={s.id} className="border-t transition-colors hover:bg-gray-50" style={{ borderColor: '#f0f3fa' }}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium leading-tight" style={{ color: '#1a1f36' }}>{s.firstName} {s.lastName}</div>
                        <div className="text-xs mt-0.5 truncate max-w-36" style={{ color: '#9ca3af' }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap" style={{ color: '#6b7280' }}>{s.code}</td>
                  <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: '#374151' }}>{getDepartmentName(s.departmentId)}</td>
                  <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: '#6b7280' }}>{s.phone}</td>
                  <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: '#6b7280' }}>{s.enrolledAt}</td>
                  <td className="px-4 py-3.5"><Badge variant={statusVariant(s.status)} dot>{s.status}</Badge></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setViewStudent(s)} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50 transition-colors whitespace-nowrap" style={{ borderColor: '#e2e7f0', color: '#374151' }}>View</button>
                      <button onClick={() => openEdit(s)} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50 transition-colors" style={{ borderColor: '#e2e7f0', color: '#374151' }}>Edit</button>
                      <button onClick={() => setConfirmId(s.id)} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap" style={{ borderColor: s.status === 'active' ? '#fca5a5' : '#d1fae5', color: s.status === 'active' ? '#e11d48' : '#059669', backgroundColor: s.status === 'active' ? '#fff5f5' : '#f0fdf4' }}>
                        {s.status === 'active' ? 'Deactivate' : 'Activate'}
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

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit — ${editing.firstName} ${editing.lastName}` : 'Add New Student'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-60" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Student'}</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="First Name" required><input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
          <FormField label="Last Name" required><input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
        </div>
        <FormField label="Email Address" required><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Phone"><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} style={inputStyle} placeholder="+1 555-0000" /></FormField>
          <FormField label="Date of Birth"><input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Department" required>
            <select value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: Number(e.target.value) }))} className={inputClass} style={inputStyle}>
              {departments.filter(d => d.status === 'active').map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </FormField>
          <FormField label="Gender">
            <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as 'male' | 'female' }))} className={inputClass} style={inputStyle}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </FormField>
        </div>
        <FormField label="Address"><input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputClass} style={inputStyle} /></FormField>
      </Modal>

      {/* View Modal */}
      {viewStudent && (
        <Modal open onClose={() => setViewStudent(null)} title="Student Profile">
          <div className="flex items-center gap-4 mb-5 pb-5 border-b" style={{ borderColor: '#f0f3fa' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
              {viewStudent.firstName[0]}{viewStudent.lastName[0]}
            </div>
            <div>
              <div className="font-bold text-lg leading-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{viewStudent.firstName} {viewStudent.lastName}</div>
              <div className="text-sm mt-0.5" style={{ color: '#6b7280' }}>{viewStudent.code}</div>
              <div className="mt-1.5"><Badge variant={statusVariant(viewStudent.status)} dot>{viewStudent.status}</Badge></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Email', viewStudent.email],
              ['Phone', viewStudent.phone],
              ['Department', getDepartmentName(viewStudent.departmentId)],
              ['Gender', viewStudent.gender],
              ['Date of Birth', viewStudent.dateOfBirth],
              ['Enrolled', viewStudent.enrolledAt],
              ['Address', viewStudent.address],
            ].map(([label, val]) => (
              <div key={label} className="col-span-1">
                <div className="text-xs font-medium mb-0.5" style={{ color: '#9ca3af' }}>{label}</div>
                <div style={{ color: '#1a1f36' }}>{val}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId !== null && toggleStatus(confirmId)}
        title="Change Student Status"
        message={`Are you sure you want to ${data.find(s => s.id === confirmId)?.status === 'active' ? 'deactivate' : 'activate'} this student?`}
        danger={data.find(s => s.id === confirmId)?.status === 'active'}
      />
    </div>
  )
}
