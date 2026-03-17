import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const login = (email: string, password: string) =>
  api.post<{ data: { user: any; token: string } }>('/auth/login', { email, password })

export const register = (name: string, email: string, password: string, role?: string) =>
  api.post('/auth/register', { name, email, password, role })

// Dashboard
export const getDashboardStats = () =>
  api.get<{ data: { total_employees: number; pending_leaves: number; approved_leaves: number; rejected_leaves: number } }>('/dashboard/stats')

// Employees (admin)
export const getEmployees = (params?: { search?: string; limit?: number; offset?: number }) =>
  api.get<{ data: any[]; total: number }>('/employees', { params })

export const getEmployee = (id: number | string) =>
  api.get<{ data: any }>(`/employees/${id}`)

export const createEmployee = (data: { name: string; email: string; password: string; role?: string; annual_leave_balance?: number }) =>
  api.post<{ data: any }>('/employees', data)

export const updateEmployee = (id: number | string, data: Partial<{ name: string; email: string; role: string; annual_leave_balance: number; password: string }>) =>
  api.put<{ data: any }>(`/employees/${id}`, data)

export const deleteEmployee = (id: number | string) =>
  api.delete(`/employees/${id}`)

// Leaves
export const applyLeave = (data: { start_date: string; end_date: string; reason?: string; leave_type?: string }) =>
  api.post<{ data: any }>('/leaves', data)

export const getMyLeaves = (params?: { status?: string; from?: string; to?: string; limit?: number; offset?: number }) =>
  api.get<{ data: any[]; total: number }>('/leaves/me', { params })

export const getAllLeaves = (params?: { status?: string; from?: string; to?: string; limit?: number; offset?: number }) =>
  api.get<{ data: any[]; total: number }>('/leaves', { params })

export const updateLeaveStatus = (id: number | string, status: 'approved' | 'rejected', comment?: string) =>
  api.patch(`/leaves/${id}/status`, { status, comment })

export default api
