type Variant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary'

const variants: Record<Variant, { bg: string; color: string }> = {
  success: { bg: '#d1fae5', color: '#065f46' },
  danger: { bg: '#ffe4e6', color: '#9f1239' },
  warning: { bg: '#fef3c7', color: '#92400e' },
  info: { bg: '#dbeafe', color: '#1e40af' },
  neutral: { bg: '#f3f4f6', color: '#374151' },
  primary: { bg: '#dde4ff', color: '#3451c7' },
}

interface BadgeProps {
  variant?: Variant
  children: React.ReactNode
  dot?: boolean
}

export default function Badge({ variant = 'neutral', children, dot }: BadgeProps) {
  const { bg, color } = variants[variant]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: bg, color, fontFamily: 'Outfit, sans-serif' }}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      )}
      {children}
    </span>
  )
}

export function statusVariant(status: string): 'success' | 'danger' | 'warning' | 'info' | 'neutral' {
  switch (status) {
    case 'active': case 'present': case 'enrolled': case 'completed': return 'success'
    case 'inactive': case 'absent': case 'dropped': return 'danger'
    case 'late': return 'warning'
    case 'permission': return 'info'
    default: return 'neutral'
  }
}
