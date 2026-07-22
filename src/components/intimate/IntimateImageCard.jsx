import { useState, useRef } from 'react'
import { updateMediaTags } from '../../lib/intimateDb'

export default function IntimateImageCard({ item, onOpen, onDelete }) {
  const [loaded, setLoaded] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showTagEditor, setShowTagEditor] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const urlRef = useRef(null)
  const tags = item.tags || []

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

  async function handleAddTag() {
    const tag = tagInput.trim().toLowerCase()
    if (!tag || tags.includes(tag)) return
    const newTags = [...tags, tag]
    await updateMediaTags(item.id, newTags)
    item.tags = newTags
    setTagInput('')
    setShowTagEditor(false)
  }

  async function handleRemoveTag(tag) {
    const newTags = tags.filter((t) => t !== tag)
    await updateMediaTags(item.id, newTags)
    item.tags = newTags
  }

  async function handleTagKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      await handleAddTag()
    }
  }

  function presetTag(tag) {
    return async () => {
      if (tags.includes(tag)) return
      const newTags = [...tags, tag]
      await updateMediaTags(item.id, newTags)
      item.tags = newTags
      setShowTagEditor(false)
    }
  }

  const PRESET_TAGS = ['romantic', 'candle', 'soft', 'passion', 'moody', 'sunset', 'golden', 'dark']

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
            {tags.slice(0, 3).map((tag) => (
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
            onClick={(e) => { e.stopPropagation(); setShowTagEditor(true) }}
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all active:scale-90 backdrop-blur-sm"
          >
            <span className="material-symbols-outlined text-lg">label</span>
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

      {showTagEditor && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm fade-in-fast">
          <div
            className="bg-surface-elevated rounded-t-xl sm:rounded-xl p-5 mx-0 sm:mx-4 w-full sm:max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium text-accent mb-3">Edit Tags</h3>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-accent/10 text-accent rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <span className="text-[10px] text-muted">No tags yet</span>
              )}
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tag..."
                className="flex-1 px-3 py-2 bg-surface-high border border-border rounded-lg text-xs text-accent placeholder:text-muted/50 outline-none focus:border-accent/50"
                autoFocus
              />
              <button
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all active:scale-95 ${
                  tagInput.trim() ? 'bg-accent text-surface' : 'bg-surface-high text-muted'
                }`}
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {PRESET_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
                <button
                  key={tag}
                  onClick={presetTag(tag)}
                  className="px-2 py-1 text-[10px] font-medium bg-surface-high text-muted hover:text-accent rounded-full transition-all active:scale-90"
                >
                  + {tag}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTagEditor(false)}
              className="w-full py-2 text-xs text-muted hover:text-accent transition-colors rounded-lg bg-surface-high"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  )
}
