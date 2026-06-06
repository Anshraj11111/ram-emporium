import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, KeyRound, Lock, ArrowLeft, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../services'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const emailSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

const resetSchema = z.object({
  email:       z.string().email(),
  otp:         z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8).regex(/[A-Z]/, 'Need 1 uppercase').regex(/[0-9]/, 'Need 1 number'),
})

export default function ForgotPassword() {
  const [step, setStep] = useState(1) // 1=email, 2=otp+reset
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  const emailForm = useForm({ resolver: zodResolver(emailSchema) })
  const resetForm = useForm({ resolver: zodResolver(resetSchema) })

  const sendOtp = async (data) => {
    try {
      await authAPI.forgotPassword({ email: data.email })
      setEmail(data.email)
      resetForm.setValue('email', data.email)
      setStep(2)
      toast.success('OTP sent to your email')
    } catch {
      toast.error('Failed to send OTP')
    }
  }

  const resetPassword = async (data) => {
    try {
      await authAPI.resetPassword(data)
      toast.success('Password reset successfully!')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Reset failed')
    }
  }

  return (
    <div className="min-h-screen bg-animated flex items-center justify-center p-4 relative overflow-hidden">
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }}
      />

      <div className="w-full max-w-md relative z-10 animate-fadeInUp">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 shadow-2xl mb-4 animate-pulse-glow">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold gradient-text">RAM EMPORIUM</h1>
          <p className="text-slate-500 text-sm mt-1">Password Recovery</p>
        </div>

        <div className="glass rounded-3xl p-8 shadow-2xl">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            {[
              { n: 1, icon: Mail,    label: 'Enter Email' },
              { n: 2, icon: KeyRound,label: 'Reset Password' },
            ].map(({ n, icon: Icon, label }) => (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= n
                    ? 'bg-gradient-to-br from-brand-500 to-purple-600 text-white'
                    : 'bg-white/5 text-slate-500'
                }`}>
                  {n}
                </div>
                <span className={`text-xs font-medium ${step >= n ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
                {n < 2 && <div className={`flex-1 h-px ${step > n ? 'bg-brand-500' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-display font-semibold text-slate-100">Forgot Password?</h2>
                <p className="text-slate-500 text-sm mt-1">Enter your email and we'll send you an OTP</p>
              </div>
              <form onSubmit={emailForm.handleSubmit(sendOtp)} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="your@email.com"
                  icon={Mail}
                  error={emailForm.formState.errors.email?.message}
                  {...emailForm.register('email')}
                />
                <Button type="submit" loading={emailForm.formState.isSubmitting} className="w-full justify-center py-3">
                  <span>Send OTP</span>
                </Button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-display font-semibold text-slate-100">Reset Password</h2>
                <p className="text-slate-500 text-sm mt-1">
                  OTP sent to <span className="text-brand-400">{email}</span>
                </p>
              </div>
              <form onSubmit={resetForm.handleSubmit(resetPassword)} className="space-y-4">
                <input type="hidden" {...resetForm.register('email')} />
                <div>
                  <label className="form-label">Enter 6-digit OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    className="glass-input w-full rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-bold"
                    placeholder="000000"
                    {...resetForm.register('otp')}
                  />
                  {resetForm.formState.errors.otp && (
                    <p className="mt-1.5 text-xs text-rose-400">{resetForm.formState.errors.otp.message}</p>
                  )}
                </div>
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  icon={Lock}
                  error={resetForm.formState.errors.newPassword?.message}
                  {...resetForm.register('newPassword')}
                />
                <Button type="submit" loading={resetForm.formState.isSubmitting} className="w-full justify-center py-3">
                  <span>Reset Password</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors mt-2 flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-brand-400 hover:text-brand-300 transition-colors flex items-center justify-center gap-1">
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
