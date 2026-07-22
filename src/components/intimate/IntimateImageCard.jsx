import { useState, useRef } from 'react'

export default function IntimateImageCard({ item, onOpen, onDelete }) {
  const [loaded, setLoaded] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const urlRef = useRef(null)

  function getUrl() {
    if (item.blobData) {
      if (!urlRef.current) {
        urlRef.current = URL.createObjectURL(item.blobData)
      }
      return urlRef.current
    }
    return item.url
  }

  async function handleDelete() {
    setDeleting(true)
    await onDelete(item.id)
    setDeleting(false)
    setShowDelete(false)
  }

  const tags = item.tags || []

  return (
    <>
      <div className="relative group aspect-square overflow-hidden rounded-lg bg-surface-high fade-in">
        <img
          src={getUrl()}
          alt={item.name || ''}
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 cursor-pointer ${
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          } hover:scale-105`}
          onClick={() => onOpen(item)}
          draggable={false}
        />

        {tags.length > 0 && (
          <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[9px] font-medium bg-black/50 text-white/80 rounded-full backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(item) }}
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all active:scale-90 backdrop-blur-sm"
          >
            <span className="material-symbols-outlined text-lg">visibility</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowDelete(true) }}
            className="p-2 rounded-full bg-white/20 text-white hover:bg-red-400/30 transition-all active:scale-90 backdrop-blur-sm"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm fade-in-fast">
          <div className="bg-surface-elevated rounded-xl p-5 mx-4 max-w-xs w-full shadow-xl">
            <h3 className="text-sm font-medium text-accent mb-2">Remove this item?</h3>
            <p className="text-xs text-muted mb-4">This will remove it from your intimate collection.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDelete(false)}
                className="px-4 py-2 text-xs text-muted hover:text-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all active:scale-95"
              >
                {deleting ? (
                  <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  'Remove'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
