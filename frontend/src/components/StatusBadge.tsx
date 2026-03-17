type Status = 'pending' | 'approved' | 'rejected'

const styles: Record<Status, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
}

export default function StatusBadge({ status }: { status: string }) {
  const s = (status?.toLowerCase() || 'pending') as Status
  const style = styles[s] || styles.pending
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${style}`}>
      {status}
    </span>
  )
}
