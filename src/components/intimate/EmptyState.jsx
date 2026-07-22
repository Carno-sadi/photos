export default function EmptyState({ onImport }) {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] sm:h-[80vh] text-muted px-4 slide-up">
      <span className="material-symbols-outlined text-4xl sm:text-5xl mb-3 sm:mb-4">favorite</span>
      <p className="text-sm mb-1">No intimate media yet</p>
      <p className="text-xs text-muted/60 mb-4">Import photos from your gallery to get started</p>
      <button
        onClick={onImport}
        className="px-5 py-2.5 bg-accent text-surface text-xs font-medium rounded-lg hover:opacity-80 transition-opacity active:scale-95"
      >
        Import from Gallery
      </button>
    </div>
  )
}
