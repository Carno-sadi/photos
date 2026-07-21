import { useState, useEffect, useRef } from 'react'
import { downloadPhoto } from '../../lib/download'
import DeleteConfirmDialog from './DeleteConfirmDialog'

export default function Lightbox({ photos, currentIndex, onClose, onNavigate, onDelete }) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [uiVisible, setUiVisible] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const hideTimer = useRef(null)
  const lastTap = useRef(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchStartTime = useRef(0)
  const isMounted = useRef(true)
  const onCloseRef = useRef(onClose)
  const onNavigateRef = useRef(onNavigate)
  const currentIndexRef = useRef(currentIndex)
  const totalRef = useRef(photos.length)

  onCloseRef.current = onClose
  onNavigateRef.current = onNavigate
  currentIndexRef.current = currentIndex
  totalRef.current = photos.length

  const photo = photos[currentIndex]
  const total = photos.length

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  function resetZoom() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  function showUi() {
    if (!isMounted.current) return
    setUiVisible(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => { if (isMounted.current) setUiVisible(false) }, 3000)
  }

  function go(delta) {
    const next = currentIndexRef.current + delta
    if (next >= 0 && next < totalRef.current) {
      setShowDelete(false)
      setLoaded(false)
      resetZoom()
      onNavigateRef.current(delta)
    }
  }

  useEffect(() => {
    showUi()
  }, [currentIndex])

  async function handleDelete() {
    if (!photo) return
    setDeleting(true)
    await onDelete(photo.id)
    if (isMounted.current) {
      setShowDelete(false)
      setDeleting(false)
    }
  }

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onCloseRef.current()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(5, z + 0.25))
      if (e.key === '-') setZoom((z) => Math.max(1, z - 0.25))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    showUi()
    return () => clearTimeout(hideTimer.current)
  }, [currentIndex])

  useEffect(() => {
    const next = photos[currentIndex + 1]
    const prev = photos[currentIndex - 1]
    if (next) { const img = new Image(); img.src = next.url }
    if (prev) { const img = new Image(); img.src = prev.url }
  }, [currentIndex, photos])

  function handleWheel(e) {
    e.preventDefault()
    showUi()
    setZoom((z) => Math.max(1, Math.min(5, z + (e.deltaY > 0 ? -0.15 : 0.15))))
  }

  function handleMouseDown(e) {
    if (zoom > 1) {
      setDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  function handleMouseMove(e) {
    if (dragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  function handleMouseUp() { setDragging(false) }

  function handleDoubleTap(e) {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      if (zoom > 1) {
        resetZoom()
      } else {
        const rect = e.target.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        setZoom(2.5)
        setPan({ x: (0.5 - x) * 400, y: (0.5 - y) * 400 })
      }
    }
    lastTap.current = now
  }

  function handleTouchStart(e) {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      touchStartTime.current = Date.now()
    }
  }

  function handleTouchEnd(e) {
    if (zoom > 1 || e.changedTouches.length > 1) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    const dt = Date.now() - touchStartTime.current
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
      go(dx > 0 ? -1 : 1)
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 300) {
      handleDoubleTap(e)
    } else if (Math.abs(dx) < 20 && Math.abs(dy) < 20 && dt < 200) {
      showUi()
    }
  }

  function handleDownload() {
    if (photo) downloadPhoto(photo.url, photo.name)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => showUi()}
    >
      <div
        className={`flex items-center justify-between px-2 sm:px-4 h-10 sm:h-14 shrink-0 bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300 ${
          uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button onClick={(e) => { e.stopPropagation(); onClose() }} className="p-2 text-white/80 hover:text-white transition-colors active:scale-90">
          <span className="material-symbols-outlined text-[22px] sm:text-2xl">close</span>
        </button>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-[11px] sm:text-xs text-white/50 mr-1">{currentIndex + 1}/{total}</span>
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload() }}
            className="p-2 text-white/50 hover:text-white transition-colors active:scale-90"
            aria-label="Download"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">download</span>
          </button>
          {deleting ? (
            <span className="w-4 h-4 border border-white/50 border-t-transparent rounded-full animate-spin mx-2" />
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setShowDelete(true) }}
              className="p-2 text-white/50 hover:text-red-400 transition-colors active:scale-90"
              aria-label="Delete"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">delete</span>
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(5, z + 0.3)) }} className="p-2 text-white/80 hover:text-white transition-colors active:scale-90">
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">add</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); resetZoom() }} className="p-2 text-white/80 hover:text-white transition-colors active:scale-90">
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">remove</span>
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <img
          src={photo?.url}
          alt=""
          onLoad={() => { if (isMounted.current) setLoaded(true) }}
          className={`max-w-full max-h-full object-contain select-none transition-all duration-150 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
          }}
          draggable={false}
        />

        {currentIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); go(-1) }}
            className={`absolute left-1 sm:left-2 md:left-4 z-10 p-2 sm:p-2.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-300 active:scale-90 backdrop-blur-sm ${
              uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">chevron_left</span>
          </button>
        )}

        {currentIndex < total - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); go(1) }}
            className={`absolute right-1 sm:right-2 md:right-4 z-10 p-2 sm:p-2.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-300 active:scale-90 backdrop-blur-sm ${
              uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">chevron_right</span>
          </button>
        )}
      </div>

      <DeleteConfirmDialog
        isOpen={showDelete}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  )
}
