import { useState } from 'react'

export default function RandomMomentButton({ items, onShowRandom }) {
  const [spinning, setSpinning] = useState(false)

  function handleClick() {
    if (items.length === 0) return
    setSpinning(true)
    const randomItem = items[Math.floor(Math.random() * items.length)]
    setTimeout(() => {
      setSpinning(false)
      onShowRandom(randomItem)
    }, 400)
  }

  return (
    <button
      onClick={handleClick}
      disabled={items.length === 0}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-90 ${
        items.length > 0
          ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:opacity-90'
          : 'bg-surface-high text-muted cursor-not-allowed'
      }`}
    >
      <span className={`material-symbols-outlined text-[16px] ${spinning ? 'animate-spin' : ''}`}>
        casino
      </span>
      Random Moment
    </button>
  )
}
