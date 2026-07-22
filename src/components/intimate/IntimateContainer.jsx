import { useState, useEffect, useRef } from 'react'
import { getAllMedia, deleteMedia, importFromUrl } from '../../lib/intimateDb'
import { listAllPhotos } from '../../lib/supabase'
import IntimateImageCard from './IntimateImageCard'
import IntimateViewer from './IntimateViewer'
import CollageCanvas from './CollageCanvas'
import MoodFilterBar from './MoodFilterBar'
import AudioPlayer from './AudioPlayer'
import SessionController from './SessionController'
import RandomMomentButton from './RandomMomentButton'
import EmptyState from './EmptyState'

export default function IntimateContainer({ onLock }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewerIndex, setViewerIndex] = useState(null)
  const [showCollage, setShowCollage] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [sessionMode, setSessionMode] = useState(false) // eslint-disable-line no-unused-vars
  const [activeMood, setActiveMood] = useState('none')

  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    loadItems()
    return () => { isMounted.current = false }
  }, [])

  async function loadItems() {
    setLoading(true)
    const all = await getAllMedia()
    if (isMounted.current) {
      setItems(all)
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    await deleteMedia(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function handleOpenViewer(item) {
    const idx = items.findIndex((i) => i.id === item.id)
    setViewerIndex(idx)
    document.body.style.overflow = 'hidden'
  }

  function handleCloseViewer() {
    setViewerIndex(null)
    document.body.style.overflow = ''
  }

  function handleViewerNavigate(delta) {
    setViewerIndex((prev) => prev + delta)
  }

  function handleShowRandom(item) {
    handleOpenViewer(item)
  }

  async function handleOpenImport() {
    const photos = await listAllPhotos()
    if (isMounted.current) {
      setGalleryPhotos(photos)
      setShowImport(true)
    }
  }

  async function handleImport(galleryItem) {
    setImporting(true)
    try {
      await importFromUrl(galleryItem.url, galleryItem.name, [], 'default')
      await loadItems()
    } catch (e) {
      console.error('Import failed:', e)
    }
    setImporting(false)
    setShowImport(false)
  }

  async function handleImportAll() {
    setImporting(true)
    const total = galleryPhotos.length
    let imported = 0
    for (const photo of galleryPhotos) {
      if (!isMounted.current) break
      try {
        await importFromUrl(photo.url, photo.name, [], 'default')
        imported++
        setImportProgress(Math.round((imported / total) * 100))
      } catch (e) {
        console.error('Import failed:', e)
      }
    }
    await loadItems()
    setImporting(false)
    setShowImport(false)
  }

  function handleEndSession() {
    setSessionMode(false)
  }

  if (sessionMode) {
    return <SessionController onEndSession={handleEndSession} />
  }

  return (
    <div className="min-h-screen pb-24 sm:pb-8">
      <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-3 h-12">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-accent">favorite</span>
            <h1 className="text-sm font-medium text-accent">Intimate</h1>
            {items.length > 0 && (
              <span className="text-[10px] text-muted bg-surface-high px-1.5 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onLock}
              className="p-1.5 text-muted hover:text-accent transition-colors"
              title="Lock"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
            </button>
          </div>
        </div>
        <MoodFilterBar activeMood={activeMood} onMoodChange={setActiveMood} />
      </div>

      {!loading && items.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto no-scrollbar">
          <RandomMomentButton items={items} onShowRandom={handleShowRandom} />
          <button
            onClick={() => setShowCollage(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-surface-high text-muted hover:text-accent transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-[16px]">dashboard_customize</span>
            Collage
          </button>
          <button
            onClick={handleOpenImport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-surface-high text-muted hover:text-accent transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
            Import
          </button>
        </div>
      )}

      <SessionController onEndSession={handleEndSession} />

      {loading ? (
        <div className="gallery-grid px-2 sm:px-4 md:px-6 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-surface-high animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState onImport={handleOpenImport} />
      ) : (
        <div className="gallery-grid px-2 sm:px-4 md:px-6 pt-2 fade-in">
          {items.map((item) => (
            <IntimateImageCard
              key={item.id}
              item={item}
              onOpen={handleOpenViewer}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {viewerIndex !== null && items[viewerIndex] && (
        <IntimateViewer
          items={items}
          currentIndex={viewerIndex}
          onClose={handleCloseViewer}
          onNavigate={handleViewerNavigate}
        />
      )}

      {showCollage && (
        <CollageCanvas items={items} onClose={() => setShowCollage(false)} />
      )}

      {showImport && (
        <div className="fixed inset-0 z-50 bg-surface flex flex-col fade-in-fast">
          <div className="flex items-center justify-between px-3 h-12 shrink-0 border-b border-border">
            <button
              onClick={() => setShowImport(false)}
              className="p-2 text-muted hover:text-accent transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
            <h2 className="text-sm font-medium text-accent">Import from Gallery</h2>
            <button
              onClick={handleImportAll}
              disabled={importing || galleryPhotos.length === 0}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all active:scale-95 ${
                importing || galleryPhotos.length === 0
                  ? 'bg-surface-high text-muted'
                  : 'bg-accent text-surface'
              }`}
            >
              {importing ? `Importing ${importProgress}%` : `Import All (${galleryPhotos.length})`}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {galleryPhotos.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted text-xs">
                No photos in gallery
              </div>
            ) : (
              <div className="gallery-grid px-2 sm:px-4 md:px-6 pt-3 pb-6">
                {galleryPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => handleImport(photo)}
                    disabled={importing}
                    className="aspect-square rounded-lg overflow-hidden bg-surface-high group relative active:scale-95 transition-transform"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/0 group-hover:text-white/80 text-2xl transition-all">
                        add_circle
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <AudioPlayer />
    </div>
  )
}
