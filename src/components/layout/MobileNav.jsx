import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, Warehouse,
  FileText, Receipt, BarChart2
} from 'lucide-react'

const items = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Home'      },
  { to: '/products',   icon: Package,         label: 'Products'  },
  { to: '/stock',      icon: Warehouse,       label: 'Stock'     },
  { to: '/quotations', icon: FileText,        label: 'Quotes'    },
  { to: '/billing',    icon: Receipt,         label: 'Billing'   },
  { to: '/reports',    icon: BarChart2,       label: 'Reports'   },
]

export default function MobileNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(10,10,26,0.97)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-0 ${
                isActive
                  ? 'text-brand-400'
                  : 'text-slate-600 active:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-brand-500/20' : ''
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="text-xs font-medium leading-none truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
