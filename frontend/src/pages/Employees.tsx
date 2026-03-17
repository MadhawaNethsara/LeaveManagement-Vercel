import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../services/api'
import toast from 'react-hot-toast'
import { TableSkeleton } from '../components/LoadingSkeleton'
import DataTable, { Pagination } from '../components/DataTable'
import PageHeader from '../components/PageHeader'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const PAGE_SIZE = 10

export default function Employees() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', annual_leave_balance: 20 })

  const { data, isLoading, error } = useQuery({
    queryKey: ['employees', page, search],
    queryFn: async () => {
      const res = await getEmployees({ search: search || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      return res.data
    },
  })

  const createMut = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Employee created')
      setModal(null)
      setForm({ name: '', email: '', password: '', role: 'employee', annual_leave_balance: 20 })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Create failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee updated')
      setModal(null)
      setEditingId(null)
      setForm({ name: '', email: '', password: '', role: 'employee', annual_leave_balance: 20 })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Employee deleted')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Delete failed'),
  })

  const employees = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const openEdit = (emp: any) => {
    setEditingId(emp.id)
    setForm({
      name: emp.name,
      email: emp.email,
      password: '',
      role: emp.role,
      annual_leave_balance: emp.annual_leave_balance ?? 20,
    })
    setModal('edit')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (modal === 'create') {
      if (!form.password || form.password.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }
      createMut.mutate(form)
    } else if (modal === 'edit' && editingId) {
      const payload: any = { name: form.name, email: form.email, role: form.role, annual_leave_balance: form.annual_leave_balance }
      if (form.password) payload.password = form.password
      updateMut.mutate({ id: editingId, data: payload })
    }
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-red-700 text-sm">
        Failed to load employees.
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <PageHeader title="Employees" subtitle="Manage company employees.">
        <button
          type="button"
          onClick={() => { setModal('create'); setForm({ name: '', email: '', password: '', role: 'employee', annual_leave_balance: 20 }); }}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" aria-hidden /> Add Employee
        </button>
      </PageHeader>

      <div className="mb-4 sm:mb-6">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search by name or email..."
          className="input max-w-md"
          aria-label="Search employees"
        />
      </div>

      <DataTable>
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-surface-200" style={{ minWidth: '640px' }}>
                <thead className="bg-surface-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider sm:px-4">Name</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Email</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider sm:px-4">Role</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider sm:px-4">Balance</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider sm:px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 bg-white">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-surface-500 text-sm">
                        No employees found.
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp: any) => (
                      <tr key={emp.id} className="hover:bg-surface-50/80 transition-colors">
                        <td className="px-3 py-3 font-medium text-surface-900 sm:px-4">
                          <span className="block truncate max-w-[120px] sm:max-w-none">{emp.name}</span>
                          <span className="sm:hidden text-xs text-surface-500 truncate block max-w-[120px]">{emp.email}</span>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 text-surface-600 text-sm">{emp.email}</td>
                        <td className="px-3 py-3 capitalize text-sm text-surface-600 sm:px-4">{emp.role}</td>
                        <td className="px-3 py-3 text-surface-600 text-sm sm:px-4">{emp.annual_leave_balance ?? 0}</td>
                        <td className="px-3 py-3 text-right sm:px-4">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(emp)}
                              className="p-2 rounded-lg text-surface-500 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                              aria-label="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => { if (confirm('Delete this employee?')) deleteMut.mutate(emp.id); }}
                              className="p-2 rounded-lg text-surface-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                onPrev={() => setPage((p) => Math.max(0, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              />
            )}
          </>
        )}
      </DataTable>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-sm"
          onClick={() => setModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="card w-full max-w-md max-h-[90vh] overflow-y-auto shadow-modal p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="modal-title" className="text-lg font-semibold text-surface-900 mb-4">
              {modal === 'create' ? 'Add Employee' : 'Edit Employee'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="input" required disabled={modal === 'edit'} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Password {modal === 'edit' && '(leave blank to keep)'}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="input" minLength={modal === 'create' ? 6 : 0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="input">
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Annual Leave Balance</label>
                <input type="number" min={0} value={form.annual_leave_balance} onChange={(e) => setForm((f) => ({ ...f, annual_leave_balance: parseInt(e.target.value, 10) || 0 }))} className="input" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="btn-primary flex-1">
                  {modal === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
