import { useState, useEffect, useRef, useCallback } from 'react'

const MOOD_FILTERS = {
  none: '',
  dim: 'brightness(0.65) contrast(1.15)',
  candle: 'sepia(0.6) hue-rotate(-20deg) contrast(1.1) brightness(0.85)',
  red: 'sepia(1) hue-rotate(300deg) saturate(3) brightness(0.7)',
  soft: 'brightness(1.05) contrast(0.9) blur(0.4px)',
}

export default function SessionController({ items, activeMood, onEndSession, onSessionStart }) {
  const [status, setStatus] = useState('idle')
  const [timeLeft, setTimeLeft] = useState(300)
  const [showWarning, setShowWarning] = useState(false) // eslint-disable-line no-unused-vars
  const [slideIndex, setSlideIndex] = useState(0)
  const [slideLoaded, setSlideLoaded] = useState(false)

  const isMounted = useRef(true)
  const sessionActiveRef = useRef(false)
  const onEndRef = useRef(onEndSession)
  const onStartRef = useRef(onSessionStart)
  const workerRef = useRef(null)
  const slideTimerRef = useRef(null)

  onEndRef.current = onEndSession
  onStartRef.current = onSessionStart

  const DURATION = 300
  const supportsFullscreen = typeof document.documentElement.requestFullscreen === 'function'
  const supportsPointerLock = typeof document.documentElement.requestPointerLock === 'function'
  const supportsKeyboardLock = typeof navigator.keyboard?.lock === 'function'
  const isMobile = !supportsFullscreen || !supportsPointerLock
  const slideshowDelay = 8

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  function requestFullscreen() {
    if (supportsFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }

  function requestPointerLock() {
    if (supportsPointerLock) {
      document.documentElement.requestPointerLock()
    }
  }

  function requestKeyboardLock() {
    if (supportsKeyboardLock) {
      navigator.keyboard.lock(['Escape', 'Tab', 'MetaLeft', 'AltLeft', 'Backspace']).catch(() => {})
    }
  }

  function exitFullscreen() {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {})
    }
  }

  function exitPointerLock() {
    if (document.pointerLockElement && document.exitPointerLock) {
      document.exitPointerLock()
    }
  }

  const startSession = useCallback(() => {
    if (sessionActiveRef.current) return
    sessionActiveRef.current = true
    setStatus('active')
    setTimeLeft(DURATION)
    setShowWarning(false)

    requestFullscreen()
    requestPointerLock()
    requestKeyboardLock()
    setSlideIndex(0)
    setSlideLoaded(false)

    if (onStartRef.current) onStartRef.current()

    try {
      const worker = new Worker(
        new URL('../../lib/sessionWorker.js', import.meta.url),
        { type: 'module' }
      )
      workerRef.current = worker
      worker.postMessage({ type: 'start', duration: DURATION })
      worker.onmessage = (e) => {
        if (!isMounted.current || !sessionActiveRef.current) {
          worker.terminate()
          return
        }
        const { remaining } = e.data
        setTimeLeft(remaining)
        if (remaining <= 10) setShowWarning(true)
        if (remaining <= 0) endSession()
      }
    } catch {
      const storedStartTime = Date.now()
      const tick = () => {
        if (!isMounted.current || !sessionActiveRef.current) return
        const elapsed = Math.floor((Date.now() - storedStartTime) / 1000)
        const remaining = Math.max(0, DURATION - elapsed)
        setTimeLeft(remaining)
        if (remaining <= 10) setShowWarning(true)
        if (remaining <= 0) { endSession(); return }
        setTimeout(tick, 200)
      }
      setTimeout(tick, 200)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function endSession() {
    if (!sessionActiveRef.current) return
    sessionActiveRef.current = false
    setStatus('idle')
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    if (slideTimerRef.current) {
      clearInterval(slideTimerRef.current)
      slideTimerRef.current = null
    }
    exitFullscreen()
    exitPointerLock()
    if (onEndRef.current) onEndRef.current()
  }

  function handleVisibilityChange() {
    if (document.hidden && sessionActiveRef.current) {
      endSession()
    }
  }

  function handleBeforeUnload(e) {
    if (sessionActiveRef.current) {
      e.preventDefault()
      e.returnValue = ''
    }
  }

  function handleKeyDown(e) {
    if (!sessionActiveRef.current) return
    const keysToBlock = ['Escape', 'F11', 'Tab', 'Backspace']
    if (keysToBlock.includes(e.key)) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  function handleTouchMove(e) {
    if (sessionActiveRef.current) {
      e.preventDefault()
    }
  }

  function handleFullscreenChange() {
    if (!document.fullscreenElement && sessionActiveRef.current) {
      endSession()
    }
  }

  function handlePointerLockChange() {
    if (!document.pointerLockElement && sessionActiveRef.current) {
      requestPointerLock()
    }
  }

  useEffect(() => {
    if (status === 'active') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('beforeunload', handleBeforeUnload)
      window.addEventListener('keydown', handleKeyDown, true)
      document.addEventListener('fullscreenchange', handleFullscreenChange)
      document.addEventListener('pointerlockchange', handlePointerLockChange)
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
      if (isMobile) {
        document.addEventListener('touchmove', handleTouchMove, { passive: false })
      }
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('touchmove', handleTouchMove)
      document.body.style.overflow = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isMobile])

  function formatTime(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (status !== 'active' || !items.length) return
    slideTimerRef.current = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % items.length)
      setSlideLoaded(false)
    }, slideshowDelay * 1000)
    return () => clearInterval(slideTimerRef.current)
  }, [status, items.length])

  const currentItem = items.length > 0 ? items[slideIndex % items.length] : null

  if (status === 'active') {
    return (
      <div
        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center select-none overflow-hidden"
        onTouchMove={isMobile ? (e) => e.preventDefault() : undefined}
      >
        {currentItem && (
          <img
            src={currentItem.url}
            alt=""
            key={slideIndex}
            onLoad={() => setSlideLoaded(true)}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${
              slideLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ filter: MOOD_FILTERS[activeMood] || 'none' }}
            draggable={false}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

        <div className="relative z-10 text-center">
          <div className={`text-6xl font-light mb-4 transition-colors duration-500 ${
            timeLeft <= 10 ? 'text-red-400' : 'text-white'
          }`}>
            {formatTime(timeLeft)}
          </div>
          <p className="text-xs text-white/50">Intimate Session</p>

          {timeLeft <= 10 && (
            <p className="text-[10px] text-red-400/60 mt-2 animate-pulse">Session ending soon</p>
          )}

          {items.length > 0 && (
            <p className="text-[10px] text-white/30 mt-3">
              {slideIndex + 1} / {items.length}
            </p>
          )}
        </div>

        <button
          onClick={endSession}
          className="relative z-10 mt-12 px-6 py-2 bg-white/5 text-white/40 hover:text-white/70 text-xs rounded-lg border border-white/10 transition-all active:scale-95"
        >
          End Session Early
        </button>
      </div>
    )
  }

  return (
    <div className="px-3 py-3">
      <button
        onClick={startSession}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-[20px]">lock</span>
        Start Intimate Session
      </button>
      <p className="text-[10px] text-muted/50 text-center mt-1.5">
        5-minute focused experience {isMobile ? '(immersive overlay)' : 'with fullscreen immersion'}
      </p>
    </div>
  )
}
