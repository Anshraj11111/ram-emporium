import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { authAPI } from '../services'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { User, Lock, Shield, Calendar } from 'lucide-react'
import { fmt } from '../lib/utils'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z
    .string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Need at least 1 uppercase letter')
    .regex(/[0-9]/, 'Need at least 1 number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

function Section({ icon: Icon, title, children }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
          <Icon size={15} className="text-brand-400" />
        </div>
        <h3 className="font-display font-semibold text-slate-200">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function Profile() {
  const { user } = useAuthStore()
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd,     setShowNewPwd]     = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema),
  })

  const changePwdMut = useMutation({
    mutationFn: authAPI.changePassword,
    onSuccess: () => {
      toast.success('Password changed! Please log in again on other devices.')
      reset()
    },
  })

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div>
        <h1 className="page-title gradient-text">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">View your account details and manage password</p>
      </div>

      {/* Avatar + info */}
      <Section icon={User} title="Account Information">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-brand-500/30 flex-shrink-0">
            <span className="text-white font-display font-bold text-3xl">
              {user?.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-slate-100">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Shield size={13} className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 capitalize">{user?.role}</span>
              {user?.isVerified && (
                <span className="badge badge-active ml-1">Verified</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Full Name',  value: user?.name },
            { label: 'Email',      value: user?.email },
            { label: 'Role',       value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—' },
            { label: 'Member Since', value: fmt.date(user?.createdAt) },
          ].map(({ label, value }) => (
            <div key={label} className="glass-dark rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-sm font-medium text-slate-200">{value || '—'}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Change Password */}
      <Section icon={Lock} title="Change Password">
        <form onSubmit={handleSubmit(changePwdMut.mutate)} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter current password"
            icon={Lock}
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            icon={Lock}
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password"
            icon={Lock}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {/* Password rules */}
          <div className="glass-dark rounded-xl p-3 text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-400 mb-2">Password must have:</p>
            <p>✓ At least 8 characters</p>
            <p>✓ At least 1 uppercase letter (A-Z)</p>
            <p>✓ At least 1 number (0-9)</p>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={changePwdMut.isPending}>
              <span>Update Password</span>
            </Button>
          </div>
        </form>
      </Section>
    </div>
  )
}
