import { useState, useEffect, useRef, useCallback } from 'react'

export default function SessionController({ onEndSession, onSessionStart }) {
  const [status, setStatus] = useState('idle')
  const [timeLeft, setTimeLeft] = useState(300)
  const [showWarning, setShowWarning] = useState(false) // eslint-disable-line no-unused-vars

  const isMounted = useRef(true)
  const sessionActiveRef = useRef(false)
  const onEndRef = useRef(onEndSession)
  const onStartRef = useRef(onSessionStart)
  const workerRef = useRef(null)

  onEndRef.current = onEndSession
  onStartRef.current = onSessionStart

  const DURATION = 300
  const supportsFullscreen = typeof document.documentElement.requestFullscreen === 'function'
  const supportsPointerLock = typeof document.documentElement.requestPointerLock === 'function'
  const supportsKeyboardLock = typeof navigator.keyboard?.lock === 'function'
  const isMobile = !supportsFullscreen || !supportsPointerLock

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

  if (status === 'active') {
    return (
      <div
        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center select-none"
        onTouchMove={isMobile ? (e) => e.preventDefault() : undefined}
      >
        <div className="text-center">
          <div className={`text-6xl font-light mb-4 transition-colors duration-500 ${
            timeLeft <= 10 ? 'text-red-400' : 'text-accent'
          }`}>
            {formatTime(timeLeft)}
          </div>
          <p className="text-xs text-muted/60">Intimate Session</p>

          {timeLeft <= 10 && (
            <p className="text-[10px] text-red-400/60 mt-2 animate-pulse">Session ending soon</p>
          )}
        </div>

        <button
          onClick={endSession}
          className="mt-12 px-6 py-2 bg-white/5 text-white/40 hover:text-white/70 text-xs rounded-lg border border-white/10 transition-all active:scale-95"
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
