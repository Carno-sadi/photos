import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { listAllPhotos } from '../lib/supabase'

export default function Gallery() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadedImages, setLoadedImages] = useState(new Set())
  const navigate = useNavigate()

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

  return (
    <div className="min-h-screen pb-20 sm:pb-8 fade-in">
      {loading ? (
        <div className="masonry px-1 sm:px-4 md:px-8 pt-14">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="masonry-item">
              <div className="bg-surface-high rounded-md sm:rounded-lg animate-pulse" style={{ height: `${100 + (i % 4) * 60}px` }} />
            </div>
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh] sm:h-[80vh] text-muted px-4 pt-14 slide-up">
          <span className="material-symbols-outlined text-4xl sm:text-5xl mb-3 sm:mb-4">photo_library</span>
          <p className="text-sm mb-3">No photos yet</p>
          <button
            onClick={() => navigate('/upload')}
            className="px-5 py-2.5 bg-accent text-surface text-xs font-medium rounded-lg hover:opacity-80 transition-opacity active:scale-95"
          >
            Upload
          </button>
        </div>
      ) : (
        <div className="masonry px-1 sm:px-4 md:px-8 pt-14">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => navigate(`/photo/${encodeURIComponent(photo.id)}`)}
              className="masonry-item cursor-pointer overflow-hidden rounded-md sm:rounded-lg bg-surface-high transition-all duration-300 hover:brightness-110 active:brightness-125"
            >
              <img
                src={photo.url}
                alt={photo.name}
                onLoad={() => handleImgLoad(photo.id)}
                className={`w-full object-cover transition-all duration-500 ${
                  loadedImages.has(photo.id) ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}