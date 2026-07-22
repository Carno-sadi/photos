self.addEventListener('message', (e) => {
  if (e.data.type === 'start') {
    const duration = e.data.duration
    const startTime = Date.now()

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = Math.max(0, duration - elapsed)
      self.postMessage({ type: 'tick', remaining })

      if (remaining > 0) {
        setTimeout(tick, 200)
      }
    }

    tick()
  }
})
