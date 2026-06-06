import { clsx } from 'clsx'

export const cn = (...inputs) => clsx(inputs)

export const fmt = {
  currency: (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  number:   (n) => Number(n || 0).toLocaleString('en-IN'),
  date:     (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
  dateTime: (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
  percent:  (n) => `${Number(n || 0).toFixed(1)}%`,
}

export const truncate = (str, len = 30) =>
  str && str.length > len ? str.substring(0, len) + '...' : (str || '—')

export const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

export const statusColor = {
  DRAFT:             'badge-draft',
  SENT:              'badge-sent',
  APPROVED:          'badge-approved',
  REJECTED:          'badge-rejected',
  CONVERTED_TO_BILL: 'badge-converted',
  ACTIVE:            'badge-active',
  INACTIVE:          'badge-inactive',
  GST:               'badge-gst',
  NON_GST:           'badge-nongst',
}

export const statusLabel = {
  DRAFT:             'Draft',
  SENT:              'Sent',
  APPROVED:          'Approved',
  REJECTED:          'Rejected',
  CONVERTED_TO_BILL: 'Converted',
  ACTIVE:            'Active',
  INACTIVE:          'Inactive',
  GST:               'GST',
  NON_GST:           'Non-GST',
}

export const paymentModes = ['CASH', 'CARD', 'UPI', 'CREDIT', 'CHEQUE', 'NEFT', 'RTGS']
export const gstRates      = [0, 3, 5, 12, 18, 28]
export const billTypes     = ['GST', 'NON_GST']

export const calcItemAmounts = ({ quantity = 0, rate = 0, discountPercentage = 0, gstRate = 0 }) => {
  const discountAmount  = Math.round((rate * discountPercentage / 100) * 100) / 100
  const finalRate       = Math.round((rate - discountAmount) * 100) / 100
  const taxableAmount   = Math.round((finalRate * quantity) * 100) / 100
  const gstAmount       = Math.round((taxableAmount * gstRate / 100) * 100) / 100
  const totalAmount     = Math.round((taxableAmount + gstAmount) * 100) / 100
  return { discountAmount, finalRate, taxableAmount, gstAmount, totalAmount }
}

export const calcBillTotals = (items = [], overallDiscount = 0) => {
  const subtotal              = Math.round(items.reduce((s, i) => s + (i.taxableAmount || 0), 0) * 100) / 100
  const overallDiscountAmount = Math.round((subtotal * overallDiscount / 100) * 100) / 100
  const gstAmount             = Math.round(items.reduce((s, i) => s + (i.gstAmount || 0), 0) * 100) / 100
  const grandTotal            = Math.round((subtotal - overallDiscountAmount + gstAmount) * 100) / 100
  return { subtotal, overallDiscountAmount, gstAmount, grandTotal }
}
