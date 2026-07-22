export default function EmptyState({ onImport, onUpload }) {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] sm:h-[80vh] text-muted px-4 slide-up">
      <span className="material-symbols-outlined text-4xl sm:text-5xl mb-3 sm:mb-4">favorite</span>
      <p className="text-sm mb-1">No intimate media yet</p>
      <p className="text-xs text-muted/60 mb-6">Import from gallery or upload directly</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onImport}
          className="px-5 py-2.5 bg-accent text-surface text-xs font-medium rounded-lg hover:opacity-80 transition-opacity active:scale-95"
        >
          Import from Gallery
        </button>
        <button
          onClick={onUpload}
          className="px-5 py-2.5 bg-surface-high text-accent text-xs font-medium rounded-lg border border-border hover:bg-surface-high/70 transition-all active:scale-95"
        >
          Upload from Device
        </button>
      </div>
    </div>
  )
}
