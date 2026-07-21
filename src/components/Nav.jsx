import { Link, useLocation } from 'react-router-dom'

export default function Nav() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isUpload = location.pathname === '/upload'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex sm:hidden items-center justify-around h-16 bg-surface/90 backdrop-blur-lg border-t border-border/50 safe-bottom">
      <Link
        to="/"
        className={`flex flex-col items-center gap-0.5 px-4 py-2 transition-all active:scale-90 ${
          isHome ? 'text-accent' : 'text-muted hover:text-accent'
        }`}
      >
        <span className="material-symbols-outlined text-[22px]">photo_library</span>
        <span className="text-[10px] font-medium">Photos</span>
      </Link>
      <Link
        to="/upload"
        className={`flex flex-col items-center gap-0.5 px-4 py-2 transition-all active:scale-90 ${
          isUpload ? 'text-accent' : 'text-muted hover:text-accent'
        }`}
      >
        <span className="material-symbols-outlined text-[22px]">add_circle</span>
        <span className="text-[10px] font-medium">Upload</span>
      </Link>
    </nav>
  )
}
