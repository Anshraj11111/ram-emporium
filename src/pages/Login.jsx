import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const [showPwd, setShowPwd] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-animated flex items-center justify-center p-4 relative overflow-hidden">
      {/* Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Grid overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="w-full max-w-md relative z-10 animate-fadeInUp">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 shadow-2xl mb-4 animate-pulse-glow">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold gradient-text">RAM EMPORIUM</h1>
          <p className="text-slate-500 text-sm mt-1">Billing & Inventory Management</p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl border border-white/8">
          <div className="mb-6">
            <h2 className="text-xl font-display font-semibold text-slate-100">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@ramemporium.com"
              icon={Mail}
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`glass-input w-full rounded-xl px-4 py-3 pl-10 pr-11 text-sm ${errors.password ? 'border-rose-500/60' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-rose-400">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full justify-center py-3">
              <span>Sign In</span>
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-3 rounded-xl glass-dark border border-white/5 text-center">
            <p className="text-xs text-slate-500">Demo: <span className="text-slate-400">admin@ramemporium.com</span> / <span className="text-slate-400">Admin@12345</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
