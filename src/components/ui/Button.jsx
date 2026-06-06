import { cn } from '../../lib/utils'

const variants = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
  success:   'btn-success',
  icon:      'btn-icon',
}

const sizes = {
  sm: 'text-xs px-3 py-2',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-6 py-3',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(variants[variant], sizes[size], className, 'relative')}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="spinner" />
          <span className="opacity-0">{children}</span>
        </>
      ) : children}
    </button>
  )
}
