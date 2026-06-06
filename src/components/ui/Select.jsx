import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Select = forwardRef(({ label, error, className, children, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="form-label">{label}</label>}
    <select
      ref={ref}
      className={cn(
        'glass-input w-full rounded-xl px-4 py-3 text-sm appearance-none cursor-pointer',
        error && 'border-rose-500/60',
        className
      )}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
  </div>
))
Select.displayName = 'Select'
export default Select
