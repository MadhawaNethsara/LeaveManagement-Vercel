interface DataTableProps {
  children: React.ReactNode
  className?: string
}

export default function DataTable({ children, className = '' }: DataTableProps) {
  return (
    <div className={`card ${className}`}>
      <div className="overflow-x-auto -mx-px">
        {children}
      </div>
    </div>
  )
}

export function Pagination({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="px-4 py-3 border-t border-surface-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-surface-500">Total: {total}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page === 0}
          className="btn-secondary min-h-0 py-2 px-3 text-sm disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-3 py-2 text-sm text-surface-600 whitespace-nowrap">
          Page {page + 1} of {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages - 1}
          className="btn-secondary min-h-0 py-2 px-3 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
