import { useEffect, useMemo, useState } from 'react'
import type { SessionUser } from '../api/auth'
import { listEnrollments, payEnrollment, type EnrollmentWithNames } from '../api/enrollments'
import { listClasses, type Class } from '../api/classes'
import { listSubjects, type Subject } from '../api/subjects'
import { buildSubjectItems } from './shared'
import Badge, { statusVariant } from '../components/Badge'
import Modal, { FormField, inputClass, inputStyle } from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { getApiError } from '../api/client'

interface EnrollmentHistoryProps {
  session: SessionUser
}

export default function EnrollmentHistory({ session }: EnrollmentHistoryProps) {
  const { toast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentWithNames[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<EnrollmentWithNames | null>(null)
  const [payForm, setPayForm] = useState({ method: 'Credit Card', reference: '' })
  const [submitting, setSubmitting] = useState(false)

  const handlePay = async () => {
    if (!paying) return
    setSubmitting(true)
    try {
      await payEnrollment(paying.id, { method: payForm.method, reference: payForm.reference.trim() || undefined })
      toast('success', `Payment recorded for ${paying.subjectName}.`)
      setPaying(null)
      setPayForm({ method: 'Credit Card', reference: '' })
      const rows = await listEnrollments()
      setEnrollments(rows.filter(e => e.studentId === session.studentId))
    } catch (err) {
      toast('error', getApiError(err, 'Unable to process payment.'))
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    Promise.all([listEnrollments(), listClasses(), listSubjects()])
      .then(([enrollmentRows, classRows, subjectRows]) => {
        setEnrollments(enrollmentRows.filter(e => e.studentId === session.studentId))
        setClasses(classRows)
        setSubjects(subjectRows)
      })
      .catch(() => toast('error', 'Unable to load enrollment history.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.studentId])

  const items = useMemo(
    () => buildSubjectItems(enrollments, classes, subjects).filter(i => i.subjectId > 0),
    [enrollments, classes, subjects],
  )
  const sorted = [...items].sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt))
  const count = { approved: 0, pending: 0, rejected: 0, dropped: 0 }
  for (const i of items) {
    if (i.status === 'approved') count.approved++
    else if (i.status === 'pending') count.pending++
    else if (i.status === 'rejected') count.rejected++
    else if (i.status === 'dropped') count.dropped++
  }

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>Enrollment History</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>A record of every subject you've joined</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: '#e2e7f0' }}>
          <div className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#059669' }}>{count.approved}</div>
          <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Approved</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: '#e2e7f0' }}>
          <div className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#b45309' }}>{count.pending}</div>
          <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Pending</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: '#e2e7f0' }}>
          <div className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#e11d48' }}>{count.rejected}</div>
          <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Rejected</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: '#e2e7f0' }}>
          <div className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#6b7280' }}>{count.dropped}</div>
          <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Dropped</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e7f0' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8f9fd', borderBottom: '1px solid #e2e7f0' }}>
                {['Subject', 'Class', 'Enrolled Date', 'Fee', 'Payment', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}><div className="p-10 text-center text-sm" style={{ color: '#9ca3af' }}>Loading…</div></td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6}><div className="py-12 text-center text-sm" style={{ color: '#9ca3af' }}>No enrollment history yet.</div></td>
                </tr>
              ) : sorted.map(item => (
                <tr key={item.enrollmentId} className="border-t" style={{ borderColor: '#f0f3fa' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3451c7', fontFamily: 'Outfit, sans-serif' }}>
                        {item.subjectName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: '#1a1f36' }}>{item.subjectName}</div>
                        <div className="text-xs" style={{ color: '#9ca3af' }}>{item.subjectCode} · {item.credits} credits</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#374151' }}>{item.className}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>{item.enrolledAt}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#374151' }}>
                    {item.amount > 0 ? `$${Number(item.amount).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {item.status === 'approved' && item.paymentStatus === 'unpaid' ? (
                      <button onClick={() => { setPaying(enrollments.find(e => e.id === item.enrollmentId) ?? null); setPayForm({ method: 'Credit Card', reference: '' }) }} className="px-2.5 py-1 text-xs font-semibold rounded-lg text-white transition-opacity hover:opacity-90" style={{ backgroundColor: '#b45309', fontFamily: 'Outfit, sans-serif' }}>
                        Pay Now · ${Number(item.amount || 0).toFixed(2)}
                      </button>
                    ) : (
                      <Badge variant={item.paymentStatus === 'paid' ? 'success' : 'warning'} dot>{item.paymentStatus}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3"><Badge variant={statusVariant(item.status)} dot>{item.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={paying !== null}
        onClose={() => setPaying(null)}
        title="Online Payment"
        width={440}
        footer={
          <>
            <button onClick={() => setPaying(null)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
            <button onClick={handlePay} disabled={submitting} className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-60" style={{ backgroundColor: '#059669', fontFamily: 'Outfit, sans-serif' }}>
              {submitting ? 'Processing…' : 'Confirm Payment'}
            </button>
          </>
        }
      >
        {paying && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl p-4" style={{ backgroundColor: '#f8f9fd' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ backgroundColor: '#eff2ff', color: '#3451c7', fontFamily: 'Outfit, sans-serif' }}>
                {paying.subjectName.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{paying.subjectName}</div>
                <div className="text-xs" style={{ color: '#9ca3af' }}>{paying.className}</div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3" style={{ borderColor: '#e2e7f0' }}>
              <span className="text-sm" style={{ color: '#6b7280' }}>Amount due</span>
              <span className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>${Number(paying.amount || 0).toFixed(2)}</span>
            </div>
            <FormField label="Payment Method" required>
              <select value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))} className={inputClass} style={inputStyle}>
                <option>Credit Card</option>
                <option>Bank Transfer</option>
                <option>Mobile Money</option>
              </select>
            </FormField>
            <FormField label="Transaction Reference">
              <input value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} className={inputClass} style={inputStyle} placeholder="e.g. receipt / transaction id" />
            </FormField>
            <p className="text-xs" style={{ color: '#9ca3af' }}>
              This is a simulated payment. Once confirmed, your enrollment is marked as paid.
            </p>
          </div>
        )}
      </Modal>

      <p className="text-xs" style={{ color: '#9ca3af' }}>Dates shown as recorded at enrollment time.</p>
    </div>
  )
}