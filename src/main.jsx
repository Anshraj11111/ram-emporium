import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime:          1000 * 60 * 5,   // 5 min — don't refetch if data is fresh
      gcTime:             1000 * 60 * 10,  // 10 min — keep in cache
      refetchOnWindowFocus: false,
      refetchOnMount:     false,           // don't refetch if data already in cache
    },
  },
})

// ── Keep backend alive (ping every 14 min to prevent cold starts) ──
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://ram-emporium-backend.onrender.com'
const pingBackend = () => fetch(`${BACKEND_URL}/health`, { method: 'GET' }).catch(() => {})
pingBackend() // ping on app load
setInterval(pingBackend, 14 * 60 * 1000) // then every 14 minutes

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(15,15,40,0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f1f5f9',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
