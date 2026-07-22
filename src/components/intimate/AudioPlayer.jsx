import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import IntimateAudioEngine from '../../lib/intimateAudio'
import { savePlaylist, getPlaylists, deletePlaylist } from '../../lib/intimateDb'

const MAX_AUDIO_SIZE = 50 * 1024 * 1024

const AudioPlayer = forwardRef(function AudioPlayer(props, ref) {
  const [isOpen, setIsOpen] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [loop, setLoop] = useState(true)
  const [playlist, setPlaylist] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [savedPlaylists, setSavedPlaylists] = useState([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [playlistName, setPlaylistName] = useState('')
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [error, setError] = useState('')

  const engineRef = useRef(null)
  const fileInputRef = useRef(null)

  useImperativeHandle(ref, () => ({
    play() {
      if (playlist.length > 0 && currentIndex >= 0 && engineRef.current) {
        engineRef.current.play()
        setIsPlaying(true)
      }
    },
    isPlaying() { return isPlaying },
    hasTracks() { return playlist.length > 0 },
  }))

  useEffect(() => {
    engineRef.current = new IntimateAudioEngine()
    engineRef.current.init()
    engineRef.current.setVolume(volume)
    engineRef.current.setLoop(loop)
    loadSavedPlaylists()

    return () => {
      if (engineRef.current) engineRef.current.destroy()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (engineRef.current) engineRef.current.setVolume(volume)
  }, [volume])

  useEffect(() => {
    if (engineRef.current) engineRef.current.setLoop(loop)
  }, [loop])

  async function loadSavedPlaylists() {
    const lists = await getPlaylists()
    setSavedPlaylists(lists)
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files || [])
    for (const f of files) {
      if (f.size > MAX_AUDIO_SIZE) {
        setError(`"${f.name}" exceeds 50MB limit`)
        return
      }
    }
    setError('')
    const newTracks = files.map((f) => ({
      id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      blob: f,
    }))
    setPlaylist((prev) => [...prev, ...newTracks])
    if (currentIndex < 0 && newTracks.length > 0) {
      setCurrentIndex(0)
      playTrack(newTracks[0])
    }
  }

  function playTrack(track) {
    const engine = engineRef.current
    if (!engine) return
    engine.playBlob(track.blob)
    setIsPlaying(true)
  }

  function selectTrack(index) {
    const track = playlist[index]
    if (!track) return
    setCurrentIndex(index)
    playTrack(track)
  }

  function handleToggle() {
    const engine = engineRef.current
    if (!engine) return
    if (playlist.length === 0) return
    engine.toggle()
    setIsPlaying(engine.isPlaying)
  }

  function handleNext() {
    if (playlist.length === 0) return
    const next = (currentIndex + 1) % playlist.length
    selectTrack(next)
  }

  function handlePrev() {
    if (playlist.length === 0) return
    const prev = (currentIndex - 1 + playlist.length) % playlist.length
    selectTrack(prev)
  }

  function handleStop() {
    if (engineRef.current) engineRef.current.stop()
    setIsPlaying(false)
  }

  function removeTrack(id) {
    setPlaylist((prev) => {
      const idx = prev.findIndex((t) => t.id === id)
      const updated = prev.filter((t) => t.id !== id)
      if (currentIndex === idx) {
        if (updated.length > 0) {
          const newIdx = Math.min(idx, updated.length - 1)
          setCurrentIndex(newIdx)
          playTrack(updated[newIdx])
        } else {
          setCurrentIndex(-1)
          handleStop()
        }
      } else if (currentIndex > idx) {
        setCurrentIndex((c) => c - 1)
      }
      return updated
    })
  }

  function clearPlaylist() {
    handleStop()
    setPlaylist([])
    setCurrentIndex(-1)
  }

  async function handleSavePlaylist() {
    if (!playlistName.trim() || playlist.length === 0) return
    const tracks = playlist.map((t) => ({
      id: t.id,
      name: t.name,
    }))
    await savePlaylist({
      id: `playlist-${Date.now()}`,
      name: playlistName.trim(),
      tracks,
      createdAt: Date.now(),
    })
    setPlaylistName('')
    setShowSaveDialog(false)
    await loadSavedPlaylists()
  }

  async function handleLoadPlaylist() {
    setShowLoadDialog(false)
    setError('')
    setPlaylist([])
    setCurrentIndex(-1)
    handleStop()
  }

  async function handleDeletePlaylist(id) {
    await deletePlaylist(id)
    await loadSavedPlaylists()
  }

  const currentTrack = currentIndex >= 0 ? playlist[currentIndex] : null

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
        <div className="fixed bottom-28 sm:bottom-14 right-4 z-30 w-72 bg-surface-elevated border border-border rounded-xl shadow-2xl max-h-[70vh] flex flex-col slide-up">
          <div className="flex items-center justify-between p-3 border-b border-border shrink-0">
            <h3 className="text-xs font-medium text-accent">Audio Player</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={playlist.length === 0}
                className={`p-1 rounded transition-colors ${
                  playlist.length > 0 ? 'text-muted hover:text-accent' : 'text-border'
                }`}
                title="Save playlist"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
              </button>
              <button
                onClick={() => setShowLoadDialog(true)}
                className="p-1 text-muted hover:text-accent transition-colors"
                title="Load playlist"
              >
                <span className="material-symbols-outlined text-[16px]">folder_open</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {playlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 px-4">
                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-muted/50 transition-colors mb-3">
                  <span className="material-symbols-outlined text-xl text-muted mb-1">upload_file</span>
                  <span className="text-[10px] text-muted">Upload .mp3 / .wav / .m4a</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.m4a,audio/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {savedPlaylists.length > 0 && (
                  <div className="w-full">
                    <p className="text-[10px] text-muted mb-2">Saved playlists:</p>
                    {savedPlaylists.map((pl) => (
                    <button
                                        key={pl.id}
                                        onClick={() => handleLoadPlaylist()}
                        className="w-full text-left px-3 py-2 rounded-lg bg-surface-high hover:bg-surface-high/70 text-[11px] text-muted hover:text-accent transition-all mb-1 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[14px]">audiotrack</span>
                        {pl.name}
                        <span className="ml-auto text-[9px] text-muted/50">{pl.tracks.length} tracks</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {playlist.map((track, i) => (
                  <div
                    key={track.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                      i === currentIndex ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-surface-high hover:text-accent'
                    }`}
                    onClick={() => selectTrack(i)}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {i === currentIndex && isPlaying ? 'music_note' : 'audiotrack'}
                    </span>
                    <span className="text-[11px] truncate flex-1">{track.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeTrack(track.id) }}
                      className="p-0.5 text-muted/50 hover:text-red-400 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="px-3 py-1.5">
              <p className="text-[10px] text-red-400">{error}</p>
            </div>
          )}

          {playlist.length > 0 && (
            <div className="shrink-0 border-t border-border p-3 space-y-3">
              {currentTrack && (
                <p className="text-[10px] text-muted truncate">
                  Now playing: {currentTrack.name}
                </p>
              )}

              <div className="flex items-center gap-2 justify-center">
                <button
                  onClick={handlePrev}
                  className="p-1.5 rounded-full bg-surface-high text-muted hover:text-accent transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-[16px]">skip_previous</span>
                </button>
                <button
                  onClick={handleToggle}
                  className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>
                <button
                  onClick={handleNext}
                  className="p-1.5 rounded-full bg-surface-high text-muted hover:text-accent transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-[16px]">skip_next</span>
                </button>
                <button
                  onClick={handleStop}
                  className="p-1.5 rounded-full bg-surface-high text-muted hover:text-accent transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-[16px]">stop</span>
                </button>
                <button
                  onClick={() => setLoop((l) => !l)}
                  className={`p-1.5 rounded-full transition-all active:scale-90 ${
                    loop ? 'bg-accent/10 text-accent' : 'bg-surface-high text-muted hover:text-accent'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">repeat</span>
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
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1 accent-accent"
                />
                <span className="material-symbols-outlined text-[14px] text-muted">volume_up</span>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] text-muted hover:text-accent underline transition-colors"
                >
                  Add more
                </button>
                <button
                  onClick={clearPlaylist}
                  className="text-[10px] text-muted hover:text-red-400 underline transition-colors"
                >
                  Clear all
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,audio/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {showSaveDialog && (
            <div className="absolute inset-0 bg-surface-elevated/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-4 z-10 fade-in-fast">
              <h4 className="text-xs font-medium text-accent mb-3">Save Playlist</h4>
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Playlist name"
                className="w-full px-3 py-2 bg-surface-high border border-border rounded-lg text-xs text-accent placeholder:text-muted/50 outline-none focus:border-accent/50 mb-3"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-1.5 text-xs text-muted hover:text-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePlaylist}
                  disabled={!playlistName.trim()}
                  className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all active:scale-95 ${
                    playlistName.trim() ? 'bg-accent text-surface' : 'bg-surface-high text-muted'
                  }`}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {showLoadDialog && (
            <div className="absolute inset-0 bg-surface-elevated/95 backdrop-blur-sm rounded-xl flex flex-col p-4 z-10 fade-in-fast">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-accent">Load Playlist</h4>
                <button
                  onClick={() => setShowLoadDialog(false)}
                  className="p-1 text-muted hover:text-accent transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
              {savedPlaylists.length === 0 ? (
                <p className="text-[10px] text-muted text-center py-4">No saved playlists</p>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-1">
                  {savedPlaylists.map((pl) => (
                    <div
                      key={pl.id}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-surface-high hover:bg-surface-high/70 transition-all"
                    >
                      <button
                              onClick={() => handleLoadPlaylist()}
                              className="flex items-center gap-2 flex-1 text-left"
                      >
                        <span className="material-symbols-outlined text-[14px] text-muted">audiotrack</span>
                        <div>
                          <p className="text-[11px] text-muted hover:text-accent transition-colors">{pl.name}</p>
                          <p className="text-[9px] text-muted/50">{pl.tracks.length} tracks</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeletePlaylist(pl.id)}
                        className="p-1 text-muted/50 hover:text-red-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
})

export default AudioPlayer
