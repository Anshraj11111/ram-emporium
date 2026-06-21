import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsAPI } from '../services'
import { fmt } from '../lib/utils'
import { Plus, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import SearchInput from '../components/ui/SearchInput'
import Pagination from '../components/ui/Pagination'
import { Table, Th, Td } from '../components/ui/Table'
import { TableSkeleton } from '../components/ui/Skeleton'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'

const schema = z.object({
  sku:           z.string().trim().max(50).toUpperCase().optional().or(z.literal('').transform(() => undefined)),
  name:          z.string().min(1, 'Product name is required'),
  category:      z.string().optional(),
  unit:          z.string().optional(),
  priceUnit:     z.string().optional(),
  cgst:          z.coerce.number().min(0).max(50).optional().default(0),
  sgst:          z.coerce.number().min(0).max(50).optional().default(0),
  purchasePrice: z.coerce.number().min(0).optional(),
  sellingPrice:  z.coerce.number().min(0, 'Selling price required'),
  stockQty:      z.coerce.number().min(0).optional(),
  minStockLevel: z.coerce.number().min(0).optional(),
  location:      z.string().optional(),
  hsn:           z.string().optional(),
  barcode:       z.string().optional(),
}).transform(data => ({
  ...data,
  gstRate: (Number(data.cgst) || 0) + (Number(data.sgst) || 0),
}))

const PRICE_UNITS = [
  'per piece','per meter','per sqft','per sqmt',
  'per kg','per gram','per liter','per box',
  'per dozen','per bundle','per roll','per bag','per ton',
]

const UNITS = ['PCS','MTR','KG','GM','LTR','BOX','DOZ','SQF','SQM','ROLL','BAG','TON','BUNDLE','SET']

// ── Product Form ──────────────────────────────────
function ProductForm({ onSubmit, defaultValues, loading }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      cgst: 0, sgst: 0, unit: 'PCS', stockQty: 0, minStockLevel: 5, priceUnit: '',
    },
  })

  const cgst          = Number(watch('cgst') || 0)
  const sgst          = Number(watch('sgst') || 0)
  const totalGst      = cgst + sgst
  const purchasePrice = Number(watch('purchasePrice') || 0)
  const sellingPrice  = Number(watch('sellingPrice')  || 0)
  const priceUnit     = watch('priceUnit') || ''

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Scrollable body */}
      <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-1 pb-2">

        {/* SKU + Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">SKU <span className="text-slate-600 font-normal text-xs">(optional)</span></label>
            <input className="glass-input w-full rounded-xl px-4 py-3 text-sm uppercase"
              placeholder="e.g. PIPE-01" {...register('sku')} />
          </div>
          <Input label="Product Name *" placeholder="e.g. Aluminium Pipe 1 inch"
            error={errors.name?.message} {...register('name')} />
        </div>

        {/* Category + Unit combo */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Category <span className="text-slate-600 font-normal text-xs">(optional)</span></label>
            <input className="glass-input w-full rounded-xl px-4 py-3 text-sm"
              placeholder="e.g. Aluminium, Steel" {...register('category')} />
          </div>
          <div>
            <label className="form-label">Unit of Sale</label>
            <div className="flex gap-1.5">
              <select className="glass-input rounded-xl px-2 py-2.5 text-sm w-20 flex-shrink-0"
                onChange={e => { if (e.target.value) setValue('unit', e.target.value) }}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <input className="glass-input rounded-xl px-3 py-2.5 text-sm flex-1"
                placeholder="or type custom…" {...register('unit')} />
            </div>
          </div>
        </div>

        {/* Price Unit */}
        <div>
          <label className="form-label">Price Unit <span className="text-slate-600 font-normal text-xs">(optional)</span></label>
          <div className="flex gap-2">
            <select className="glass-input rounded-xl px-3 py-2.5 text-sm w-40 flex-shrink-0"
              onChange={e => {
                if (e.target.value) {
                  setValue('priceUnit', e.target.value)
                  setValue('unit', e.target.value)
                }
              }}>
              <option value="">Quick select…</option>
              {PRICE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <input className="glass-input rounded-xl px-4 py-2.5 text-sm flex-1"
              placeholder="or type: per sqft, per running ft…"
              {...register('priceUnit', {
                onChange: (e) => { if (e.target.value) setValue('unit', e.target.value) }
              })} />
          </div>
        </div>

        {/* ── CGST + SGST — Set BEFORE prices ── */}
        <div className="glass-dark rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">GST Rates</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">CGST %</label>
              <input type="number" min="0" max="50" step="0.5"
                className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                placeholder="e.g. 9" {...register('cgst')} />
            </div>
            <div>
              <label className="form-label">SGST %</label>
              <input type="number" min="0" max="50" step="0.5"
                className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                placeholder="e.g. 9" {...register('sgst')} />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">CGST {cgst}% + SGST {sgst}%</span>
            <span className="font-bold text-brand-400">Total GST = {totalGst}%</span>
          </div>
        </div>

        {/* ── Purchase + Selling — auto-convert to GST-inclusive on blur ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">
              Purchase Price ₹
              {totalGst > 0 && <span className="text-slate-600 text-xs font-normal ml-1">(type excl. GST → auto includes)</span>}
            </label>
            <input
              type="number" step="0.01" min="0" placeholder="0.00"
              className="glass-input w-full rounded-xl px-4 py-3 text-sm"
              {...register('purchasePrice')}
              onBlur={(e) => {
                const raw = parseFloat(e.target.value)
                if (!isNaN(raw) && raw > 0 && totalGst > 0) {
                  const withGstVal = Math.round(raw * (1 + totalGst / 100) * 100) / 100
                  setValue('purchasePrice', withGstVal)
                }
              }}
            />
            {purchasePrice > 0 && totalGst > 0 && (
              <p className="text-xs text-amber-400 mt-1">
                Saved as ₹{purchasePrice} (incl. {totalGst}% GST)
                {priceUnit && ` ${priceUnit}`}
              </p>
            )}
          </div>
          <div>
            <label className="form-label">
              Selling Price ₹ *
              {totalGst > 0 && <span className="text-slate-600 text-xs font-normal ml-1">(type excl. GST → auto includes)</span>}
            </label>
            <input
              type="number" step="0.01" min="0" placeholder="0.00"
              className={`glass-input w-full rounded-xl px-4 py-3 text-sm ${errors.sellingPrice ? 'border-rose-500/60' : ''}`}
              {...register('sellingPrice')}
              onBlur={(e) => {
                const raw = parseFloat(e.target.value)
                if (!isNaN(raw) && raw > 0 && totalGst > 0) {
                  const withGstVal = Math.round(raw * (1 + totalGst / 100) * 100) / 100
                  setValue('sellingPrice', withGstVal)
                }
              }}
            />
            {sellingPrice > 0 && totalGst > 0 && (
              <p className="text-xs text-emerald-400 mt-1">
                Saved as ₹{sellingPrice} (incl. {totalGst}% GST)
                {priceUnit && ` ${priceUnit}`}
              </p>
            )}
            {errors.sellingPrice && <p className="mt-1 text-xs text-rose-400">{errors.sellingPrice.message}</p>}
          </div>
        </div>

        {/* Stock + Min Level */}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Opening Stock" type="number" placeholder="0" {...register('stockQty')} />
          <Input label="Min Stock Level" type="number" placeholder="5" {...register('minStockLevel')} />
        </div>

        {/* HSN + Barcode + Location */}
        <div className="grid grid-cols-2 gap-3">
          <Input label="HSN Code" placeholder="7304" {...register('hsn')} />
          <Input label="Barcode" placeholder="8901234567890" {...register('barcode')} />
        </div>
        <Input label="Location" placeholder="Rack A-3" {...register('location')} />

      </div>{/* end scroll */}

      {/* Submit button — always visible */}
      <div className="flex justify-end pt-4 border-t border-white/5 mt-2">
        <Button type="submit" loading={loading}>
          <span>{defaultValues ? 'Update Product' : 'Create Product'}</span>
        </Button>
      </div>
    </form>
  )
}

