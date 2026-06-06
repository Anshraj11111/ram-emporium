import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productsAPI } from '../../services'
import { fmt } from '../../lib/utils'
import { Search, Package } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Reusable product search dropdown used in both Billing and Quotations.
 * - Shows all products on focus (before any typing)
 * - Filters as you type
 * - Scrollable list (max 280px height)
 * - Renders dropdown INSIDE the modal (no overflow clipping)
 */
export default function ProductSearchInput({ onSelect, excludeIds = [] }) {
  const [q, setQ]       = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef         = useRef(null)

  // Fetch: if q is empty show all (limit 30), else search
  const { data: allProducts } = useQuery({
    queryKey: ['products-all-dropdown'],
    queryFn:  () => productsAPI.list({ limit: 50 }).then(r => r.data.data),
    staleTime: 60000,
  })

  const { data: searchResults } = useQuery({
    queryKey: ['product-search-input', q],
    queryFn:  () => productsAPI.search(q, 20).then(r => r.data.data),
    enabled:  q.trim().length > 0,
  })

  // Which list to show
  const products = q.trim().length > 0
    ? (searchResults || [])
    : (allProducts   || [])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (product) => {
    if (excludeIds.includes(product._id)) {
      toast.error(`"${product.name}" already added`)
      return
    }
    onSelect(product)
    setQ('')
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      {/* Input */}
      <div className="flex items-center gap-2 glass-input rounded-xl px-3 py-2.5">
        <Search size={15} className="text-slate-500 flex-shrink-0" />
        <input
          type="text"
          className="bg-transparent text-sm text-slate-200 outline-none flex-1 placeholder-slate-600"
          placeholder="Type to search or click to see all products…"
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {q && (
          <button
            type="button"
            className="text-slate-500 hover:text-slate-300 text-xs"
            onClick={() => { setQ(''); setOpen(true) }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown — rendered inline, not portal, so modal clip doesn't matter */}
      {open && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 rounded-2xl border border-white/10 overflow-hidden"
          style={{
            background:    'rgba(10,10,30,0.98)',
            backdropFilter:'blur(20px)',
            boxShadow:     '0 10px 40px rgba(0,0,0,0.7)',
            maxHeight:     '280px',
            overflowY:     'auto',
          }}
        >
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <Package size={24} className="mb-2 opacity-40" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-2 border-b border-white/5">
                <p className="text-xs text-slate-500 font-medium">
                  {q ? `${products.length} results` : `All products (${products.length})`}
                </p>
              </div>

              {/* List */}
              {products.map(p => (
                <button
                  key={p._id}
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/6 transition-colors border-b border-white/4 last:border-0 text-left"
                  onClick={() => handleSelect(p)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-brand-400">{p.sku}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className={`text-xs font-medium ${
                        p.stockQty <= 0
                          ? 'text-rose-400'
                          : p.stockQty < (p.minStockLevel || 5)
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}>
                        Stock: {p.stockQty} {p.unit}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-sm font-bold text-slate-100">
                      {fmt.currency(p.sellingPrice)}
                    </p>
                    <p className="text-xs text-slate-500">GST {p.gstRate}%</p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
