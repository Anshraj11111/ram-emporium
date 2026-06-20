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
  { id: 'daily',              label: 'Daily'           },
  { id: 'monthly',            label: 'Monthly'         },
  { id: 'yearly',             label: 'Yearly'          },
  { id: 'day-products',       label: 'Products Today'  },
  { id: 'month-products',     label: 'Products Monthly'},
  { id: 'stock-history',      label: 'Stock History'   },
  { id: 'top-selling',        label: 'Top'             },
  { id: 'customer-wise',      label: 'Customers'       },
  { id: 'low-stock',          label: 'Low Stock'       },
  { id: 'profit',             label: 'Profit'          },
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

  // ── New: Day-wise & Month-wise product sales ──
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])

  const dayProducts = useQuery({
    queryKey: ['report-day-products', selectedDate],
    queryFn:  () => reportsAPI.dayWiseProducts({ date: selectedDate }).then(r => r.data.data),
    enabled:  tab === 'day-products',
  })

  const monthProducts = useQuery({
    queryKey: ['report-month-products', year, month],
    queryFn:  () => reportsAPI.monthWiseProducts({ year, month }).then(r => r.data.data),
    enabled:  tab === 'month-products',
  })

  // ── Stock History ──
  const [historyStart, setHistoryStart] = useState('')
  const [historyEnd,   setHistoryEnd]   = useState('')
  const [historyProduct, setHistoryProduct] = useState('')
  const [expandedProduct, setExpandedProduct] = useState(null)

  const stockHistory = useQuery({
    queryKey: ['report-stock-history', historyStart, historyEnd, historyProduct],
    queryFn:  () => reportsAPI.stockTimeline({
      startDate: historyStart || undefined,
      endDate:   historyEnd   || undefined,
      productId: historyProduct || undefined,
    }).then(r => r.data.data),
    enabled: tab === 'stock-history',
  })

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

      {(tab === 'yearly' || tab === 'month-products') && (
        <div className="glass rounded-2xl p-3 flex gap-3">
          <div>
            <label className="form-label text-xs">Year</label>
            <select className="glass-input rounded-xl px-3 py-2 text-sm w-28" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {tab === 'month-products' && (
            <div>
              <label className="form-label text-xs">Month</label>
              <select className="glass-input rounded-xl px-3 py-2 text-sm w-28" value={month} onChange={e => setMonth(Number(e.target.value))}>
                {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Stock History filters */}
      {tab === 'stock-history' && (
        <div className="glass rounded-2xl p-3 flex flex-wrap gap-3 items-end">
          <div>
            <label className="form-label text-xs">From Date</label>
            <input type="date" className="glass-input rounded-xl px-3 py-2 text-sm"
              value={historyStart} onChange={e => setHistoryStart(e.target.value)} />
          </div>
          <div>
            <label className="form-label text-xs">To Date</label>
            <input type="date" className="glass-input rounded-xl px-3 py-2 text-sm"
              value={historyEnd} onChange={e => setHistoryEnd(e.target.value)} />
          </div>
          <p className="text-xs text-slate-500 pb-1">
            Leave blank to see all movements
          </p>
        </div>
      )}

      {/* Date picker for day-wise products */}
      {tab === 'day-products' && (        <div className="glass rounded-2xl p-3 flex flex-wrap items-end gap-4">
          <div>
            <label className="form-label text-xs">Select Date</label>
            <input type="date" className="glass-input rounded-xl px-3 py-2.5 text-sm"
              value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>
          <p className="text-xs text-slate-500 pb-1.5">
            Product sales for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
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

      {/* ── Stock History ── */}
      {tab === 'stock-history' && (
        <div className="space-y-3">
          {stockHistory.isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4 space-y-2">
                <div className="skeleton h-5 w-1/2 rounded" />
                <div className="skeleton h-4 w-3/4 rounded" />
              </div>
            ))
          ) : (stockHistory.data || []).length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <AlertTriangle size={32} className="mx-auto mb-3 text-slate-600" />
              <p className="text-slate-500">No stock movements found</p>
              <p className="text-slate-600 text-xs mt-1">Try adjusting the date range</p>
            </div>
          ) : (
            <>
              {/* Summary row */}
              <div className="glass rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Products with movements</p>
                  <p className="text-2xl font-display font-bold gradient-text">{(stockHistory.data || []).length}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Total movements</p>
                  <p className="text-xl font-display font-bold text-brand-400">
                    {(stockHistory.data || []).reduce((s, p) => s + (p.movements?.length || 0), 0)}
                  </p>
                </div>
              </div>

              {/* Product cards */}
              {(stockHistory.data || []).map((product) => (
                <div key={product._id} className="glass rounded-2xl overflow-hidden">
                  {/* Product header — click to expand */}
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-white/3 transition-colors text-left"
                    onClick={() => setExpandedProduct(
                      expandedProduct === product._id ? null : product._id
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        product.currentStock < product.minStockLevel ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{product.name}</p>
                        {product.sku && <code className="text-xs text-brand-400">{product.sku}</code>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 ml-3">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Current</p>
                        <p className={`text-base font-bold ${
                          product.currentStock < product.minStockLevel ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {product.currentStock} <span className="text-xs text-slate-500">{product.unit}</span>
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Movements</p>
                        <p className="text-sm font-bold text-brand-400">{product.movements?.length || 0}</p>
                      </div>
                      <span className="text-slate-500 text-xs">
                        {expandedProduct === product._id ? '▲' : '▼'}
                      </span>
                    </div>
                  </button>

                  {/* Movement timeline — expanded */}
                  {expandedProduct === product._id && product.movements?.length > 0 && (
                    <div className="border-t border-white/5 max-h-80 overflow-y-auto">
                      {product.movements.map((m, mi) => {
                        const isPurchase  = m.type === 'PURCHASE'
                        const isSale      = m.type === 'SALE'
                        const isAdjust    = m.type === 'ADJUSTMENT'
                        const dotColor    = isPurchase ? 'bg-emerald-400' : isSale ? 'bg-rose-400' : 'bg-amber-400'
                        const qtyColor    = isPurchase ? 'text-emerald-400' : isSale ? 'text-rose-400' : 'text-amber-400'
                        const dateTime    = new Date(m.dateTime)
                        return (
                          <div key={mi} className="flex items-start gap-3 px-4 py-3 border-b border-white/4 last:border-0 hover:bg-white/2">
                            {/* Dot + line */}
                            <div className="flex flex-col items-center gap-1 flex-shrink-0 mt-1">
                              <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                              {mi < product.movements.length - 1 && (
                                <span className="w-px flex-1 bg-white/5 min-h-4" />
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-semibold text-slate-200">
                                    {isPurchase ? '📦 Purchase / Stock IN' : isSale ? '🛒 Sale / Stock OUT' : '⚙️ Adjustment'}
                                  </p>
                                  {m.remarks && <p className="text-xs text-slate-500 mt-0.5">{m.remarks}</p>}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className={`text-sm font-bold ${qtyColor}`}>
                                    {m.qty > 0 ? '+' : ''}{m.qty} {product.unit}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {m.previousStock} → {m.currentStock}
                                  </p>
                                </div>
                              </div>
                              {/* Date + Time */}
                              <p className="text-xs text-slate-600 mt-1">
                                🕐 {dateTime.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                                {' '}at{' '}
                                {dateTime.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12: true })}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Empty movements */}
                  {expandedProduct === product._id && (!product.movements || product.movements.length === 0) && (
                    <div className="px-4 py-6 text-center text-slate-500 text-xs border-t border-white/5">
                      No movements in selected date range
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Day-wise Product Sales ── */}
      {tab === 'day-products' && (
        <div className="space-y-3">
          {dayProducts.isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4"><div className="skeleton h-4 w-3/4 rounded" /></div>
            ))
          ) : (dayProducts.data || []).length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-slate-500">
              <TrendingUp size={32} className="mx-auto mb-3 opacity-20" />
              <p>No sales recorded for this date</p>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="glass rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Total Products Sold</p>
                  <p className="text-2xl font-display font-bold gradient-text">
                    {(dayProducts.data || []).reduce((s, p) => s + p.totalQty, 0)} units
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-xl font-display font-bold text-emerald-400">
                    {fmt.currency((dayProducts.data || []).reduce((s, p) => s + p.totalRev, 0))}
                  </p>
                </div>
              </div>

              {/* Product rows */}
              {(dayProducts.data || []).map((p, i) => (
                <div key={p._id || i} className="glass rounded-2xl p-4 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-brand-500/20 text-brand-400 text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{p.productName}</p>
                    {p.sku && <code className="text-xs text-brand-400">{p.sku}</code>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-slate-100">{fmt.number(p.totalQty)} <span className="text-xs text-slate-500">units</span></p>
                    <p className="text-xs text-emerald-400">{fmt.currency(p.totalRev)}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Month-wise Product Sales ── */}
      {tab === 'month-products' && (
        <div className="space-y-3">
          {monthProducts.isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4"><div className="skeleton h-4 w-3/4 rounded" /></div>
            ))
          ) : (monthProducts.data || []).length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-slate-500">
              <TrendingUp size={32} className="mx-auto mb-3 opacity-20" />
              <p>No sales recorded for {months[month - 1]} {year}</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="glass rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{months[month-1]} {year} — Total Products</p>
                  <p className="text-2xl font-display font-bold gradient-text">
                    {(monthProducts.data || []).reduce((s, p) => s + p.totalQty, 0)} units
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-xl font-display font-bold text-emerald-400">
                    {fmt.currency((monthProducts.data || []).reduce((s, p) => s + p.totalRev, 0))}
                  </p>
                </div>
              </div>

              {/* Product cards with day breakdown */}
              {(monthProducts.data || []).map((p, i) => (
                <div key={p._id || i} className="glass rounded-2xl overflow-hidden">
                  {/* Product header */}
                  <div className="flex items-center gap-3 p-4 border-b border-white/5">
                    <span className="w-7 h-7 rounded-xl bg-brand-500/20 text-brand-400 text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{p.productName}</p>
                      {p.sku && <code className="text-xs text-brand-400">{p.sku}</code>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-slate-100">{fmt.number(p.totalQty)} <span className="text-xs text-slate-500">units</span></p>
                      <p className="text-xs text-emerald-400">{fmt.currency(p.totalRev)}</p>
                    </div>
                  </div>

                  {/* Day-by-day breakdown */}
                  {p.dailyBreakdown && p.dailyBreakdown.length > 0 && (
                    <div className="p-3 grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {p.dailyBreakdown.map((d, di) => (
                        <div key={di} className="glass-dark rounded-lg p-2 text-center">
                          <p className="text-xs text-slate-500">Day {d.day}</p>
                          <p className="text-xs font-bold text-slate-200">{d.totalQty} <span className="text-slate-600">u</span></p>
                          <p className="text-xs text-emerald-400">{fmt.currency(d.totalRev)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

    </div>
  )
}
