import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billsAPI } from '../services'
import { fmt, calcItemAmounts, calcBillTotals, gstRates, paymentModes } from '../lib/utils'
import { Plus, Eye, FileDown, Receipt, Trash2, User, Phone, MapPin, Hash } from 'lucide-react'
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

// ── Bill Creation Form ────────────────────────────────────────────────────
function BillForm({ onSubmit, loading }) {
  const { register, control, handleSubmit, watch, setValue } = useForm({
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
      quantity:           Number(i.quantity)           || 0,
      rate:               Number(i.rate)               || 0,
      discountPercentage: Number(i.discountPercentage) || 0,
      gstRate:            isGst ? (Number(i.gstRate)   || 0) : 0,
    }),
  }))

  const totals     = calcBillTotals(processedItems, overallDiscount)
  const roundOff   = Math.round(totals.grandTotal) - totals.grandTotal
  const grandTotal = Math.round(totals.grandTotal)

  const addProduct = (p) => {
    append({
      productId: p._id, productName: p.name,
      sku: p.sku, unit: p.unit || 'PCS',
      quantity: 1, rate: p.sellingPrice,
      discountPercentage: 0, gstRate: p.gstRate || 18,
    })
  }

  const handleSubmitForm = (data) => {
    const payload = {
      type:            data.type,
      paymentMode:     data.paymentMode,
      overallDiscount: Number(data.overallDiscount) || 0,
      paidAmount:      data.paidAmount ? Number(data.paidAmount) : grandTotal,
      notes:           data.notes,
      // Pass customer info as inline snapshot (no customerId needed)
      customerSnapshot: {
        name:      data.customerName    || 'Walk-in Customer',
        mobile:    data.customerMobile  || '',
        gstNumber: data.customerGst     || '',
        address:   data.customerAddress || '',
      },
      items: items.map(item => ({
        productId:          item.productId,
        quantity:           Number(item.quantity),
        rate:               Number(item.rate),
        discountPercentage: Number(item.discountPercentage) || 0,
        gstRate:            isGst ? Number(item.gstRate) : 0,
        productName:        item.productName,
      })),
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-5">

      {/* ── Bill Type + Payment ── */}
      <div className="grid grid-cols-2 gap-4">
        <Select label="Bill Type *" {...register('type')}>
          <option value="GST">GST Bill</option>
          <option value="NON_GST">Non-GST Bill</option>
        </Select>
        <Select label="Payment Mode" {...register('paymentMode')}>
          {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
        </Select>
      </div>

      {/* ── Customer Info (direct entry) ── */}
      <div className="glass-dark rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <User size={15} className="text-brand-400" />
          <p className="text-sm font-semibold text-slate-300">Customer Details</p>
          <span className="text-xs text-slate-600">(optional — leave blank for walk-in)</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="glass-input w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
              placeholder="Customer Name"
              {...register('customerName')}
            />
          </div>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="glass-input w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
              placeholder="Mobile Number"
              maxLength={10}
              {...register('customerMobile')}
            />
          </div>
        </div>

        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-3.5 text-slate-500" />
          <input
            className="glass-input w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
            placeholder="Address (optional)"
            {...register('customerAddress')}
          />
        </div>

        {/* Show GST field only for GST bills */}
        {isGst && (
          <div className="relative">
            <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="glass-input w-full rounded-xl pl-9 pr-4 py-2.5 text-sm uppercase"
              placeholder="GST Number (optional)"
              maxLength={15}
              {...register('customerGst')}
            />
          </div>
        )}
      </div>

      {/* ── Product Search ── */}
      <div>
        <label className="form-label">Add Products *</label>
        <ProductSearchInput onSelect={addProduct} excludeIds={addedIds} />
      </div>

      {/* ── Items Table ── */}
      {fields.length > 0 ? (
        <div className="space-y-2">
          {/* Header */}
          <div className={`grid gap-2 text-xs text-slate-500 uppercase tracking-wider px-1 ${isGst ? 'grid-cols-12' : 'grid-cols-11'}`}>
            <div className="col-span-4">Product</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-2 text-right">Rate ₹</div>
            <div className="col-span-1 text-right">Disc%</div>
            {isGst && <div className="col-span-1 text-right">GST%</div>}
            <div className="col-span-2 text-right">Total ₹</div>
            <div className="col-span-1" />
          </div>

          {/* Rows */}
          {fields.map((field, idx) => {
            const calc = calcItemAmounts({
              quantity:           Number(watch(`items.${idx}.quantity`)) || 0,
              rate:               Number(watch(`items.${idx}.rate`))     || 0,
              discountPercentage: Number(watch(`items.${idx}.discountPercentage`)) || 0,
              gstRate:            isGst ? (Number(watch(`items.${idx}.gstRate`)) || 0) : 0,
            })
            return (
              <div
                key={field.id}
                className={`grid gap-2 items-center glass-dark rounded-xl p-3 ${isGst ? 'grid-cols-12' : 'grid-cols-11'}`}
              >
                <div className="col-span-4">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {watch(`items.${idx}.productName`)}
                  </p>
                  <p className="text-xs text-slate-500">{watch(`items.${idx}.sku`)} · {watch(`items.${idx}.unit`)}</p>
                </div>

                {/* Qty */}
                <div className="col-span-1">
                  <input
                    type="number" min="1"
                    className="glass-input rounded-lg px-2 py-1.5 text-xs w-full text-right"
                    {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                  />
                </div>

                {/* Rate */}
                <div className="col-span-2">
                  <input
                    type="number" step="0.01"
                    className="glass-input rounded-lg px-2 py-1.5 text-xs w-full text-right"
                    {...register(`items.${idx}.rate`, { valueAsNumber: true })}
                  />
                </div>

                {/* Discount % */}
                <div className="col-span-1">
                  <input
                    type="number" min="0" max="100"
                    className="glass-input rounded-lg px-2 py-1.5 text-xs w-full text-right"
                    {...register(`items.${idx}.discountPercentage`, { valueAsNumber: true })}
                  />
                </div>

                {/* GST % — only for GST bills */}
                {isGst && (
                  <div className="col-span-1">
                    <select
                      className="glass-input rounded-lg px-1 py-1.5 text-xs w-full"
                      {...register(`items.${idx}.gstRate`, { valueAsNumber: true })}
                    >
                      {gstRates.map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </div>
                )}

                {/* Total */}
                <div className="col-span-2 text-right">
                  <p className="text-sm font-bold text-slate-100">{fmt.currency(calc.totalAmount)}</p>
                  {isGst && (
                    <p className="text-xs text-slate-500">
                      +GST {fmt.currency(calc.gstAmount)}
                    </p>
                  )}
                </div>

                {/* Remove */}
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    className="btn-icon text-slate-600 hover:text-rose-400"
                    onClick={() => remove(idx)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass-dark rounded-xl p-8 text-center">
          <Receipt size={28} className="mx-auto mb-2 text-slate-600" />
          <p className="text-sm text-slate-500">Search and add products above to start billing</p>
        </div>
      )}

      {/* ── Totals ── */}
      {fields.length > 0 && (
        <div className="glass-dark rounded-2xl p-5 space-y-3">
          {/* Overall discount input */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400 w-44">Overall Discount %</label>
            <input
              type="number" min="0" max="100" step="0.01"
              className="glass-input rounded-xl px-3 py-2 text-sm w-24 text-right"
              {...register('overallDiscount', { valueAsNumber: true })}
            />
          </div>

          <div className="glass-divider" />

          {/* Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>{fmt.currency(totals.subtotal)}</span>
            </div>

            {totals.overallDiscountAmount > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>Discount ({overallDiscount}%)</span>
                <span>- {fmt.currency(totals.overallDiscountAmount)}</span>
              </div>
            )}

            {isGst && totals.gstAmount > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>GST Amount</span>
                <span>{fmt.currency(totals.gstAmount)}</span>
              </div>
            )}

            {roundOff !== 0 && (
              <div className="flex justify-between text-slate-500 text-xs">
                <span>Round Off</span>
                <span>{roundOff > 0 ? '+' : ''}{fmt.currency(roundOff)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-white/8">
              <span className="text-lg font-display font-bold text-slate-100">Grand Total</span>
              <span className="text-2xl font-display font-black gradient-text">
                {fmt.currency(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Paid amount + Notes ── */}
      {fields.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Amount Paid ₹"
            type="number"
            step="0.01"
            placeholder={String(grandTotal)}
            {...register('paidAmount', { valueAsNumber: true })}
          />
          <Input
            label="Notes (optional)"
            placeholder="Any remarks…"
            {...register('notes')}
          />
        </div>
      )}

      {/* ── Submit ── */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          loading={loading}
          disabled={fields.length === 0}
          size="lg"
        >
          <Receipt size={16} />
          <span>Generate Bill</span>
        </Button>
      </div>
    </form>
  )
}

// ── Bill View (detail modal) ──────────────────────────────────────────────
function BillView({ bill }) {
  if (!bill) return null
  const snap = bill.customerSnapshot || {}

  return (
    <div className="space-y-4">
      {/* Info row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-dark rounded-xl p-4 space-y-1.5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Bill Details</p>
          <p className="text-sm text-slate-300">
            <span className="text-slate-500">No: </span>
            <code className="text-brand-400">{bill.billNo}</code>
          </p>
          <p className="text-sm text-slate-300">
            <span className="text-slate-500">Date: </span>{fmt.date(bill.createdAt)}
          </p>
          <p className="text-sm text-slate-300">
            <span className="text-slate-500">Payment: </span>{bill.paymentMode}
          </p>
          <Badge status={bill.type} />
        </div>

        <div className="glass-dark rounded-xl p-4 space-y-1.5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Customer</p>
          <p className="text-sm font-semibold text-slate-200">{snap.name || 'Walk-in Customer'}</p>
          {snap.mobile    && <p className="text-xs text-slate-400">📞 {snap.mobile}</p>}
          {snap.gstNumber && <p className="text-xs text-emerald-400">GST: {snap.gstNumber}</p>}
          {snap.address   && <p className="text-xs text-slate-500">📍 {snap.address}</p>}
        </div>
      </div>

      {/* Items table */}
      <div className="glass-dark rounded-xl overflow-hidden">
        <table className="glass-table w-full text-xs">
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Product</Th>
              <Th className="text-right">Qty</Th>
              <Th className="text-right">Rate</Th>
              <Th className="text-right">Disc%</Th>
              <Th className="text-right">GST%</Th>
              <Th className="text-right">Amount</Th>
            </tr>
          </thead>
          <tbody>
            {bill.items?.map((item, i) => (
              <tr key={i}>
                <Td>{i + 1}</Td>
                <Td>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-slate-500">{item.sku}</p>
                </Td>
                <Td className="text-right">{item.quantity} {item.unit}</Td>
                <Td className="text-right">{fmt.currency(item.rate)}</Td>
                <Td className="text-right">
                  {item.discountPercentage > 0
                    ? <span className="text-rose-400">{item.discountPercentage}%</span>
                    : '—'}
                </Td>
                <Td className="text-right">{item.gstRate}%</Td>
                <Td className="text-right font-semibold">{fmt.currency(item.totalAmount)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="glass-dark rounded-xl p-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-slate-400">
          <span>Subtotal</span><span>{fmt.currency(bill.subtotal)}</span>
        </div>
        {bill.gstAmount > 0 && (
          <div className="flex justify-between text-slate-400">
            <span>GST</span><span>{fmt.currency(bill.gstAmount)}</span>
          </div>
        )}
        {bill.overallDiscountAmount > 0 && (
          <div className="flex justify-between text-rose-400">
            <span>Discount</span><span>- {fmt.currency(bill.overallDiscountAmount)}</span>
          </div>
        )}
        {bill.roundOff !== 0 && bill.roundOff !== undefined && (
          <div className="flex justify-between text-slate-500 text-xs">
            <span>Round Off</span><span>{fmt.currency(bill.roundOff)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-slate-100 text-lg border-t border-white/5 pt-2">
          <span>Grand Total</span>
          <span className="gradient-text">{fmt.currency(bill.grandTotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>Paid</span><span>{fmt.currency(bill.paidAmount)}</span>
        </div>
        {bill.dueAmount > 0 && (
          <div className="flex justify-between text-rose-400 text-xs font-semibold">
            <span>Due</span><span>{fmt.currency(bill.dueAmount)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Billing Page ─────────────────────────────────────────────────────
export default function Billing() {
  const qc = useQueryClient()
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [viewId, setViewId]         = useState(null)

  // List bills
  const { data, isLoading } = useQuery({
    queryKey: ['bills', page, search, typeFilter],
    queryFn:  () => billsAPI.list({ page, limit: 20, search, type: typeFilter }).then(r => r.data),
    keepPreviousData: true,
  })

  // View single bill
  const { data: billDetail } = useQuery({
    queryKey: ['bill', viewId],
    queryFn:  () => billsAPI.getById(viewId).then(r => r.data.data),
    enabled:  !!viewId,
  })

  // Create bill
  const createMut = useMutation({
    mutationFn: billsAPI.create,
    onSuccess: () => {
      qc.invalidateQueries(['bills'])
      qc.invalidateQueries(['products'])
      qc.invalidateQueries(['dashboard'])
      setShowCreate(false)
      toast.success('Bill generated successfully!')
    },
  })

  // PDF
  const pdfMut = useMutation({
    mutationFn: billsAPI.generatePDF,
    onSuccess:  (res) => {
      window.open(res.data.data.pdfUrl, '_blank')
      toast.success('PDF generated')
    },
  })

  const bills      = data?.data          || []
  const pagination = data?.meta?.pagination

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title gradient-text">Billing</h1>
          <p className="text-slate-500 text-sm mt-1">
            {pagination?.total || 0} total bills
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="lg">
          <Plus size={16} />
          <span>New Bill</span>
        </Button>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Bills',  value: fmt.number(pagination?.total || 0),  color: 'from-brand-500 to-purple-600' },
          { label: 'This Page',    value: fmt.number(bills.length),             color: 'from-cyan-500 to-blue-600'   },
          { label: 'GST Bills',    value: fmt.number(bills.filter(b => b.type === 'GST').length),    color: 'from-emerald-500 to-teal-600' },
          { label: 'Non-GST',      value: fmt.number(bills.filter(b => b.type === 'NON_GST').length), color: 'from-amber-500 to-orange-600' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-display font-bold mt-1 bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="glass rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <SearchInput
            value={search}
            onChange={v => { setSearch(v); setPage(1) }}
            placeholder="Search bill no, customer name, mobile…"
          />
        </div>
        <select
          className="glass-input rounded-xl px-3 py-2.5 text-sm min-w-36"
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
        >
          <option value="">All Types</option>
          <option value="GST">GST Bills</option>
          <option value="NON_GST">Non-GST Bills</option>
        </select>
      </div>

      {/* ── Bills Table ── */}
      <div className="glass rounded-2xl overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>Bill No</Th>
              <Th>Type</Th>
              <Th>Customer</Th>
              <Th>Mobile</Th>
              <Th>Payment</Th>
              <Th className="text-right">Amount</Th>
              <Th className="text-right">Due</Th>
              <Th>Date</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>

          {isLoading ? <TableSkeleton cols={9} /> : (
            <tbody>
              {bills.map(b => (
                <tr key={b._id}>
                  <Td>
                    <code className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                      {b.billNo}
                    </code>
                  </Td>
                  <Td><Badge status={b.type} /></Td>
                  <Td>
                    <p className="text-sm text-slate-300 font-medium">
                      {b.customerSnapshot?.name || 'Walk-in'}
                    </p>
                  </Td>
                  <Td>
                    <span className="text-slate-400 text-sm">
                      {b.customerSnapshot?.mobile || '—'}
                    </span>
                  </Td>
                  <Td>
                    <span className="badge badge-info text-xs">{b.paymentMode}</span>
                  </Td>
                  <Td className="text-right font-semibold text-slate-100">
                    {fmt.currency(b.grandTotal)}
                  </Td>
                  <Td className="text-right">
                    {b.dueAmount > 0
                      ? <span className="text-rose-400 font-semibold text-sm">{fmt.currency(b.dueAmount)}</span>
                      : <span className="text-emerald-400 text-xs font-medium">Paid</span>}
                  </Td>
                  <Td>
                    <span className="text-slate-500 text-xs">{fmt.date(b.createdAt)}</span>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        className="btn-icon"
                        onClick={() => setViewId(b._id)}
                        data-tooltip="View Bill"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => pdfMut.mutate(b._id)}
                        data-tooltip="Download PDF"
                      >
                        <FileDown size={13} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}

              {bills.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-14">
                    <Receipt size={36} className="mx-auto mb-3 text-slate-700" />
                    <p className="text-slate-500 font-medium">No bills yet</p>
                    <p className="text-slate-600 text-sm mt-1">Click "New Bill" to create your first bill</p>
                  </td>
                </tr>
              )}
            </tbody>
          )}
        </Table>

        <div className="px-6 py-4">
          <Pagination meta={pagination} onPageChange={setPage} />
        </div>
      </div>

      {/* ── Create Bill Modal ── */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New Bill"
        size="xl"
      >
        <BillForm onSubmit={createMut.mutate} loading={createMut.isPending} />
      </Modal>

      {/* ── View Bill Modal ── */}
      <Modal
        open={!!viewId}
        onClose={() => setViewId(null)}
        title={billDetail ? `Bill – ${billDetail.billNo}` : 'Loading…'}
        size="lg"
      >
        {billDetail && (
          <>
            <BillView bill={billDetail} />
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
              <Button variant="secondary" onClick={() => pdfMut.mutate(viewId)}>
                <FileDown size={15} />
                <span>Download PDF</span>
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
