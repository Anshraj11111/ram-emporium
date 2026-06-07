import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import MobileNav from './MobileNav'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed]     = useState(false)
  const [isMobile, setIsMobile]       = useState(window.innerWidth < 768)
  const location = useLocation()

  // Close mobile sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  // Track viewport
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <div className="flex h-screen bg-animated overflow-hidden relative">
      {/* Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ── Desktop Sidebar ── */}
      {!isMobile && (
        <Sidebar collapsed={collapsed} />
      )}

      {/* ── Mobile Sidebar Overlay ── */}
      {isMobile && sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed left-0 top-0 bottom-0 z-50 w-72 shadow-2xl"
            style={{ animation: 'slideInLeft 0.25s ease' }}>
            <Sidebar collapsed={false} onClose={() => setSidebarOpen(false)} mobile />
          </div>
        </>
      )}

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
        <Topbar
          onToggleSidebar={() => isMobile ? setSidebarOpen(!sidebarOpen) : setCollapsed(!collapsed)}
          isMobile={isMobile}
        />

        {/* Page content — safe area for iOS */}
        <main
          className="flex-1 overflow-y-auto"
          style={{
            padding: isMobile ? '16px 16px calc(80px + env(safe-area-inset-bottom))' : '24px',
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      {isMobile && <MobileNav />}
    </div>
  )
}
