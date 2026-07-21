export default function DeleteConfirmDialog({ isOpen, onCancel, onConfirm, deleting }) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm fade-in-fast"
      onClick={onCancel}
    >
      <div
        className="bg-surface-elevated border border-border rounded-xl p-5 mx-4 max-w-xs w-full slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-center mb-1">Delete this image?</p>
        <p className="text-xs text-muted text-center mb-5">This cannot be undone.</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-lg text-xs font-medium bg-surface-high text-muted hover:text-accent transition-colors active:scale-95 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-500 transition-colors active:scale-95 disabled:opacity-50"
          >
            {deleting ? (
              <span className="inline-block w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
