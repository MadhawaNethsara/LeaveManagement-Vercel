import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: number | string
  name: string
  email: string
  role: string
  annual_leave_balance: number
  created_at?: string
}

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'leave-auth' }
  )
)
