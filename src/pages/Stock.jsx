import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { stockAPI, productsAPI } from '../services'
import { fmt } from '../lib/utils'
import { PackagePlus, ArrowUpDown, History, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import { Table, Th, Td } from '../components/ui/Table'
import SearchInput from '../components/ui/SearchInput'

function StockForm({ type, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm()
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Product ID" placeholder="Paste product _id" {...register('productId', { required: true })} />
      <Input label={type === 'adjust' ? 'New Stock Quantity' : 'Quantity to Add'}
        type="number" min={type === 'adjust' ? 0 : 1}
        {...register('quantity', { required: true, valueAsNumber: true })} />
      <Input label="Remarks" placeholder="Optional remarks…" {...register('remarks')} />
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}><span>{type === 'adjust' ? 'Adjust Stock' : 'Record Purchase'}</span></Button>
      </div>
    </form>
  )
}

const txIcon = { PURCHASE: TrendingUp, SALE: TrendingDown, ADJUSTMENT: Minus }
const txColor = { PURCHASE: 'text-emerald-400', SALE: 'text-rose-400', ADJUSTMENT: 'text-amber-400' }

export default function Stock() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const [showPurchase, setShowPurchase] = useState(false)
  const [showAdjust,   setShowAdjust]   = useState(false)
  const [ledgerProduct, setLedgerProduct] = useState(null)
  const [ledgerPage, setLedgerPage]       = useState(1)

  const { data: prodData, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => productsAPI.list({ page, limit: 20, search }).then(r => r.data),
    keepPreviousData: true,
  })

  const { data: lowData } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => productsAPI.lowStock(10).then(r => r.data.data),
  })

  const { data: ledgerData } = useQuery({
    queryKey: ['ledger', ledgerProduct?._id, ledgerPage],
    queryFn: () => stockAPI.getLedger(ledgerProduct._id, { page: ledgerPage, limit: 15 }).then(r => r.data),
    enabled: !!ledgerProduct,
    keepPreviousData: true,
  })

  const purchaseMut = useMutation({
    mutationFn: stockAPI.purchase,
    onSuccess: () => { qc.invalidateQueries(['products']); setShowPurchase(false); toast.success('Purchase recorded') },
  })
  const adjustMut = useMutation({
    mutationFn: stockAPI.adjust,
    onSuccess: () => { qc.invalidateQueries(['products']); setShowAdjust(false); toast.success('Stock adjusted') },
  })

  const products = prodData?.data || []
  const pagination = prodData?.meta?.pagination

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title gradient-text">Stock Management</h1>
          <p className="text-slate-500 text-sm mt-1">Track inventory levels and movements</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowAdjust(true)}>
            <ArrowUpDown size={16} /><span>Adjust Stock</span>
          </Button>
          <Button onClick={() => setShowPurchase(true)}>
            <PackagePlus size={16} /><span>Record Purchase</span>
          </Button>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {lowData?.length > 0 && (
        <div className="glass rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-amber-400 font-semibold text-sm">{lowData.length} Products Running Low</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowData.map(p => (
              <span key={p._id} className="badge badge-warning text-xs">
                {p.name} ({p.stockQty}/{p.minStockLevel})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="glass rounded-2xl p-4">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search products…" />
      </div>

      {/* Products table */}
      <div className="glass rounded-2xl overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>SKU</Th>
              <Th>Category</Th>
              <Th>Location</Th>
              <Th className="text-right">Stock</Th>
              <Th className="text-right">Min Level</Th>
              <Th>Status</Th>
              <Th className="text-right">Ledger</Th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isLow = p.stockQty < p.minStockLevel
              return (
                <tr key={p._id}>
                  <Td><span className="font-medium text-slate-200">{p.name}</span></Td>
                  <Td><code className="text-xs text-brand-400">{p.sku}</code></Td>
                  <Td><span className="text-slate-400">{p.category || '—'}</span></Td>
                  <Td><span className="text-slate-500 text-xs">{p.location || '—'}</span></Td>
                  <Td className="text-right">
                    <span className={`font-bold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {p.stockQty}
                    </span>
                    <span className="text-slate-500 text-xs ml-1">{p.unit}</span>
                  </Td>
                  <Td className="text-right text-slate-500">{p.minStockLevel}</Td>
                  <Td>
                    {isLow
                      ? <span className="badge badge-warning">Low Stock</span>
                      : <span className="badge badge-active">OK</span>}
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <button className="btn-icon" onClick={() => { setLedgerProduct(p); setLedgerPage(1) }}>
                        <History size={14} />
                      </button>
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </Table>
        <div className="px-6 py-4">
          <Pagination meta={pagination} onPageChange={setPage} />
        </div>
      </div>

      {/* Purchase Modal */}
      <Modal open={showPurchase} onClose={() => setShowPurchase(false)} title="Record Purchase">
        <StockForm type="purchase" onSubmit={purchaseMut.mutate} loading={purchaseMut.isPending} />
      </Modal>

      {/* Adjust Modal */}
      <Modal open={showAdjust} onClose={() => setShowAdjust(false)} title="Adjust Stock">
        <StockForm type="adjust" onSubmit={adjustMut.mutate} loading={adjustMut.isPending} />
      </Modal>

      {/* Ledger Modal */}
      <Modal open={!!ledgerProduct} onClose={() => setLedgerProduct(null)} title={`Stock Ledger – ${ledgerProduct?.name}`} size="lg">
        {ledgerData && (
          <>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(ledgerData.data || []).map((entry) => {
                const Icon = txIcon[entry.transactionType] || Minus
                return (
                  <div key={entry._id} className="flex items-center justify-between glass-dark rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg glass flex items-center justify-center ${txColor[entry.transactionType]}`}>
                        <Icon size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{entry.transactionType}</p>
                        <p className="text-xs text-slate-500">{entry.remarks || '—'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${entry.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                      </p>
                      <p className="text-xs text-slate-500">{entry.previousStock} → {entry.currentStock}</p>
                      <p className="text-xs text-slate-600">{fmt.dateTime(entry.createdAt)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4">
              <Pagination meta={ledgerData.meta?.pagination} onPageChange={setLedgerPage} />
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
