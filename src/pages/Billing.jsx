import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billsAPI, settingsAPI } from '../services'
import { fmt, calcItemAmounts, calcBillTotals, gstRates, paymentModes } from '../lib/utils'
import { Plus, Eye, FileDown, Receipt, Trash2, User, Phone, MapPin, Hash, QrCode } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import SearchInput from '../components/ui/SearchInput'
import Pagination from '../components/ui/Pagination'
import { Table, Th, Td } from '../components/ui/Table'
import { TableSkeleton } from '../components/ui/Skeleton'
import ProductSearchInput from '../components/billing/ProductSearchInput'
import UpiQR from '../components/ui/UpiQR'
import ConfirmDialog from '../components/ui/ConfirmDialog'

// ── Bill Form ──────────────────────────────────────
function BillForm({ onSubmit, loading }) {
  const { register, control, handleSubmit, watch } = useForm({
    defaultValues: {
      type: 'GST', paymentMode: 'CASH', overallDiscount: 0, items: [],
      customerName: '', customerMobile: '', customerAddress: '', customerGst: '',
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const type            = watch('type')
  const overallDiscount = Number(watch('overallDiscount') || 0)
  const items           = watch('items') || []
  const isGst           = type === 'GST'
  const addedIds        = fields.map(f => f.productId)

  const processedItems = items.map(i => ({
    ...i,
    ...calcItemAmounts({
      quantity: Number(i.quantity) || 0, rate: Number(i.rate) || 0,
      discountPercentage: Number(i.discountPercentage) || 0,
      gstRate: isGst ? (Number(i.gstRate) || 0) : 0,
    }),
  }))
  const totals     = calcBillTotals(processedItems, overallDiscount)
  const roundOff   = Math.round(totals.grandTotal) - totals.grandTotal
  const grandTotal = Math.round(totals.grandTotal)

  const addProduct = (p) => append({
    productId: p._id, productName: p.name, sku: p.sku, unit: p.unit || 'PCS',
    quantity: 1, rate: p.sellingPrice, discountPercentage: 0, gstRate: p.gstRate || 0,
  })

  const handleSubmitForm = (data) => {
    onSubmit({
      type: data.type, paymentMode: data.paymentMode,
      overallDiscount: Number(data.overallDiscount) || 0,
      paidAmount: data.paidAmount ? Number(data.paidAmount) : grandTotal,
      notes: data.notes,
      customerSnapshot: {
        name: data.customerName || 'Walk-in Customer',
        mobile: data.customerMobile || '',
        gstNumber: data.customerGst || '',
        address: data.customerAddress || '',
      },
      items: items.map(item => ({
        productId: item.productId, quantity: Number(item.quantity),
        rate: Number(item.rate), discountPercentage: Number(item.discountPercentage) || 0,
        gstRate: isGst ? Number(item.gstRate) : 0, productName: item.productName,
      })),
    })
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
      {/* Type + Payment */}
      <div className="grid grid-cols-2 gap-3">
        <Select label="Bill Type *" {...register('type')}>
          <option value="GST">GST Bill</option>
          <option value="NON_GST">Non-GST Bill</option>
        </Select>
        <Select label="Payment" {...register('paymentMode')}>
          {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
        </Select>
      </div>

      {/* Customer */}
      <div className="glass-dark rounded-2xl p-3 space-y-3">
        <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <User size={13} className="text-brand-400" /> Customer Details
          <span className="text-slate-600 font-normal">(optional)</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input className="glass-input rounded-xl px-3 py-2.5 text-sm" placeholder="Customer Name" {...register('customerName')} />
          <input className="glass-input rounded-xl px-3 py-2.5 text-sm" placeholder="Mobile" maxLength={10} {...register('customerMobile')} />
        </div>
        <input className="glass-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="Address (optional)" {...register('customerAddress')} />
        {isGst && (
          <input className="glass-input w-full rounded-xl px-3 py-2.5 text-sm uppercase" placeholder="GST Number" maxLength={15} {...register('customerGst')} />
        )}
      </div>

      {/* Products */}
      <div>
        <label className="form-label">Add Products *</label>
        <ProductSearchInput onSelect={addProduct} excludeIds={addedIds} />
      </div>

      {/* Items */}
      {fields.length > 0 ? (
        <div className="space-y-2">
          {fields.map((field, idx) => {
            const calc = calcItemAmounts({
              quantity: Number(watch(`items.${idx}.quantity`)) || 0,
              rate: Number(watch(`items.${idx}.rate`)) || 0,
              discountPercentage: Number(watch(`items.${idx}.discountPercentage`)) || 0,
              gstRate: isGst ? (Number(watch(`items.${idx}.gstRate`)) || 0) : 0,
            })
            return (
              <div key={field.id} className="glass-dark rounded-xl p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{watch(`items.${idx}.productName`)}</p>
                    <p className="text-xs text-slate-500">{watch(`items.${idx}.sku`)}</p>
                  </div>
                  <button type="button" className="btn-icon w-7 h-7 text-slate-600 hover:text-rose-400 flex-shrink-0" onClick={() => remove(idx)}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <div>
                    <label className="text-xs text-slate-500">Qty</label>
                    <input type="number" min="1" className="glass-input rounded-lg px-2 py-1.5 text-xs w-full text-right mt-0.5"
                      {...register(`items.${idx}.quantity`, { valueAsNumber: true })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Rate</label>
                    <input type="number" step="0.01" className="glass-input rounded-lg px-2 py-1.5 text-xs w-full text-right mt-0.5"
                      {...register(`items.${idx}.rate`, { valueAsNumber: true })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Disc%</label>
                    <input type="number" min="0" max="100" className="glass-input rounded-lg px-2 py-1.5 text-xs w-full text-right mt-0.5"
                      {...register(`items.${idx}.discountPercentage`, { valueAsNumber: true })} />
                  </div>
                  {isGst ? (
                    <div>
                      <label className="text-xs text-slate-500">CGST%+SGST%</label>
                      <select className="glass-input rounded-lg px-1 py-1.5 text-xs w-full mt-0.5"
                        {...register(`items.${idx}.gstRate`, { valueAsNumber: true })}>
                        {[0,3,5,6,9,12,14,18,28].map(r => <option key={r} value={r}>{r/2}+{r/2}%</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-end justify-center pb-1">
                      <span className="text-xs text-slate-600">No GST</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-2">
                  <p className="text-sm font-bold text-slate-100">{fmt.currency(calc.totalAmount)}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass-dark rounded-xl p-6 text-center text-slate-500 text-sm">
          <Receipt size={24} className="mx-auto mb-2 opacity-30" />
          Search and add products above
        </div>
      )}

      {/* Totals */}
      {fields.length > 0 && (
        <div className="glass-dark rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 flex-1">Overall Discount %</span>
            <input type="number" min="0" max="100" step="0.01"
              className="glass-input rounded-xl px-3 py-2 text-sm w-20 text-right"
              {...register('overallDiscount', { valueAsNumber: true })} />
          </div>
          <div className="glass-divider" />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{fmt.currency(totals.subtotal)}</span></div>
            {totals.overallDiscountAmount > 0 && (
              <div className="flex justify-between text-rose-400"><span>Discount ({overallDiscount}%)</span><span>-{fmt.currency(totals.overallDiscountAmount)}</span></div>
            )}
            {isGst && totals.gstAmount > 0 && (
              <>
                <div className="flex justify-between text-slate-400"><span>CGST</span><span>{fmt.currency(totals.gstAmount / 2)}</span></div>
                <div className="flex justify-between text-slate-400"><span>SGST</span><span>{fmt.currency(totals.gstAmount / 2)}</span></div>
              </>
            )}
            {roundOff !== 0 && <div className="flex justify-between text-slate-500 text-xs"><span>Round Off</span><span>{roundOff > 0 ? '+' : ''}{fmt.currency(roundOff)}</span></div>}
            <div className="flex justify-between items-center pt-2 border-t border-white/8">
              <span className="font-display font-bold text-slate-100">Grand Total</span>
              <span className="text-xl font-display font-black gradient-text">{fmt.currency(grandTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {fields.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="Paid ₹" type="number" step="0.01" placeholder={String(grandTotal)} {...register('paidAmount', { valueAsNumber: true })} />
          <Input label="Notes" placeholder="Optional…" {...register('notes')} />
        </div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" loading={loading} disabled={fields.length === 0} size="lg">
          <Receipt size={16} /><span>Generate Bill</span>
        </Button>
      </div>
    </form>
  )
}

// ── Bill View ──────────────────────────────────────
function BillView({ bill, shopSettings }) {
  const snap = bill?.customerSnapshot || {}
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-dark rounded-xl p-3 space-y-1">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Bill</p>
          <p className="text-xs text-slate-300"><span className="text-slate-500">No: </span><code className="text-brand-400">{bill.billNo}</code></p>
          <p className="text-xs text-slate-300"><span className="text-slate-500">Date: </span>{fmt.date(bill.createdAt)}</p>
          <p className="text-xs text-slate-300"><span className="text-slate-500">Pay: </span>{bill.paymentMode}</p>
          <Badge status={bill.type} />
        </div>
        <div className="glass-dark rounded-xl p-3 space-y-1">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Customer</p>
          <p className="text-sm font-semibold text-slate-200">{snap.name || 'Walk-in'}</p>
          {snap.mobile    && <p className="text-xs text-slate-400">📞 {snap.mobile}</p>}
          {snap.gstNumber && <p className="text-xs text-emerald-400">GST: {snap.gstNumber}</p>}
          {snap.address   && <p className="text-xs text-slate-500 truncate">📍 {snap.address}</p>}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {bill.items?.map((item, i) => (
          <div key={i} className="glass-dark rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200 truncate">{item.productName}</p>
              <p className="text-xs text-slate-500">{item.sku} · {item.quantity} {item.unit} × {fmt.currency(item.rate)}</p>
              {item.discountPercentage > 0 && <p className="text-xs text-rose-400">Disc: {item.discountPercentage}%</p>}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-slate-100">{fmt.currency(item.totalAmount)}</p>
              {item.gstRate > 0 && <p className="text-xs text-slate-500">GST {item.gstRate}%</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="glass-dark rounded-xl p-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{fmt.currency(bill.subtotal)}</span></div>
        {bill.gstAmount > 0 && (
          <>
            <div className="flex justify-between text-slate-400"><span>CGST</span><span>{fmt.currency(bill.gstAmount / 2)}</span></div>
            <div className="flex justify-between text-slate-400"><span>SGST</span><span>{fmt.currency(bill.gstAmount / 2)}</span></div>
          </>
        )}
        {bill.overallDiscountAmount > 0 && <div className="flex justify-between text-rose-400"><span>Discount</span><span>-{fmt.currency(bill.overallDiscountAmount)}</span></div>}
        <div className="flex justify-between font-bold text-slate-100 text-base border-t border-white/5 pt-2">
          <span>Grand Total</span><span className="gradient-text">{fmt.currency(bill.grandTotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-500"><span>Paid</span><span>{fmt.currency(bill.paidAmount)}</span></div>
        {bill.dueAmount > 0 && <div className="flex justify-between text-xs text-rose-400 font-semibold"><span>Due</span><span>{fmt.currency(bill.dueAmount)}</span></div>}
      </div>

      {/* UPI QR */}
      {shopSettings?.upiId && (
        <div className="glass-dark rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <QrCode size={15} className="text-brand-400" />
            <p className="text-sm font-semibold text-slate-300">Pay via UPI</p>
          </div>
          <div className="flex justify-center">
            <UpiQR upiId={shopSettings.upiId} name={shopSettings.shopName}
              amount={bill.dueAmount > 0 ? bill.dueAmount : bill.grandTotal}
              note={`Payment for ${bill.billNo}`} size={150} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Bill Card (mobile list) ───────────────────────
function BillCard({ bill, onView, onPdf, onDelete }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <code className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">{bill.billNo}</code>
          <p className="text-sm font-semibold text-slate-200 mt-1.5 truncate">
            {bill.customerSnapshot?.name || 'Walk-in'}
          </p>
          {bill.customerSnapshot?.mobile && (
            <p className="text-xs text-slate-500">📞 {bill.customerSnapshot.mobile}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold text-slate-100">{fmt.currency(bill.grandTotal)}</p>
          <Badge status={bill.type} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="badge badge-info text-xs">{bill.paymentMode}</span>
          {bill.dueAmount > 0
            ? <span className="text-xs text-rose-400 font-medium">Due {fmt.currency(bill.dueAmount)}</span>
            : <span className="text-xs text-emerald-400">Paid</span>}
        </div>
        <div className="flex gap-1.5">
          <button className="btn-icon w-8 h-8" onClick={() => onView(bill._id)}><Eye size={13} /></button>
          <button className="btn-icon w-8 h-8" onClick={() => onPdf(bill._id)}><FileDown size={13} /></button>
          <button className="btn-icon w-8 h-8 hover:text-rose-400" onClick={() => onDelete(bill._id)}><Trash2 size={13} /></button>
        </div>
      </div>
      <p className="text-xs text-slate-600 mt-2">{fmt.date(bill.createdAt)}</p>
    </div>
  )
}

// ── Main ──────────────────────────────────────────
export default function Billing() {
  const qc = useQueryClient()
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [viewId, setViewId]         = useState(null)
  const [deleteId, setDeleteId]     = useState(null)
  const isMobile = window.innerWidth < 768

  const { data, isLoading } = useQuery({
    queryKey: ['bills', page, search, typeFilter],
    queryFn: () => billsAPI.list({ page, limit: 20, search, type: typeFilter }).then(r => r.data),
    keepPreviousData: true,
  })

  const { data: billDetail } = useQuery({
    queryKey: ['bill', viewId],
    queryFn: () => billsAPI.getById(viewId).then(r => r.data.data),
    enabled: !!viewId,
  })

  const { data: shopSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.get().then(r => r.data.data),
  })

  const createMut = useMutation({
    mutationFn: billsAPI.create,
    onSuccess: () => { qc.invalidateQueries(['bills']); qc.invalidateQueries(['products']); qc.invalidateQueries(['dashboard']); setShowCreate(false); toast.success('Bill created!') },
  })

  const deleteMut = useMutation({
    mutationFn: billsAPI.delete,
    onSuccess: () => {
      qc.invalidateQueries(['bills'])
      qc.invalidateQueries(['dashboard'])
      setDeleteId(null)
      toast.success('Bill deleted')
    },
  })

  const pdfMut = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/bills/${id}/generate-pdf`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('PDF failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `bill-${id}.pdf`; a.click()
      URL.revokeObjectURL(url)
    },
    onSuccess: () => toast.success('PDF downloaded'),
    onError: () => toast.error('PDF generation failed'),
  })

  const bills      = data?.data          || []
  const pagination = data?.meta?.pagination

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="page-title gradient-text">Billing</h1>
          <p className="text-slate-500 text-xs mt-0.5">{pagination?.total || 0} total bills</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /><span>New Bill</span>
        </Button>
      </div>

      {/* Stats — 2×2 on mobile */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Bills',  value: fmt.number(pagination?.total || 0),  color: 'from-brand-500 to-purple-600' },
          { label: 'This Page',    value: fmt.number(bills.length),             color: 'from-cyan-500 to-blue-600'   },
          { label: 'GST Bills',    value: fmt.number(bills.filter(b => b.type === 'GST').length),    color: 'from-emerald-500 to-teal-600' },
          { label: 'Non-GST',      value: fmt.number(bills.filter(b => b.type === 'NON_GST').length), color: 'from-amber-500 to-orange-600' },
        ].map((s, i) => (
          <div key={i} className="stat-card py-3 px-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-display font-bold mt-1 bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-3 flex gap-2">
        <div className="flex-1">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search bill, customer…" />
        </div>
        <select className="glass-input rounded-xl px-3 py-2 text-sm flex-shrink-0" style={{ minWidth: 0, maxWidth: 120 }}
          value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}>
          <option value="">All</option>
          <option value="GST">GST</option>
          <option value="NON_GST">Non-GST</option>
        </select>
      </div>

      {/* Mobile cards / Desktop table */}
      {isMobile ? (
        <div className="space-y-3">
          {isLoading
            ? [...Array(3)].map((_, i) => <div key={i} className="glass rounded-2xl p-4 space-y-3"><div className="skeleton h-5 w-3/4 rounded" /><div className="skeleton h-4 w-1/2 rounded" /></div>)
            : bills.length === 0
            ? <div className="glass rounded-2xl p-12 text-center"><Receipt size={32} className="mx-auto mb-3 text-slate-700" /><p className="text-slate-500">No bills yet</p></div>
            : bills.map(b => <BillCard key={b._id} bill={b} onView={setViewId} onPdf={(id) => pdfMut.mutate(id)} onDelete={setDeleteId} />)}
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <Table>
            <thead><tr>
              <Th>Bill No</Th><Th>Type</Th><Th>Customer</Th><Th>Mobile</Th>
              <Th>Payment</Th><Th className="text-right">Amount</Th>
              <Th className="text-right">Due</Th><Th>Date</Th><Th className="text-right">Actions</Th>
            </tr></thead>
            {isLoading ? <TableSkeleton cols={9} /> : (
              <tbody>
                {bills.map(b => (
                  <tr key={b._id}>
                    <Td><code className="text-xs text-brand-400">{b.billNo}</code></Td>
                    <Td><Badge status={b.type} /></Td>
                    <Td><p className="text-sm text-slate-300">{b.customerSnapshot?.name || 'Walk-in'}</p></Td>
                    <Td><span className="text-slate-400 text-sm">{b.customerSnapshot?.mobile || '—'}</span></Td>
                    <Td><span className="badge badge-info text-xs">{b.paymentMode}</span></Td>
                    <Td className="text-right font-semibold text-slate-100">{fmt.currency(b.grandTotal)}</Td>
                    <Td className="text-right">{b.dueAmount > 0 ? <span className="text-rose-400 font-medium text-sm">{fmt.currency(b.dueAmount)}</span> : <span className="text-emerald-400 text-xs">Paid</span>}</Td>
                    <Td><span className="text-slate-500 text-xs">{fmt.date(b.createdAt)}</span></Td>
                    <Td>
                      <div className="flex justify-end gap-1.5">
                        <button className="btn-icon" onClick={() => setViewId(b._id)}><Eye size={13} /></button>
                        <button className="btn-icon" onClick={() => pdfMut.mutate(b._id)}><FileDown size={13} /></button>
                        <button className="btn-icon hover:text-rose-400" onClick={() => setDeleteId(b._id)}><Trash2 size={13} /></button>
                      </div>
                    </Td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-12 text-slate-500"><Receipt size={32} className="mx-auto mb-2 opacity-30" />No bills found</td></tr>
                )}
              </tbody>
            )}
          </Table>
          <div className="px-4 py-3"><Pagination meta={pagination} onPageChange={setPage} /></div>
        </div>
      )}

      {isMobile && <Pagination meta={pagination} onPageChange={setPage} />}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Bill" size="xl">
        <BillForm onSubmit={createMut.mutate} loading={createMut.isPending} />
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewId} onClose={() => setViewId(null)} title={billDetail ? `Bill – ${billDetail.billNo}` : 'Loading…'} size="lg">
        {billDetail && (
          <>
            <BillView bill={billDetail} shopSettings={shopSettings} />
            <div className="flex justify-end mt-4 pt-4 border-t border-white/5">
              <Button variant="secondary" size="sm" onClick={() => pdfMut.mutate(viewId)} loading={pdfMut.isPending}>
                <FileDown size={15} /><span>Download PDF</span>
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete Bill Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
        title="Delete Bill"
        message="Are you sure you want to delete this bill? Stock will NOT be restored automatically. This action cannot be undone."
        confirmLabel="Delete Bill"
        danger
      />
    </div>
  )
}
