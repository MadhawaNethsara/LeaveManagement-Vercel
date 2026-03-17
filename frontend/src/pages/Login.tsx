import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { login } from '../services/api'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Email and password required')
      return
    }
    setLoading(true)
    try {
      const res = await login(email, password)
      // Axios puts response body in res.data; API returns { data: { user, token } }
      const body = res.data as { data?: { user?: unknown; token?: string }; user?: unknown; token?: string }
      const user = body?.data?.user ?? body?.user
      const token = body?.data?.token ?? body?.token
      if (!user || !token) {
        toast.error('Invalid response from server')
        return
      }
      setAuth(user as any, token)
      toast.success('Welcome back!')
      // Defer navigate so auth state (and persist) is committed before PrivateRoute reads it
      setTimeout(() => navigate('/', { replace: true }), 0)
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.message ?? 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-surface-100 px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="card shadow-modal p-6 sm:p-8 md:p-10">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-surface-900 sm:text-3xl">
              Leave Management
            </h1>
            <p className="mt-2 text-sm text-surface-500 sm:text-base">Sign in to your account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-surface-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-surface-500">
            Demo: admin@company.com / password
          </p>
        </div>
      </div>
    </div>
  )
}
