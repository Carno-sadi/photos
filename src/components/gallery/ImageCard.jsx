import { useState, useRef, useEffect } from 'react'
import { downloadPhoto } from '../../lib/download'
import DeleteConfirmDialog from './DeleteConfirmDialog'

export default function ImageCard({ photo, onOpen, onDeleted, viewMode, loadedImages, onImgLoad, priority }) {
  const [overlay, setOverlay] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const overlayTimer = useRef(null)
  const imgRef = useRef(null)
  const mounted = useRef(true)
  const onImgLoadRef = useRef(onImgLoad)
  const photoIdRef = useRef(photo.id)
  onImgLoadRef.current = onImgLoad
  photoIdRef.current = photo.id

  useEffect(() => {
    return () => { mounted.current = false; clearTimeout(overlayTimer.current) }
  }, [])

  useEffect(() => {
    if (imgRef.current?.complete) {
      onImgLoadRef.current(photoIdRef.current)
    }
  }, [])

  function handleDelete() {
    setDeleting(true)
    onDeleted(photo.id)
  }

  function handleDownload(e) {
    e.stopPropagation()
    setOverlay(false)
    downloadPhoto(photo.url, photo.name)
  }

  function handleDeleteClick(e) {
    e.stopPropagation()
    setOverlay(false)
    setShowDelete(true)
  }

  function handleOverlayToggle(e) {
    e.stopPropagation()
    setOverlay((v) => !v)
    if (!overlay) {
      clearTimeout(overlayTimer.current)
      overlayTimer.current = setTimeout(() => {
        if (mounted.current) setOverlay(false)
      }, 4000)
    }
  }

  if (viewMode === 'list') {
    return (
      <>
        <div
          className="flex items-center gap-3 bg-surface-high/50 hover:bg-surface-high rounded-lg px-3 py-2.5 transition-colors group cursor-pointer active:scale-[0.99]"
          onClick={() => onOpen(photo)}
        >
          <div className="w-12 h-12 rounded-md overflow-hidden bg-surface shrink-0">
            <img
              ref={imgRef}
              src={photo.url}
              alt={photo.name}
              className="w-full h-full object-cover"
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={priority ? 'high' : 'auto'}
              onLoad={() => onImgLoad(photo.id)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs truncate text-accent">{photo.name}</p>
            <p className="text-[11px] text-muted/60 mt-0.5">
              {new Date(photo.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleDownload}
              className="p-1.5 text-muted hover:text-accent transition-colors active:scale-90"
              aria-label="Download"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-1.5 text-muted hover:text-red-400 transition-colors active:scale-90"
              aria-label="Delete"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        </div>
        <DeleteConfirmDialog
          isOpen={showDelete}
          onCancel={() => setShowDelete(false)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      </>
    )
  }

  return (
    <>
      <div
        className="aspect-square bg-surface-high rounded-lg overflow-hidden cursor-pointer group relative"
        onClick={handleOverlayToggle}
        onMouseEnter={() => { clearTimeout(overlayTimer.current); setOverlay(true) }}
        onMouseLeave={() => { overlayTimer.current = setTimeout(() => { if (mounted.current) setOverlay(false) }, 500) }}
      >
        <img
          ref={imgRef}
          src={photo.url}
          alt={photo.name}
          onLoad={() => onImgLoad(photo.id)}
          className={`w-full h-full object-cover transition-all duration-200 ${
            loadedImages?.has(photo.id) ? 'opacity-100' : 'opacity-0'
          } group-hover:scale-105`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
        />

        <div
          className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-all duration-200 ${
            overlay ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setOverlay(false); onOpen(photo) }}
            className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-all active:scale-90 backdrop-blur-sm"
            aria-label="View"
          >
            <span className="material-symbols-outlined text-[20px]">visibility</span>
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-all active:scale-90 backdrop-blur-sm"
            aria-label="Download"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-2 rounded-full bg-white/15 text-white hover:bg-red-500/60 transition-all active:scale-90 backdrop-blur-sm"
            aria-label="Delete"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>
      <DeleteConfirmDialog
        isOpen={showDelete}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </>
  )
}
