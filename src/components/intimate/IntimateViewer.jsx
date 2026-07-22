import { useState, useEffect, useRef } from 'react'
import MoodFilterBar from './MoodFilterBar'

const MOOD_FILTERS = {
  none: '',
  dim: 'brightness(0.65) contrast(1.15)',
  candle: 'sepia(0.6) hue-rotate(-20deg) contrast(1.1) brightness(0.85)',
  red: 'sepia(1) hue-rotate(300deg) saturate(3) brightness(0.7)',
  soft: 'brightness(1.05) contrast(0.9) blur(0.4px)',
}

export default function IntimateViewer({ items, currentIndex, onClose, onNavigate }) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [loaded, setLoaded] = useState(false)
  const [activeMood, setActiveMood] = useState('none')
  const [slideshow, setSlideshow] = useState(false)
  const [slideshowDelay, setSlideshowDelay] = useState(5)

  const isMounted = useRef(true)
  const slideshowTimer = useRef(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchStartTime = useRef(0)
  const pinchDist = useRef(0)
  const pinchZoom = useRef(1)
  const currentIndexRef = useRef(currentIndex)
  const onNavigateRef = useRef(onNavigate)
  const onCloseRef = useRef(onClose)
  const totalRef = useRef(items.length)

  onNavigateRef.current = onNavigate
  onCloseRef.current = onClose
  currentIndexRef.current = currentIndex
  totalRef.current = items.length

  const item = items[currentIndex]
  const total = items.length

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  function resetZoom() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  function go(delta) {
    const next = currentIndexRef.current + delta
    if (next >= 0 && next < totalRef.current) {
      setLoaded(false)
      resetZoom()
      onNavigateRef.current(delta)
    }
  }

  useEffect(() => {
    if (!slideshow) {
      clearInterval(slideshowTimer.current)
      return
    }
    slideshowTimer.current = setInterval(() => {
      const next = currentIndexRef.current + 1
      if (next >= totalRef.current) {
        go(-currentIndexRef.current)
      } else {
        go(1)
      }
    }, slideshowDelay * 1000)
    return () => clearInterval(slideshowTimer.current)
  }, [slideshow, slideshowDelay])

  function getUrl(item) {
    if (item.blobData) return URL.createObjectURL(item.blobData)
    return item.url
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

  function handleWheel(e) {
    e.preventDefault()
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

  function getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  function handleTouchStart(e) {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      touchStartTime.current = Date.now()
    } else if (e.touches.length === 2) {
      pinchDist.current = getTouchDist(e.touches)
      pinchZoom.current = zoom
    }
  }

  function handleTouchMove(e) {
    if (e.touches.length === 2) {
      e.preventDefault()
      const dist = getTouchDist(e.touches)
      const scale = dist / pinchDist.current
      const newZoom = Math.max(1, Math.min(5, pinchZoom.current * scale))
      setZoom(newZoom)
    }
  }

  function handleTouchEnd(e) {
    if (zoom > 1 || e.changedTouches.length > 1) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    const dt = Date.now() - touchStartTime.current
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
      go(dx > 0 ? -1 : 1)
    }
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
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between px-2 h-10 shrink-0 bg-gradient-to-b from-black/50 to-transparent z-10">
        <button onClick={() => onClose()} className="p-2 text-white/80 hover:text-white transition-colors active:scale-90">
          <span className="material-symbols-outlined text-[22px]">close</span>
        </button>
        <span className="text-[11px] text-white/50">{currentIndex + 1}/{total}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSlideshow((s) => !s)}
            className={`p-2 transition-colors active:scale-90 ${
              slideshow ? 'text-accent' : 'text-white/50 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">slideshow</span>
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(5, z + 0.3))}
            className="p-2 text-white/50 hover:text-white transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
          <button
            onClick={resetZoom}
            className="p-2 text-white/50 hover:text-white transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined text-[18px]">remove</span>
          </button>
        </div>
      </div>

      {slideshow && (
        <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-black/40 z-10">
          <span className="text-[10px] text-white/50">Delay:</span>
          {[3, 5, 7, 10].map((d) => (
            <button
              key={d}
              onClick={() => setSlideshowDelay(d)}
              className={`px-2 py-0.5 text-[10px] rounded transition-all ${
                slideshowDelay === d
                  ? 'bg-accent text-surface'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {d}s
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <img
          src={item ? getUrl(item) : ''}
          alt=""
          key={currentIndex}
          onLoad={() => { if (isMounted.current) setLoaded(true) }}
          className={`max-w-full max-h-full object-contain select-none transition-all duration-150 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            filter: MOOD_FILTERS[activeMood] || 'none',
            cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
          }}
          draggable={false}
        />

        {currentIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); go(-1) }}
            className="absolute left-2 z-10 p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-all active:scale-90 backdrop-blur-sm"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
        )}

        {currentIndex < total - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); go(1) }}
            className="absolute right-2 z-10 p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-all active:scale-90 backdrop-blur-sm"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        )}
      </div>

      <div className="shrink-0 bg-gradient-to-t from-black/50 to-transparent pt-4 pb-2 z-10">
        <MoodFilterBar activeMood={activeMood} onMoodChange={setActiveMood} />
      </div>
    </div>
  )
}
