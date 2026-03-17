import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { applyLeave } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'other', label: 'Other' },
]

export default function ApplyLeave() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [leaveType, setLeaveType] = useState('annual')

  const mutation = useMutation({
    mutationFn: (data: { start_date: string; end_date: string; reason: string; leave_type: string }) =>
      applyLeave(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Leave request submitted')
      setStartDate('')
      setEndDate('')
      setReason('')
      setLeaveType('annual')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to apply leave')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      toast.error('Start and end dates are required')
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date must be on or after start date')
      return
    }
    mutation.mutate({ start_date: startDate, end_date: endDate, reason: reason.trim(), leave_type: leaveType })
  }

  return (
    <div className="max-w-2xl">
      <div className="page-header mb-6 sm:mb-8">
        <h1 className="page-title">Apply for Leave</h1>
        <p className="page-subtitle">
          Submit a new leave request. Your balance: {user?.annual_leave_balance ?? 0} days (annual).
        </p>
      </div>

      <div className="card p-5 sm:p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-surface-700 mb-1.5">
                Start Date
              </label>
              <input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-surface-700 mb-1.5">
                End Date
              </label>
              <input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="leave_type" className="block text-sm font-medium text-surface-700 mb-1.5">
              Leave Type
            </label>
            <select
              id="leave_type"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="input"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-surface-700 mb-1.5">
              Reason (optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="Brief reason for leave"
            />
          </div>
          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3">
            {mutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  )
}
