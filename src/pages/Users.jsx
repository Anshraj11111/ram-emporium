import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI, authAPI } from '../services'
import { fmt } from '../lib/utils'
import { Plus, UserCheck, UserX, Shield } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useState } from 'react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import Pagination from '../components/ui/Pagination'
import { Table, Th, Td } from '../components/ui/Table'
import { TableSkeleton } from '../components/ui/Skeleton'

function RegisterForm({ onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { role: 'staff' },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Full Name *" placeholder="Staff Name" {...register('name', { required: true })} />
      <Input label="Email *" type="email" placeholder="staff@ramemporium.com" {...register('email', { required: true })} />
      <Input label="Password *" type="password" placeholder="Min 8 chars with uppercase & number" {...register('password', { required: true })} />
      <Select label="Role" {...register('role')}>
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
      </Select>
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}><span>Create User</span></Button>
      </div>
    </form>
  )
}

export default function Users() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => usersAPI.list({ page, limit: 20 }).then(r => r.data),
    keepPreviousData: true,
  })

  const registerMut = useMutation({
    mutationFn: authAPI.register,
    onSuccess: () => { qc.invalidateQueries(['users']); setShowCreate(false); toast.success('User created — ask them to verify email') },
  })

  const deactivateMut = useMutation({
    mutationFn: usersAPI.deactivate,
    onSuccess: () => { qc.invalidateQueries(['users']); toast.success('User deactivated') },
  })

  const activateMut = useMutation({
    mutationFn: usersAPI.activate,
    onSuccess: () => { qc.invalidateQueries(['users']); toast.success('User activated') },
  })

  const users = data?.data || []
  const pagination = data?.meta?.pagination

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title gradient-text">User Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage team access and roles</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16}/><span>Add User</span></Button>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <Table>
          <thead><tr>
            <Th>User</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Verified</Th>
            <Th>Status</Th>
            <Th>Last Login</Th>
            <Th>Joined</Th>
            <Th className="text-right">Actions</Th>
          </tr></thead>
          {isLoading ? <TableSkeleton cols={8} /> : (
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500/30 to-purple-600/30 flex items-center justify-center border border-brand-500/20">
                        <span className="text-brand-400 text-xs font-bold">{u.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-slate-200">{u.name}</span>
                    </div>
                  </Td>
                  <Td><span className="text-slate-400 text-sm">{u.email}</span></Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      {u.role === 'admin' && <Shield size={13} className="text-amber-400" />}
                      <span className={`text-sm font-medium capitalize ${u.role === 'admin' ? 'text-amber-400' : 'text-slate-300'}`}>
                        {u.role}
                      </span>
                    </div>
                  </Td>
                  <Td>
                    {u.isVerified
                      ? <span className="badge badge-active">Verified</span>
                      : <span className="badge badge-warning">Pending</span>}
                  </Td>
                  <Td>
                    {u.isActive
                      ? <span className="badge badge-active">Active</span>
                      : <span className="badge badge-inactive">Inactive</span>}
                  </Td>
                  <Td><span className="text-slate-500 text-xs">{u.lastLoginAt ? fmt.date(u.lastLoginAt) : '—'}</span></Td>
                  <Td><span className="text-slate-500 text-xs">{fmt.date(u.createdAt)}</span></Td>
                  <Td>
                    <div className="flex items-center justify-end gap-2">
                      {u.isActive ? (
                        <button className="btn-icon hover:text-rose-400" onClick={() => deactivateMut.mutate(u._id)}>
                          <UserX size={14} />
                        </button>
                      ) : (
                        <button className="btn-icon hover:text-emerald-400" onClick={() => activateMut.mutate(u._id)}>
                          <UserCheck size={14} />
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          )}
        </Table>
        <div className="px-6 py-4">
          <Pagination meta={pagination} onPageChange={setPage} />
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New User">
        <RegisterForm onSubmit={registerMut.mutate} loading={registerMut.isPending} />
      </Modal>
    </div>
  )
}
