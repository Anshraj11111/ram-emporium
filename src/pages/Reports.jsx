import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsAPI } from '../services'
import { fmt } from '../lib/utils'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Calendar, TrendingUp, Package, Users, AlertTriangle, DollarSign } from 'lucide-react'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-3 border border-white/10 text-xs shadow-2xl">
      <p className="text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {typeof p.value === 'number' && p.value > 100 ? fmt.currency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  )
}

export default function Reports() {
  const [tab, setTab] = useState('daily')
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')

  const daily = useQuery({
    queryKey: ['report-daily'],
    queryFn: () => reportsAPI.daily().then(r => r.data.data),
    enabled: tab === 'daily',
  })

  const monthly = useQuery({
    queryKey: ['report-monthly', year, month],
    queryFn: () => reportsAPI.monthly({ year, month }).then(r => r.data.data),
    enabled: tab === 'monthly',
  })

  const yearly = useQuery({
    queryKey: ['report-yearly', year],
    queryFn: () => reportsAPI.yearly({ year }).then(r => r.data.data),
    enabled: tab === 'yearly',
  })

  const topSelling = useQuery({
    queryKey: ['report-top', startDate, endDate],
    queryFn: () => reportsAPI.topSelling({ limit: 10, startDate, endDate }).then(r => r.data.data),
    enabled: tab === 'top-selling',
  })

  const customerWise = useQuery({
    queryKey: ['report-customers', startDate, endDate],
    queryFn: () => reportsAPI.customerWise({ startDate, endDate }).then(r => r.data.data),
    enabled: tab === 'customer-wise',
  })

  const lowStock = useQuery({
    queryKey: ['report-lowstock'],
    queryFn: () => reportsAPI.lowStock().then(r => r.data.data),
    enabled: tab === 'low-stock',
  })

  const profit = useQuery({
    queryKey: ['report-profit', startDate, endDate],
    queryFn: () => reportsAPI.profit({ startDate, endDate }).then(r => r.data.data),
    enabled: tab === 'profit',
  })

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="page-title gradient-text">Reports & Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Business insights at a glance</p>
      </div>

      {/* Tabs */}
      <div className="glass rounded-2xl p-2 flex flex-wrap gap-1">
        {[
          { id: 'daily',        label: 'Daily' },
          { id: 'monthly',      label: 'Monthly' },
          { id: 'yearly',       label: 'Yearly' },
          { id: 'top-selling',  label: 'Top Products' },
          { id: 'customer-wise',label: 'Customers' },
          { id: 'low-stock',    label: 'Low Stock' },
          { id: 'profit',       label: 'Profit' },
        ].map(t => (
          <TabBtn key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</TabBtn>
        ))}
      </div>

      {/* Date filters for range-based tabs */}
      {['top-selling','customer-wise','profit'].includes(tab) && (
        <div className="glass rounded-2xl p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="form-label">Start Date</label>
            <input type="date" className="glass-input rounded-xl px-3 py-2.5 text-sm"
              value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <input type="date" className="glass-input rounded-xl px-3 py-2.5 text-sm"
              value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      )}

      {tab === 'monthly' && (
        <div className="glass rounded-2xl p-4 flex gap-4">
          <div>
            <label className="form-label">Year</label>
            <select className="glass-input rounded-xl px-3 py-2.5 text-sm" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Month</label>
            <select className="glass-input rounded-xl px-3 py-2.5 text-sm" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {months.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
        </div>
      )}

      {tab === 'yearly' && (
        <div className="glass rounded-2xl p-4">
          <label className="form-label">Year</label>
          <select className="glass-input rounded-xl px-3 py-2.5 text-sm w-32" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {/* ── Daily ─── */}
      {tab === 'daily' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {daily.isLoading ? (
            <div className="col-span-4 text-center text-slate-500 py-10">Loading…</div>
          ) : (
            <>
              {[
                { label: 'Total Sales Today',  value: fmt.currency(daily.data?.totalSales || 0),  icon: TrendingUp,  color: 'from-brand-500 to-purple-600' },
                { label: 'Bills Today',         value: fmt.number(daily.data?.totalBills || 0),    icon: Calendar,    color: 'from-cyan-500 to-blue-600' },
                { label: 'GST Sales',           value: fmt.currency(daily.data?.gstSales || 0),    icon: DollarSign,  color: 'from-emerald-500 to-teal-600' },
                { label: 'Non-GST Sales',       value: fmt.currency(daily.data?.nonGstSales || 0), icon: DollarSign,  color: 'from-amber-500 to-orange-600' },
              ].map((s,i) => (
                <div key={i} className="stat-card animate-fadeInUp" style={{ animationDelay: `${i*0.05}s` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{s.label}</p>
                      <p className="text-2xl font-display font-bold text-slate-100">{s.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                      <s.icon size={18} className="text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Monthly ── */}
      {tab === 'monthly' && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display font-semibold text-slate-200 mb-6">
            Sales – {months[month-1]} {year}
          </h3>
          {monthly.isLoading ? (
            <div className="text-center text-slate-500 py-10">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={(monthly.data || []).map(d => ({ day: `Day ${d._id}`, sales: d.sales, bills: d.bills }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sales" fill="url(#grad1)" radius={[6,6,0,0]} />
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── Yearly ── */}
      {tab === 'yearly' && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display font-semibold text-slate-200 mb-6">Yearly Sales – {year}</h3>
          {yearly.isLoading ? (
            <div className="text-center text-slate-500 py-10">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={(yearly.data || []).map(d => ({ month: months[d._id-1], sales: d.sales, bills: d.bills }))}>
                <defs>
                  <linearGradient id="yearGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fill="url(#yearGrad)"
                  dot={{ fill: '#6366f1', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── Top Selling ── */}
      {tab === 'top-selling' && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display font-semibold text-slate-200 mb-6">Top 10 Selling Products</h3>
          {topSelling.isLoading ? (
            <div className="text-center text-slate-500 py-10">Loading…</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topSelling.data || []} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="productName" tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false} tickLine={false} width={120}
                    tickFormatter={v => v?.length > 16 ? v.slice(0,16)+'…' : v} />
                  <Tooltip formatter={(v, n) => [n === 'totalQty' ? `${v} qty` : fmt.currency(v), n === 'totalQty' ? 'Qty Sold' : 'Revenue']}
                    contentStyle={{ background: 'rgba(15,15,40,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="totalQty" fill="url(#topGrad)" radius={[0,6,6,0]} />
                  <defs>
                    <linearGradient id="topGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(topSelling.data || []).map((p, i) => (
                  <div key={p._id} className="flex items-center gap-3 glass-dark rounded-xl p-3">
                    <span className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i+1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{p.productName}</p>
                      <p className="text-xs text-slate-500">{p.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-100">{fmt.number(p.totalQty)} qty</p>
                      <p className="text-xs text-slate-500">{fmt.currency(p.totalRev)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Customer Wise ── */}
      {tab === 'customer-wise' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-6">
            <h3 className="font-display font-semibold text-slate-200">Customer-wise Sales</h3>
          </div>
          <table className="glass-table w-full">
            <thead><tr>
              <th>#</th><th>Customer</th><th>Mobile</th>
              <th className="text-right">Total Bills</th><th className="text-right">Total Purchase</th>
            </tr></thead>
            <tbody>
              {customerWise.isLoading ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-500">Loading…</td></tr>
              ) : (customerWise.data?.data || []).map((c, i) => (
                <tr key={c._id}>
                  <td className="px-4 py-3 text-slate-500 text-sm">{i+1}</td>
                  <td className="px-4 py-3 font-medium text-slate-200">{c.customerName || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{c.mobile || '—'}</td>
                  <td className="px-4 py-3 text-right"><span className="number-pill">{c.totalBills}</span></td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-100">{fmt.currency(c.totalPurchase)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Low Stock ── */}
      {tab === 'low-stock' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400" />
            <h3 className="font-display font-semibold text-slate-200">Low Stock Report</h3>
          </div>
          <table className="glass-table w-full">
            <thead><tr>
              <th>Product</th><th>SKU</th><th>Unit</th>
              <th className="text-right">Current Stock</th><th className="text-right">Min Level</th><th>Location</th>
            </tr></thead>
            <tbody>
              {lowStock.isLoading ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500">Loading…</td></tr>
              ) : (lowStock.data || []).map(p => (
                <tr key={p._id}>
                  <td className="px-4 py-3 font-medium text-slate-200">{p.name}</td>
                  <td className="px-4 py-3"><code className="text-brand-400 text-xs">{p.sku}</code></td>
                  <td className="px-4 py-3 text-slate-400">{p.unit}</td>
                  <td className="px-4 py-3 text-right font-bold text-amber-400">{p.stockQty}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{p.minStockLevel}</td>
                  <td className="px-4 py-3 text-slate-500 text-sm">{p.location || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Profit ── */}
      {tab === 'profit' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {profit.isLoading ? (
            <div className="col-span-3 text-center text-slate-500 py-10">Loading…</div>
          ) : (
            <>
              {[
                { label: 'Total Revenue', value: fmt.currency(profit.data?.revenue || 0), color: 'from-brand-500 to-purple-600', icon: TrendingUp },
                { label: 'Total Cost',    value: fmt.currency(profit.data?.cost || 0),    color: 'from-rose-500 to-pink-600',    icon: DollarSign },
                { label: 'Net Profit',    value: fmt.currency(profit.data?.profit || 0),  color: 'from-emerald-500 to-teal-600', icon: TrendingUp },
              ].map((s,i) => (
                <div key={i} className="stat-card animate-fadeInUp" style={{ animationDelay: `${i*0.1}s` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{s.label}</p>
                      <p className="text-2xl font-display font-bold text-slate-100">{s.value}</p>
                      {s.label === 'Net Profit' && (
                        <p className="text-xs text-emerald-400 mt-1">
                          Margin: {((profit.data?.marginPct || 0)).toFixed(1)}%
                        </p>
                      )}
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                      <s.icon size={18} className="text-white" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="col-span-3 glass rounded-2xl p-6">
                <h3 className="font-display font-semibold text-slate-200 mb-4">Revenue vs Cost</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[{
                    name: 'Summary',
                    Revenue: profit.data?.revenue || 0,
                    Cost:    profit.data?.cost    || 0,
                    Profit:  profit.data?.profit  || 0,
                  }]}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Revenue" fill="#6366f1" radius={[6,6,0,0]} />
                    <Bar dataKey="Cost"    fill="#f43f5e" radius={[6,6,0,0]} />
                    <Bar dataKey="Profit"  fill="#10b981" radius={[6,6,0,0]} />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
