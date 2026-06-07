import { useState } from 'react'
import { Menu, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const breadcrumbMap = {
  '/dashboard':     'Dashboard',
  '/products':      'Products',
  '/customers':     'Customers',
  '/stock':         'Stock',
  '/quotations':    'Quotations',
  '/billing':       'Billing',
  '/reports':       'Reports',
  '/settings':      'Settings',
  '/notifications': 'Notifications',
  '/users':         'Users',
  '/profile':       'Profile',
}

export default function Topbar({ onToggleSidebar, isMobile }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const pageName =
    breadcrumbMap[location.pathname] ||
    breadcrumbMap['/' + location.pathname.split('/')[1]] || 'Page'

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-4 glass-dark border-b border-white/5 relative z-10"
      style={{
        height: 60,
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          className="btn-icon w-9 h-9"
          onClick={onToggleSidebar}
          aria-label="Menu"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="font-display font-semibold text-slate-100 text-sm sm:text-base leading-tight truncate">
            {pageName}
          </h1>
          {!isMobile && (
            <p className="text-xs text-slate-600 leading-tight">RAM EMPORIUM</p>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <Link to="/notifications" className="btn-icon w-9 h-9 relative" aria-label="Notifications">
          <Bell size={17} />
          <span className="notif-dot" />
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            className="flex items-center gap-2 glass rounded-xl px-2.5 py-1.5 cursor-pointer transition-all hover:border-white/15"
            onClick={() => setDropdownOpen(o => !o)}
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </span>
            </div>
            {!isMobile && (
              <span className="text-sm text-slate-300 font-medium hidden sm:block">
                {user?.name}
              </span>
            )}
            <ChevronDown size={13} className={`text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="dropdown-menu z-50" style={{ minWidth: 180 }}>
                <div className="p-3 border-b border-white/5">
                  <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <Link to="/profile" className="dropdown-item rounded-xl" onClick={() => setDropdownOpen(false)}>
                    <User size={14} /> Profile
                  </Link>
                  <Link to="/settings" className="dropdown-item rounded-xl" onClick={() => setDropdownOpen(false)}>
                    <Settings size={14} /> Settings
                  </Link>
                  <div className="glass-divider my-1" />
                  <button className="dropdown-item danger w-full rounded-xl" onClick={handleLogout}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
