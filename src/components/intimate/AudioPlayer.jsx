import { useState, useRef, useEffect } from 'react'
import IntimateAudioEngine from '../../lib/intimateAudio'

export default function AudioPlayer() {
  const [isOpen, setIsOpen] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [loop, setLoop] = useState(true)
  const [file, setFile] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const engineRef = useRef(null)

  useEffect(() => {
    engineRef.current = new IntimateAudioEngine()
    engineRef.current.init()
    engineRef.current.setVolume(volume)
    engineRef.current.setLoop(loop)

    return () => {
      if (engineRef.current) engineRef.current.destroy()
    }
  }, [volume, loop])

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const engine = engineRef.current
    if (engine) {
      engine.playBlob(f)
      setIsPlaying(true)
    }
  }

  function handleToggle() {
    const engine = engineRef.current
    if (!engine) return
    if (!file) return
    engine.toggle()
    setIsPlaying(engine.isPlaying)
  }

  function handleVolumeChange(val) {
    const v = parseFloat(val)
    setVolume(v)
    if (engineRef.current) engineRef.current.setVolume(v)
  }

  function handleLoopToggle() {
    const l = !loop
    setLoop(l)
    if (engineRef.current) engineRef.current.setLoop(l)
  }

  function handleStop() {
    if (engineRef.current) engineRef.current.stop()
    setIsPlaying(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`fixed bottom-20 sm:bottom-4 right-4 z-30 p-2.5 rounded-full shadow-lg transition-all active:scale-90 ${
          isOpen ? 'bg-accent text-surface' : 'bg-surface-high text-muted hover:text-accent'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">
          {isPlaying ? 'music_note' : 'audio_file'}
        </span>
      </button>

      {isOpen && (
        <div className="fixed bottom-28 sm:bottom-14 right-4 z-30 w-64 bg-surface-elevated border border-border rounded-xl shadow-2xl p-4 slide-up">
          <h3 className="text-xs font-medium text-accent mb-3">Audio Player</h3>

          {!file ? (
            <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-muted/50 transition-colors">
              <span className="material-symbols-outlined text-xl text-muted mb-1">upload_file</span>
              <span className="text-[10px] text-muted">Upload .mp3 / .wav / .m4a</span>
              <input
                type="file"
                accept=".mp3,.wav,.m4a,audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] text-muted truncate">{file.name}</p>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggle}
                  className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>
                <button
                  onClick={handleStop}
                  className="p-2 rounded-full bg-surface-high text-muted hover:text-accent transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-[18px]">stop</span>
                </button>
                <button
                  onClick={handleLoopToggle}
                  className={`p-2 rounded-full transition-all active:scale-90 ${
                    loop ? 'bg-accent/10 text-accent' : 'bg-surface-high text-muted hover:text-accent'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">repeat</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-muted">volume_down</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => handleVolumeChange(e.target.value)}
                  className="flex-1 h-1 accent-accent"
                />
                <span className="material-symbols-outlined text-[14px] text-muted">volume_up</span>
              </div>

              <button
                onClick={() => { setFile(null); handleStop() }}
                className="text-[10px] text-muted hover:text-accent underline transition-colors"
              >
                Remove & upload new
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
