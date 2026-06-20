import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customBillsAPI } from '../services'
import { fmt, paymentModes } from '../lib/utils'
import { Plus, Trash2, Eye, FileDown, Receipt, User, Phone, MapPin, Hash } from 'lucide-react'
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
import ConfirmDialog from '../components/ui/ConfirmDialog'

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

function calcItem(item) {
  const qty      = Number(item.qty)      || 0
  const rate     = Number(item.rate)     || 0
  const disc     = Number(item.discount) || 0
  const cgst     = Number(item.cgst)     || 0
  const sgst     = Number(item.sgst)     || 0
  const discAmt  = round2(rate * disc / 100)
  const finalRate= round2(rate - discAmt)
  const taxable  = round2(finalRate * qty)
  const cgstAmt  = round2(taxable * cgst / 100)
  const sgstAmt  = round2(taxable * sgst / 100)
  const total    = round2(taxable + cgstAmt + sgstAmt)
  return { taxable, cgstAmt, sgstAmt, total }
}

// ── Custom Bill Form ──────────────────────────────
function CustomBillForm({ onSubmit, loading }) {
  const { register, control, handleSubmit, watch } = useForm({
    defaultValues: {
      paymentMode: 'CASH',
      items: [{ description: '', qty: 1, unit: 'PCS', rate: '', discount: 0, cgst: 9, sgst: 9 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items') || []

  // Live totals
  const computed = items.map(i => calcItem(i))
  const subtotal  = round2(computed.reduce((s, c) => s + c.taxable, 0))
  const cgstTotal = round2(computed.reduce((s, c) => s + c.cgstAmt, 0))
  const sgstTotal = round2(computed.reduce((s, c) => s + c.sgstAmt, 0))
  const rawGrand  = round2(subtotal + cgstTotal + sgstTotal)
  const roundOff  = round2(Math.round(rawGrand) - rawGrand)
  const grandTotal= Math.round(rawGrand)

  const handleSubmitForm = (data) => {
    onSubmit({
      customerName:    data.customerName,
      customerMobile:  data.customerMobile,
      customerAddress: data.customerAddress,
      customerGst:     data.customerGst,
      paymentMode:     data.paymentMode,
      paidAmount:      data.paidAmount ? Number(data.paidAmount) : grandTotal,
      notes:           data.notes,
      items: data.items.map(i => ({
        description: i.description,
        qty:         Number(i.qty) || 1,
        unit:        i.unit || 'PCS',
        rate:        Number(i.rate) || 0,
        discount:    Number(i.discount) || 0,
        cgst:        Number(i.cgst) || 0,
        sgst:        Number(i.sgst) || 0,
      })),
    })
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)}>
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 pb-2">

        {/* Payment Mode */}
        <Select label="Payment Mode" {...register('paymentMode')}>
          {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
        </Select>

        {/* Customer Details */}
        <div className="glass-dark rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <User size={13} className="text-brand-400" /> Customer Details
            <span className="text-slate-600 font-normal">(optional)</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input className="glass-input rounded-xl px-3 py-2.5 text-sm" placeholder="Customer Name" {...register('customerName')} />
            <input className="glass-input rounded-xl px-3 py-2.5 text-sm" placeholder="Mobile" {...register('customerMobile')} />
          </div>
          <input className="glass-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="Address (optional)" {...register('customerAddress')} />
          <input className="glass-input w-full rounded-xl px-3 py-2.5 text-sm uppercase" placeholder="GST Number (optional)" {...register('customerGst')} />
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="form-label mb-0">Items *</label>
            <button type="button" className="btn-secondary text-xs px-3 py-1.5"
              onClick={() => append({ description: '', qty: 1, unit: 'PCS', rate: '', discount: 0, cgst: 9, sgst: 9 })}>
              <Plus size={13} /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, idx) => {
              const calc = calcItem({
                qty:      watch(`items.${idx}.qty`),
                rate:     watch(`items.${idx}.rate`),
                discount: watch(`items.${idx}.discount`),
                cgst:     watch(`items.${idx}.cgst`),
                sgst:     watch(`items.${idx}.sgst`),
              })
              return (
                <div key={field.id} className="glass-dark rounded-xl p-3 space-y-2.5">
                  {/* Description */}
                  <div className="flex items-center gap-2">
                    <input
                      className="glass-input rounded-xl px-3 py-2 text-sm flex-1"
                      placeholder="Item description (e.g. Aluminium Pipe 1 inch)"
                      {...register(`items.${idx}.description`)}
                    />
                    <button type="button" className="btn-icon w-8 h-8 hover:text-rose-400 flex-shrink-0"
                      onClick={() => fields.length > 1 && remove(idx)}>
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Qty + Unit + Rate + Discount */}
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-xs text-slate-500">Qty</label>
                      <input type="number" min="1" step="0.01"
                        className="glass-input rounded-lg px-2 py-2 text-sm w-full mt-0.5 text-right"
                        {...register(`items.${idx}.qty`, { valueAsNumber: true })} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Unit</label>
                      <input
                        className="glass-input rounded-lg px-2 py-2 text-sm w-full mt-0.5"
                        placeholder="PCS"
                        {...register(`items.${idx}.unit`)} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Rate ₹</label>
                      <input type="number" step="0.01" min="0"
                        className="glass-input rounded-lg px-2 py-2 text-sm w-full mt-0.5 text-right"
                        placeholder="0.00"
                        {...register(`items.${idx}.rate`, { valueAsNumber: true })} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Disc%</label>
                      <input type="number" min="0" max="100"
                        className="glass-input rounded-lg px-2 py-2 text-sm w-full mt-0.5 text-right"
                        {...register(`items.${idx}.discount`, { valueAsNumber: true })} />
                    </div>
                  </div>

                  {/* CGST + SGST + Total */}
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div>
                      <label className="text-xs text-slate-500">CGST %</label>
                      <input type="number" min="0" max="50" step="0.5"
                        className="glass-input rounded-lg px-2 py-2 text-sm w-full mt-0.5 text-right"
                        {...register(`items.${idx}.cgst`, { valueAsNumber: true })} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">SGST %</label>
                      <input type="number" min="0" max="50" step="0.5"
                        className="glass-input rounded-lg px-2 py-2 text-sm w-full mt-0.5 text-right"
                        {...register(`items.${idx}.sgst`, { valueAsNumber: true })} />
                    </div>
                    <div className="glass-dark rounded-lg px-3 py-2 text-right">
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="text-sm font-bold text-slate-100">{fmt.currency(calc.total)}</p>
                      {(calc.cgstAmt > 0 || calc.sgstAmt > 0) && (
                        <p className="text-xs text-slate-500">
                          CGST {fmt.currency(calc.cgstAmt)} + SGST {fmt.currency(calc.sgstAmt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Grand Total summary */}
        {fields.length > 0 && (
          <div className="glass-dark rounded-2xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{fmt.currency(subtotal)}</span></div>
            {cgstTotal > 0 && <div className="flex justify-between text-slate-400"><span>CGST</span><span>{fmt.currency(cgstTotal)}</span></div>}
            {sgstTotal > 0 && <div className="flex justify-between text-slate-400"><span>SGST</span><span>{fmt.currency(sgstTotal)}</span></div>}
            {roundOff !== 0 && <div className="flex justify-between text-slate-500 text-xs"><span>Round Off</span><span>{roundOff > 0 ? '+' : ''}{fmt.currency(roundOff)}</span></div>}
            <div className="flex justify-between items-center pt-2 border-t border-white/8">
              <span className="font-display font-bold text-slate-100">Grand Total</span>
              <span className="text-xl font-display font-black gradient-text">{fmt.currency(grandTotal)}</span>
            </div>
          </div>
        )}

        {/* Paid + Notes */}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Paid ₹" type="number" step="0.01" placeholder={String(grandTotal)} {...register('paidAmount', { valueAsNumber: true })} />
          <Input label="Notes (optional)" placeholder="Any remarks…" {...register('notes')} />
        </div>

      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t border-white/5 mt-2">
        <Button type="submit" loading={loading} disabled={fields.length === 0} size="lg">
          <Receipt size={16} /><span>Generate Custom Bill</span>
        </Button>
      </div>
    </form>
  )
}

// ── Bill view modal ───────────────────────────────
function CustomBillView({ bill }) {
  if (!bill) return null
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-dark rounded-xl p-3 space-y-1.5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Bill Details</p>
          <p className="text-sm text-slate-300"><span className="text-slate-500">No: </span><code className="text-brand-400">{bill.billNo}</code></p>
          <p className="text-sm text-slate-300"><span className="text-slate-500">Date: </span>{fmt.date(bill.createdAt)}</p>
          <p className="text-sm text-slate-300"><span className="text-slate-500">Payment: </span>{bill.paymentMode}</p>
        </div>
        <div className="glass-dark rounded-xl p-3 space-y-1.5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Customer</p>
          <p className="text-sm font-semibold text-slate-200">{bill.customerName || 'Walk-in'}</p>
          {bill.customerMobile  && <p className="text-xs text-slate-400">📞 {bill.customerMobile}</p>}
          {bill.customerGst     && <p className="text-xs text-emerald-400">GST: {bill.customerGst}</p>}
          {bill.customerAddress && <p className="text-xs text-slate-500 truncate">📍 {bill.customerAddress}</p>}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {bill.items?.map((item, i) => (
          <div key={i} className="glass-dark rounded-xl p-3 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200">{item.description}</p>
              <p className="text-xs text-slate-500">{item.qty} {item.unit} × {fmt.currency(item.rate)}</p>
              {item.discount > 0 && <p className="text-xs text-rose-400">Disc: {item.discount}%</p>}
              {(item.cgst > 0 || item.sgst > 0) && (
                <p className="text-xs text-slate-500">CGST {item.cgst}% + SGST {item.sgst}%</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-slate-100">{fmt.currency(item.totalAmount)}</p>
              {item.cgstAmount > 0 && <p className="text-xs text-slate-500">+{fmt.currency(item.cgstAmount + item.sgstAmount)} tax</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="glass-dark rounded-xl p-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{fmt.currency(bill.subtotal)}</span></div>
        {bill.cgstAmount > 0 && <div className="flex justify-between text-slate-400"><span>CGST</span><span>{fmt.currency(bill.cgstAmount)}</span></div>}
        {bill.sgstAmount > 0 && <div className="flex justify-between text-slate-400"><span>SGST</span><span>{fmt.currency(bill.sgstAmount)}</span></div>}
        {bill.roundOff !== 0 && <div className="flex justify-between text-slate-500 text-xs"><span>Round Off</span><span>{fmt.currency(bill.roundOff)}</span></div>}
        <div className="flex justify-between font-bold text-slate-100 text-base border-t border-white/5 pt-2">
          <span>Grand Total</span><span className="gradient-text">{fmt.currency(bill.grandTotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-500"><span>Paid</span><span>{fmt.currency(bill.paidAmount)}</span></div>
        {bill.dueAmount > 0 && <div className="flex justify-between text-xs text-rose-400 font-semibold"><span>Due</span><span>{fmt.currency(bill.dueAmount)}</span></div>}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────
export default function CustomBilling() {
  const qc = useQueryClient()
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [viewId, setViewId]         = useState(null)
  const [deleteId, setDeleteId]     = useState(null)
  const isMobile = window.innerWidth < 768

  const { data, isLoading } = useQuery({
    queryKey: ['custom-bills', page, search],
    queryFn:  () => customBillsAPI.list({ page, limit: 20, search }).then(r => r.data),
    keepPreviousData: true,
  })

  const { data: billDetail } = useQuery({
    queryKey: ['custom-bill', viewId],
    queryFn:  () => customBillsAPI.getById(viewId).then(r => r.data.data),
    enabled:  !!viewId,
  })

  const createMut = useMutation({
    mutationFn: customBillsAPI.create,
    onSuccess:  () => { qc.invalidateQueries(['custom-bills']); setShowCreate(false); toast.success('Custom bill created!') },
  })

  const deleteMut = useMutation({
    mutationFn: customBillsAPI.delete,
    onSuccess:  () => { qc.invalidateQueries(['custom-bills']); setDeleteId(null); toast.success('Bill deleted') },
  })

  const pdfMut = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || '/api/v1'}/custom-bills/${id}/generate-pdf`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('PDF failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a'); a.href = url; a.download = `custom-bill-${id}.pdf`; a.click()
      URL.revokeObjectURL(url)
    },
    onSuccess: () => toast.success('PDF downloaded'),
    onError:   () => toast.error('PDF failed'),
  })

  const bills      = data?.data          || []
  const pagination = data?.meta?.pagination

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="page-title gradient-text">Custom Bill</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Manual bills — no stock deduction · fully customizable
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /><span>New Custom Bill</span>
        </Button>
      </div>

      {/* Info banner */}
      <div className="glass rounded-2xl p-3 border border-brand-500/20 bg-brand-500/5 text-xs text-slate-400 flex items-start gap-2">
        <Receipt size={14} className="text-brand-400 flex-shrink-0 mt-0.5" />
        <span>
          Custom bills are <strong className="text-slate-300">completely independent</strong> from your product stock.
          You can type any item, price, tax rate — nothing gets deducted from inventory.
        </span>
      </div>

      {/* Search */}
      <div className="glass rounded-2xl p-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search bill no, customer name…" />
      </div>

      {/* Mobile cards / Desktop table */}
      {isMobile ? (
        <div className="space-y-3">
          {isLoading
            ? [...Array(3)].map((_, i) => <div key={i} className="glass rounded-2xl p-4 space-y-2"><div className="skeleton h-5 w-1/2 rounded" /><div className="skeleton h-4 w-3/4 rounded" /></div>)
            : bills.length === 0
            ? <div className="glass rounded-2xl p-12 text-center"><Receipt size={32} className="mx-auto mb-3 text-slate-700" /><p className="text-slate-500">No custom bills yet</p></div>
            : bills.map(b => (
                <div key={b._id} className="glass rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <code className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">{b.billNo}</code>
                      <p className="text-sm font-semibold text-slate-200 mt-1.5 truncate">{b.customerName || 'Walk-in'}</p>
                      {b.customerMobile && <p className="text-xs text-slate-500">📞 {b.customerMobile}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold gradient-text">{fmt.currency(b.grandTotal)}</p>
                      <p className="text-xs text-slate-500">{b.items?.length || 0} items</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-info text-xs">{b.paymentMode}</span>
                      {b.dueAmount > 0
                        ? <span className="text-xs text-rose-400">Due {fmt.currency(b.dueAmount)}</span>
                        : <span className="text-xs text-emerald-400">Paid</span>}
                    </div>
                    <div className="flex gap-1.5">
                      <button className="btn-icon w-8 h-8" onClick={() => setViewId(b._id)}><Eye size={13} /></button>
                      <button className="btn-icon w-8 h-8" onClick={() => pdfMut.mutate(b._id)}><FileDown size={13} /></button>
                      <button className="btn-icon w-8 h-8 hover:text-rose-400" onClick={() => setDeleteId(b._id)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <Table>
            <thead><tr>
              <Th>Bill No</Th><Th>Customer</Th><Th>Items</Th>
              <Th>Payment</Th><Th className="text-right">Amount</Th>
              <Th className="text-right">Due</Th><Th>Date</Th>
              <Th className="text-right">Actions</Th>
            </tr></thead>
            {isLoading ? <TableSkeleton cols={8} /> : (
              <tbody>
                {bills.map(b => (
                  <tr key={b._id}>
                    <Td><code className="text-xs text-brand-400">{b.billNo}</code></Td>
                    <Td>
                      <p className="text-sm text-slate-300">{b.customerName || 'Walk-in'}</p>
                      {b.customerMobile && <p className="text-xs text-slate-500">{b.customerMobile}</p>}
                    </Td>
                    <Td><span className="number-pill">{b.items?.length || 0}</span></Td>
                    <Td><span className="badge badge-info text-xs">{b.paymentMode}</span></Td>
                    <Td className="text-right font-semibold text-slate-100">{fmt.currency(b.grandTotal)}</Td>
                    <Td className="text-right">
                      {b.dueAmount > 0
                        ? <span className="text-rose-400 font-medium text-sm">{fmt.currency(b.dueAmount)}</span>
                        : <span className="text-emerald-400 text-xs">Paid</span>}
                    </Td>
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
                  <tr><td colSpan={8} className="text-center py-12 text-slate-500">
                    <Receipt size={32} className="mx-auto mb-2 opacity-30" />No custom bills yet
                  </td></tr>
                )}
              </tbody>
            )}
          </Table>
          <div className="px-4 py-3"><Pagination meta={pagination} onPageChange={setPage} /></div>
        </div>
      )}

      {isMobile && <Pagination meta={pagination} onPageChange={setPage} />}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Custom Bill" size="xl">
        <CustomBillForm onSubmit={createMut.mutate} loading={createMut.isPending} />
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewId} onClose={() => setViewId(null)}
        title={billDetail ? `Custom Bill – ${billDetail.billNo}` : 'Loading…'} size="lg">
        {billDetail && (
          <>
            <CustomBillView bill={billDetail} />
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
              <Button variant="secondary" size="sm" onClick={() => pdfMut.mutate(viewId)} loading={pdfMut.isPending}>
                <FileDown size={15} /><span>Download PDF</span>
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
        title="Delete Custom Bill"
        message="This custom bill will be permanently deleted."
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
