import { cn } from '../../lib/utils'

export default function Card({ children, className, hover = false, glow = false, ...props }) {
  return (
    <div
      className={cn(
        'glass rounded-2xl',
        hover && 'glass-hover cursor-pointer',
        glow && 'animate-pulse-glow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
