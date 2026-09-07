import { useEffect, useMemo, useState } from 'react'
import { listEnrollments, listEnrollmentsPage, payEnrollment, type EnrollmentWithNames } from '../api/enrollments'
import Badge from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle } from '../components/Modal'
import Pagination from '../components/Pagination'
import { useToast } from '../context/ToastContext'
import { getApiError } from '../api/client'

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

const PAGE_SIZE = 10

export default function Payments() {
  const { toast } = useToast()
  const [data, setData] = useState<EnrollmentWithNames[]>([])
  const [allApproved, setAllApproved] = useState<EnrollmentWithNames[]>([])
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [recordTarget, setRecordTarget] = useState<EnrollmentWithNames | null>(null)
  const [payForm, setPayForm] = useState({ method: 'Cash', reference: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [pageResult, allRows] = await Promise.all([
        listEnrollmentsPage({ page, limit: PAGE_SIZE, search, status: 'approved', paymentStatus: filterStatus }),
        listEnrollments(),
      ])
      setData(pageResult.data)
      setTotalItems(pageResult.total)
      setTotalPages(Math.max(1, pageResult.totalPages))
      setAllApproved(allRows.filter(e => e.status === 'approved'))
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to load payments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filterStatus])

  const safePage = Math.min(page, totalPages)
  const filtered = data

  const approved = allApproved
  const totalCollected = approved.filter(e => e.paymentStatus === 'paid').reduce((s, e) => s + Number(e.amount || 0), 0)
  const totalOutstanding = approved.filter(e => e.paymentStatus === 'unpaid').reduce((s, e) => s + Number(e.amount || 0), 0)
  const paidCount = approved.filter(e => e.paymentStatus === 'paid').length
  const unpaidCount = approved.length - paidCount

  const handleRecord = async () => {
    if (!recordTarget) return
    setSubmitting(true)
    try {
      const updated = await payEnrollment(recordTarget.id, {
        method: payForm.method,
        reference: payForm.reference.trim() || undefined,
      })
      setData(prev => prev.map(e => e.id === updated.id ? updated : e))
      setRecordTarget(null)
      setPayForm({ method: 'Cash', reference: '' })
      toast('success', `Payment recorded for ${updated.studentName}.`)
    } catch (err) {
      toast('error', getApiError(err, 'Unable to record payment.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Payments</h1>
        <p className="text-sm" style={{ color: '#9ca3af' }}>Track enrollment fees across approved enrollments</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e7f0' }}>
          <div className="text-2xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{approved.length}</div>
          <div className="text-xs" style={{ color: '#9ca3af' }}>Approved enrollments</div>
        </div>
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e7f0' }}>
          <div className="text-2xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#059669' }}>{paidCount}</div>
          <div className="text-xs" style={{ color: '#9ca3af' }}>Paid</div>
        </div>
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e7f0' }}>
          <div className="text-2xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#b45309' }}>{unpaidCount}</div>
          <div className="text-xs" style={{ color: '#9ca3af' }}>Unpaid</div>
        </div>
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e7f0' }}>
          <div className="text-2xl font-bold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#3b5bdb' }}>${totalCollected.toFixed(2)}</div>
          <div className="text-xs" style={{ color: '#9ca3af' }}>Collected · ${totalOutstanding.toFixed(2)} owed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3" style={{ borderColor: '#e2e7f0' }}>
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search by student, class or reference…" className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0' }} />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as 'all' | 'paid' | 'unpaid'); setPage(1) }} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e7f0', color: '#374151' }}>
          <option value="all">All Payment Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8f9fd', borderBottom: '1px solid #e2e7f0' }}>
                {['Student', 'Class / Subject', 'Amount', 'Status', 'Method', 'Reference', 'Paid At', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm" style={{ color: '#9ca3af' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: '#9ca3af' }}>No payments found</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: '#f0f3fa' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}>
                        {initials(e.studentName)}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: '#1a1f36' }}>{e.studentName}</div>
                        <div className="text-xs" style={{ color: '#9ca3af' }}>{e.studentCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium" style={{ color: '#1a1f36' }}>{e.subjectName || e.className}</div>
                    <div className="text-xs" style={{ color: '#9ca3af' }}>{e.className}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: '#1a1f36' }}>${Number(e.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={e.paymentStatus === 'paid' ? 'success' : 'warning'} dot>{e.paymentStatus}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>{e.paymentMethod || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>{e.paymentReference || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>{e.paidAt || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {e.paymentStatus === 'unpaid' && (
                      <button onClick={() => { setRecordTarget(e); setPayForm({ method: 'Cash', reference: '' }) }} className="px-2.5 py-1 text-xs font-semibold rounded-lg text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#059669', fontFamily: 'Outfit, sans-serif' }}>
                        Record Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} totalPages={totalPages} totalItems={totalItems} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      {/* Record payment modal */}
      <Modal
        open={recordTarget !== null}
        onClose={() => setRecordTarget(null)}
        title="Record Payment"
        width={440}
        footer={
          <>
            <button onClick={() => setRecordTarget(null)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
            <button onClick={handleRecord} disabled={submitting} className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-60" style={{ backgroundColor: '#059669', fontFamily: 'Outfit, sans-serif' }}>
              {submitting ? 'Saving…' : 'Confirm Payment'}
            </button>
          </>
        }
      >
        {recordTarget && (
          <div className="space-y-4">
            <div className="rounded-lg border px-4 py-3 flex items-center justify-between" style={{ borderColor: '#e2e7f0', backgroundColor: '#f8f9fd' }}>
              <div>
                <div className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{recordTarget.studentName}</div>
                <div className="text-xs" style={{ color: '#9ca3af' }}>{recordTarget.subjectName} · {recordTarget.className}</div>
              </div>
              <span className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>${Number(recordTarget.amount || 0).toFixed(2)}</span>
            </div>
            <FormField label="Payment Method" required>
              <select value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))} className={inputClass} style={inputStyle}>
                <option>Cash</option>
                <option>Credit Card</option>
                <option>Bank Transfer</option>
                <option>Mobile Money</option>
              </select>
            </FormField>
            <FormField label="Reference / Receipt">
              <input value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} className={inputClass} style={inputStyle} placeholder="e.g. receipt number" />
            </FormField>
          </div>
        )}
      </Modal>
    </div>
  )
}