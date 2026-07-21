import { Link } from 'react-router-dom'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name-asc', label: 'A-Z' },
  { value: 'name-desc', label: 'Z-A' },
]

export default function Header({ search, onSearchChange, sort, onSortChange, viewMode, onViewModeChange, photoCount }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-lg border-b border-border/50 safe-top">
      <div className="flex items-center justify-between h-12 sm:h-14 px-3 sm:px-6">
        <Link to="/" className="text-sm font-medium tracking-tight text-accent hover:opacity-70 transition-opacity shrink-0">
          Photos
          <span className="text-[11px] text-muted/50 ml-1.5 hidden sm:inline">{photoCount}</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial justify-end sm:justify-normal sm:ml-6">
          <div className="relative flex-1 sm:flex-initial sm:w-48 max-w-[180px]">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[14px] text-muted/60 pointer-events-none">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-full bg-surface-high text-xs text-accent rounded-lg pl-7 pr-2 py-1.5 border border-border/50 focus:outline-none focus:border-border placeholder:text-muted/40 transition-colors"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-surface-high text-xs text-muted rounded-lg px-2 py-1.5 border border-border/50 focus:outline-none focus:border-border appearance-none cursor-pointer hover:text-accent transition-colors"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button
            onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-surface-high transition-all active:scale-90"
            aria-label={viewMode === 'grid' ? 'List view' : 'Grid view'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {viewMode === 'grid' ? 'view_list' : 'grid_view'}
            </span>
          </button>

          <Link
            to="/upload"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-surface text-xs font-medium hover:opacity-80 transition-opacity active:scale-95"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span className="hidden sm:inline">Upload</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
