export default function SkeletonLoader({ viewMode }) {
  const count = viewMode === 'list' ? 8 : 20

  if (viewMode === 'list') {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-14 space-y-3">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex items-center gap-3 bg-surface-high rounded-lg p-3 animate-pulse">
            <div className="w-14 h-14 rounded-md bg-surface/50 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-surface/50 rounded w-3/4" />
              <div className="h-2.5 bg-surface/50 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="gallery-grid px-2 sm:px-4 md:px-6 pt-14">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="aspect-square bg-surface-high rounded-lg animate-pulse" />
      ))}
    </div>
  )
}
