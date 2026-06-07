import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { QrCode, Copy, CheckCheck } from 'lucide-react'

/**
 * Generates a UPI payment QR code.
 *
 * UPI deep-link format:
 * upi://pay?pa=<upi_id>&pn=<name>&am=<amount>&cu=INR&tn=<note>
 *
 * Props:
 *   upiId   – UPI ID (e.g. ramemporium@upi)
 *   name    – Payee name
 *   amount  – Amount (optional, 0 = any amount)
 *   note    – Payment note (optional)
 *   size    – Canvas size in px (default 180)
 */
export default function UpiQR({ upiId, name, amount = 0, note = 'Payment', size = 180 }) {
  const canvasRef = useRef(null)
  const [copied, setCopied]   = useState(false)
  const [error,  setError]    = useState(false)

  const upiLink = amount > 0
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name || 'RAM EMPORIUM')}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`
    : `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name || 'RAM EMPORIUM')}&cu=INR`

  useEffect(() => {
    if (!upiId || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, upiLink, {
      width:           size,
      margin:          2,
      color: {
        dark:  '#1e293b',
        light: '#f8fafc',
      },
      errorCorrectionLevel: 'M',
    }).then(() => setError(false)).catch(() => setError(true))
  }, [upiId, amount, upiLink, size])

  const handleCopy = () => {
    navigator.clipboard.writeText(upiLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!upiId) return null

  return (
    <div className="flex flex-col items-center gap-3">
      {/* QR Canvas */}
      <div className="rounded-2xl overflow-hidden border-2 border-white/10 shadow-xl">
        {error ? (
          <div className="w-44 h-44 flex flex-col items-center justify-center bg-slate-800 text-slate-400">
            <QrCode size={32} className="mb-2 opacity-40" />
            <p className="text-xs">QR Error</p>
          </div>
        ) : (
          <canvas ref={canvasRef} style={{ display: 'block' }} />
        )}
      </div>

      {/* UPI ID */}
      <div className="text-center">
        <p className="text-xs text-slate-500 mb-1">UPI ID</p>
        <div className="flex items-center gap-2 glass-dark rounded-xl px-3 py-2">
          <span className="text-sm font-mono text-brand-400">{upiId}</span>
          <button
            onClick={handleCopy}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            {copied ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Amount badge */}
      {amount > 0 && (
        <div className="glass rounded-xl px-4 py-2 text-center">
          <p className="text-xs text-slate-500">Amount to Pay</p>
          <p className="text-lg font-display font-bold gradient-text">
            ₹{amount.toFixed(2)}
          </p>
        </div>
      )}

      {/* Scan instruction */}
      <p className="text-xs text-slate-600 text-center max-w-36">
        Scan with any UPI app to pay
      </p>
    </div>
  )
}
