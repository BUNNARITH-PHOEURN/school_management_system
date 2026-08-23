import { type ReactNode, useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: number
}

export default function Modal({ open, onClose, title, children, footer, width = 520 }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(2px)' }} onClick={onClose} />
      <div
        className="relative bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] w-full"
        style={{ maxWidth: width, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#e2e7f0' }}>
          <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1f36' }}>{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: '#e2e7f0' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function FormField({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
        {label}{required && <span className="ml-0.5" style={{ color: '#e11d48' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export const inputClass = "w-full px-3 py-2 rounded-lg border text-sm transition-colors outline-none focus:ring-2"
export const inputStyle = { borderColor: '#e2e7f0', color: '#1a1f36' }

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  danger?: boolean
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={400}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-gray-50" style={{ borderColor: '#e2e7f0', color: '#374151', fontFamily: 'Outfit, sans-serif' }}>
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: danger ? '#e11d48' : '#3b5bdb', fontFamily: 'Outfit, sans-serif' }}
          >
            Confirm
          </button>
        </>
      }
    >
      <p className="text-sm" style={{ color: '#6b7280' }}>{message}</p>
    </Modal>
  )
}
