import { Link } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-animated flex items-center justify-center relative overflow-hidden">
      <div className="orb orb-1" /><div className="orb orb-2" />
      <div className="text-center relative z-10 animate-fadeInUp">
        <div className="text-9xl font-display font-black gradient-text mb-4">404</div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <AlertCircle size={20} className="text-rose-400" />
          <p className="text-xl font-semibold text-slate-200">Page Not Found</p>
        </div>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="btn-primary inline-flex items-center gap-2"
        >
          <Home size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  )
}
