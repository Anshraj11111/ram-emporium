import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsAPI } from '../services'
import { fmt } from '../lib/utils'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, DollarSign, Calendar, AlertTriangle } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-2.5 border border-white/10 text-xs shadow-2xl">
      <p className="text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {typeof p.value === 'number' && p.value > 100 ? fmt.currency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

const TABS = [
  { id: 'daily',        label: 'Daily'    },
  { id: 'monthly',      label: 'Monthly'  },
  { id: 'yearly',       label: 'Yearly'   },
  { id: 'top-selling',  label: 'Top'      },
  { id: 'customer-wise',label: 'Customers'},
  { id: 'low-stock',    label: 'Low Stock'},
  { id: 'profit',       label: 'Profit'   },
]

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function Reports() {
  const [tab, setTab]     = useState('daily')
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')

  const daily       = useQuery({ queryKey: ['report-daily'],           queryFn: () => reportsAPI.daily().then(r => r.data.data),                                    enabled: tab === 'daily' })
  const monthly     = useQuery({ queryKey: ['report-monthly', year, month], queryFn: () => reportsAPI.monthly({ year, month }).then(r => r.data.data),              enabled: tab === 'monthly' })
  const yearly      = useQuery({ queryKey: ['report-yearly', year],    queryFn: () => reportsAPI.yearly({ year }).then(r => r.data.data),                           enabled: tab === 'yearly' })
  const topSelling  = useQuery({ queryKey: ['report-top', startDate, endDate], queryFn: () => reportsAPI.topSelling({ limit: 10, startDate, endDate }).then(r => r.data.data), enabled: tab === 'top-selling' })
  const customerWise= useQuery({ queryKey: ['report-customers', startDate, endDate], queryFn: () => reportsAPI.customerWise({ startDate, endDate }).then(r => r.data.data), enabled: tab === 'customer-wise' })
  const lowStock    = useQuery({ queryKey: ['report-lowstock'],        queryFn: () => reportsAPI.lowStock().then(r => r.data.data),                                 enabled: tab === 'low-stock' })
  const profit      = useQuery({ queryKey: ['report-profit', startDate, endDate], queryFn: () => reportsAPI.profit({ startDate, endDate }).then(r => r.data.data), enabled: tab === 'profit' })

  const dateRangeTabs = ['top-selling', 'customer-wise', 'profit']

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="page-title gradient-text">Reports</h1>
        <p className="text-slate-500 text-xs mt-0.5">Business analytics</p>
      </div>

      {/* Tab strip — scrollable horizontally on mobile */}
      <div className="glass rounded-2xl p-1.5 overflow-x-auto">
        <div className="flex gap-1 min-w-max sm:min-w-0 sm:flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.id
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date filters */}
      {dateRangeTabs.includes(tab) && (
        <div className="glass rounded-2xl p-3 flex gap-3 flex-wrap">
          <div className="flex-1 min-w-32">
            <label className="form-label text-xs">Start Date</label>
            <input type="date" className="glass-input rounded-xl px-3 py-2 text-sm w-full" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="flex-1 min-w-32">
            <label className="form-label text-xs">End Date</label>
            <input type="date" className="glass-input rounded-xl px-3 py-2 text-sm w-full" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      )}

      {(tab === 'monthly') && (
        <div className="glass rounded-2xl p-3 flex gap-3">
          <div className="flex-1">
            <label className="form-label text-xs">Year</label>
            <select className="glass-input rounded-xl px-3 py-2 text-sm w-full" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="form-label text-xs">Month</label>
            <select className="glass-input rounded-xl px-3 py-2 text-sm w-full" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
        </div>
      )}

      {tab === 'yearly' && (
        <div className="glass rounded-2xl p-3">
          <label className="form-label text-xs">Year</label>
          <select className="glass-input rounded-xl px-3 py-2 text-sm w-36" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {/* ── Daily ── */}
      {tab === 'daily' && (
        <div className="grid grid-cols-2 gap-3">
          {daily.isLoading
            ? [...Array(4)].map((_,i) => <div key={i} className="stat-card"><div className="skeleton h-4 w-20 rounded mb-2"/><div className="skeleton h-6 w-24 rounded"/></div>)
            : [
                { label: 'Sales Today',  value: fmt.currency(daily.data?.totalSales || 0),  icon: TrendingUp,  color: 'from-brand-500 to-purple-600' },
                { label: 'Bills Today',  value: fmt.number(daily.data?.totalBills || 0),    icon: Calendar,    color: 'from-cyan-500 to-blue-600' },
                { label: 'GST Sales',    value: fmt.currency(daily.data?.gstSales || 0),    icon: DollarSign,  color: 'from-emerald-500 to-teal-600' },
                { label: 'Non-GST',      value: fmt.currency(daily.data?.nonGstSales || 0), icon: DollarSign,  color: 'from-amber-500 to-orange-600' },
              ].map((s, i) => (
                <div key={i} className="stat-card py-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
                      <p className="text-lg font-display font-bold text-slate-100 truncate">{s.value}</p>
                    </div>
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0`}>
                      <s.icon size={16} className="text-white" />
                    </div>
                  </div>
                </div>
              ))}
        </div>
      )}

      {/* ── Monthly ── */}
      {tab === 'monthly' && (
        <div className="glass rounded-2xl p-4">
          <h3 className="font-display font-semibold text-slate-200 mb-4">{months[month-1]} {year}</h3>
          {monthly.isLoading ? <div className="skeleton h-48 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(monthly.data || []).map(d => ({ day: `${d._id}`, sales: d.sales }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sales" fill="url(#grad1)" radius={[4,4,0,0]} />
                <defs><linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                </linearGradient></defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── Yearly ── */}
      {tab === 'yearly' && (
        <div className="glass rounded-2xl p-4">
          <h3 className="font-display font-semibold text-slate-200 mb-4">Year {year}</h3>
          {yearly.isLoading ? <div className="skeleton h-48 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={(yearly.data || []).map(d => ({ month: months[d._id-1], sales: d.sales }))}>
                <defs><linearGradient id="yearGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fill="url(#yearGrad)" dot={{ fill: '#6366f1', r: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── Top Selling ── */}
      {tab === 'top-selling' && (
        <div className="space-y-2">
          {topSelling.isLoading
            ? [...Array(5)].map((_,i) => <div key={i} className="glass rounded-2xl p-4"><div className="skeleton h-4 w-3/4 rounded" /></div>)
            : (topSelling.data || []).map((p, i) => (
                <div key={p._id} className="glass rounded-2xl p-4 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-brand-500/20 text-brand-400 text-sm font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{p.productName}</p>
                    <p className="text-xs text-slate-500">{p.sku}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-100">{fmt.number(p.totalQty)} qty</p>
                    <p className="text-xs text-slate-500">{fmt.currency(p.totalRev)}</p>
                  </div>
                </div>
              ))}
        </div>
      )}

      {/* ── Customer Wise ── */}
      {tab === 'customer-wise' && (
        <div className="space-y-2">
          {customerWise.isLoading
            ? [...Array(4)].map((_,i) => <div key={i} className="glass rounded-2xl p-4"><div className="skeleton h-4 w-3/4 rounded" /></div>)
            : (customerWise.data?.data || []).map((c, i) => (
                <div key={c._id || i} className="glass rounded-2xl p-4 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-brand-500/20 text-brand-400 text-sm font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{c.customerName || 'Walk-in'}</p>
                    <p className="text-xs text-slate-500">{c.mobile || '—'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-100">{fmt.currency(c.totalPurchase)}</p>
                    <p className="text-xs text-slate-500">{c.totalBills} bills</p>
                  </div>
                </div>
              ))}
        </div>
      )}

      {/* ── Low Stock ── */}
      {tab === 'low-stock' && (
        <div className="space-y-2">
          {lowStock.isLoading
            ? [...Array(4)].map((_,i) => <div key={i} className="glass rounded-2xl p-4"><div className="skeleton h-4 w-3/4 rounded" /></div>)
            : (lowStock.data || []).length === 0
            ? <div className="glass rounded-2xl p-10 text-center text-slate-500">All stock levels OK ✓</div>
            : (lowStock.data || []).map(p => (
                <div key={p._id} className="glass rounded-2xl p-4 flex items-center gap-3">
                  <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{p.name}</p>
                    <code className="text-xs text-brand-400">{p.sku}</code>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-amber-400">{p.stockQty}</p>
                    <p className="text-xs text-slate-500">min {p.minStockLevel} {p.unit}</p>
                  </div>
                </div>
              ))}
        </div>
      )}

      {/* ── Profit ── */}
      {tab === 'profit' && (
        <div className="space-y-3">
          {profit.isLoading
            ? <div className="skeleton h-32 rounded-2xl" />
            : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Revenue', value: fmt.currency(profit.data?.revenue || 0), color: 'from-brand-500 to-purple-600' },
                    { label: 'Cost',    value: fmt.currency(profit.data?.cost    || 0), color: 'from-rose-500 to-pink-600' },
                    { label: 'Profit',  value: fmt.currency(profit.data?.profit  || 0), color: 'from-emerald-500 to-teal-600', sub: `Margin ${((profit.data?.marginPct || 0)).toFixed(1)}%` },
                  ].map((s, i) => (
                    <div key={i} className="stat-card py-3 px-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
                      <p className={`text-lg font-display font-bold mt-1 bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
                      {s.sub && <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>}
                    </div>
                  ))}
                </div>
                <div className="glass rounded-2xl p-4">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={[{ name: 'Summary', Revenue: profit.data?.revenue || 0, Cost: profit.data?.cost || 0, Profit: profit.data?.profit || 0 }]}>
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Revenue" fill="#6366f1" radius={[4,4,0,0]} />
                      <Bar dataKey="Cost"    fill="#f43f5e" radius={[4,4,0,0]} />
                      <Bar dataKey="Profit"  fill="#10b981" radius={[4,4,0,0]} />
                      <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
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
