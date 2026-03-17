import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { Users, Clock, CheckCircle, XCircle } from 'lucide-react'

const statCards = [
  { key: 'total_employees', label: 'Total Employees', icon: Users, color: 'primary' },
  { key: 'pending_leaves', label: 'Pending Leaves', icon: Clock, color: 'amber' },
  { key: 'approved_leaves', label: 'Approved Leaves', icon: CheckCircle, color: 'emerald' },
  { key: 'rejected_leaves', label: 'Rejected Leaves', icon: XCircle, color: 'red' },
]

const colorClasses: Record<string, string> = {
  primary: 'bg-primary-50 text-primary-600 border-primary-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  red: 'bg-red-50 text-red-600 border-red-100',
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => (await getDashboardStats()).data.data,
  })

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-red-700 text-sm">
        Failed to load stats.
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="page-header mb-6 sm:mb-8">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.name}. Here’s your overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : statCards.map((card) => {
              if (card.key === 'total_employees' && !isAdmin) return null
              const Icon = card.icon
              const value = data?.[card.key as keyof typeof data] ?? 0
              return (
                <div
                  key={card.key}
                  className="card p-5 sm:p-6 transition-shadow hover:shadow-card-hover"
                >
                  <div
                    className={`inline-flex p-2.5 rounded-lg border ${colorClasses[card.color]}`}
                    aria-hidden
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <p className="mt-4 text-2xl font-bold tracking-tight text-surface-900">{value}</p>
                  <p className="mt-0.5 text-sm text-surface-500">{card.label}</p>
                </div>
              )
            })}
      </div>

      {isAdmin && (
        <div className="mt-6 sm:mt-8 p-4 sm:p-5 rounded-xl bg-primary-50 border border-primary-100">
          <p className="text-sm text-primary-800">
            You have admin access. Use <strong>Employees</strong> to manage staff and{' '}
            <strong>Leave Approval</strong> to approve or reject requests.
          </p>
        </div>
      )}
    </div>
  )
}
