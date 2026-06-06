import { cn } from '../../lib/utils'

/**
 * Generic empty state block for tables / lists.
 *
 * Props:
 *   icon     – Lucide icon component
 *   title    – main heading
 *   message  – sub-text
 *   action   – optional { label, onClick } button config
 */
export default function EmptyState({ icon: Icon, title, message, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
          <Icon size={28} className="text-slate-600" />
        </div>
      )}
      <p className="text-slate-300 font-semibold text-base">{title}</p>
      {message && (
        <p className="text-slate-500 text-sm mt-1 max-w-xs leading-relaxed">{message}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary mt-5 text-sm"
        >
          <span>{action.label}</span>
        </button>
      )}
    </div>
  )
}
