import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Reusable stat card with icon, value, label and optional trend.
 *
 * Props:
 *   icon       – Lucide icon component
 *   label      – small text label
 *   value      – main display value (string)
 *   sub        – small sub-text below value
 *   trend      – { value: number, label: string } — positive = green, negative = red
 *   gradient   – tailwind gradient classes for the icon bg
 *   delay      – stagger animation delay index (1-6)
 *   className  – extra classes on wrapper
 *   onClick    – optional click handler
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  gradient = 'from-brand-500 to-purple-600',
  delay = 1,
  className,
  onClick,
}) {
  const isPositive = trend?.value >= 0

  return (
    <div
      className={cn(
        `stat-card animate-fadeInUp stagger-${delay}`,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className="text-2xl font-display font-bold text-slate-100 truncate">
            {value}
          </p>
          {sub && (
            <p className="text-xs text-slate-500 mt-1">{sub}</p>
          )}
        </div>

        {/* Icon */}
        <div className={cn(
          'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ml-3',
          `bg-gradient-to-br ${gradient}`
        )}>
          <Icon size={20} className="text-white" />
        </div>
      </div>

      {/* Bottom trend row */}
      <div className="mt-4 flex items-center gap-1.5">
        {trend ? (
          <>
            <div className={cn(
              'flex items-center gap-0.5 text-xs font-semibold',
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            )}>
              {isPositive
                ? <ArrowUpRight size={13} />
                : <ArrowDownRight size={13} />
              }
              <span>{Math.abs(trend.value)}%</span>
            </div>
            <span className="text-xs text-slate-600">{trend.label}</span>
          </>
        ) : (
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live</span>
          </div>
        )}
      </div>
    </div>
  )
}
