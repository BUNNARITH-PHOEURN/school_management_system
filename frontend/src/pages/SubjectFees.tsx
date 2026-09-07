import { useEffect, useMemo, useState } from 'react'
import { listSubjects, type Subject } from '../api/subjects'
import { listAcademicYears, type AcademicYear } from '../api/academicYears'
import { listSubjectFees, listSubjectFeesPage, upsertSubjectFee, deleteSubjectFee, type SubjectFee } from '../api/subjectFees'
import Badge from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle, ConfirmDialog } from '../components/Modal'
import Pagination from '../components/Pagination'
import { useToast } from '../context/ToastContext'
import { getApiError } from '../api/client'

const PAGE_SIZE = 10

export default function SubjectFees() {
  const { toast } = useToast()
  const [fees, setFees] = useState<SubjectFee[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SubjectFee | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [form, setForm] = useState({ subjectId: 0, academicYearId: 0, fee: '' })

  useEffect(() => {
    Promise.all([listSubjectFeesPage({ page, limit: PAGE_SIZE, search }), listSubjects(), listAcademicYears()])
      .then(([feeResult, subjectRows, yearRows]) => {
        setFees(feeResult.data)
        setTotalItems(feeResult.total)
        setTotalPages(Math.max(1, feeResult.totalPages))
        setSubjects(subjectRows)
        setYears(yearRows)
      })
      .catch(() => toast('error', 'Unable to load subject fees.'))
      .finally(() => setLoading(false))
  }, [page, search])

  const safePage = Math.min(page, totalPages)
  const subjectName = (id: number) => subjects.find(s => s.id === id)?.name ?? 'Unknown'
  const yearName = (id: number) => years.find(y => y.id === id)?.name ?? 'Unknown'

  const filtered = fees

  const openCreate = () => {
    setEditing(null)
    setForm({ subjectId: subjects[0]?.id ?? 0, academicYearId: years.find(y => y.status === 'active')?.id ?? years[0]?.id ?? 0, fee: '' })
    setModalOpen(true)
  }
  const openEdit = (f: SubjectFee) => {
    setEditing(f)
    setForm({ subjectId: f.subjectId, academicYearId: f.academicYearId, fee: String(f.fee) })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const fee = Number(form.fee)
    if (!Number.isFinite(fee) || fee < 0) {
      toast('error', 'Fee must be a non-negative number.')
      return
    }
    try {
      const saved = await upsertSubjectFee({ subjectId: form.subjectId, academicYearId: form.academicYearId, fee })
      setFees(prev => {
        const existing = prev.find(f => f.subjectId === saved.subjectId && f.academicYearId === saved.academicYearId)
        return existing ? prev.map(f => f === existing ? saved : f) : [...prev, saved]
      })
      setModalOpen(false)
      toast('success', editing ? 'Subject fee updated.' : 'Subject fee added.')
    } catch (err) {
      toast('error', getApiError(err, 'Unable to save subject fee.'))
    }
  }

  const handleDelete = async () => {
    if (!confirmId) return
    try {
      await deleteSubjectFee(confirmId)
      setFees(prev => prev.filter(f => f.id !== confirmId))
      setConfirmId(null)
      toast('success', 'Subject fee removed.')
    } catch (err) {
      toast('error', getApiError(err, 'Unable to remove subject fee.'))
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Subject Fees</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>Set tuition per subject per academic year</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
          + Add Fee
        </button>
      </div>

      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3" style={{ borderColor: '#e2e7f0' }}>
        <div className="relative flex-1 min-w-40">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search subject fees…" className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0' }} />
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#f8f9fd', borderBottom: '1px solid #e2e7f0' }}>
              {['Subject', 'Academic Year', 'Fee', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}><div className="py-10 text-center text-sm" style={{ color: '#9ca3af' }}>Loading…</div></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4}><div className="py-12 text-center text-sm" style={{ color: '#9ca3af' }}>No subject fees configured yet.</div></td></tr>
            ) : filtered.map(f => (
              <tr key={f.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: '#f0f3fa' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3451c7', fontFamily: 'Outfit, sans-serif' }}>
                      {subjectName(f.subjectId).charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: '#1a1f36' }}>{subjectName(f.subjectId)}</div>
                      <div className="text-xs" style={{ color: '#9ca3af' }}>{f.subjectCode}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>{yearName(f.academicYearId)}</td>
                <td className="px-4 py-3">
                  {f.fee > 0 ? (
                    <Badge variant="primary">${Number(f.fee).toFixed(2)}</Badge>
                  ) : (
                    <Badge variant="neutral">Free</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(f)} className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50" style={{ borderColor: '#e2e7f0', color: '#374151' }}>Edit</button>
                    <button onClick={() => setConfirmId(f.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-red-50" style={{ borderColor: '#fca5a5', color: '#e11d48' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={safePage} totalPages={totalPages} totalItems={totalItems} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Subject Fee' : 'Add Subject Fee'} width={440}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>{editing ? 'Save' : 'Add Fee'}</button>
          </>
        }
      >
        <FormField label="Subject" required>
          <select value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: Number(e.target.value) }))} className={inputClass} style={inputStyle}>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
          </select>
        </FormField>
        <FormField label="Academic Year" required>
          <select value={form.academicYearId} onChange={e => setForm(f => ({ ...f, academicYearId: Number(e.target.value) }))} className={inputClass} style={inputStyle}>
            {years.map(y => <option key={y.id} value={y.id}>{y.name} {y.status === 'active' ? '(Active)' : ''}</option>)}
          </select>
        </FormField>
        <FormField label="Fee (USD)" required>
          <input type="number" min={0} step="0.01" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} className={inputClass} style={inputStyle} placeholder="0.00" />
        </FormField>
      </Modal>

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="Remove Subject Fee"
        message="Remove this subject fee? Existing enrollments keep their recorded amount."
        danger
      />
    </div>
  )
}