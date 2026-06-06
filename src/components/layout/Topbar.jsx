import { useState } from 'react'
import { Menu, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const breadcrumbMap = {
  '/dashboard':     'Dashboard',
  '/products':      'Products',
  '/customers':     'Customers',
  '/stock':         'Stock Management',
  '/quotations':    'Quotations',
  '/billing':       'Billing',
  '/reports':       'Reports & Analytics',
  '/settings':      'Settings',
  '/notifications': 'Notifications',
  '/users':         'User Management',
  '/profile':       'My Profile',
}

export default function Topbar({ onToggleSidebar }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const pageName =
    breadcrumbMap[location.pathname] ||
    breadcrumbMap['/' + location.pathname.split('/')[1]] ||
    'Page'

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <header className="h-16 glass-dark border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0 relative z-10">
      {/* Left: toggle + breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          className="btn-icon"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="font-display font-semibold text-slate-100 text-base leading-tight">
            {pageName}
          </h1>
          <p className="text-xs text-slate-600 leading-tight">RAM EMPORIUM</p>
        </div>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-2">
        {/* Notifications bell */}
        <Link to="/notifications" className="btn-icon relative" aria-label="Notifications">
          <Bell size={18} />
          <span className="notif-dot" />
        </Link>

        {/* User dropdown */}
        <div className="relative">
          <button
            className="flex items-center gap-2 glass rounded-xl px-3 py-2 cursor-pointer transition-all hover:border-white/15 focus:outline-none"
            onClick={() => setDropdownOpen(o => !o)}
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-slate-300 font-medium hidden sm:block">
              {user?.name}
            </span>
            <ChevronDown
              size={14}
              className={`text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="dropdown-menu z-50">
                {/* User info header */}
                <div className="p-4 border-b border-white/5">
                  <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                  <span className="badge badge-info mt-2 capitalize">{user?.role}</span>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  <Link
                    to="/profile"
                    className="dropdown-item rounded-xl"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={15} />
                    My Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="dropdown-item rounded-xl"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings size={15} />
                    Settings
                  </Link>
                  <div className="glass-divider my-1" />
                  <button
                    className="dropdown-item danger w-full rounded-xl"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    Logout
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
