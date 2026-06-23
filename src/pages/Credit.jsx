import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { creditAPI } from '../services'
import { fmt } from '../lib/utils'
import {
  CreditCard, Phone, MapPin, ChevronDown, ChevronUp,
  CheckCircle2, IndianRupee, Clock, AlertCircle,
  Banknote, Receipt, TrendingDown, Users
} from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import SearchInput from '../components/ui/SearchInput'
import Pagination from '../components/ui/Pagination'

// ─── Individual bill row inside expanded customer ─────────────────────────
function BillRow({ bill, onMarkPaid, onAddPayment, marking, paying }) {
  const [showPay, setShowPay] = useState(false)
  const [payAmt,  setPayAmt]  = useState('')

  const handlePay = () => {
    const n = Number(payAmt)
    if (!n || n <= 0) return toast.error('Enter a valid amount')
    if (n > bill.dueAmount) return toast.error(`Max payable: ${fmt.currency(bill.dueAmount)}`)
    onAddPayment(bill.source, bill._id, n)
    setPayAmt('')
    setShowPay(false)
  }

  return (
    <div className="glass-dark rounded-xl p-4 space-y-3">
      {/* Bill header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-xs font-semibold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-lg">
              {bill.billNo}
            </code>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              bill.source === 'custom-bill'
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
            }`}>
              {bill.source === 'custom-bill' ? 'Custom' : 'Bill'}
            </span>
            <span className="badge badge-info text-xs">{bill.paymentMode}</span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock size={10} />
            {new Date(bill.createdAt).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>

        {/* Amount summary */}
        <div className="text-right flex-shrink-0 space-y-0.5">
          <p className="text-xs text-slate-500">
            Total: <span className="text-slate-300 font-semibold">{fmt.currency(bill.grandTotal)}</span>
          </p>
          <p className="text-xs text-emerald-400">
            Paid: {fmt.currency(bill.paidAmount)}
          </p>
          <p className="text-sm font-bold text-rose-400">
            Due: {fmt.currency(bill.dueAmount)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            style={{ width: `${Math.min(100, (bill.paidAmount / bill.grandTotal) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-600">
          {Math.round((bill.paidAmount / bill.grandTotal) * 100)}% paid
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onMarkPaid(bill.source, bill._id)}
          disabled={marking}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
            bg-emerald-500/10 text-emerald-400 border border-emerald-500/20
            hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle2 size={12} />
          {marking ? 'Saving…' : 'Mark Fully Paid'}
        </button>

        <button
          onClick={() => setShowPay(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
            bg-brand-500/10 text-brand-400 border border-brand-500/20
            hover:bg-brand-500/20 hover:border-brand-500/40 transition-all"
        >
          <IndianRupee size={12} />
          Add Payment
        </button>
      </div>

      {/* Inline partial payment */}
      {showPay && (
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
            <input
              type="number"
              min="1"
              step="0.01"
              max={bill.dueAmount}
              value={payAmt}
              onChange={e => setPayAmt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePay()}
              placeholder={`Max ${fmt.currency(bill.dueAmount)}`}
              className="glass-input rounded-xl pl-7 pr-3 py-2 text-sm w-full text-right"
              autoFocus
            />
          </div>
          <Button size="sm" onClick={handlePay} loading={paying}>
            <Banknote size={13} /><span>Pay</span>
          </Button>
          <button
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all text-sm"
            onClick={() => { setShowPay(false); setPayAmt('') }}
          >✕</button>
        </div>
      )}
    </div>
  )
}

// ─── Customer credit card ─────────────────────────────────────────────────
function CustomerCard({ customer, onMarkPaid, onAddPayment, markingId, payingId }) {
  const [expanded, setExpanded] = useState(false)
  const paidPct = customer.totalBilled > 0
    ? Math.round((customer.totalPaid / customer.totalBilled) * 100)
    : 0

  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors">
      {/* Customer header — click to expand */}
      <button
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/2 transition-colors text-left"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Avatar */}
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500/25 to-orange-500/25
          border border-rose-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-rose-300 font-bold text-base">
            {(customer.name || '?')[0].toUpperCase()}
          </span>
        </div>

        {/* Name + contact */}
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-slate-100 text-sm truncate">{customer.name || 'Walk-in Customer'}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {customer.mobile && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Phone size={10} />{customer.mobile}
              </span>
            )}
            {customer.address && (
              <span className="text-xs text-slate-500 flex items-center gap-1 truncate max-w-xs">
                <MapPin size={10} />{customer.address}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-0.5">Billed</p>
            <p className="text-sm font-semibold text-slate-300">{fmt.currency(customer.totalBilled)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-0.5">Paid</p>
            <p className="text-sm font-semibold text-emerald-400">{fmt.currency(customer.totalPaid)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-0.5">Outstanding</p>
            <p className="text-lg font-display font-bold text-rose-400">{fmt.currency(customer.totalDue)}</p>
          </div>
        </div>

        {/* Mobile: just show due */}
        <div className="sm:hidden text-right flex-shrink-0">
          <p className="text-xs text-slate-500 mb-0.5">Due</p>
          <p className="text-base font-bold text-rose-400">{fmt.currency(customer.totalDue)}</p>
        </div>

        <div className="text-slate-500 flex-shrink-0 ml-1">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {/* Progress bar under header */}
      <div className="px-5 pb-1">
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
            style={{ width: `${paidPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-600 mt-1">{paidPct}% of total billed paid</p>
      </div>

      {/* Expanded: pending bills */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 space-y-3 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={12} className="text-rose-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {customer.bills.length} Pending Bill{customer.bills.length !== 1 ? 's' : ''}
            </p>
          </div>
          {customer.bills.map(bill => (
            <BillRow
              key={`${bill.source}-${bill._id}`}
              bill={bill}
              onMarkPaid={onMarkPaid}
              onAddPayment={onAddPayment}
              marking={markingId === `${bill.source}-${bill._id}`}
              paying={payingId === `${bill.source}-${bill._id}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Credit Ledger page ──────────────────────────────────────────────
export default function Credit() {
  const qc = useQueryClient()
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const [markingId, setMarkingId] = useState(null)
  const [payingId,  setPayingId]  = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['credit', page, search],
    queryFn:  () => creditAPI.list({ page, limit: 20, search }).then(r => r.data),
    keepPreviousData: true,
  })

  const markPaidMut = useMutation({
    mutationFn: ({ source, id }) => creditAPI.markPaid(source, id),
    onMutate:   ({ source, id }) => setMarkingId(`${source}-${id}`),
    onSettled:  ()               => setMarkingId(null),
    onSuccess:  () => { qc.invalidateQueries(['credit']); toast.success('Marked as fully paid ✓') },
    onError:    () => toast.error('Failed to update'),
  })

  const addPayMut = useMutation({
    mutationFn: ({ source, id, amount }) => creditAPI.addPayment(source, id, amount),
    onMutate:   ({ source, id }) => setPayingId(`${source}-${id}`),
    onSettled:  ()               => setPayingId(null),
    onSuccess:  () => { qc.invalidateQueries(['credit']); toast.success('Payment recorded ✓') },
    onError:    () => toast.error('Failed to record payment'),
  })

  const customers  = data?.data          || []
  const pagination = data?.meta?.pagination

  const totalDue    = customers.reduce((s, c) => s + c.totalDue,    0)
  const totalBilled = customers.reduce((s, c) => s + c.totalBilled, 0)
  const totalPaid   = customers.reduce((s, c) => s + c.totalPaid,   0)

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* ── Page header ── */}
      <div>
        <h1 className="page-title gradient-text">Credit Ledger</h1>
        <p className="text-slate-500 text-xs mt-0.5">
          Customers with pending due amounts — track and collect payments
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card animate-fadeInUp stagger-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Total Outstanding
              </p>
              <p className="text-2xl font-display font-bold text-rose-400 truncate">
                {isLoading ? '—' : fmt.currency(totalDue)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                across {pagination?.total || 0} customer{pagination?.total !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center flex-shrink-0">
              <TrendingDown size={18} className="text-white" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-rose-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>Needs collection</span>
          </div>
        </div>

        <div className="stat-card animate-fadeInUp stagger-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Customers with Due
              </p>
              <p className="text-2xl font-display font-bold text-slate-100 truncate">
                {isLoading ? '—' : pagination?.total || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">pending accounts</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Users size={18} className="text-white" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-brand-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span>Live</span>
          </div>
        </div>

        <div className="stat-card animate-fadeInUp stagger-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Total Collected
              </p>
              <p className="text-2xl font-display font-bold text-emerald-400 truncate">
                {isLoading ? '—' : fmt.currency(totalPaid)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                of {fmt.currency(totalBilled)} billed
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <Banknote size={18} className="text-white" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Recovered amount</span>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="glass rounded-2xl p-3">
        <SearchInput
          value={search}
          onChange={v => { setSearch(v); setPage(1) }}
          placeholder="Search by customer name or mobile…"
        />
      </div>

      {/* ── Customer list ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-4">
                <div className="skeleton w-11 h-11 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/3 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
                <div className="skeleton h-6 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-emerald-400" />
          </div>
          <p className="font-semibold text-slate-300 text-lg">All Clear!</p>
          <p className="text-slate-500 text-sm mt-1">
            {search ? 'No customers match your search.' : 'No pending dues — all bills are fully paid 🎉'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map(customer => (
            <CustomerCard
              key={customer.mobile || customer.name}
              customer={customer}
              onMarkPaid={(source, id)           => markPaidMut.mutate({ source, id })}
              onAddPayment={(source, id, amount) => addPayMut.mutate({ source, id, amount })}
              markingId={markingId}
              payingId={payingId}
            />
          ))}
        </div>
      )}

      <Pagination meta={pagination} onPageChange={setPage} />
    </div>
  )
}
