import { useState, useCallback } from 'react'
import IntimateGate from './IntimateGate'
import IntimateContainer from './IntimateContainer'

export default function IntimatePage() {
  const [unlocked, setUnlocked] = useState(false)

  const handleLock = useCallback(() => {
    setUnlocked(false)
  }, [])

  if (!unlocked) {
    return <IntimateGate onUnlock={() => setUnlocked(true)} />
  }

  return <IntimateContainer onLock={handleLock} />
}
