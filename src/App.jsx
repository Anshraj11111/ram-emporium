import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import useAuthStore from './store/authStore'
import AppLayout from './components/layout/AppLayout'

// Pages (lazy loaded for performance)
const Login           = lazy(() => import('./pages/Login'))
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword'))
const Dashboard       = lazy(() => import('./pages/Dashboard'))
const Products        = lazy(() => import('./pages/Products'))
const Customers       = lazy(() => import('./pages/Customers'))
const Stock           = lazy(() => import('./pages/Stock'))
const Quotations      = lazy(() => import('./pages/Quotations'))
const Billing         = lazy(() => import('./pages/Billing'))
const CustomBilling   = lazy(() => import('./pages/CustomBilling'))
const Reports         = lazy(() => import('./pages/Reports'))
const Settings        = lazy(() => import('./pages/Settings'))
const Notifications   = lazy(() => import('./pages/Notifications'))
const Users           = lazy(() => import('./pages/Users'))
const Profile         = lazy(() => import('./pages/Profile'))
const NotFound        = lazy(() => import('./pages/NotFound'))

// ── Full-page loader ─────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-animated flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
          <span className="text-white font-display font-bold text-2xl">R</span>
        </div>
        <div className="spinner mx-auto" style={{ width: 24, height: 24 }} />
      </div>
    </div>
  )
}

// ── Auth guard ───────────────────────────────────
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }) {
  const { isAdmin } = useAuthStore()
  if (!isAdmin()) return <Navigate to="/dashboard" replace />
  return children
}

function RedirectIfAuth({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public ── */}
        <Route path="/login" element={
          <RedirectIfAuth><Login /></RedirectIfAuth>
        } />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ── Protected ── */}
        <Route path="/" element={
          <RequireAuth><AppLayout /></RequireAuth>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"     element={<Dashboard />} />
          <Route path="products"      element={<Products />} />
          <Route path="customers"     element={<Customers />} />
          <Route path="stock"         element={<Stock />} />
          <Route path="quotations"    element={<Quotations />} />
          <Route path="billing"         element={<Billing />} />
          <Route path="custom-billing"  element={<CustomBilling />} />
          <Route path="reports"       element={<Reports />} />
          <Route path="settings"      element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="users" element={
            <RequireAdmin><Users /></RequireAdmin>
          } />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
