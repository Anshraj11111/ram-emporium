import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quotationsAPI, billsAPI } from '../services'
import { fmt, calcItemAmounts, calcBillTotals, gstRates, paymentModes } from '../lib/utils'
import {
  Plus, Trash2, FileText, Eye, Copy, FileDown,
  ArrowRightLeft, Edit2, CheckCircle
} from 'lucide-react'
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
import ProductSearchInput from '../components/billing/ProductSearchInput'

// ── Quotation Form (Create + Edit) ───────────────
function QuotationForm({ onSubmit, defaultValues, loading }) {
  const { register, control, handleSubmit, watch } = useForm({
    defaultValues: defaultValues || {
      items: [], overallDiscount: 0,
      customerName: '', customerMobile: '', customerAddress: '', customerGst: '',
      validUntil: '',
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const items           = watch('items') || []
  const overallDiscount = Number(watch('overallDiscount') || 0)
  const processedItems  = items.map(i => ({
    ...i,
    ...calcItemAmounts({
      quantity:           Number(i.quantity)           || 0,
      rate:               Number(i.rate)               || 0,
      discountPercentage: Number(i.discountPercentage) || 0,
      gstRate:            Number(i.gstRate)            || 0,
    }),
  }))
  const totals = calcBillTotals(processedItems, overallDiscount)

  // ids already in items (to prevent duplicates)
  const addedIds = fields.map(f => f.productId)

  const addProduct = (p) => {
    append({
      productId:          p._id,
      productName:        p.name,
      sku:                p.sku,
      unit:               p.unit || 'PCS',
      quantity:           1,
      rate:               p.sellingPrice,
      discountPercentage: 0,
      gstRate:            p.gstRate || 18,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* ── Customer Details ── */}
      <div className="glass-dark rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <span className="text-brand-400 text-xs">👤</span>
          </div>
          <p className="text-sm font-semibold text-slate-300">Customer Details</p>
          <span className="text-xs text-slate-600">(optional)</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
              placeholder="Customer Name"
              {...register('customerName')}
            />
          </div>
          <div className="relative">
            <input
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
              placeholder="Mobile Number"
              maxLength={10}
              {...register('customerMobile')}
            />
          </div>
        </div>

        <input
          className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
          placeholder="Address (optional)"
          {...register('customerAddress')}
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm uppercase"
            placeholder="GST Number (optional)"
            maxLength={15}
            {...register('customerGst')}
          />
          <input
            type="date"
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
            {...register('validUntil')}
          />
        </div>
      </div>

      {/* Product search */}
      <div>
        <label className="form-label">Add Products *</label>
        <ProductSearchInput onSelect={addProduct} excludeIds={addedIds} />
      </div>

      {/* Items */}
      {fields.length > 0 ? (
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs text-slate-500 uppercase tracking-wider px-1">
            <div className="col-span-4">Product</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-2 text-right">Rate</div>
            <div className="col-span-1 text-right">Disc%</div>
            <div className="col-span-1 text-right">GST%</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1" />
          </div>

          {fields.map((field, idx) => {
            const calc = calcItemAmounts({
              quantity:           Number(watch(`items.${idx}.quantity`))           || 0,
              rate:               Number(watch(`items.${idx}.rate`))               || 0,
              discountPercentage: Number(watch(`items.${idx}.discountPercentage`)) || 0,
              gstRate:            Number(watch(`items.${idx}.gstRate`))            || 0,
            })
            return (
              <div key={field.id}
                className="grid grid-cols-12 gap-2 items-center glass-dark rounded-xl p-3">
                <div className="col-span-4">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {watch(`items.${idx}.productName`)}
                  </p>
                  <p className="text-xs text-slate-500">{watch(`items.${idx}.sku`)}</p>
                </div>
                <div className="col-span-1">
                  <input type="number" min="1"
                    className="glass-input rounded-lg px-2 py-1.5 text-xs w-full text-right"
                    {...register(`items.${idx}.quantity`, { valueAsNumber: true })} />
                </div>
                <div className="col-span-2">
                  <input type="number" step="0.01"
                    className="glass-input rounded-lg px-2 py-1.5 text-xs w-full text-right"
                    {...register(`items.${idx}.rate`, { valueAsNumber: true })} />
                </div>
                <div className="col-span-1">
                  <input type="number" min="0" max="100"
                    className="glass-input rounded-lg px-2 py-1.5 text-xs w-full text-right"
                    {...register(`items.${idx}.discountPercentage`, { valueAsNumber: true })} />
                </div>
                <div className="col-span-1">
                  <select className="glass-input rounded-lg px-1 py-1.5 text-xs w-full"
                    {...register(`items.${idx}.gstRate`, { valueAsNumber: true })}>
                    {gstRates.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-sm font-bold text-slate-100">{fmt.currency(calc.totalAmount)}</p>
                  <p className="text-xs text-slate-500">{fmt.currency(calc.taxableAmount)} + GST</p>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button type="button"
                    className="btn-icon text-slate-600 hover:text-rose-400"
                    onClick={() => remove(idx)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass-dark rounded-xl p-8 text-center text-slate-500 text-sm">
          Search and add products above
        </div>
      )}

      {/* Totals */}
      {fields.length > 0 && (
        <div className="glass-dark rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <label className="form-label mb-0 text-slate-500 w-44">Overall Discount %</label>
            <input type="number" min="0" max="100" step="0.01"
              className="glass-input rounded-xl px-3 py-2 text-sm w-24 text-right"
              {...register('overallDiscount', { valueAsNumber: true })} />
          </div>
          <div className="glass-divider" />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span><span>{fmt.currency(totals.subtotal)}</span>
            </div>
            {totals.overallDiscountAmount > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>Discount ({overallDiscount}%)</span>
                <span>-{fmt.currency(totals.overallDiscountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>GST</span><span>{fmt.currency(totals.gstAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-100 text-lg pt-2 border-t border-white/5">
              <span>Grand Total</span>
              <span className="gradient-text">{fmt.currency(totals.grandTotal)}</span>
            </div>
          </div>
        </div>
      )}

      <Input label="Notes" placeholder="Any notes for the customer…" {...register('notes')} />

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading} disabled={fields.length === 0}>
          <span>{defaultValues?._id ? 'Update Quotation' : 'Create Quotation'}</span>
        </Button>
      </div>
    </form>
  )
}

// ── Convert to Bill Form ──────────────────────────
function ConvertForm({ onSubmit, loading }) {
  const { register, handleSubmit } = useForm({
    defaultValues: { type: 'GST', paymentMode: 'CASH' },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="glass-dark rounded-xl p-3 text-sm text-slate-400 flex items-center gap-2">
        <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
        All products, rates and discounts will be carried over automatically.
      </div>
      <Select label="Bill Type *" {...register('type')}>
        <option value="GST">GST Bill</option>
        <option value="NON_GST">Non-GST Bill</option>
      </Select>
      <Select label="Payment Mode" {...register('paymentMode')}>
        {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
      </Select>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" variant="success" loading={loading}>
          <CheckCircle size={15} />
          <span>Convert to Bill</span>
        </Button>
      </div>
    </form>
  )
}

// ── Main Component ────────────────────────────────
export default function Quotations() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const [status, setStatus] = useState('')

  // Modal states
  const [showCreate, setShowCreate] = useState(false)
  const [editItem,   setEditItem]   = useState(null)   // quotation to edit
  const [viewItem,   setViewItem]   = useState(null)   // quotation to view
  const [convertId,  setConvertId]  = useState(null)   // id to convert
  const [deleteId,   setDeleteId]   = useState(null)   // id to delete

  // ── Queries ───────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['quotations', page, search, status],
    queryFn: () => quotationsAPI.list({ page, limit: 20, search, status }).then(r => r.data),
    keepPreviousData: true,
  })

  // Fetch full detail when editing
  const { data: editDetail } = useQuery({
    queryKey: ['quotation-detail', editItem?._id],
    queryFn: () => quotationsAPI.getById(editItem._id).then(r => r.data.data),
    enabled: !!editItem?._id,
  })

  // ── Mutations ─────────────────────────────────
  const createMut = useMutation({
    mutationFn: quotationsAPI.create,
    onSuccess: () => {
      qc.invalidateQueries(['quotations'])
      setShowCreate(false)
      toast.success('Quotation created')
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => quotationsAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['quotations'])
      setEditItem(null)
      toast.success('Quotation updated')
    },
  })

  const deleteMut = useMutation({
    mutationFn: quotationsAPI.delete,
    onSuccess: () => {
      qc.invalidateQueries(['quotations'])
      setDeleteId(null)
      toast.success('Quotation deleted')
    },
  })

  const dupMut = useMutation({
    mutationFn: quotationsAPI.duplicate,
    onSuccess: () => {
      qc.invalidateQueries(['quotations'])
      toast.success('Quotation duplicated')
    },
  })

  const pdfMut = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || '/api/v1'}/quotations/${id}/generate-pdf`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `quotation-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    },
    onSuccess: () => toast.success('PDF downloaded'),
    onError:   () => toast.error('PDF generation failed'),
  })

  const convertMut = useMutation({
    mutationFn: ({ qId, data }) => billsAPI.convertQuotation(qId, data),
    onSuccess: () => {
      qc.invalidateQueries(['quotations'])
      qc.invalidateQueries(['bills'])
      qc.invalidateQueries(['products'])
      setConvertId(null)
      toast.success('Converted to bill successfully!')
    },
  })

  // ── Helpers ───────────────────────────────────
  const handleCreate = (formData) => {
    const payload = {
      customerName:    formData.customerName    || undefined,
      customerMobile:  formData.customerMobile  || undefined,
      customerAddress: formData.customerAddress || undefined,
      customerGst:     formData.customerGst     || undefined,
      items: formData.items.map(i => ({
        productId:          i.productId,
        productName:        i.productName,
        quantity:           Number(i.quantity),
        rate:               Number(i.rate),
        discountPercentage: Number(i.discountPercentage) || 0,
        gstRate:            Number(i.gstRate) || 0,
      })),
      overallDiscount: Number(formData.overallDiscount) || 0,
      notes:           formData.notes,
      validUntil:      formData.validUntil || undefined,
    }
    createMut.mutate(payload)
  }

  const handleUpdate = (formData) => {
    const payload = {
      customerName:    formData.customerName    || undefined,
      customerMobile:  formData.customerMobile  || undefined,
      customerAddress: formData.customerAddress || undefined,
      customerGst:     formData.customerGst     || undefined,
      items: formData.items.map(i => ({
        productId:          i.productId,
        productName:        i.productName,
        quantity:           Number(i.quantity),
        rate:               Number(i.rate),
        discountPercentage: Number(i.discountPercentage) || 0,
        gstRate:            Number(i.gstRate) || 0,
      })),
      overallDiscount: Number(formData.overallDiscount) || 0,
      notes:           formData.notes,
      validUntil:      formData.validUntil || undefined,
    }
    updateMut.mutate({ id: editItem._id, data: payload })
  }

  const buildEditDefaults = (q) => {
    if (!q) return null
    const snap = q.customerSnapshot || {}
    return {
      _id:             q._id,
      customerName:    snap.name      || '',
      customerMobile:  snap.mobile    || '',
      customerAddress: snap.address   || '',
      customerGst:     snap.gstNumber || '',
      overallDiscount: q.overallDiscount || 0,
      notes:           q.notes    || '',
      validUntil:      q.validUntil ? q.validUntil.split('T')[0] : '',
      items: (q.items || []).map(i => ({
        productId:          i.productId?._id || i.productId,
        productName:        i.productName,
        sku:                i.sku,
        unit:               i.unit,
        quantity:           i.quantity,
        rate:               i.rate,
        discountPercentage: i.discountPercentage || 0,
        gstRate:            i.gstRate || 0,
      })),
    }
  }

  const quotations = data?.data || []
  const pagination = data?.meta?.pagination
  const statusList = ['DRAFT','SENT','APPROVED','REJECTED','CONVERTED_TO_BILL']

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="page-title gradient-text">Quotations</h1>
          <p className="text-slate-500 text-xs mt-0.5">{pagination?.total || 0} total quotations</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus size={15} /><span>New</span>
        </Button>
      </div>

      {/* ── Filters ── */}
      <div className="glass rounded-2xl p-3 flex gap-2">
        <div className="flex-1">
          <SearchInput value={search}
            onChange={v => { setSearch(v); setPage(1) }}
            placeholder="Search quotation no, customer…" />
        </div>
        <select className="glass-input rounded-xl px-3 py-2 text-sm flex-shrink-0"
          style={{ minWidth: 0, maxWidth: 130 }}
          value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All</option>
          {statusList.map(s => (
            <option key={s} value={s}>{s === 'CONVERTED_TO_BILL' ? 'Converted' : s}</option>
          ))}
        </select>
      </div>

      {/* ── Table (desktop) / Cards (mobile) ── */}
      {window.innerWidth < 768 ? (
        <div className="space-y-3">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4 space-y-3">
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-5 w-3/4 rounded" />
              </div>
            ))
          ) : quotations.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <FileText size={32} className="mx-auto mb-3 text-slate-700" />
              <p className="text-slate-500">No quotations found</p>
            </div>
          ) : quotations.map(q => (
            <div key={q._id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <code className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">{q.quotationNo}</code>
                  <p className="text-sm font-semibold text-slate-200 mt-1.5">
                    {q.customerSnapshot?.name || 'Walk-in'}
                  </p>
                  <p className="text-xs text-slate-500">{fmt.date(q.createdAt)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-slate-100">{fmt.currency(q.grandTotal)}</p>
                  <Badge status={q.status} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="number-pill text-xs">{q.items?.length || 0} items</span>
                <div className="flex gap-1.5">
                  <button className="btn-icon w-8 h-8" onClick={() => setViewItem(q)}><Eye size={13} /></button>
                  {q.status !== 'CONVERTED_TO_BILL' && (
                    <button className="btn-icon w-8 h-8" onClick={() => setEditItem(q)}><Edit2 size={13} /></button>
                  )}
                  <button className="btn-icon w-8 h-8" onClick={() => pdfMut.mutate(q._id)}><FileDown size={13} /></button>
                  {q.status !== 'CONVERTED_TO_BILL' && (
                    <button className="btn-icon w-8 h-8 text-emerald-500" onClick={() => setConvertId(q._id)}>
                      <ArrowRightLeft size={13} />
                    </button>
                  )}
                  <button className="btn-icon w-8 h-8 hover:text-rose-400" onClick={() => setDeleteId(q._id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <Pagination meta={pagination} onPageChange={setPage} />
        </div>
      ) : (
      <div className="glass rounded-2xl overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>Quotation No</Th>
              <Th>Customer</Th>
              <Th>Items</Th>
              <Th className="text-right">Amount</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>

          {isLoading ? <TableSkeleton cols={7} /> : (
            <tbody>
              {quotations.map(q => (
                <tr key={q._id}>
                  <Td><code className="text-brand-400 text-xs bg-brand-500/10 px-2 py-0.5 rounded">{q.quotationNo}</code></Td>
                  <Td><span className="text-slate-300">{q.customerSnapshot?.name || 'Walk-in'}</span></Td>
                  <Td><span className="number-pill">{q.items?.length || 0}</span></Td>
                  <Td className="text-right font-semibold text-slate-100">{fmt.currency(q.grandTotal)}</Td>
                  <Td><Badge status={q.status} /></Td>
                  <Td><span className="text-slate-500 text-xs">{fmt.date(q.createdAt)}</span></Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1.5">
                      <button className="btn-icon" onClick={() => setViewItem(q)} data-tooltip="View"><Eye size={13} /></button>
                      <button className={`btn-icon ${q.status === 'CONVERTED_TO_BILL' ? 'opacity-30 cursor-not-allowed' : ''}`} onClick={() => q.status !== 'CONVERTED_TO_BILL' && setEditItem(q)} data-tooltip="Edit"><Edit2 size={13} /></button>
                      <button className="btn-icon" onClick={() => dupMut.mutate(q._id)} data-tooltip="Duplicate"><Copy size={13} /></button>
                      <button className="btn-icon" onClick={() => pdfMut.mutate(q._id)} data-tooltip="PDF"><FileDown size={13} /></button>
                      {q.status !== 'CONVERTED_TO_BILL' && (
                        <button className="btn-icon text-emerald-500 hover:text-emerald-300" onClick={() => setConvertId(q._id)} data-tooltip="Convert"><ArrowRightLeft size={13} /></button>
                      )}
                      <button
                        className="btn-icon hover:text-rose-400 hover:border-rose-500/30"
                        onClick={() => setDeleteId(q._id)}
                        data-tooltip="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
              {quotations.length === 0 && (
                <tr><td colSpan={7} className="text-center py-14">
                  <FileText size={36} className="mx-auto mb-3 text-slate-700" />
                  <p className="text-slate-500 font-medium">No quotations found</p>
                </td></tr>
              )}
            </tbody>
          )}
        </Table>
        <div className="px-4 py-3"><Pagination meta={pagination} onPageChange={setPage} /></div>
      </div>
      )} {/* end desktop */}

      {/* ── Create Modal ── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)}
        title="New Quotation" size="xl">
        <QuotationForm onSubmit={handleCreate} loading={createMut.isPending} />
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)}
        title={`Edit Quotation – ${editItem?.quotationNo}`} size="xl">
        {editDetail ? (
          <QuotationForm
            defaultValues={buildEditDefaults(editDetail)}
            onSubmit={handleUpdate}
            loading={updateMut.isPending}
          />
        ) : (
          <div className="flex items-center justify-center py-16">
            <div className="spinner w-8 h-8" />
          </div>
        )}
      </Modal>

      {/* ── View Modal ── */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)}
        title={`Quotation – ${viewItem?.quotationNo}`} size="lg">
        {viewItem && (
          <div className="space-y-4">
            {/* Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-dark rounded-xl p-4 space-y-1.5">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Details</p>
                <p className="text-sm text-slate-300">
                  <span className="text-slate-500">No: </span>
                  <code className="text-brand-400">{viewItem.quotationNo}</code>
                </p>
                <p className="text-sm text-slate-300">
                  <span className="text-slate-500">Date: </span>{fmt.date(viewItem.createdAt)}
                </p>
                <Badge status={viewItem.status} />
              </div>
              <div className="glass-dark rounded-xl p-4 space-y-1.5">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Customer</p>
                <p className="text-sm font-semibold text-slate-200">
                  {viewItem.customerSnapshot?.name || 'Walk-in'}
                </p>
                {viewItem.customerSnapshot?.mobile && (
                  <p className="text-xs text-slate-400">📞 {viewItem.customerSnapshot.mobile}</p>
                )}
                {viewItem.customerSnapshot?.gstNumber && (
                  <p className="text-xs text-emerald-400">GST: {viewItem.customerSnapshot.gstNumber}</p>
                )}
                {viewItem.customerSnapshot?.address && (
                  <p className="text-xs text-slate-500">📍 {viewItem.customerSnapshot.address}</p>
                )}
              </div>
            </div>

            {/* Items table */}
            <div className="glass-dark rounded-xl overflow-hidden">
              <table className="glass-table w-full text-xs">
                <thead>
                  <tr>
                    <Th>#</Th><Th>Product</Th>
                    <Th className="text-right">Qty</Th>
                    <Th className="text-right">Rate</Th>
                    <Th className="text-right">Disc%</Th>
                    <Th className="text-right">GST%</Th>
                    <Th className="text-right">Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {viewItem.items?.map((item, i) => (
                    <tr key={i}>
                      <Td>{i+1}</Td>
                      <Td>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-slate-500 text-xs">{item.sku}</p>
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
                <span>Subtotal</span><span>{fmt.currency(viewItem.subtotal)}</span>
              </div>
              {viewItem.gstAmount > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>GST</span><span>{fmt.currency(viewItem.gstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-100 text-base border-t border-white/5 pt-2">
                <span>Grand Total</span>
                <span className="gradient-text">{fmt.currency(viewItem.grandTotal)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
              <Button variant="secondary" size="sm"
                onClick={() => { pdfMut.mutate(viewItem._id); }}
                loading={pdfMut.isPending}>
                <FileDown size={14} /><span>Download PDF</span>
              </Button>
              {viewItem.status !== 'CONVERTED_TO_BILL' && (
                <Button variant="success" size="sm"
                  onClick={() => { setViewItem(null); setConvertId(viewItem._id) }}>
                  <ArrowRightLeft size={14} /><span>Convert to Bill</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Convert Modal ── */}
      <Modal open={!!convertId} onClose={() => setConvertId(null)}
        title="Convert Quotation to Bill" size="sm">
        <ConvertForm
          onSubmit={d => convertMut.mutate({ qId: convertId, data: d })}
          loading={convertMut.isPending}
        />
      </Modal>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
        title="Delete Quotation"
        message="This quotation will be permanently deleted. This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
