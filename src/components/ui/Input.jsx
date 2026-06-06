import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Input = forwardRef(({ label, error, className, icon: Icon, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="form-label">{label}</label>}
    <div className="relative">
      {Icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          <Icon size={16} />
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'glass-input w-full rounded-xl px-4 py-3 text-sm transition-all duration-200',
          Icon && 'pl-10',
          error && 'border-rose-500/60 focus:border-rose-500',
          className
        )}
        {...props}
      />
    </div>
    {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
  </div>
))
Input.displayName = 'Input'
export default Input
