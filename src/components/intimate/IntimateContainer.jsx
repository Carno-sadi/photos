import { useState, useEffect, useRef } from 'react'
import { listIntimatePhotos, uploadToIntimate, deleteIntimatePhoto, copyFromGalleryToIntimate, listAllPhotos } from '../../lib/supabase'
import { getTags, getAllTags } from '../../lib/intimateDb'
import IntimateImageCard from './IntimateImageCard'
import IntimateViewer from './IntimateViewer'
import CollageCanvas from './CollageCanvas'
import MoodFilterBar from './MoodFilterBar'
import AudioPlayer from './AudioPlayer'
import SessionController from './SessionController'
import RandomMomentButton from './RandomMomentButton'
import AnimationViewer2d from './AnimationViewer2d'
import EmptyState from './EmptyState'

export default function IntimateContainer({ onLock, autoAnimate }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewerIndex, setViewerIndex] = useState(null)
  const [showCollage, setShowCollage] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0) // eslint-disable-line no-unused-vars
  const [sessionMode, setSessionMode] = useState(false)
  const [activeMood, setActiveMood] = useState('none')
  const [activeTag, setActiveTag] = useState(null)
  const [importError, setImportError] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [allTagsList, setAllTagsList] = useState([])
  const [animateItem, setAnimateItem] = useState(null)

  const isMounted = useRef(true)
  const audioRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    isMounted.current = true
    loadItems()
    return () => { isMounted.current = false }
  }, [])

  async function loadItems() {
    setLoading(true)
    const [photos, tagsList] = await Promise.all([
      listIntimatePhotos(),
      getAllTags(),
    ])
    const withTags = await Promise.all(
      photos.map(async (p) => {
        const tags = await getTags(p.id)
        return { ...p, tags }
      })
    )
    if (isMounted.current) {
      setItems(withTags)
      setAllTagsList(tagsList)
      setLoading(false)
      if (autoAnimate && withTags.length > 0) {
        setAnimateItem(0)
      }
    }
  }

  const filteredItems = activeTag
    ? items.filter((item) => (item.tags || []).includes(activeTag))
    : items

  async function handleDelete(id) {
    await deleteIntimatePhoto(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function handleOpenViewer(item) {
    const idx = filteredItems.findIndex((i) => i.id === item.id)
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
    setImportError('')
    setSelectedIds(new Set())
    const photos = await listAllPhotos()
    if (isMounted.current) {
      setGalleryPhotos(photos)
      setShowImport(true)
    }
  }

  function handleTagSelect(tag) {
    setActiveTag((prev) => (prev === tag ? null : tag))
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleImportSelected() {
    if (selectedIds.size === 0) return
    setImportError('')
    setImporting(true)
    const selected = galleryPhotos.filter((p) => selectedIds.has(p.id))
    let imported = 0
    let hasError = false
    for (const photo of selected) {
      if (!isMounted.current) break
      try {
        await copyFromGalleryToIntimate(photo.id)
        imported++
        setImportProgress(Math.round((imported / selected.length) * 100))
      } catch {
        hasError = true
      }
    }
    if (hasError) setImportError('Some imports failed. Check the console.')
    await loadItems()
    setImporting(false)
  }

  async function handleImportAll() {
    setImportError('')
    setImporting(true)
    let imported = 0
    let hasError = false
    for (const photo of galleryPhotos) {
      if (!isMounted.current) break
      try {
        await copyFromGalleryToIntimate(photo.id)
        imported++
        setImportProgress(Math.round((imported / galleryPhotos.length) * 100))
      } catch {
        hasError = true
      }
    }
    if (hasError) setImportError('Some imports failed. Check the console.')
    await loadItems()
    setImporting(false)
  }

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setImportError('')
    setImporting(true)
    let uploaded = 0
    let hasError = false
    for (const file of files) {
      if (!isMounted.current) break
      try {
        await uploadToIntimate(file)
        uploaded++
        setUploadProgress(Math.round((uploaded / files.length) * 100))
      } catch {
        hasError = true
      }
    }
    if (hasError) setImportError('Some uploads failed.')
    await loadItems()
    setImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSessionStart() {
    if (audioRef.current && audioRef.current.hasTracks()) {
      audioRef.current.play()
    }
  }

  function handleEndSession() {
    setSessionMode(false)
  }

  function handleAnimate(item) {
    const idx = items.findIndex((i) => i.id === item.id)
    setAnimateItem(idx >= 0 ? idx : 0)
  }

  async function refreshTagsList() {
    const tags = await getAllTags()
    setAllTagsList(tags)
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
                {filteredItems.length}/{items.length}
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

        {allTagsList.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 pb-2 overflow-x-auto no-scrollbar">
            {allTagsList.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagSelect(tag)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all active:scale-90 whitespace-nowrap ${
                  activeTag === tag
                    ? 'bg-accent text-surface'
                    : 'bg-surface-high text-muted hover:text-accent'
                }`}
              >
                {tag}
              </button>
            ))}
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                className="px-2 py-1 text-[10px] text-muted hover:text-accent transition-colors"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>

      {!loading && items.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto no-scrollbar">
          <RandomMomentButton items={filteredItems} onShowRandom={handleShowRandom} />
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
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-surface-high text-muted hover:text-accent transition-all active:scale-90 cursor-pointer">
            <span className="material-symbols-outlined text-[16px]">upload</span>
            Upload
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      <SessionController items={filteredItems} activeMood={activeMood} onEndSession={handleEndSession} onSessionStart={handleSessionStart} />

      {loading ? (
        <div className="gallery-grid px-2 sm:px-4 md:px-6 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-surface-high animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState onImport={handleOpenImport} onUpload={() => fileInputRef.current?.click()} />
      ) : (
        <div className="gallery-grid px-2 sm:px-4 md:px-6 pt-2 fade-in">
          {filteredItems.map((item) => (
            <IntimateImageCard
              key={item.id}
              item={item}
              onOpen={handleOpenViewer}
              onDelete={handleDelete}
              onTagsChanged={refreshTagsList}
              onAnimate={handleAnimate}
            />
          ))}
        </div>
      )}

      {viewerIndex !== null && filteredItems[viewerIndex] && (
        <IntimateViewer
          items={filteredItems}
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
            <div className="flex items-center gap-1">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleImportSelected}
                  disabled={importing}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all active:scale-95 ${
                    importing ? 'bg-surface-high text-muted' : 'bg-accent text-surface'
                  }`}
                >
                  {importing ? `Importing ${importProgress}%` : `Import (${selectedIds.size})`}
                </button>
              )}
              <button
                onClick={handleImportAll}
                disabled={importing || galleryPhotos.length === 0}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all active:scale-95 ${
                  importing || galleryPhotos.length === 0
                    ? 'bg-surface-high text-muted'
                    : 'bg-accent text-surface'
                }`}
              >
                {importing ? `Importing ${importProgress}%` : `All (${galleryPhotos.length})`}
              </button>
            </div>
          </div>

          {importError && (
            <div className="px-3 py-2 bg-red-500/10 border-b border-red-500/20">
              <p className="text-[10px] text-red-400">{importError}</p>
            </div>
          )}

          {importing && (
            <div className="px-3 py-1.5 bg-accent/5 border-b border-accent/10">
              <p className="text-[10px] text-accent/70">Processing...</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {galleryPhotos.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted text-xs">
                No photos in gallery
              </div>
            ) : (
              <div className="gallery-grid px-2 sm:px-4 md:px-6 pt-3 pb-6">
                {galleryPhotos.map((photo) => {
                  const isSelected = selectedIds.has(photo.id)
                  return (
                    <button
                      key={photo.id}
                      onClick={() => { if (!importing) toggleSelect(photo.id) }}
                      disabled={importing}
                      className={`aspect-square rounded-lg overflow-hidden bg-surface-high group relative active:scale-95 transition-all ${
                        isSelected ? 'ring-2 ring-accent' : ''
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className={`w-full h-full object-cover transition-all ${
                          isSelected ? 'opacity-60' : ''
                        }`}
                        draggable={false}
                      />
                      <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                        isSelected ? 'bg-accent border-accent' : 'border-white/50 bg-black/30'
                      }`}>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[12px] text-surface">check</span>
                        )}
                      </div>
                      <div className="absolute bottom-1 left-1 right-1">
                        <p className="text-[8px] text-white/70 truncate text-left px-1 drop-shadow-md">
                          {photo.name}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {animateItem !== null && items.length > 0 && (
        <AnimationViewer2d
          items={items}
          startIndex={animateItem}
          onClose={() => setAnimateItem(null)}
        />
      )}

      <AudioPlayer ref={audioRef} />
    </div>
  )
}
