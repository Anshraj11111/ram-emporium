import { cn } from '../../lib/utils'
import { statusColor, statusLabel } from '../../lib/utils'

export default function Badge({ status, label, className }) {
  const colorClass = statusColor[status] || 'badge-info'
  const text = label || statusLabel[status] || status
  return (
    <span className={cn('badge', colorClass, className)}>
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {text}
    </span>
  )
}
