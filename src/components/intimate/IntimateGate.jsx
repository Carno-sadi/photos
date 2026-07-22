import { useState, useEffect } from 'react'

function hashPin(pin) {
  let hash = 0
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

const STORAGE_KEY = 'intimate_pin_hash'

export default function IntimateGate({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState('verify')
  const [confirmPin, setConfirmPin] = useState('')

  useEffect(() => {
    const storedHash = localStorage.getItem(STORAGE_KEY)
    if (!storedHash) setMode('setup')
  }, [])

  function handleDigit(d) {
    if (pin.length < 4) {
      setPin((p) => p + d)
      setError('')
    }
  }

  function handleDelete() {
    setPin((p) => p.slice(0, -1))
    setError('')
  }

  function handleSubmit() {
    if (pin.length !== 4) return

    if (mode === 'setup') {
      setConfirmPin(pin)
      setMode('confirm')
      setPin('')
      return
    }

    if (mode === 'confirm') {
      if (pin === confirmPin) {
        localStorage.setItem(STORAGE_KEY, hashPin(pin))
        onUnlock()
      } else {
        setError('PINs do not match')
        setPin('')
        setMode('setup')
        setConfirmPin('')
      }
      return
    }

    const storedHash = localStorage.getItem(STORAGE_KEY)
    if (hashPin(pin) === storedHash) {
      onUnlock()
    } else {
      setError('Wrong PIN')
      setPin('')
    }
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY)
    setMode('setup')
    setPin('')
    setConfirmPin('')
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs mx-auto text-center slide-up">
        <span className="material-symbols-outlined text-5xl text-accent/80 mb-4">lock</span>

        <h2 className="text-lg font-medium text-accent mb-1">
          {mode === 'setup' && 'Set Intimate PIN'}
          {mode === 'confirm' && 'Confirm PIN'}
          {mode === 'verify' && 'Enter PIN'}
        </h2>
        <p className="text-xs text-muted mb-6">
          {mode === 'setup' && 'Choose a 4-digit PIN to protect your intimate gallery'}
          {mode === 'confirm' && 'Re-enter your PIN to confirm'}
          {mode === 'verify' && 'Enter your 4-digit PIN'}
        </p>

        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-150 ${
                pin.length > i ? 'bg-accent scale-110' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

        <div className="grid grid-cols-3 gap-3 max-w-[200px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="w-14 h-14 rounded-full bg-surface-high text-accent text-lg font-medium hover:bg-surface-high/70 transition-all active:scale-90"
            >
              {d}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit(0)}
            className="w-14 h-14 rounded-full bg-surface-high text-accent text-lg font-medium hover:bg-surface-high/70 transition-all active:scale-90"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-14 h-14 rounded-full bg-surface-high text-muted hover:text-accent transition-all active:scale-90 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-xl">backspace</span>
          </button>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={pin.length !== 4}
            className={`px-6 py-2.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              pin.length === 4
                ? 'bg-accent text-surface'
                : 'bg-surface-high text-muted'
            }`}
          >
            {mode === 'setup' ? 'Set PIN' : mode === 'confirm' ? 'Confirm' : 'Unlock'}
          </button>
        </div>

        {mode === 'verify' && (
          <button
            onClick={handleReset}
            className="mt-4 text-xs text-muted hover:text-accent underline transition-colors"
          >
            Reset PIN
          </button>
        )}
      </div>
    </div>
  )
}
