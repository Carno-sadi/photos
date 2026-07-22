import { useState, useEffect, useRef } from 'react'
import WarpEngine from '../../lib/warpEngine'
import ParticleSystem from '../../lib/particleSystem'
import AnimationControls from './AnimationControls'
import MoodFilterBar from './MoodFilterBar'

const MOOD_FILTERS = {
  none: '',
  dim: 'brightness(0.65) contrast(1.15)',
  candle: 'sepia(0.6) hue-rotate(-20deg) contrast(1.1) brightness(0.85)',
  red: 'sepia(1) hue-rotate(300deg) saturate(3) brightness(0.7)',
  soft: 'brightness(1.05) contrast(0.9) blur(0.4px)',
}

const ANIM_PRESETS = [
  { mode: 'thrust', speed: 0.5, intensity: 0.5, jiggle: 0.3 },
  { mode: 'thrust', speed: 0.8, intensity: 0.7, jiggle: 0.6 },
  { mode: 'breathe', speed: 0.3, intensity: 0.4, jiggle: 0.1 },
  { mode: 'wave', speed: 0.4, intensity: 0.6, jiggle: 0.2 },
  { mode: 'pulse', speed: 0.6, intensity: 0.5, jiggle: 0.3 },
]

export default function AnimationViewer2d({ items, startIndex, onClose }) {
  const [mode, setMode] = useState('thrust')
  const [params, setParams] = useState({ speed: 0.5, intensity: 0.5, jiggle: 0.3 })
  const [isPlaying, setIsPlaying] = useState(true)
  const [activeMood, setActiveMood] = useState('none')
  const [currentIndex, setCurrentIndex] = useState(startIndex || 0)
  const [showControls, setShowControls] = useState(true)
  const [audioSync, setAudioSync] = useState(false)

  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const imgRef = useRef(null)
  const warpRef = useRef(null)
  const particleRef = useRef(null)
  const audioRef = useRef(null)
  const hideTimer = useRef(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  const currentIndexRef = useRef(currentIndex)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const warp = new WarpEngine()
    warp.init(canvas)
    warp.params = { ...params, mode }
    warpRef.current = warp

    const particles = new ParticleSystem()
    particles.init(canvas)
    particleRef.current = particles

    particles.addEmitter({
      x: canvas.width * 0.5,
      y: canvas.height * 0.3,
      rate: 3,
      lifetime: 1.5,
      speed: 30,
      size: 2,
      color: '255, 200, 150',
      gravity: 5,
      spread: 0.8,
      decay: 0.6,
    })

    loadImage(items[currentIndex]?.url)
    warp.start()
    setIsPlaying(true)

    function handleResize() {
      if (!isMounted.current) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      warp.resize(canvas.width, canvas.height)
      particles.init(canvas)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      warp.destroy()
      particles.destroy()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function loadImage(url) {
    if (!url) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imgRef.current = img
      if (warpRef.current) {
        warpRef.current.setImage(img)
      }
    }
    img.onerror = () => {
      img.crossOrigin = ''
      img.onerror = null
      img.src = url
    }
    img.src = url
  }

  useEffect(() => {
    if (!warpRef.current) return
    warpRef.current.params = { ...params, mode }
  }, [params, mode])

  useEffect(() => {
    if (!warpRef.current) return
    if (isPlaying) {
      warpRef.current.start()
    } else {
      warpRef.current.stop()
    }
  }, [isPlaying])

  useEffect(() => {
    if (!particleRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return

    let running = true
    let lastTime = performance.now()

    function particleLoop(now) {
      if (!running || !isMounted.current) return
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      if (particleRef.current) {
        particleRef.current.update(dt)
      }

      if (overlayRef.current) {
        const ctx = overlayRef.current.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (particleRef.current) particleRef.current.render()
      }

      requestAnimationFrame(particleLoop)
    }

    requestAnimationFrame(particleLoop)

    return () => { running = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!warpRef.current || !audioSync) return
    warpRef.current.onFrame = () => {
      if (audioRef.current) {
        const amp = audioRef.current.getAmplitude()
        if (warpRef.current) {
          warpRef.current.params.intensity = params.intensity * (0.5 + amp * 0.5)
        }
      }
    }
    return () => {
      if (warpRef.current) warpRef.current.onFrame = null
    }
  }, [audioSync, params.intensity])

  function handleParamChange(key, value) {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  function handleModeChange(newMode) {
    setMode(newMode)
    showUi()
  }

  function handleToggle() {
    setIsPlaying((p) => !p)
    showUi()
  }

  function handleSurprise() {
    const preset = ANIM_PRESETS[Math.floor(Math.random() * ANIM_PRESETS.length)]
    setMode(preset.mode)
    setParams({ speed: preset.speed, intensity: preset.intensity, jiggle: preset.jiggle })
    if (items.length > 1) {
      let next
      do { next = Math.floor(Math.random() * items.length) } while (next === currentIndexRef.current)
      setCurrentIndex(next)
      loadImage(items[next].url)
    }
    showUi()
  }

  function handleSave() {
    const preset = {
      mode,
      params,
      mood: activeMood,
      imageIndex: currentIndexRef.current,
      timestamp: Date.now(),
    }
    try {
      localStorage.setItem('animation_preset', JSON.stringify(preset))
    } catch {}
    showUi()
  }

  function handleAudioSync() {
    setAudioSync((a) => !a)
    showUi()
  }

  function showUi() {
    setShowControls(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (isMounted.current) setShowControls(false)
    }, 4000)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose()
    showUi()
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentItem = items[currentIndex]

  return (
    <div
      className="fixed inset-0 z-50 bg-black select-none"
      onMouseMove={showUi}
      onTouchStart={showUi}
      onClick={showUi}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ filter: MOOD_FILTERS[activeMood] || 'none' }}
      />

      {!currentItem && (
        <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
          No images to animate
        </div>
      )}

      <div className={`absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none transition-opacity duration-500 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`} />

      {showControls && (
        <>
          <div className="absolute top-0 left-0 right-0 z-10">
            <div className="flex items-center justify-between px-3 h-10">
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white transition-colors active:scale-90"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
              <span className="text-[11px] text-white/40 font-mono">
                {currentIndex + 1}/{items.length}
              </span>
              <div className="w-10" />
            </div>
            <MoodFilterBar activeMood={activeMood} onMoodChange={setActiveMood} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-10 pb-4">
            <AnimationControls
              params={params}
              onParamChange={handleParamChange}
              mode={mode}
              onModeChange={handleModeChange}
              isPlaying={isPlaying}
              onToggle={handleToggle}
              onSave={handleSave}
              onSurprise={handleSurprise}
              hasAudio={false}
              onAudioSync={handleAudioSync}
            />
          </div>
        </>
      )}
    </div>
  )
}
