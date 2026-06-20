import api from '../lib/axios'

// ── Helper: remove empty/undefined params ─────────
const clean = (params = {}) => {
  const result = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v !== undefined && v !== null) result[k] = v
  }
  return result
}

// ── Auth ─────────────────────────────────────────
export const authAPI = {
  login:          (d)    => api.post('/auth/login', d),
  register:       (d)    => api.post('/auth/register', d),
  logout:         ()     => api.post('/auth/logout'),
  me:             ()     => api.get('/auth/me'),
  forgotPassword: (d)    => api.post('/auth/forgot-password', d),
  resetPassword:  (d)    => api.post('/auth/reset-password', d),
  changePassword: (d)    => api.post('/auth/change-password', d),
  verifyEmail:    (d)    => api.post('/auth/verify-email', d),
  refreshToken:   (d)    => api.post('/auth/refresh-token', d),
}

// ── Dashboard ─────────────────────────────────────
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard'),
}

// ── Products ──────────────────────────────────────
export const productsAPI = {
  list:      (params) => api.get('/products', { params: clean(params) }),
  search:    (q, limit = 15) => api.get('/products/search', { params: { q, limit } }),
  getById:   (id)     => api.get(`/products/${id}`),
  create:    (d)      => api.post('/products', d),
  update:    (id, d)  => api.put(`/products/${id}`, d),
  delete:    (id)     => api.delete(`/products/${id}`),
  lowStock:  (limit)  => api.get('/products/low-stock', { params: clean({ limit }) }),
}

// ── Customers ─────────────────────────────────────
export const customersAPI = {
  list:    (params) => api.get('/customers', { params: clean(params) }),
  getById: (id)     => api.get(`/customers/${id}`),
  create:  (d)      => api.post('/customers', d),
  update:  (id, d)  => api.put(`/customers/${id}`, d),
  delete:  (id)     => api.delete(`/customers/${id}`),
}

// ── Stock ─────────────────────────────────────────
export const stockAPI = {
  purchase:  (d)          => api.post('/stock/purchase', d),
  adjust:    (d)          => api.post('/stock/adjust', d),
  getLedger: (id, params) => api.get(`/stock/ledger/${id}`, { params: clean(params) }),
}

// ── Quotations ────────────────────────────────────
export const quotationsAPI = {
  list:             (params)     => api.get('/quotations', { params: clean(params) }),
  getById:          (id)         => api.get(`/quotations/${id}`),
  create:           (d)          => api.post('/quotations', d),
  update:           (id, d)      => api.put(`/quotations/${id}`, d),
  delete:           (id)         => api.delete(`/quotations/${id}`),
  updateStatus:     (id, status) => api.patch(`/quotations/${id}/status`, { status }),
  duplicate:        (id)         => api.post(`/quotations/${id}/duplicate`),
  generatePDF:      (id)         => api.post(`/quotations/${id}/generate-pdf`),
  getForConversion: (id)         => api.get(`/quotations/${id}/convert-preview`),
}

// ── Bills ─────────────────────────────────────────
export const billsAPI = {
  list:             (params) => api.get('/bills', { params: clean(params) }),
  getById:          (id)     => api.get(`/bills/${id}`),
  create:           (d)      => api.post('/bills', d),
  convertQuotation: (qId, d) => api.post(`/bills/convert/${qId}`, d),
  generatePDF:      (id)     => api.post(`/bills/${id}/generate-pdf`),
  delete:           (id)     => api.delete(`/bills/${id}`),
}

// ── Reports ───────────────────────────────────────
export const reportsAPI = {
  daily:              (params) => api.get('/reports/daily',               { params: clean(params) }),
  monthly:            (params) => api.get('/reports/monthly',             { params: clean(params) }),
  yearly:             (params) => api.get('/reports/yearly',              { params: clean(params) }),
  productWise:        (params) => api.get('/reports/product-wise',        { params: clean(params) }),
  customerWise:       (params) => api.get('/reports/customer-wise',       { params: clean(params) }),
  topSelling:         (params) => api.get('/reports/top-selling',         { params: clean(params) }),
  lowStock:           ()       => api.get('/reports/low-stock'),
  profit:             (params) => api.get('/reports/profit',              { params: clean(params) }),
  dayWiseProducts:    (params) => api.get('/reports/day-wise-products',   { params: clean(params) }),
  monthWiseProducts:  (params) => api.get('/reports/month-wise-products', { params: clean(params) }),
  stockTimeline:      (params) => api.get('/reports/stock-timeline',       { params: clean(params) }),
}

// ── Settings ──────────────────────────────────────
export const settingsAPI = {
  get:    ()    => api.get('/settings'),
  update: (d)   => api.put('/settings', d),
  uploadLogo: (file) => {
    const fd = new FormData()
    fd.append('logo', file)
    return api.post('/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  uploadSignature: (file) => {
    const fd = new FormData()
    fd.append('signature', file)
    return api.post('/settings/signature', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

// ── Notifications ─────────────────────────────────
export const notificationsAPI = {
  getAll:      (params) => api.get('/notifications', { params: clean(params) }),
  markRead:    (id)     => api.patch(`/notifications/${id}/read`),
  markAllRead: ()       => api.patch('/notifications/read-all'),
}

// ── Custom Bills (no stock connection) ───────────
export const customBillsAPI = {
  list:        (params) => api.get('/custom-bills', { params: clean(params) }),
  getById:     (id)     => api.get(`/custom-bills/${id}`),
  create:      (d)      => api.post('/custom-bills', d),
  delete:      (id)     => api.delete(`/custom-bills/${id}`),
  generatePDF: (id)     => api.post(`/custom-bills/${id}/generate-pdf`),
}
export const usersAPI = {
  list:       (params) => api.get('/users', { params: clean(params) }),
  getById:    (id)     => api.get(`/users/${id}`),
  update:     (id, d)  => api.put(`/users/${id}`, d),
  activate:   (id)     => api.patch(`/users/${id}/activate`),
  deactivate: (id)     => api.patch(`/users/${id}/deactivate`),
}
