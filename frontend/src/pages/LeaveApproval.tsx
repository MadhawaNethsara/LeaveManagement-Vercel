import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllLeaves, updateLeaveStatus } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import { TableSkeleton } from '../components/LoadingSkeleton'
import DataTable, { Pagination } from '../components/DataTable'
import PageHeader from '../components/PageHeader'
import toast from 'react-hot-toast'
import { Check, X } from 'lucide-react'

const PAGE_SIZE = 10

export default function LeaveApproval() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('pending')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [comment, setComment] = useState('')
  const [actingId, setActingId] = useState<number | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['all-leaves', page, status, from, to],
    queryFn: async () => {
      const params: any = { limit: PAGE_SIZE, offset: page * PAGE_SIZE }
      if (status) params.status = status
      if (from) params.from = from
      if (to) params.to = to
      const res = await getAllLeaves(params)
      return res.data
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, status, comment }: { id: number; status: 'approved' | 'rejected'; comment?: string }) =>
      updateLeaveStatus(id, status, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setActingId(null)
      setComment('')
      toast.success('Status updated')
    },
    onError: (err: any) => {
      setActingId(null)
      toast.error(err.response?.data?.error || 'Update failed')
    },
  })

  const leaves = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleAction = (id: number, newStatus: 'approved' | 'rejected') => {
    setActingId(id)
    updateMut.mutate({ id, status: newStatus, comment: comment || undefined })
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-red-700 text-sm">
        Failed to load leaves.
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <PageHeader title="Leave Approval" subtitle="Approve or reject leave requests." />

      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          className="input-sm w-full sm:w-auto min-w-[140px]"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }} className="input-sm w-full sm:w-auto" aria-label="From date" />
        <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }} className="input-sm w-full sm:w-auto" aria-label="To date" />
      </div>

      <div className="mb-4">
        <label htmlFor="approval-comment" className="block text-sm font-medium text-surface-700 mb-1.5">
          Comment (optional, for next action)
        </label>
        <input
          id="approval-comment"
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="e.g. Approved. Enjoy!"
          className="input max-w-md"
        />
      </div>

      <DataTable>
        {isLoading ? (
          <TableSkeleton rows={5} cols={8} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-surface-200" style={{ minWidth: '720px' }}>
                <thead className="bg-surface-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider sm:px-4">Employee</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider sm:px-4">Start</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider sm:px-4">End</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Type</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Reason</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider sm:px-4">Status</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Created</th>
                    {status === 'pending' && <th className="px-3 py-3 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider sm:px-4">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 bg-white">
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={status === 'pending' ? 8 : 7} className="px-4 py-10 text-center text-surface-500 text-sm">
                        No leaves found.
                      </td>
                    </tr>
                  ) : (
                    leaves.map((l: any) => (
                      <tr key={l.id} className="hover:bg-surface-50/80 transition-colors">
                        <td className="px-3 py-3 sm:px-4">
                          <div className="font-medium text-surface-900 truncate max-w-[140px] sm:max-w-none">{l.user?.name ?? '—'}</div>
                          <div className="text-xs text-surface-500 truncate max-w-[140px] sm:max-w-none">{l.user?.email}</div>
                        </td>
                        <td className="px-3 py-3 text-sm text-surface-900 whitespace-nowrap sm:px-4">{l.start_date?.slice(0, 10)}</td>
                        <td className="px-3 py-3 text-sm text-surface-900 whitespace-nowrap sm:px-4">{l.end_date?.slice(0, 10)}</td>
                        <td className="hidden sm:table-cell px-4 py-3 text-sm text-surface-600 capitalize">{l.leave_type}</td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-surface-600 max-w-[160px] truncate">{l.reason || '—'}</td>
                        <td className="px-3 py-3 sm:px-4"><StatusBadge status={l.status} /></td>
                        <td className="hidden sm:table-cell px-4 py-3 text-sm text-surface-500">{l.created_at?.slice(0, 10)}</td>
                        {status === 'pending' && (
                          <td className="px-3 py-3 sm:px-4">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleAction(l.id, 'approved')}
                                disabled={actingId === l.id}
                                className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 transition-colors"
                                title="Approve"
                                aria-label="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAction(l.id, 'rejected')}
                                disabled={actingId === l.id}
                                className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
                                title="Reject"
                                aria-label="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
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
    </div>
  )
}
