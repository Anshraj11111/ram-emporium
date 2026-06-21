import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsAPI } from '../services'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Store, Upload, FileText, CreditCard, QrCode, PenLine, Trash2 } from 'lucide-react'
import UpiQR from '../components/ui/UpiQR'

const schema = z.object({
  shopName:        z.string().min(1, 'Shop name is required'),
  ownerName:       z.string().optional(),
  mobile:          z.string().optional(),
  email:           z.string().email().optional().or(z.literal('')),
  address:         z.string().optional(),
  city:            z.string().optional(),
  state:           z.string().optional(),
  pincode:         z.string().optional(),
  gstNumber:       z.string().optional(),
  invoicePrefix:   z.string().optional(),
  nonGstPrefix:    z.string().optional(),
  quotationPrefix: z.string().optional(),
  termsConditions: z.string().optional(),
  bankName:        z.string().optional(),
  bankAccountNo:   z.string().optional(),
  bankIfsc:        z.string().optional(),
  upiId:           z.string().optional(),
})

function Section({ icon: Icon, title, children }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
          <Icon size={16} className="text-brand-400" />
        </div>
        <h3 className="font-display font-semibold text-slate-200">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function Settings() {
  const qc = useQueryClient()
  const fileRef      = useRef()
  const signatureRef = useRef()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.get().then(r => r.data.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {},
  })

  useEffect(() => {
    if (settings) reset(settings)
  }, [settings, reset])

  const saveMut = useMutation({
    mutationFn: settingsAPI.update,
    onSuccess: () => { qc.invalidateQueries(['settings']); toast.success('Settings saved successfully') },
  })

  const logoMut = useMutation({
    mutationFn: (file) => settingsAPI.uploadLogo(file),
    onSuccess: () => { qc.invalidateQueries(['settings']); toast.success('Logo uploaded') },
  })

  const signatureMut = useMutation({
    mutationFn: (file) => settingsAPI.uploadSignature(file),
    onSuccess: () => { qc.invalidateQueries(['settings']); toast.success('Signature uploaded — will appear on PDF bills') },
  })

  const removeSignatureMut = useMutation({
    mutationFn: () => settingsAPI.removeSignature(),
    onSuccess: () => { qc.invalidateQueries(['settings']); toast.success('Signature removed') },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fadeIn max-w-3xl">
      <div>
        <h1 className="page-title gradient-text">Settings</h1>
        <p className="text-slate-500 text-xs mt-0.5">Shop details for bills and quotations</p>
      </div>

      <form onSubmit={handleSubmit(saveMut.mutate)} className="space-y-6">
        {/* Shop Info */}
        <Section icon={Store} title="Shop Information">
          <div className="space-y-4">
            {/* Logo */}
            <div>
              <label className="form-label">Shop Logo</label>
              <div className="flex items-center gap-4">
                {settings?.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                ) : (
                  <div className="w-16 h-16 rounded-xl glass flex items-center justify-center text-slate-500">
                    <Store size={24} />
                  </div>
                )}
                <div>
                  <input type="file" ref={fileRef} className="hidden" accept="image/*"
                    onChange={e => e.target.files[0] && logoMut.mutate(e.target.files[0])} />
                  <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()} loading={logoMut.isPending}>
                    <Upload size={14} /><span>Upload Logo</span>
                  </Button>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Shop Name *" placeholder="RAM EMPORIUM" error={errors.shopName?.message} {...register('shopName')} />
              <Input label="Owner Name" placeholder="Ram Kumar" {...register('ownerName')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Mobile" placeholder="9876543210" {...register('mobile')} />
              <Input label="Email" type="email" placeholder="info@ramemporium.com" {...register('email')} />
            </div>
            <Input label="Address" placeholder="123, Main Market, Near Clock Tower" {...register('address')} />
            <div className="grid grid-cols-3 gap-4">
              <Input label="City" placeholder="Delhi" {...register('city')} />
              <Input label="State" placeholder="Delhi" {...register('state')} />
              <Input label="Pincode" placeholder="110001" {...register('pincode')} />
            </div>
            <Input label="GST Number" placeholder="07AAACR5055K1Z5" {...register('gstNumber')} />
          </div>
        </Section>

        {/* Invoice Settings */}
        <Section icon={FileText} title="Invoice & Document Prefixes">
          <div className="grid grid-cols-3 gap-4">
            <Input label="GST Invoice Prefix" placeholder="GST" {...register('invoicePrefix')} />
            <Input label="Non-GST Prefix" placeholder="NONGST" {...register('nonGstPrefix')} />
            <Input label="Quotation Prefix" placeholder="QT" {...register('quotationPrefix')} />
          </div>
          <div className="mt-4 p-3 glass-dark rounded-xl text-xs text-slate-400">
            <p>Preview: <code className="text-brand-400">GST-2026-000001</code> · <code className="text-amber-400">NONGST-2026-000001</code> · <code className="text-cyan-400">QT-2026-000001</code></p>
          </div>
          <div className="mt-4">
            <label className="form-label">Terms & Conditions</label>
            <textarea
              rows={3}
              className="glass-input w-full rounded-xl px-4 py-3 text-sm resize-none"
              placeholder="Goods once sold will not be taken back. All disputes subject to Delhi jurisdiction."
              {...register('termsConditions')}
            />
          </div>
        </Section>

        {/* Bank Details */}
        <Section icon={CreditCard} title="Bank & Payment Details">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Bank Name" placeholder="State Bank of India" {...register('bankName')} />
            <Input label="Account Number" placeholder="1234567890" {...register('bankAccountNo')} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Input label="IFSC Code" placeholder="SBIN0001234" {...register('bankIfsc')} />
            <Input label="UPI ID" placeholder="ramemporium@upi" {...register('upiId')} />
          </div>

          {/* Live UPI QR Preview */}
          {settings?.upiId && (
            <div className="mt-6 p-4 glass-dark rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <QrCode size={16} className="text-brand-400" />
                <p className="text-sm font-semibold text-slate-300">Your UPI QR Code</p>
                <span className="text-xs text-slate-500">(customers scan this to pay)</span>
              </div>
              <div className="flex justify-center">
                <UpiQR
                  upiId={settings.upiId}
                  name={settings.shopName}
                  amount={0}
                  note="Payment to RAM EMPORIUM"
                  size={160}
                />
              </div>
            </div>
          )}
        </Section>

        {/* Signature */}
        <Section icon={PenLine} title="Authorised Signature">
          <p className="text-xs text-slate-500 mb-4">
            Upload your signature image — it will appear on all PDF bills and quotations above the "Authorised Signatory" line.
          </p>

          <div className="flex items-start gap-6">
            {/* Preview */}
            <div className="flex-shrink-0">
              {settings?.signatureUrl ? (
                <div className="relative">
                  <div className="w-52 h-20 rounded-xl border border-white/10 bg-white flex items-center justify-center overflow-hidden">
                    <img
                      src={settings.signatureUrl}
                      alt="Signature"
                      className="max-w-full max-h-full object-contain p-2"
                    />
                  </div>
                  <p className="text-xs text-emerald-400 mt-1.5 text-center">✓ Signature saved</p>
                </div>
              ) : (
                <div className="w-52 h-20 rounded-xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center text-slate-600 bg-white/3">
                  <PenLine size={20} className="mb-1 opacity-40" />
                  <p className="text-xs">No signature yet</p>
                </div>
              )}
            </div>

            {/* Upload */}
            <div className="flex-1">
              <input
                type="file"
                ref={signatureRef}
                className="hidden"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={e => e.target.files[0] && signatureMut.mutate(e.target.files[0])}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => signatureRef.current?.click()}
                loading={signatureMut.isPending}
              >
                <Upload size={14} />
                <span>{settings?.signatureUrl ? 'Replace Signature' : 'Upload Signature'}</span>
              </Button>
              {settings?.signatureUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => removeSignatureMut.mutate()}
                  loading={removeSignatureMut.isPending}
                >
                  <Trash2 size={14} />
                  <span>Remove Signature</span>
                </Button>
              )}
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <p>• PNG, JPG or WebP — max 2MB</p>
                <p>• Use a white/transparent background for best results</p>
                <p>• Recommended size: 400×150 px or wider</p>
                <p>• Will appear on all future PDF downloads</p>
              </div>
            </div>
          </div>

          {/* PDF preview mockup */}
          {settings?.signatureUrl && (
            <div className="mt-5 p-4 glass-dark rounded-2xl border border-white/5">
              <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-brand-500" />
                Preview — how it appears on PDF
              </p>
              <div className="bg-white rounded-xl p-4 flex flex-col items-end">
                <img
                  src={settings.signatureUrl}
                  alt="Signature preview"
                  className="max-h-14 object-contain mb-1"
                  style={{ maxWidth: 200 }}
                />
                <div className="w-52 border-t border-slate-300 pt-1 text-center">
                  <p className="text-xs text-slate-500">Authorised Signatory</p>
                  <p className="text-xs text-slate-400 font-medium">{settings.shopName || 'RAM EMPORIUM'}</p>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* Save button */}
        <div className="flex justify-end gap-3">
          <Button type="submit" loading={saveMut.isPending} size="lg">
            <span>Save Settings</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
