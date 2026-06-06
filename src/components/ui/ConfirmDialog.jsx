import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

/**
 * Reusable confirmation dialog.
 *
 * Usage:
 *   <ConfirmDialog
 *     open={!!deleteId}
 *     onClose={() => setDeleteId(null)}
 *     onConfirm={() => deleteMut.mutate(deleteId)}
 *     loading={deleteMut.isPending}
 *     title="Delete Product"
 *     message="This action cannot be undone."
 *     confirmLabel="Delete"
 *     danger
 *   />
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  danger = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          danger ? 'bg-rose-500/15 border border-rose-500/25' : 'bg-amber-500/15 border border-amber-500/25'
        }`}>
          <AlertTriangle size={18} className={danger ? 'text-rose-400' : 'text-amber-400'} />
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          <span>{confirmLabel}</span>
        </Button>
      </div>
    </Modal>
  )
}
