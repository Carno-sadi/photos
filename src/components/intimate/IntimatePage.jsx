import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import IntimateGate from './IntimateGate'
import IntimateContainer from './IntimateContainer'

export default function IntimatePage() {
  const [unlocked, setUnlocked] = useState(false)
  const [searchParams] = useSearchParams()
  const autoAnimate = searchParams.get('animate') === 'true'

  const handleLock = useCallback(() => {
    setUnlocked(false)
  }, [])

  if (!unlocked) {
    return <IntimateGate onUnlock={() => setUnlocked(true)} />
  }

  return <IntimateContainer onLock={handleLock} autoAnimate={autoAnimate} />
}
