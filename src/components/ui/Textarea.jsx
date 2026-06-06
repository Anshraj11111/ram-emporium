import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Textarea = forwardRef(({ label, error, className, rows = 3, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="form-label">{label}</label>}
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'glass-input w-full rounded-xl px-4 py-3 text-sm resize-none transition-all duration-200',
        error && 'border-rose-500/60 focus:border-rose-500',
        className
      )}
      {...props}
    />
    {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
  </div>
))
Textarea.displayName = 'Textarea'
export default Textarea
