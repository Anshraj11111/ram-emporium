import axios from 'axios'
import toast from 'react-hot-toast'

// Production: use VITE_API_URL env variable
// Development: use Vite proxy (/api → localhost:5000)
const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach token ─────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 / refresh ────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

const clearSession = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  // Clear zustand persisted store so login screen shows fresh
  localStorage.removeItem('ram-auth')
  window.location.href = '/login'
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry the refresh-token call itself — avoid infinite loop
      if (originalRequest.url?.includes('/auth/refresh-token')) {
        clearSession()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        isRefreshing = false
        clearSession()
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post('/api/v1/auth/refresh-token', { refreshToken })
        const { accessToken, refreshToken: newRefresh } = data.data

        // Persist new tokens
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefresh)

        // Sync zustand store so persisted state stays consistent
        try {
          const stored = localStorage.getItem('ram-auth')
          if (stored) {
            const parsed = JSON.parse(stored)
            parsed.state.accessToken  = accessToken
            parsed.state.refreshToken = newRefresh
            localStorage.setItem('ram-auth', JSON.stringify(parsed))
          }
        } catch {}

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        clearSession()
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    // Show error toast for non-401 server errors
    const message = error.response?.data?.error?.message || 'Something went wrong'
    if (error.response?.status !== 401) {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

export default api
