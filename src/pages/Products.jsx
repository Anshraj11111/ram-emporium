import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsAPI } from '../services'
import { fmt, gstRates } from '../lib/utils'
import { Plus, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import EmptyState from '../components/ui/EmptyState'

const schema = z.object({
  sku:           z.string().min(1).toUpperCase(),
  name:          z.string().min(1),
  category:      z.string().optional(),
  unit:          z.string().optional(),
  purchasePrice: z.coerce.number().min(0).optional(),
  sellingPrice:  z.coerce.number().min(0),
  gstRate:       z.coerce.number(),
  stockQty:      z.coerce.number().min(0).optional(),
  minStockLevel: z.coerce.number().min(0).optional(),
  location:      z.string().optional(),
  hsn:           z.string().optional(),
  barcode:       z.string().optional(),
})

function ProductForm({ onSubmit, defaultValues, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || { gstRate: 18, unit: 'PCS', stockQty: 0, minStockLevel: 5 },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="SKU *" placeholder="PROD-001" error={errors.sku?.message} {...register('sku')} />
        <Input label="Name *" placeholder="Product name" error={errors.name?.message} {...register('name')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Category" placeholder="Steel" {...register('category')} />
        <Input label="Unit" placeholder="PCS/MTR/KG" {...register('unit')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Purchase ₹" type="number" step="0.01" {...register('purchasePrice')} />
        <Input label="Selling ₹ *" type="number" step="0.01" error={errors.sellingPrice?.message} {...register('sellingPrice')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="GST Rate" {...register('gstRate')}>
          {gstRates.map(r => <option key={r} value={r}>{r}%</option>)}
        </Select>
        <Input label="Stock Qty" type="number" {...register('stockQty')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Min Stock" type="number" {...register('minStockLevel')} />
        <Input label="Location" placeholder="Rack A-3" {...register('location')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="HSN Code" {...register('hsn')} />
        <Input label="Barcode" {...register('barcode')} />
      </div>
      <div className="flex justify-end pt-1">
        <Button type="submit" loading={loading}>
          <span>{defaultValues ? 'Update' : 'Create Product'}</span>
        </Button>
      </div>
    </form>
  )
}

// Mobile card view for a product
function ProductCard({ product, onEdit, onDelete }) {
  const isLow = product.stockQty < product.minStockLevel
  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isLow && <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />}
            <p className="font-semibold text-slate-200 truncate">{product.name}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">{product.sku}</code>
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
          <p className="text-xs text-slate-500 mb-0.5">GST</p>
          <p className="text-sm font-bold text-slate-200">{product.gstRate}%</p>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button className="btn-icon" onClick={() => onEdit(product)}><Edit2 size={14} /></button>
        <button className="btn-icon hover:text-rose-400" onClick={() => onDelete(product._id)}><Trash2 size={14} /></button>
      </div>
    </div>
  )
}

export default function Products() {
  const qc = useQueryClient()
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [category, setCategory] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const isMobile = window.innerWidth < 768

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, category],
    queryFn: () => productsAPI.list({ page, limit: 20, search, category }).then(r => r.data),
    keepPreviousData: true,
  })

  const createMut = useMutation({ mutationFn: productsAPI.create, onSuccess: () => { qc.invalidateQueries(['products']); setShowAdd(false); toast.success('Product created') } })
  const updateMut = useMutation({ mutationFn: ({ id, data }) => productsAPI.update(id, data), onSuccess: () => { qc.invalidateQueries(['products']); setEditItem(null); toast.success('Product updated') } })
  const deleteMut = useMutation({ mutationFn: productsAPI.delete, onSuccess: () => { qc.invalidateQueries(['products']); setDeleteId(null); toast.success('Product deleted') } })

  const products   = data?.data || []
  const pagination = data?.meta?.pagination

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

      {/* Search + filter row */}
      <div className="glass rounded-2xl p-3 flex gap-2">
        <div className="flex-1">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search name, SKU…" />
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

      {/* Mobile: cards / Desktop: table */}
      {isMobile ? (
        <div className="space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4 space-y-3">
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(3)].map((_, j) => <div key={j} className="skeleton h-12 rounded-xl" />)}
                </div>
              </div>
            ))
          ) : products.length === 0 ? (
            <EmptyState icon={Package} title="No products found" action={{ label: 'Add Product', onClick: () => setShowAdd(true) }} />
          ) : products.map(p => (
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
              <Th className="text-right">GST</Th>
              <Th className="text-right">Stock</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr></thead>
            {isLoading ? <TableSkeleton cols={9} /> : (
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <Td><code className="text-xs text-brand-400">{p.sku}</code></Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        {p.stockQty < p.minStockLevel && <AlertTriangle size={12} className="text-amber-400" />}
                        <span className="font-medium text-slate-200">{p.name}</span>
                      </div>
                    </Td>
                    <Td><span className="text-slate-400">{p.category || '—'}</span></Td>
                    <Td className="text-right text-slate-400">{fmt.currency(p.purchasePrice)}</Td>
                    <Td className="text-right font-semibold text-slate-100">{fmt.currency(p.sellingPrice)}</Td>
                    <Td className="text-right text-slate-400">{p.gstRate}%</Td>
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
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={9}><EmptyState icon={Package} title="No products found" action={{ label: 'Add Product', onClick: () => setShowAdd(true) }} /></td></tr>
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
        {editItem && <ProductForm defaultValues={editItem} onSubmit={(d) => updateMut.mutate({ id: editItem._id, data: d })} loading={updateMut.isPending} />}
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} loading={deleteMut.isPending} title="Delete Product" message="This product will be permanently deleted." confirmLabel="Delete" danger />
    </div>
  )
}
