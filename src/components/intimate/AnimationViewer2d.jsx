import { useState, useEffect, useRef } from 'react'
import WarpEngine from '../../lib/warpEngine'
import TubeEngine from '../../lib/tubeEngine'
import SexEffects from '../../lib/sexEffects'
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
  { mode: 'missionary', speed: 0.5, intensity: 0.5, jiggle: 0.3, depth: 0.5, angle: 0 },
  { mode: 'doggy', speed: 0.7, intensity: 0.6, jiggle: 0.5, depth: 0.6, angle: 0 },
  { mode: 'cowgirl', speed: 0.6, intensity: 0.5, jiggle: 0.7, depth: 0.4, angle: 0 },
  { mode: 'oral', speed: 0.8, intensity: 0.4, jiggle: 0.2, depth: 0.3, angle: 0 },
  { mode: 'passion', speed: 0.3, intensity: 0.6, jiggle: 0.3, depth: 0.5, angle: 0 },
  { mode: 'random', speed: 0.5, intensity: 0.5, jiggle: 0.4, depth: 0.5, angle: 0 },
]

export default function AnimationViewer2d({ items, startIndex, onClose }) {
  const [mode, setMode] = useState('missionary')
  const [params, setParams] = useState({ speed: 0.5, intensity: 0.5, jiggle: 0.3, depth: 0.5, angle: 0 })
  const [isPlaying, setIsPlaying] = useState(true)
  const [activeMood, setActiveMood] = useState('none')
  const [currentIndex, setCurrentIndex] = useState(startIndex || 0)
  const [showControls, setShowControls] = useState(true)
  const [audioSync, setAudioSync] = useState(false)
  const [positionName, setPositionName] = useState('')
  const [effects, setEffects] = useState({
    condom: false,
    pill: false,
    lube: false,
  })

  const canvasRef = useRef(null)
  const tubeCanvasRef = useRef(null)
  const overlayRef = useRef(null)
  const imgRef = useRef(null)
  const warpRef = useRef(null)
  const tubeRef = useRef(null)
  const sexEffectsRef = useRef(null)
  const audioRef = useRef(null)
  const hideTimer = useRef(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const currentIndexRef = useRef(currentIndex)
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])

  useEffect(() => {
    const canvas = canvasRef.current
    const tubeCanvas = tubeCanvasRef.current
    if (!canvas || !tubeCanvas) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    tubeCanvas.width = window.innerWidth
    tubeCanvas.height = window.innerHeight

    const warp = new WarpEngine()
    warp.init(canvas)
    warp.params = { ...params, mode }
    warpRef.current = warp

    const tube = new TubeEngine()
    tube.setPose(mode, 0)
    tubeRef.current = tube

    const sex = new SexEffects()
    sexEffectsRef.current = sex

    loadImage(items[currentIndex]?.url)
    warp.start()

    function handleResize() {
      if (!isMounted.current) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      tubeCanvas.width = window.innerWidth
      tubeCanvas.height = window.innerHeight
      warp.resize(canvas.width, canvas.height)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      warp.destroy()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!tubeRef.current) return
    let running = true
    let lastTime = performance.now()

    function loop(now) {
      if (!running || !isMounted.current) return
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      const tube = tubeRef.current
      const sex = sexEffectsRef.current
      const tc = tubeCanvasRef.current
      if (!tube || !sex || !tc) { requestAnimationFrame(loop); return }

      tube.speed = params.speed
      tube.intensity = params.intensity
      tube.depth = params.depth
      tube.update(dt)
      sex.update(dt)

      const tctx = tc.getContext('2d')
      tctx.clearRect(0, 0, tc.width, tc.height)
      tube.draw(tctx, tc.width, tc.height)

      sex.draw(tctx, tc.width, tc.height, tube.getThrustPhase())

      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
    return () => { running = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function loadImage(url) {
    if (!url) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imgRef.current = img
      if (warpRef.current) warpRef.current.setImage(img)
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
    if (isPlaying) warpRef.current.start()
    else warpRef.current.stop()
  }, [isPlaying])

  useEffect(() => {
    if (!warpRef.current) return
    const id = setInterval(() => {
      if (warpRef.current && warpRef.current.positionName) {
        setPositionName(warpRef.current.positionName)
      }
    }, 500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!tubeRef.current) return
    tubeRef.current.setPose(mode, 0)
  }, [mode])

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
    setParams({ speed: preset.speed, intensity: preset.intensity, jiggle: preset.jiggle, depth: preset.depth, angle: preset.angle })
    if (items.length > 1) {
      let next
      do { next = Math.floor(Math.random() * items.length) } while (next === currentIndexRef.current)
      setCurrentIndex(next)
      loadImage(items[next].url)
    }
    showUi()
  }

  function handleSave() {
    const preset = { mode, params, mood: activeMood, imageIndex: currentIndexRef.current, timestamp: Date.now() }
    try { localStorage.setItem('animation_preset', JSON.stringify(preset)) } catch {}
    showUi()
  }

  function handleAudioSync() {
    setAudioSync((a) => !a)
    showUi()
  }

  function handleEffectsChange(type) {
    const sex = sexEffectsRef.current
    if (!sex) return

    switch (type) {
      case 'condom':
        sex.toggleCondom()
        setEffects((e) => ({ ...e, condom: !e.condom }))
        break
      case 'pill':
        sex.togglePill()
        setEffects((e) => ({ ...e, pill: !e.pill }))
        break
      case 'lube':
        sex.toggleLube()
        setEffects((e) => ({ ...e, lube: !e.lube }))
        break
      case 'cumInside':
        sex.triggerCumInside()
        break
      case 'cumOutside':
        sex.triggerCumOutside()
        break
      case 'more':
        sex.triggerMore()
        break
    }
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
      <canvas ref={tubeCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

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

      <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-500 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full">
          <span className="text-xs text-white/70 font-medium">{positionName || mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
        </div>
      </div>

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
              positionName={positionName}
              effects={effects}
              onEffectsChange={handleEffectsChange}
            />
          </div>
        </>
      )}
    </div>
  )
}
