import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMyLeaves } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import { TableSkeleton } from '../components/LoadingSkeleton'
import DataTable, { Pagination } from '../components/DataTable'
import PageHeader from '../components/PageHeader'

const PAGE_SIZE = 10

export default function MyLeaves() {
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-leaves', page, status, from, to],
    queryFn: async () => {
      const params: any = { limit: PAGE_SIZE, offset: page * PAGE_SIZE }
      if (status) params.status = status
      if (from) params.from = from
      if (to) params.to = to
      const res = await getMyLeaves(params)
      return res.data
    },
  })

  const leaves = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-red-700 text-sm">
        Failed to load leaves.
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <PageHeader title="My Leaves" subtitle="View and filter your leave requests." />

      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          className="input-sm w-full sm:w-auto min-w-[140px]"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(0); }}
          className="input-sm w-full sm:w-auto"
          aria-label="From date"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(0); }}
          className="input-sm w-full sm:w-auto"
          aria-label="To date"
        />
      </div>

      <DataTable>
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-surface-200" style={{ minWidth: '600px' }}>
                <thead className="bg-surface-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider sm:px-4">Start</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider sm:px-4">End</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider sm:px-4">Type</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Reason</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider sm:px-4">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider sm:px-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 bg-white">
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-surface-500 text-sm">
                        No leave requests found.
                      </td>
                    </tr>
                  ) : (
                    leaves.map((l: any) => (
                      <tr key={l.id} className="hover:bg-surface-50/80 transition-colors">
                        <td className="px-3 py-3 text-sm text-surface-900 whitespace-nowrap sm:px-4">{l.start_date?.slice(0, 10)}</td>
                        <td className="px-3 py-3 text-sm text-surface-900 whitespace-nowrap sm:px-4">{l.end_date?.slice(0, 10)}</td>
                        <td className="px-3 py-3 text-sm text-surface-600 capitalize sm:px-4">{l.leave_type}</td>
                        <td className="hidden sm:table-cell px-4 py-3 text-sm text-surface-600 max-w-xs truncate">{l.reason || '—'}</td>
                        <td className="px-3 py-3 sm:px-4"><StatusBadge status={l.status} /></td>
                        <td className="px-3 py-3 text-sm text-surface-500 whitespace-nowrap sm:px-4">{l.created_at?.slice(0, 10)}</td>
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
