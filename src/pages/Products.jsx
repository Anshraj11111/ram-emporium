import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsAPI } from '../services'
import { fmt, statusColor, gstRates } from '../lib/utils'
import { Plus, Edit2, Trash2, Package, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react'
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
})

function ProductForm({ onSubmit, defaultValues, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || { gstRate: 18, unit: 'PCS', stockQty: 0, minStockLevel: 5 },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="SKU *" placeholder="PROD-001" error={errors.sku?.message} {...register('sku')} />
        <Input label="Product Name *" placeholder="Aluminium Pipe" error={errors.name?.message} {...register('name')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Category" placeholder="Aluminium" {...register('category')} />
        <Input label="Unit" placeholder="PCS / MTR / KG" {...register('unit')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Purchase Price ₹" type="number" step="0.01" {...register('purchasePrice')} />
        <Input label="Selling Price ₹ *" type="number" step="0.01" error={errors.sellingPrice?.message} {...register('sellingPrice')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="GST Rate" {...register('gstRate')}>
          {gstRates.map(r => <option key={r} value={r}>{r}%</option>)}
        </Select>
        <Input label="Stock Quantity" type="number" {...register('stockQty')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Min Stock Level" type="number" {...register('minStockLevel')} />
        <Input label="Location" placeholder="Rack A-3" {...register('location')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="HSN Code" placeholder="7304" {...register('hsn')} />
        <Input label="Barcode" placeholder="8901234567890" {...register('barcode')} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>
          <span>{defaultValues ? 'Update Product' : 'Create Product'}</span>
        </Button>
      </div>
    </form>
  )
}

export default function Products() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const [category, setCategory] = useState('')
  const [status, setStatus]     = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, category, status],
    queryFn: () => productsAPI.list({ page, limit: 20, search, category, status }).then(r => r.data),
    keepPreviousData: true,
  })

  const createMut = useMutation({
    mutationFn: productsAPI.create,
    onSuccess: () => { qc.invalidateQueries(['products']); setShowAdd(false); toast.success('Product created') },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => productsAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['products']); setEditItem(null); toast.success('Product updated') },
  })

  const deleteMut = useMutation({
    mutationFn: productsAPI.delete,
    onSuccess: () => { qc.invalidateQueries(['products']); setDeleteId(null); toast.success('Product deleted') },
  })

  const products = data?.data || []
  const pagination = data?.meta?.pagination

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title gradient-text">Products</h1>
          <p className="text-slate-500 text-sm mt-1">{pagination?.total || 0} total products</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={16} /><span>Add Product</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search name, SKU, barcode…" />
          </div>
          <select className="glass-input rounded-xl px-3 py-2.5 text-sm min-w-36"
            value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}>
            <option value="">All Categories</option>
            <option value="Aluminium">Aluminium</option>
            <option value="Steel">Steel</option>
            <option value="PVC">PVC</option>
            <option value="Electrical">Electrical</option>
            <option value="Fasteners">Fasteners</option>
          </select>
          <select className="glass-input rounded-xl px-3 py-2.5 text-sm min-w-32"
            value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>SKU</Th>
              <Th>Product Name</Th>
              <Th>Category</Th>
              <Th className="text-right">Purchase ₹</Th>
              <Th className="text-right">Selling ₹</Th>
              <Th className="text-right">GST</Th>
              <Th className="text-right">Stock</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          {isLoading ? <TableSkeleton cols={9} /> : (
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <Td><code className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">{p.sku}</code></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      {p.stockQty < p.minStockLevel && (
                        <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
                      )}
                      <span className="font-medium text-slate-200">{p.name}</span>
                    </div>
                    {p.location && <p className="text-xs text-slate-500">{p.location}</p>}
                  </Td>
                  <Td><span className="text-slate-400">{p.category || '—'}</span></Td>
                  <Td className="text-right text-slate-400">{fmt.currency(p.purchasePrice)}</Td>
                  <Td className="text-right font-semibold text-slate-100">{fmt.currency(p.sellingPrice)}</Td>
                  <Td className="text-right text-slate-400">{p.gstRate}%</Td>
                  <Td className="text-right">
                    <span className={p.stockQty < p.minStockLevel ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                      {p.stockQty} {p.unit}
                    </span>
                  </Td>
                  <Td><Badge status={p.status} /></Td>
                  <Td>
                    <div className="flex items-center justify-end gap-2">
                      <button className="btn-icon" onClick={() => setEditItem(p)}><Edit2 size={14} /></button>
                      <button className="btn-icon hover:border-rose-500/40 hover:text-rose-400" onClick={() => setDeleteId(p._id)}><Trash2 size={14} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={9}>
                  <EmptyState
                    icon={Package}
                    title="No products found"
                    message="Try adjusting your search or filters, or add a new product."
                    action={{ label: 'Add Product', onClick: () => setShowAdd(true) }}
                  />
                </td></tr>
              )}
            </tbody>
          )}
        </Table>
        <div className="px-6 py-4">
          <Pagination meta={pagination} onPageChange={setPage} />
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Product" size="lg">
        <ProductForm onSubmit={(d) => createMut.mutate(d)} loading={createMut.isPending} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Product" size="lg">
        {editItem && (
          <ProductForm
            defaultValues={editItem}
            onSubmit={(d) => updateMut.mutate({ id: editItem._id, data: d })}
            loading={updateMut.isPending}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete Product"
        danger
      />
    </div>
  )
}
