import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/axios'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password })
        const { accessToken, refreshToken, user } = data.data
        localStorage.setItem('accessToken',  accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ user, accessToken, refreshToken, isAuthenticated: true })
        return user
      },

      logout: async () => {
        try { await api.post('/auth/logout') } catch {}
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      setUser: (user) => set({ user }),

      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'ram-auth',
      partialize: (state) => ({
        user:          state.user,
        accessToken:   state.accessToken,
        refreshToken:  state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