// ── Mobile product card ───────────────────────────
function ProductCard({ product, onEdit, onDelete }) {
  const isLow = product.stockQty < product.minStockLevel
  const cgst = product.cgst || (product.gstRate / 2) || 0
  const sgst = product.sgst || (product.gstRate / 2) || 0
  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isLow && <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />}
            <p className="font-semibold text-slate-200 truncate">{product.name}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {product.sku && <code className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">{product.sku}</code>}
            {product.category && <span className="text-xs text-slate-500">{product.category}</span>}
          </div>
        </div>
        <Badge status={product.status} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="glass-dark rounded-xl p-2">
          <p className="text-xs text-slate-500 mb-0.5">Selling</p>
          <p className="text-sm font-bold text-slate-100">{fmt.currency(product.sellingPrice)}</p>
        </div>
        <div className="glass-dark rounded-xl p-2">
          <p className="text-xs text-slate-500 mb-0.5">Stock</p>
          <p className={`text-sm font-bold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
            {product.stockQty} {product.unit}
          </p>
        </div>
        <div className="glass-dark rounded-xl p-2">
          <p className="text-xs text-slate-500 mb-0.5">CGST+SGST</p>
          <p className="text-xs font-bold text-slate-200">{cgst}%+{sgst}%</p>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button className="btn-icon" onClick={() => onEdit(product)}><Edit2 size={14} /></button>
        <button className="btn-icon hover:text-rose-400" onClick={() => onDelete(product._id)}><Trash2 size={14} /></button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────
export default function Products() {
  const qc = useQueryClient()
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [category, setCategory] = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const isMobile = window.innerWidth < 768

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, category],
    queryFn:  () => productsAPI.list({ page, limit: 20, search, category }).then(r => r.data),
    keepPreviousData: true,
  })

  const createMut = useMutation({
    mutationFn: productsAPI.create,
    onSuccess:  () => { qc.invalidateQueries(['products']); setShowAdd(false); toast.success('Product created') },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => productsAPI.update(id, data),
    onSuccess:  () => { qc.invalidateQueries(['products']); setEditItem(null); toast.success('Product updated') },
  })
  const deleteMut = useMutation({
    mutationFn: productsAPI.delete,
    onSuccess:  () => { qc.invalidateQueries(['products']); setDeleteId(null); toast.success('Product deleted') },
  })

  const products   = data?.data          || []
  const pagination = data?.meta?.pagination

  // Build edit defaults including cgst/sgst
  const buildEditDefaults = (p) => ({
    ...p,
    cgst: p.cgst ?? (p.gstRate ? p.gstRate / 2 : 9),
    sgst: p.sgst ?? (p.gstRate ? p.gstRate / 2 : 9),
    priceUnit: p.priceUnit || '',
  })

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="page-title gradient-text">Products</h1>
          <p className="text-slate-500 text-xs mt-0.5">{pagination?.total || 0} products</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus size={15} /><span>Add</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-3 flex gap-2">
        <div className="flex-1">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }}
            placeholder="Search name, SKU…" />
        </div>
        <select className="glass-input rounded-xl px-3 py-2 text-sm flex-shrink-0"
          style={{ minWidth: 0, maxWidth: 130 }}
          value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}>
          <option value="">All</option>
          <option value="Aluminium">Aluminium</option>
          <option value="Steel">Steel</option>
          <option value="PVC">PVC</option>
          <option value="Electrical">Electrical</option>
          <option value="Fasteners">Fasteners</option>
        </select>
      </div>

      {/* Mobile cards / Desktop table */}
      {isMobile ? (
        <div className="space-y-3">
          {isLoading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="glass rounded-2xl p-4 space-y-3">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(3)].map((_, j) => <div key={j} className="skeleton h-12 rounded-xl" />)}
                  </div>
                </div>
              ))
            : products.length === 0
            ? <EmptyState icon={Package} title="No products found"
                action={{ label: 'Add Product', onClick: () => setShowAdd(true) }} />
            : products.map(p => (
                <ProductCard key={p._id} product={p} onEdit={setEditItem} onDelete={setDeleteId} />
              ))}
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <Table>
            <thead><tr>
              <Th>SKU</Th><Th>Name</Th><Th>Category</Th>
              <Th className="text-right">Purchase</Th>
              <Th className="text-right">Selling</Th>
              <Th className="text-right">CGST+SGST</Th>
              <Th className="text-right">Stock</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr></thead>
            {isLoading ? <TableSkeleton cols={9} /> : (
              <tbody>
                {products.map(p => {
                  const cgst = p.cgst ?? (p.gstRate ? p.gstRate / 2 : 0)
                  const sgst = p.sgst ?? (p.gstRate ? p.gstRate / 2 : 0)
                  return (
                    <tr key={p._id}>
                      <Td><code className="text-xs text-brand-400">{p.sku || '—'}</code></Td>
                      <Td>
                        <div className="flex items-center gap-1.5">
                          {p.stockQty < p.minStockLevel && <AlertTriangle size={12} className="text-amber-400" />}
                          <span className="font-medium text-slate-200">{p.name}</span>
                        </div>
                      </Td>
                      <Td><span className="text-slate-400">{p.category || '—'}</span></Td>
                      <Td className="text-right text-slate-400">{fmt.currency(p.purchasePrice)}</Td>
                      <Td className="text-right font-semibold text-slate-100">{fmt.currency(p.sellingPrice)}</Td>
                      <Td className="text-right text-slate-400 text-xs">{cgst}%+{sgst}%</Td>
                      <Td className="text-right">
                        <span className={p.stockQty < p.minStockLevel ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                          {p.stockQty} {p.unit}
                        </span>
                      </Td>
                      <Td><Badge status={p.status} /></Td>
                      <Td>
                        <div className="flex justify-end gap-1.5">
                          <button className="btn-icon" onClick={() => setEditItem(p)}><Edit2 size={13} /></button>
                          <button className="btn-icon hover:text-rose-400" onClick={() => setDeleteId(p._id)}><Trash2 size={13} /></button>
                        </div>
                      </Td>
                    </tr>
                  )
                })}
                {products.length === 0 && (
                  <tr><td colSpan={9}>
                    <EmptyState icon={Package} title="No products found"
                      action={{ label: 'Add Product', onClick: () => setShowAdd(true) }} />
                  </td></tr>
                )}
              </tbody>
            )}
          </Table>
          <div className="px-4 py-3"><Pagination meta={pagination} onPageChange={setPage} /></div>
        </div>
      )}

      {isMobile && <Pagination meta={pagination} onPageChange={setPage} />}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Product" size="lg">
        <ProductForm onSubmit={createMut.mutate} loading={createMut.isPending} />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Product" size="lg">
        {editItem && (
          <ProductForm
            defaultValues={buildEditDefaults(editItem)}
            onSubmit={d => updateMut.mutate({ id: editItem._id, data: d })}
            loading={updateMut.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
        title="Delete Product"
        message="This product will be permanently deleted. This cannot be undone."
        confirmLabel="Delete Product"
        danger
      />
    </div>
  )
}
