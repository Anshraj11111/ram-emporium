import { useQuery } from '@tanstack/react-query'
import { dashboardAPI } from '../services'
import { fmt } from '../lib/utils'
import {
  TrendingUp, ShoppingCart, Package,
  AlertTriangle, Receipt, ArrowUpRight, Clock
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from 'recharts'
import Skeleton from '../components/ui/Skeleton'
import Badge from '../components/ui/Badge'
import { Link } from 'react-router-dom'

const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
  <div className={`stat-card animate-fadeInUp stagger-${delay}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</p>
        <p className="text-2xl font-display font-bold text-slate-100">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <div className="mt-4 flex items-center gap-1 text-xs text-emerald-400">
      <ArrowUpRight size={12} />
      <span>Live data</span>
    </div>
  </div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-3 border border-white/10 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {fmt.currency(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardAPI.getSummary().then((r) => r.data.data),
    refetchInterval: 60000,
  })

  const monthlyData = Array.from({ length: 7 }, (_, i) => ({
    name: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
    sales: Math.floor(Math.random() * 50000) + 10000,
  }))

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="stat-card">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const d = data || {}

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title gradient-text">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 text-xs text-slate-400">
          <Clock size={13} />
          <span>Updated just now</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={TrendingUp}   label="Today's Sales"    value={fmt.currency(d.totalSalesToday)}     sub={`${d.totalBillsToday || 0} bills`}     color="bg-gradient-to-br from-brand-500 to-purple-600"  delay={1} />
        <StatCard icon={ShoppingCart} label="This Month"       value={fmt.currency(d.totalSalesThisMonth)} sub={`${d.totalBillsThisMonth || 0} bills`}  color="bg-gradient-to-br from-cyan-500 to-blue-600"     delay={2} />
        <StatCard icon={Package}      label="Total Products"   value={fmt.number(d.totalProducts)}         sub="Active products"                        color="bg-gradient-to-br from-emerald-500 to-teal-600"  delay={3} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 animate-fadeInUp stagger-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-slate-200">Weekly Sales</h3>
              <p className="text-xs text-slate-500 mt-0.5">Revenue trend this week</p>
            </div>
            <span className="badge badge-active">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2}
                fill="url(#salesGrad)" dot={{ fill: '#6366f1', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock */}
        <div className="glass rounded-2xl p-6 animate-fadeInUp stagger-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-slate-200">Low Stock</h3>
              <p className="text-xs text-slate-500 mt-0.5">{d.lowStockCount || 0} items critical</p>
            </div>
            <AlertTriangle size={18} className="text-amber-400" />
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {d.lowStockProducts?.length > 0 ? d.lowStockProducts.map((p) => (
              <div key={p._id} className="flex items-center justify-between p-2 glass-dark rounded-xl">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-200 truncate">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.sku}</p>
                </div>
                <div className="text-right ml-2">
                  <p className="text-xs font-bold text-amber-400">{p.stockQty}</p>
                  <p className="text-xs text-slate-600">min {p.minStockLevel}</p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-500 text-center py-4">All stock levels OK ✓</p>
            )}
          </div>
          <Link to="/stock" className="btn-secondary w-full justify-center mt-4 text-xs py-2">
            View Stock
          </Link>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Bills */}
        <div className="glass rounded-2xl p-6 animate-fadeInUp stagger-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-200">Recent Bills</h3>
            <Link to="/billing" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          <div className="space-y-2">
            {d.recentBills?.length > 0 ? d.recentBills.map((b) => (
              <div key={b._id} className="flex items-center justify-between p-3 glass-dark rounded-xl hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500/20 to-purple-600/20 border border-brand-500/20 flex items-center justify-center">
                    <Receipt size={14} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{b.billNo}</p>
                    <p className="text-xs text-slate-500">{b.customerSnapshot?.name || 'Walk-in'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-100">{fmt.currency(b.grandTotal)}</p>
                  <Badge status={b.type} className="mt-0.5" />
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-500 text-center py-4">No bills yet</p>
            )}
          </div>
        </div>

        {/* Top Selling */}
        <div className="glass rounded-2xl p-6 animate-fadeInUp stagger-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-200">Top Selling This Month</h3>
            <Link to="/reports" className="text-xs text-brand-400 hover:text-brand-300">Reports →</Link>
          </div>
          {d.topSellingProducts?.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={d.topSellingProducts.slice(0, 5)} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="productName" tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false} tickLine={false} width={100}
                  tickFormatter={(v) => v?.length > 14 ? v.slice(0, 14) + '…' : v} />
                <Tooltip formatter={(v) => [fmt.number(v) + ' qty', 'Sold']}
                  contentStyle={{ background: 'rgba(15,15,40,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="totalQty" fill="url(#barGrad)" radius={[0, 6, 6, 0]} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">No sales data yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
