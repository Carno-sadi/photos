import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { listAllPhotos, deletePhoto } from '../../lib/supabase'
import Header from '../layout/Header'
import ImageCard from './ImageCard'
import Lightbox from './Lightbox'
import EmptyState from './EmptyState'
import SkeletonLoader from './SkeletonLoader'

export default function GalleryContainer() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadedImages, setLoadedImages] = useState(new Set())
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useEffect(() => {
    let mounted = true
    listAllPhotos().then((items) => {
      if (mounted) {
        setPhotos(items)
        setLoading(false)
      }
    })
    return () => { mounted = false }
  }, [])

  const handleImgLoad = useCallback((id) => {
    setLoadedImages((prev) => new Set(prev).add(id))
  }, [])

  function handleSearchChange(val) { setSearch(val) }
  function handleSortChange(val) { setSort(val) }
  function handleViewModeChange(val) { setViewMode(val) }

  function handleOpenLightbox(photo) {
    const idx = filteredSorted.findIndex((p) => p.id === photo.id)
    setLightboxIndex(idx)
    document.body.style.overflow = 'hidden'
  }

  function handleCloseLightbox() {
    setLightboxIndex(null)
    document.body.style.overflow = ''
  }

  function handleLightboxNavigate(delta) {
    setLightboxIndex((prev) => prev + delta)
  }

  async function handleLightboxDelete(photoId) {
    const { error } = await deletePhoto(photoId)
    if (!error) {
      const deletedIdx = photos.findIndex((p) => p.id === photoId)
      if (deletedIdx !== -1) {
        const newPhotos = photos.filter((p) => p.id !== photoId)
        setPhotos(newPhotos)
        if (lightboxIndex !== null) {
          if (newPhotos.length === 0) {
            setLightboxIndex(null)
            document.body.style.overflow = ''
          } else if (lightboxIndex >= newPhotos.length) {
            setLightboxIndex(newPhotos.length - 1)
          }
        }
      }
    }
  }

  async function handleDeleteFromCard(photoId) {
    const { error } = await deletePhoto(photoId)
    if (!error) {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
    }
  }

  const filteredSorted = photos
    .filter((p) => {
      if (!search) return true
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
      if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at)
      if (sort === 'name-asc') return a.name.localeCompare(b.name)
      if (sort === 'name-desc') return b.name.localeCompare(a.name)
      return 0
    })

  return (
    <div className="min-h-screen pb-20 sm:pb-8">
      <Header
        search={search}
        onSearchChange={handleSearchChange}
        sort={sort}
        onSortChange={handleSortChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        photoCount={photos.length}
      />

      <div className="flex items-center gap-2 px-3 sm:px-6 pt-16 sm:pt-[4.5rem] pb-2">
        <Link
          to="/intimate"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[15px]">favorite</span>
          Intimate
        </Link>
        <Link
          to="/intimate?animate=true"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-pink-600/20 to-purple-600/20 text-pink-300 hover:from-pink-600/30 hover:to-purple-600/30 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[15px]">play_circle</span>
          Sex Page
        </Link>
      </div>

      {loading ? (
        <SkeletonLoader viewMode={viewMode} />
      ) : filteredSorted.length === 0 ? (
        <EmptyState />
      ) : viewMode === 'list' ? (
        <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-16 sm:pt-[4.5rem] space-y-1.5 fade-in">
          {filteredSorted.map((photo, i) => (
            <ImageCard
              key={photo.id}
              photo={photo}
              onOpen={handleOpenLightbox}
              onDeleted={handleDeleteFromCard}
              viewMode="list"
              loadedImages={loadedImages}
              onImgLoad={handleImgLoad}
              priority={i < 4}
            />
          ))}
        </div>
      ) : (
        <div className="gallery-grid px-2 sm:px-4 md:px-6 pt-16 sm:pt-[4.5rem] fade-in">
          {filteredSorted.map((photo, i) => (
            <ImageCard
              key={photo.id}
              photo={photo}
              onOpen={handleOpenLightbox}
              onDeleted={handleDeleteFromCard}
              viewMode="grid"
              loadedImages={loadedImages}
              onImgLoad={handleImgLoad}
              priority={i < 6}
            />
          ))}
        </div>
      )}

      {lightboxIndex !== null && filteredSorted[lightboxIndex] && (
        <Lightbox
          photos={filteredSorted}
          currentIndex={lightboxIndex}
          onClose={handleCloseLightbox}
          onNavigate={handleLightboxNavigate}
          onDelete={handleLightboxDelete}
        />
      )}
    </div>
  )
}
