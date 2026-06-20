import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, FileText, Receipt,
  BarChart2, Settings, LogOut, Warehouse, Bell,
  UserCog, User, X
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/products',      icon: Package,         label: 'Products'     },
  { to: '/stock',         icon: Warehouse,        label: 'Stock'        },
  { to: '/quotations',    icon: FileText,         label: 'Quotations'  },
  { to: '/billing',       icon: Receipt,          label: 'Billing'      },
  { to: '/custom-billing',icon: FileText,         label: 'Custom Bill' },
  { to: '/reports',       icon: BarChart2,        label: 'Reports'      },
  { to: '/notifications', icon: Bell,             label: 'Notifications'},
  { to: '/settings',      icon: Settings,         label: 'Settings'     },
]

const adminNav = [
  { to: '/users', icon: UserCog, label: 'Users' },
]

export default function Sidebar({ collapsed, mobile, onClose }) {
  const { user, logout, isAdmin } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const width = mobile ? 280 : (collapsed ? 72 : 260)

  return (
    <aside
      className="flex flex-col h-full glass-dark border-r border-white/5 relative z-10"
      style={{ width, minWidth: width, transition: 'width 0.3s ease' }}
    >
      {/* Logo + close button (mobile) */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5 flex-shrink-0"
        style={{ paddingTop: mobile ? 'max(16px, env(safe-area-inset-top))' : undefined }}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/30">
          <span className="text-white font-display font-bold text-base">R</span>
        </div>
        {(!collapsed || mobile) && (
          <div className="flex-1 min-w-0 animate-fadeIn">
            <p className="font-display font-bold text-slate-100 text-sm leading-tight">RAM EMPORIUM</p>
            <p className="text-xs text-slate-500 leading-tight">Billing &amp; Inventory</p>
          </div>
        )}
        {mobile && onClose && (
          <button className="btn-icon w-8 h-8 flex-shrink-0" onClick={onClose}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={(collapsed && !mobile) ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {(!collapsed || mobile) && <span className="truncate">{label}</span>}
          </NavLink>
        ))}

        {isAdmin() && (
          <>
            <div className="glass-divider my-2" />
            {(!collapsed || mobile) && (
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 py-1">
                Admin
              </p>
            )}
            {adminNav.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                title={(collapsed && !mobile) ? label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {(!collapsed || mobile) && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="p-2 border-t border-white/5 flex-shrink-0"
        style={{ paddingBottom: mobile ? 'env(safe-area-inset-bottom)' : undefined }}>
        <NavLink
          to="/profile"
          className={({ isActive }) => `sidebar-link mb-1 ${isActive ? 'active' : ''}`}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          {(!collapsed || mobile) && (
            <div className="flex-1 min-w-0 animate-fadeIn">
              <p className="text-xs font-semibold text-slate-200 truncate leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize leading-tight">{user?.role}</p>
            </div>
          )}
        </NavLink>

        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10"
        >
          <LogOut size={17} className="flex-shrink-0" />
          {(!collapsed || mobile) && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
