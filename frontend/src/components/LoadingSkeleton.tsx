export function CardSkeleton() {
  return (
    <div className="card p-5 sm:p-6 animate-pulse">
      <div className="h-4 w-20 bg-surface-200 rounded mb-4" />
      <div className="h-8 w-16 bg-surface-200 rounded" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-surface-200 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <table className="min-w-full divide-y divide-surface-200">
      <thead className="bg-surface-50">
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="px-4 py-3 text-left">
              <div className="h-4 w-24 bg-surface-200 rounded animate-pulse" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-surface-100">
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  )
}
