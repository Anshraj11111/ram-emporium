import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import MobileNav from './MobileNav'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed]     = useState(false)
  const [isMobile, setIsMobile]       = useState(window.innerWidth < 768)
  const location   = useLocation()
  const mainRef    = useRef(null)

  // Close mobile sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  // Track viewport
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Force all wheel events inside the layout to scroll #main-scroll
  useEffect(() => {
    const mainEl = mainRef.current
    if (!mainEl) return

    const handleWheel = (e) => {
      // If the event target is already inside a scrollable child (e.g. modal),
      // let it scroll naturally
      let el = e.target
      while (el && el !== mainEl) {
        const style = window.getComputedStyle(el)
        const overflowY = style.overflowY
        const canScroll = (overflowY === 'auto' || overflowY === 'scroll') &&
                           el.scrollHeight > el.clientHeight
        if (canScroll) return   // let the inner element scroll
        el = el.parentElement
      }
      // Otherwise redirect the scroll to main
      mainEl.scrollTop += e.deltaY
    }

    // Attach to the whole document so even elements outside main catch it
    document.addEventListener('wheel', handleWheel, { passive: true })
    return () => document.removeEventListener('wheel', handleWheel)
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
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
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

        <main
          ref={mainRef}
          id="main-scroll"
          className="flex-1 overflow-y-auto outline-none"
          style={{
            padding: isMobile ? '16px 16px calc(80px + env(safe-area-inset-bottom))' : '24px',
            WebkitOverflowScrolling: 'touch',
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
