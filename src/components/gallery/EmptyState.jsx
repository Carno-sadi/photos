import { useNavigate } from 'react-router-dom'

export default function EmptyState() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] sm:h-[80vh] text-muted px-4 slide-up">
      <span className="material-symbols-outlined text-4xl sm:text-5xl mb-3 sm:mb-4">photo_library</span>
      <p className="text-sm mb-3">No photos yet</p>
      <button
        onClick={() => navigate('/upload')}
        className="px-5 py-2.5 bg-accent text-surface text-xs font-medium rounded-lg hover:opacity-80 transition-opacity active:scale-95"
      >
        Upload
      </button>
    </div>
  )
}
