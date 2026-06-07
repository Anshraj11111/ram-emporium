import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else       document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const maxW = { sm: 440, md: 640, lg: 800, xl: 960 }[size] || 640
  const isMobile = window.innerWidth < 640

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ alignItems: isMobile ? 'flex-end' : 'center' }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth:    isMobile ? '100%' : maxW,
          width:       '100%',
          borderRadius: isMobile ? '20px 20px 0 0' : 24,
          maxHeight:   isMobile ? '92vh' : '90vh',
          animation:   isMobile ? 'slideUp 0.3s ease' : 'fadeInUp 0.3s ease',
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0,
        }}
      >
        {/* Drag handle on mobile */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="font-display text-base font-semibold text-slate-100 truncate pr-4">
            {title}
          </h2>
          <button className="btn-icon flex-shrink-0 w-8 h-8" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto" style={{ maxHeight: isMobile ? 'calc(92vh - 80px)' : 'calc(90vh - 80px)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
