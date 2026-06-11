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
import ProductSearchInput from '../components/billing/ProductSearchInput'

const txIcon  = { PURCHASE: TrendingUp, SALE: TrendingDown, ADJUSTMENT: Minus }
const txColor = { PURCHASE: 'text-emerald-400', SALE: 'text-rose-400', ADJUSTMENT: 'text-amber-400' }

function StockForm({ type, onSubmit, loading }) {
  const { register, handleSubmit, setValue, watch } = useForm()
  const [selectedProduct, setSelectedProduct] = useState(null)

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setValue('productId', product._id)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Product Search */}
      <div>
        <label className="form-label">Select Product *</label>
        {selectedProduct ? (
          <div className="flex items-center justify-between glass-dark rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-200">{selectedProduct.name}</p>
              <p className="text-xs text-slate-500">
                {selectedProduct.sku} · Current Stock: <span className="text-emerald-400 font-bold">{selectedProduct.stockQty} {selectedProduct.unit}</span>
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors ml-3"
              onClick={() => { setSelectedProduct(null); setValue('productId', '') }}
            >
              Change
            </button>
          </div>
        ) : (
          <ProductSearchInput onSelect={handleProductSelect} excludeIds={[]} />
        )}
        <input type="hidden" {...register('productId', { required: true })} />
      </div>

      {/* Quantity */}
      <div>
        <label className="form-label">
          {type === 'adjust' ? 'Set New Stock Quantity *' : 'Quantity to Add *'}
        </label>
        <input
          type="number"
          min={type === 'adjust' ? 0 : 1}
          placeholder={type === 'adjust' ? 'Enter new total quantity' : 'How many units received?'}
          className="glass-input w-full rounded-xl px-4 py-3 text-sm"
          {...register('quantity', { required: true, valueAsNumber: true, min: type === 'adjust' ? 0 : 1 })}
        />
        {type === 'adjust' && (
          <p className="text-xs text-slate-500 mt-1">
            This sets the stock to the exact number you enter (e.g. after physical count)
          </p>
        )}
      </div>

      {/* Remarks */}
      <Input
        label="Remarks (optional)"
        placeholder={type === 'adjust' ? 'e.g. Physical stock count' : 'e.g. Received from supplier'}
        {...register('remarks')}
      />

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          <span>{type === 'adjust' ? 'Adjust Stock' : 'Record Purchase'}</span>
        </Button>
      </div>
    </form>
  )
}

