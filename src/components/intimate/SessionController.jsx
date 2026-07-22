import { useState, useEffect, useRef, useCallback } from 'react'

export default function SessionController({ onEndSession }) {
  const [status, setStatus] = useState('idle')
  const [timeLeft, setTimeLeft] = useState(300)
  const [showWarning, setShowWarning] = useState(false) // eslint-disable-line no-unused-vars

  const isMounted = useRef(true)
  const sessionActiveRef = useRef(false)
  const onEndRef = useRef(onEndSession)

  onEndRef.current = onEndSession

  const DURATION = 300

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  function requestFullscreen() {
    const el = document.documentElement
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {})
    }
  }

  function requestPointerLock() {
    const el = document.documentElement
    if (el.requestPointerLock) {
      el.requestPointerLock()
    }
  }

  function requestKeyboardLock() {
    if (navigator.keyboard && navigator.keyboard.lock) {
      navigator.keyboard.lock(['Escape', 'Tab', 'MetaLeft', 'AltLeft']).catch(() => {})
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

    const storedStartTime = Date.now()
    localStorage.setItem('intimate_session_start', storedStartTime.toString())
    localStorage.setItem('intimate_session_duration', DURATION.toString())

    const tick = () => {
      if (!isMounted.current || !sessionActiveRef.current) return
      const elapsed = Math.floor((Date.now() - storedStartTime) / 1000)
      const remaining = Math.max(0, DURATION - elapsed)
      setTimeLeft(remaining)

      if (remaining <= 0) {
        endSession()
        return
      }

      if (remaining <= 10) setShowWarning(true)

      requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [])

  function endSession() {
    if (!sessionActiveRef.current) return
    sessionActiveRef.current = false
    setStatus('idle')
    localStorage.removeItem('intimate_session_start')
    localStorage.removeItem('intimate_session_duration')
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
    const keysToBlock = ['Escape', 'F11', 'Tab']
    if (keysToBlock.includes(e.key)) {
      e.preventDefault()
      e.stopPropagation()
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

      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)

      document.body.style.overflow = ''
    }
  }, [status])

  function formatTime(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (status === 'active') {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center select-none">
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
        5-minute focused experience with fullscreen immersion
      </p>
    </div>
  )
}
