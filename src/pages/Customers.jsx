import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersAPI } from '../services'
import { fmt } from '../lib/utils'
import { Plus, Edit2, Trash2, Users, Phone, Building2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import SearchInput from '../components/ui/SearchInput'
import Pagination from '../components/ui/Pagination'
import { Table, Th, Td } from '../components/ui/Table'
import { TableSkeleton } from '../components/ui/Skeleton'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'

const schema = z.object({
  name:      z.string().min(1, 'Name required'),
  mobile:    z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile').optional().or(z.literal('')),
  gstNumber: z.string().optional().or(z.literal('')),
  address:   z.string().optional(),
  city:      z.string().optional(),
  state:     z.string().optional(),
  email:     z.string().email().optional().or(z.literal('')),
  notes:     z.string().optional(),
})

function CustomerForm({ onSubmit, defaultValues, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {},
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Name *" placeholder="Ramesh Traders" error={errors.name?.message} {...register('name')} />
        <Input label="Mobile" placeholder="9876543210" error={errors.mobile?.message} {...register('mobile')} />
      </div>
      <Input label="GST Number" placeholder="07AAACR5055K1Z5" {...register('gstNumber')} />
      <Input label="Address" placeholder="123, Main Market" {...register('address')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="City" placeholder="Delhi" {...register('city')} />
        <Input label="State" placeholder="Delhi" {...register('state')} />
      </div>
      <Input label="Email" type="email" placeholder="customer@email.com" {...register('email')} />
      <Input label="Notes" placeholder="Any notes…" {...register('notes')} />
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>
          <span>{defaultValues ? 'Update Customer' : 'Add Customer'}</span>
        </Button>
      </div>
    </form>
  )
}

export default function Customers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const [gstOnly, setGstOnly] = useState(false)
  const [showAdd, setShowAdd]   = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search, gstOnly],
    queryFn: () => customersAPI.list({ page, limit: 20, search, gstOnly }).then(r => r.data),
    keepPreviousData: true,
  })

  const createMut = useMutation({
    mutationFn: customersAPI.create,
    onSuccess: () => { qc.invalidateQueries(['customers']); setShowAdd(false); toast.success('Customer added') },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => customersAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['customers']); setEditItem(null); toast.success('Customer updated') },
  })
  const deleteMut = useMutation({
    mutationFn: customersAPI.delete,
    onSuccess: () => { qc.invalidateQueries(['customers']); setDeleteId(null); toast.success('Customer deleted') },
  })

  const customers = data?.data || []
  const pagination = data?.meta?.pagination

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title gradient-text">Customers</h1>
          <p className="text-slate-500 text-sm mt-1">{pagination?.total || 0} registered customers</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={16} /><span>Add Customer</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-48">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search name, mobile, GST…" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded accent-brand-500"
            checked={gstOnly} onChange={e => { setGstOnly(e.target.checked); setPage(1) }} />
          <span className="text-sm text-slate-400">GST customers only</span>
        </label>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Mobile</Th>
              <Th>GST Number</Th>
              <Th>City</Th>
              <Th>State</Th>
              <Th>Added On</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          {isLoading ? <TableSkeleton cols={7} /> : (
            <tbody>
              {customers.map((c) => (
                <tr key={c._id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500/20 to-purple-600/20 flex items-center justify-center">
                        <span className="text-brand-400 text-xs font-bold">{c.name[0]}</span>
                      </div>
                      <span className="font-medium text-slate-200">{c.name}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1 text-slate-400 text-sm">
                      <Phone size={12} />{c.mobile || '—'}
                    </div>
                  </Td>
                  <Td>
                    {c.gstNumber
                      ? <code className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{c.gstNumber}</code>
                      : <span className="text-slate-600 text-xs">No GST</span>}
                  </Td>
                  <Td><span className="text-slate-400">{c.city || '—'}</span></Td>
                  <Td><span className="text-slate-400">{c.state || '—'}</span></Td>
                  <Td><span className="text-slate-500 text-xs">{fmt.date(c.createdAt)}</span></Td>
                  <Td>
                    <div className="flex items-center justify-end gap-2">
                      <button className="btn-icon" onClick={() => setEditItem(c)}><Edit2 size={14} /></button>
                      <button className="btn-icon hover:border-rose-500/40 hover:text-rose-400" onClick={() => setDeleteId(c._id)}><Trash2 size={14} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={7}>
                  <EmptyState
                    icon={Users}
                    title="No customers found"
                    message="Try adjusting your search or add a new customer."
                    action={{ label: 'Add Customer', onClick: () => setShowAdd(true) }}
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

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Customer">
        <CustomerForm onSubmit={(d) => createMut.mutate(d)} loading={createMut.isPending} />
      </Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Customer">
        {editItem && <CustomerForm defaultValues={editItem} onSubmit={(d) => updateMut.mutate({ id: editItem._id, data: d })} loading={updateMut.isPending} />}
      </Modal>
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
        title="Delete Customer"
        message="Delete this customer? This cannot be undone."
        confirmLabel="Delete Customer"
        danger
      />
    </div>
  )
}
