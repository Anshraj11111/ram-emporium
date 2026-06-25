import { cn } from '../../lib/utils'

export function Table({ children, className }) {
  return (
    <div className="overflow-x-auto w-full">
      <table className={cn('glass-table', className)}>{children}</table>
    </div>
  )
}

export function Th({ children, className }) {
  return <th className={cn(className)}>{children}</th>
}

export function Td({ children, className }) {
  return <td className={cn(className)}>{children}</td>
}
