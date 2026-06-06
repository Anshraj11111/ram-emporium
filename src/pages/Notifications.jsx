import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsAPI } from '../services'
import { fmt } from '../lib/utils'
import { Bell, BellOff, CheckCheck, AlertTriangle, Info, ShoppingCart, FileText } from 'lucide-react'
import Button from '../components/ui/Button'
import Pagination from '../components/ui/Pagination'
import { useState } from 'react'

const typeIcon = {
  LOW_STOCK:     AlertTriangle,
  NEW_BILL:      ShoppingCart,
  NEW_QUOTATION: FileText,
  SYSTEM:        Info,
  INFO:          Info,
}

const typeColor = {
  LOW_STOCK:     'text-amber-400 bg-amber-400/10 border-amber-400/20',
  NEW_BILL:      'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  NEW_QUOTATION: 'text-brand-400 bg-brand-400/10 border-brand-400/20',
  SYSTEM:        'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  INFO:          'text-slate-400 bg-slate-400/10 border-slate-400/20',
}

export default function Notifications() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationsAPI.getAll({ page, limit: 20 }).then(r => r.data),
    keepPreviousData: true,
  })

  const markReadMut = useMutation({
    mutationFn: notificationsAPI.markRead,
    onSuccess: () => qc.invalidateQueries(['notifications']),
  })

  const markAllMut = useMutation({
    mutationFn: notificationsAPI.markAllRead,
    onSuccess: () => { qc.invalidateQueries(['notifications']); },
  })

  const notifications = data?.data?.notifications || []
  const unreadCount   = data?.data?.unreadCount || 0
  const pagination    = data?.meta?.pagination

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title gradient-text">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">
            {unreadCount > 0 ? <span className="text-amber-400 font-medium">{unreadCount} unread</span> : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markAllMut.mutate()} loading={markAllMut.isPending}>
            <CheckCheck size={14} /><span>Mark All Read</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-4 flex gap-4">
              <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <BellOff size={48} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-500 font-medium">No notifications yet</p>
          <p className="text-slate-600 text-sm mt-1">Alerts will appear here when stock runs low or activity occurs.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = typeIcon[n.type] || Info
            const colors = typeColor[n.type] || typeColor.INFO
            return (
              <div
                key={n._id}
                onClick={() => !n.isRead && markReadMut.mutate(n._id)}
                className={`glass rounded-2xl p-4 flex gap-4 transition-all cursor-pointer
                  ${n.isRead ? 'opacity-60' : 'hover:bg-white/5 border-l-2 border-l-brand-500/60'}`}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${colors}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.isRead ? 'text-slate-400' : 'text-slate-100'}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-slate-600 flex-shrink-0">{fmt.dateTime(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${colors}`}>{n.type.replace('_',' ')}</span>
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Pagination meta={pagination} onPageChange={setPage} />
    </div>
  )
}
