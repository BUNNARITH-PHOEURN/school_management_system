import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const iconMap: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }
  const styleMap: Record<ToastType, { bg: string; border: string; color: string }> = {
    success: { bg: '#d1fae5', border: '#6ee7b7', color: '#065f46' },
    error: { bg: '#ffe4e6', border: '#fca5a5', color: '#9f1239' },
    info: { bg: '#dbeafe', border: '#93c5fd', color: '#1e40af' },
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" style={{ maxWidth: 340 }}>
        {toasts.map(t => {
          const s = styleMap[t.type]
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium"
              style={{ backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.color, fontFamily: 'Outfit, sans-serif', animation: 'slideInRight 0.2s ease' }}
            >
              <span className="text-base leading-none">{iconMap[t.type]}</span>
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                className="opacity-50 hover:opacity-100 transition-opacity ml-1"
                style={{ color: s.color }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