// Mobile card for a stock product row
function StockCard({ product, onLedger }) {
  const isLow = product.stockQty < product.minStockLevel
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-200 truncate">{product.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <code className="text-xs text-brand-400">{product.sku}</code>
            {product.category && <span className="text-xs text-slate-500">{product.category}</span>}
          </div>
        </div>
        {isLow
          ? <span className="badge badge-warning text-xs flex-shrink-0">Low</span>
          : <span className="badge badge-active text-xs flex-shrink-0">OK</span>}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="glass-dark rounded-xl p-2">
          <p className="text-xs text-slate-500 mb-0.5">Stock</p>
          <p className={`text-base font-bold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
            {product.stockQty}
          </p>
          <p className="text-xs text-slate-600">{product.unit}</p>
        </div>
        <div className="glass-dark rounded-xl p-2">
          <p className="text-xs text-slate-500 mb-0.5">Min</p>
          <p className="text-base font-bold text-slate-300">{product.minStockLevel}</p>
          <p className="text-xs text-slate-600">{product.unit}</p>
        </div>
        <div className="glass-dark rounded-xl p-2">
          <p className="text-xs text-slate-500 mb-0.5">Location</p>
          <p className="text-xs font-medium text-slate-300 mt-1">{product.location || '—'}</p>
        </div>
      </div>

      <div className="flex justify-end mt-3">
        <button className="btn-icon" onClick={() => onLedger(product)} data-tooltip="Ledger">
          <History size={15} />
        </button>
      </div>
    </div>
  )
}

export default function Stock() {
  const qc = useQueryClient()
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [showPurchase, setShowPurchase] = useState(false)
  const [showAdjust,   setShowAdjust]   = useState(false)
  const [ledgerProduct, setLedgerProduct] = useState(null)
  const [ledgerPage, setLedgerPage]       = useState(1)
  const isMobile = window.innerWidth < 768

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

  const products   = prodData?.data          || []
  const pagination = prodData?.meta?.pagination

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title gradient-text">Stock</h1>
          <p className="text-slate-500 text-xs mt-0.5">Track inventory levels</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs px-3 py-2" onClick={() => setShowAdjust(true)}>
            <ArrowUpDown size={14} />
            {!isMobile && <span>Adjust</span>}
          </button>
          <Button size="sm" onClick={() => setShowPurchase(true)}>
            <PackagePlus size={14} />
            <span>{isMobile ? 'Purchase' : 'Record Purchase'}</span>
          </Button>
        </div>
      </div>

      {/* Low stock alert */}
      {lowData?.length > 0 && (
        <div className="glass rounded-2xl p-3 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-amber-400 font-semibold text-sm">{lowData.length} items low</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {lowData.slice(0, 5).map(p => (
              <span key={p._id} className="badge badge-warning text-xs">
                {p.name} ({p.stockQty})
              </span>
            ))}
            {lowData.length > 5 && (
              <span className="text-xs text-amber-400">+{lowData.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="glass rounded-2xl p-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search products…" />
      </div>

      {/* Mobile cards / Desktop table */}
      {isMobile ? (
        <div className="space-y-3">
          {isLoading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="glass rounded-2xl p-4 space-y-3">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(3)].map((_, j) => <div key={j} className="skeleton h-14 rounded-xl" />)}
                  </div>
                </div>
              ))
            : products.map(p => (
                <StockCard key={p._id} product={p} onLedger={(prod) => { setLedgerProduct(prod); setLedgerPage(1) }} />
              ))}
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <Table>
            <thead><tr>
              <Th>Product</Th><Th>SKU</Th><Th>Category</Th>
              <Th>Location</Th><Th className="text-right">Stock</Th>
              <Th className="text-right">Min</Th><Th>Status</Th><Th className="text-right">Ledger</Th>
            </tr></thead>
            <tbody>
              {products.map(p => {
                const isLow = p.stockQty < p.minStockLevel
                return (
                  <tr key={p._id}>
                    <Td><span className="font-medium text-slate-200">{p.name}</span></Td>
                    <Td><code className="text-xs text-brand-400">{p.sku}</code></Td>
                    <Td><span className="text-slate-400">{p.category || '—'}</span></Td>
                    <Td><span className="text-slate-500 text-xs">{p.location || '—'}</span></Td>
                    <Td className="text-right">
                      <span className={`font-bold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>{p.stockQty}</span>
                      <span className="text-slate-500 text-xs ml-1">{p.unit}</span>
                    </Td>
                    <Td className="text-right text-slate-500">{p.minStockLevel}</Td>
                    <Td>{isLow ? <span className="badge badge-warning">Low</span> : <span className="badge badge-active">OK</span>}</Td>
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
          <div className="px-4 py-3"><Pagination meta={pagination} onPageChange={setPage} /></div>
        </div>
      )}

      {isMobile && <Pagination meta={pagination} onPageChange={setPage} />}

      <Modal open={showPurchase} onClose={() => setShowPurchase(false)} title="Record Purchase">
        <StockForm type="purchase" onSubmit={purchaseMut.mutate} loading={purchaseMut.isPending} />
      </Modal>
      <Modal open={showAdjust} onClose={() => setShowAdjust(false)} title="Adjust Stock">
        <StockForm type="adjust" onSubmit={adjustMut.mutate} loading={adjustMut.isPending} />
      </Modal>

      {/* Ledger Modal */}
      <Modal open={!!ledgerProduct} onClose={() => setLedgerProduct(null)} title={`Ledger – ${ledgerProduct?.name}`} size="lg">
        {ledgerData && (
          <>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(ledgerData.data || []).map((entry) => {
                const Icon = txIcon[entry.transactionType] || Minus
                return (
                  <div key={entry._id} className="flex items-center justify-between glass-dark rounded-xl p-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg glass flex items-center justify-center flex-shrink-0 ${txColor[entry.transactionType]}`}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200">{entry.transactionType}</p>
                        <p className="text-xs text-slate-500 truncate">{entry.remarks || '—'}</p>
                        <p className="text-xs text-slate-600">{fmt.dateTime(entry.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${entry.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                      </p>
                      <p className="text-xs text-slate-500">{entry.previousStock}→{entry.currentStock}</p>
                    </div>
                  </div>
                )
              })}
              {!ledgerData.data?.length && (
                <p className="text-center text-slate-500 text-sm py-6">No ledger entries yet</p>
              )}
            </div>
            <div className="mt-3">
              <Pagination meta={ledgerData.meta?.pagination} onPageChange={setLedgerPage} />
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
