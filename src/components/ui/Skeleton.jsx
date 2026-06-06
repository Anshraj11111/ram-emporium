import { cn } from '../../lib/utils'

export default function Skeleton({ className, count = 1 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn('skeleton', className)} />
      ))}
    </>
  )
}

export function TableSkeleton({ cols = 5, rows = 5 }) {
  return (
    <tbody>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }, (_, c) => (
            <td key={c} className="px-4 py-3">
              <div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}
