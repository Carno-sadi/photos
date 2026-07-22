import { useState, useRef } from 'react'

export default function CollageCanvas({ items, onClose }) {
  const canvasRef = useRef(null)
  const [placedItems, setPlacedItems] = useState([])
  const [draggingId, setDraggingId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [saving, setSaving] = useState(false)
  const containerRef = useRef(null)

  function handleAddFromGallery(item) {
    const id = `placed-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const container = containerRef.current
    const w = container ? container.clientWidth : 400
    const h = container ? container.clientHeight : 400
    setPlacedItems((prev) => [
      ...prev,
      {
        id,
        itemId: item.id,
        url: item.url,
        x: Math.random() * (w - 160),
        y: Math.random() * (h - 160),
        w: 160,
        h: 160,
        zIndex: prev.length,
      },
    ])
  }

  function handleDragStart(e, id) {
    setDraggingId(id)
    setSelectedId(id)
  }

  function handleDrag(e) {
    if (!draggingId) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPlacedItems((prev) =>
      prev.map((p) =>
        p.id === draggingId
          ? { ...p, x: e.clientX - rect.left - p.w / 2, y: e.clientY - rect.top - p.h / 2 }
          : p
      )
    )
  }

  function handleDragEnd() {
    setDraggingId(null)
  }

  function bringToFront(id) {
    setPlacedItems((prev) => {
      const maxZ = Math.max(...prev.map((p) => p.zIndex), 0)
      return prev.map((p) => (p.id === id ? { ...p, zIndex: maxZ + 1 } : p))
    })
  }

  function handleCanvasClick() {
    setSelectedId(null)
  }

  function removeSelected() {
    if (selectedId) {
      setPlacedItems((prev) => prev.filter((p) => p.id !== selectedId))
      setSelectedId(null)
    }
  }

  async function handleSave() {
    const canvas = canvasRef.current
    if (!canvas || placedItems.length === 0) return
    setSaving(true)

    const ctx = canvas.getContext('2d')
    const container = containerRef.current
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight

    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const sorted = [...placedItems].sort((a, b) => a.zIndex - b.zIndex)

    const promises = sorted.map((p) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          ctx.drawImage(img, p.x, p.y, p.w, p.h)
          resolve()
        }
        img.onerror = resolve
        img.src = p.url
      })
    })

    await Promise.all(promises)

    const link = document.createElement('a')
    link.download = `collage-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setSaving(false)
  }

  const availableItems = items.filter(
    (item) => !placedItems.some((p) => p.itemId === item.id)
  )

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col">
      <div className="flex items-center justify-between px-3 h-12 shrink-0 border-b border-border">
        <button onClick={onClose} className="p-2 text-muted hover:text-accent transition-colors">
          <span className="material-symbols-outlined text-[22px]">close</span>
        </button>
        <h2 className="text-sm font-medium text-accent">Collage Canvas</h2>
        <div className="flex items-center gap-1">
          {selectedId && (
            <button
              onClick={removeSelected}
              className="p-2 text-red-400 hover:text-red-300 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || placedItems.length === 0}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all active:scale-95 ${
              placedItems.length > 0
                ? 'bg-accent text-surface'
                : 'bg-surface-high text-muted'
            }`}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-surface-elevated m-2 rounded-lg"
          onClick={handleCanvasClick}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          {placedItems.map((p) => (
            <div
              key={p.id}
              className={`absolute cursor-grab active:cursor-grabbing rounded-lg overflow-hidden border-2 transition-shadow ${
                selectedId === p.id ? 'border-accent shadow-lg shadow-accent/20' : 'border-transparent'
              }`}
              style={{
                left: p.x,
                top: p.y,
                width: p.w,
                height: p.h,
                zIndex: p.zIndex,
              }}
              onMouseDown={(e) => { e.stopPropagation(); handleDragStart(e, p.id); bringToFront(p.id) }}
              onTouchStart={(e) => { e.stopPropagation(); handleDragStart(e, p.id); bringToFront(p.id) }}
              onTouchMove={(e) => {
                if (!draggingId) return
                const touch = e.touches[0]
                const rect = containerRef.current?.getBoundingClientRect()
                if (!rect) return
                setPlacedItems((prev) =>
                  prev.map((pi) =>
                    pi.id === draggingId
                      ? { ...pi, x: touch.clientX - rect.left - pi.w / 2, y: touch.clientY - rect.top - pi.h / 2 }
                      : pi
                  )
                )
              }}
              onTouchEnd={() => setDraggingId(null)}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={p.url}
                alt=""
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
            </div>
          ))}

          {placedItems.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted">
              <div className="text-center">
                <span className="material-symbols-outlined text-3xl mb-2 block">dashboard_customize</span>
                <p className="text-xs">Drag images from the tray below</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-20 shrink-0 border-t border-border overflow-x-auto no-scrollbar">
        <div className="flex gap-2 p-2 h-full">
          {availableItems.length === 0 && placedItems.length > 0 && (
            <div className="flex items-center justify-center w-full text-[10px] text-muted">
              All items placed
            </div>
          )}
          {availableItems.length === 0 && placedItems.length === 0 && (
            <div className="flex items-center justify-center w-full text-[10px] text-muted">
              No images available
            </div>
          )}
          {availableItems.map((item) => {
            const url = item.url
            return (
              <button
                key={item.id}
                onClick={() => handleAddFromGallery(item)}
                className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border hover:border-accent/50 transition-all active:scale-95"
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </button>
            )
          })}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
