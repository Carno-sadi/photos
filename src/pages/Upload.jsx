import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const FOLDERS = [
  { label: 'Admin', prefix: 'photos/admin' },
  { label: 'Muskan', prefix: 'muskan' },
  { label: 'Random', prefix: 'random' },
]

export default function Upload() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [folder, setFolder] = useState('photos/admin')
  const inputRef = useRef(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  function revokeThumbs() {
    files.forEach((f) => { if (f.thumb) URL.revokeObjectURL(f.thumb) })
  }

  function handleFiles(list) {
    const items = Array.from(list).map((f) => ({
      file: f,
      name: f.name,
      size: f.size,
      status: 'pending',
      thumb: URL.createObjectURL(f),
    }))
    setFiles((prev) => [...prev, ...items])
  }

  async function uploadAll() {
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      if (!mounted.current) break
      const item = files[i]
      if (item.status === 'complete' || item.status === 'uploading') continue
      setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f))
      const path = `${folder}/${item.file.name}`
      const { error } = await supabase.storage.from('photos').upload(path, item.file, {
        cacheControl: '3600',
        upsert: false,
      })
      if (!mounted.current) break
      setFiles((prev) => prev.map((f, idx) =>
        idx === i ? { ...f, status: error ? 'error' : 'complete' } : f
      ))
    }
    if (mounted.current) setUploading(false)
  }

  function formatSize(bytes) {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + 'KB'
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  }

  const pending = files.filter((f) => f.status !== 'complete')
  const allDone = files.length > 0 && pending.length === 0

  return (
    <div className="min-h-screen pb-24 sm:pb-8 px-3 sm:px-4 md:px-8 pt-14 fade-in">
      <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 justify-center overflow-x-auto px-1 no-scrollbar">
        {FOLDERS.map((f) => (
          <button
            key={f.prefix}
            onClick={() => setFolder(f.prefix)}
            className={`shrink-0 px-3 sm:px-4 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-all active:scale-95 ${
              folder === f.prefix
                ? 'bg-accent text-surface'
                : 'bg-surface-high text-muted hover:text-accent'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl h-[180px] sm:h-[260px] md:h-[320px] flex flex-col items-center justify-center transition-all cursor-pointer ${
          dragOver ? 'border-accent bg-surface-elevated' : 'border-border bg-surface-high/50 hover:border-muted'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="material-symbols-outlined text-3xl sm:text-4xl text-muted mb-2 sm:mb-3">cloud_upload</span>
        <p className="text-sm text-muted mb-0.5 sm:mb-1">Drop images here</p>
        <p className="text-[11px] sm:text-xs text-muted/60">or click to browse</p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 sm:mt-6 max-w-lg mx-auto space-y-2 sm:space-y-3">
          {files.map((item, i) => (
            <div key={i} className={`flex items-center gap-2 sm:gap-3 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 transition-all slide-up ${
              item.status === 'complete'
                ? 'bg-surface-high/50'
                : item.status === 'error'
                  ? 'bg-red-900/20'
                  : 'bg-surface-high'
            }`}>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md overflow-hidden bg-surface shrink-0">
                <img
                  src={item.thumb}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs sm:text-sm truncate ${item.status === 'complete' ? 'text-muted line-through' : ''}`}>
                  {item.name}
                </p>
                <p className={`text-[11px] sm:text-xs ${item.status === 'complete' ? 'text-muted/50' : item.status === 'error' ? 'text-red-400' : 'text-muted'}`}>
                  {item.status === 'complete'
                    ? 'Uploaded'
                    : item.status === 'error'
                      ? 'Failed'
                      : item.status === 'uploading'
                        ? 'Uploading...'
                        : formatSize(item.size)}
                </p>
              </div>
              {item.status === 'complete' ? (
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-muted/50 shrink-0">check_circle</span>
              ) : item.status === 'error' ? (
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-red-400 shrink-0">error</span>
              ) : item.status === 'uploading' ? (
                <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 border border-muted border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <button onClick={() => { URL.revokeObjectURL(item.thumb); setFiles((prev) => prev.filter((_, j) => j !== i)) }} className="p-1 -mr-1 active:scale-90">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-muted hover:text-accent">close</span>
                </button>
              )}
            </div>
          ))}
          {!allDone && (
            <button
              onClick={uploadAll}
              disabled={uploading || pending.length === 0}
              className="w-full py-3 sm:py-3.5 bg-accent text-surface text-sm font-medium rounded-lg hover:opacity-80 transition-opacity active:scale-[0.98] disabled:opacity-50"
            >
              {uploading
                ? `Uploading ${files.filter(f => f.status === 'uploading').length}/${pending.length}...`
                : `Upload ${pending.length} file${pending.length > 1 ? 's' : ''}`}
            </button>
          )}
          {allDone && (
            <button
              onClick={() => { revokeThumbs(); setFiles([]) }}
              className="w-full py-3 sm:py-3.5 bg-surface-high text-muted text-sm font-medium rounded-lg hover:text-accent transition-all active:scale-[0.98]"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {files.length === 0 && (
        <p className="text-center text-[11px] sm:text-xs text-muted/40 mt-6 sm:mt-8">All files are private and only visible to you</p>
      )}
    </div>
  )
}