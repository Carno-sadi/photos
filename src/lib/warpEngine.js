export default class WarpEngine {
  constructor() {
    this.canvas = null
    this.ctx = null
    this.sourceImage = null
    this.gridCols = 40
    this.gridRows = 40
    this.grid = []
    this.baseGrid = []
    this.springs = []
    this.animTime = 0
    this.running = false
    this.frameId = null
    this.onFrame = null

    this.params = {
      speed: 0.5,
      intensity: 0.5,
      jiggle: 0.3,
      angle: 0,
      mode: 'thrust',
    }

    this.particles = []
  }

  init(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.buildGrid()
  }

  setImage(img) {
    this.sourceImage = img
    this.buildGrid()
  }

  buildGrid() {
    if (!this.canvas || !this.sourceImage) return
    const w = this.canvas.width
    const h = this.canvas.height
    this.grid = []
    this.baseGrid = []
    this.springs = []

    const cols = this.gridCols
    const rows = this.gridRows

    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= cols; col++) {
        const x = (col / cols) * w
        const y = (row / rows) * h
        this.grid.push({ x, y, ox: x, oy: y })
        this.baseGrid.push({ x, y })
        this.springs.push({
          vx: 0,
          vy: 0,
          targetX: x,
          targetY: y,
        })
      }
    }
  }

  resize(w, h) {
    if (this.canvas) {
      this.canvas.width = w
      this.canvas.height = h
      this.buildGrid()
    }
  }

  getGridIndex(row, col) {
    const cols = this.gridCols
    return row * (cols + 1) + col
  }

  getRowCol(idx) {
    const cols = this.gridCols + 1
    return { row: Math.floor(idx / cols), col: idx % cols }
  }

  applyDisplacement(index, dx, dy) {
    if (index < 0 || index >= this.grid.length) return
    this.grid[index].x += dx
    this.grid[index].y += dy
  }

  applyRadialDisplacement(cx, cy, radius, strength, time) {
    for (let i = 0; i < this.grid.length; i++) {
      const p = this.grid[i]
      const dx = p.ox - cx
      const dy = p.oy - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > radius) continue
      const falloff = 1 - dist / radius
      const angle = Math.atan2(dy, dx)
      const wave = Math.sin(dist * 0.05 - time * 2) * falloff * strength
      p.x += Math.cos(angle) * wave
      p.y += Math.sin(angle) * wave
    }
  }

  applyWaveDisplacement(axis, frequency, amplitude, time) {
    for (let i = 0; i < this.grid.length; i++) {
      const p = this.grid[i]
      const { col } = this.getRowCol(i)
      const wave = Math.sin(col * frequency + time) * amplitude
      if (axis === 'x') p.x += wave
      else p.y += wave
    }
  }

  applyThrustDisplacement(intensity, time) {
    const cols = this.gridCols + 1
    const rows = this.gridRows + 1
    const centerCol = cols / 2
    const centerRow = rows * 0.55

    const pulse = Math.sin(time * 3) * intensity * 30
    const compression = Math.sin(time * 3) * intensity * 0.08

    for (let i = 0; i < this.grid.length; i++) {
      const p = this.grid[i]
      const { row, col } = this.getRowCol(i)
      const dc = col - centerCol
      const dr = row - centerRow
      const dist = Math.sqrt(dc * dc + dr * dr)
      const maxDist = Math.max(cols, rows) * 0.5
      if (dist > maxDist) continue
      const falloff = 1 - dist / maxDist

      const angle = Math.atan2(dr, dc)
      p.x += Math.cos(angle) * pulse * falloff * 0.3
      p.y += Math.sin(angle) * pulse * falloff * 0.8

      const compress = (dr > -3 && dr < 5 && Math.abs(dc) < 6) ? -compression * 10 : 0
      p.y += compress * falloff
    }
  }

  applyBreathingDisplacement(intensity, time) {
    const cols = this.gridCols + 1
    const rows = this.gridRows + 1
    const centerRow = rows * 0.35

    const breath = Math.sin(time * 1.5) * intensity * 15

    for (let i = 0; i < this.grid.length; i++) {
      const p = this.grid[i]
      const { row, col } = this.getRowCol(i)
      const dr = row - centerRow
      const dc = col - cols / 2
      const dist = Math.sqrt(dr * dr + dc * dc)
      const maxDist = rows * 0.6
      if (dist > maxDist) continue
      const falloff = 1 - dist / maxDist
      p.y += breath * falloff * 0.5
      p.x += breath * falloff * 0.15
    }
  }

  applyJiggleImpulse(impulseX, impulseY, time) {
    const cols = this.gridCols + 1
    const rows = this.gridRows + 1
    const centerRow = rows * 0.3
    const centerCol = cols * 0.5
    const radius = rows * 0.2

    for (let i = 0; i < this.grid.length; i++) {
      const p = this.grid[i]
      const { row, col } = this.getRowCol(i)
      const dr = row - centerRow
      const dc = col - centerCol
      const dist = Math.sqrt(dr * dr + dc * dc) / radius
      if (dist > 1) continue
      const falloff = (1 - dist) * (1 - dist)
      const decay = Math.exp(-time * 2)
      const oscillate = Math.cos(time * 8)

      p.x += impulseX * falloff * decay * oscillate * 0.5
      p.y += impulseY * falloff * decay * oscillate * 0.3
    }
  }

  springRelax(damping) {
    for (let i = 0; i < this.grid.length; i++) {
      const p = this.grid[i]
      const s = this.springs[i]
      const dx = p.ox - p.x
      const dy = p.oy - p.y

      s.vx += dx * 0.3
      s.vy += dy * 0.3
      s.vx *= damping
      s.vy *= damping

      p.x += s.vx
      p.y += s.vy
    }
  }

  resetGrid() {
    for (let i = 0; i < this.grid.length; i++) {
      this.grid[i].x = this.baseGrid[i].x
      this.grid[i].y = this.baseGrid[i].y
      this.springs[i].vx = 0
      this.springs[i].vy = 0
    }
  }

  render() {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height

    ctx.clearRect(0, 0, w, h)

    if (!this.sourceImage) return

    const cols = this.gridCols
    const rows = this.gridRows

    const imgW = this.sourceImage.width
    const imgH = this.sourceImage.height

    ctx.beginPath()
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i0 = this.getGridIndex(row, col)
        const i1 = this.getGridIndex(row, col + 1)
        const i2 = this.getGridIndex(row + 1, col)
        const i3 = this.getGridIndex(row + 1, col + 1)

        const p0 = this.grid[i0]
        const p1 = this.grid[i1]
        const p2 = this.grid[i2]
        const p3 = this.grid[i3]

        const u0 = col / cols
        const v0 = row / rows
        const u1 = (col + 1) / cols
        const v1 = (row + 1) / rows

        const sx0 = u0 * imgW
        const sy0 = v0 * imgH
        const sx1 = u1 * imgW
        const sy1 = v1 * imgH

        ctx.save()
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p1.x, p1.y)
        ctx.lineTo(p3.x, p3.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.closePath()
        ctx.clip()

        ctx.drawImage(
          this.sourceImage,
          sx0, sy0, sx1 - sx0, sy1 - sy0,
          p0.x, p0.y, p1.x - p0.x, p3.y - p0.y
        )
        ctx.restore()
      }
    }
  }

  tick(dt) {
    if (!this.running) return
    this.animTime += dt * this.params.speed

    this.resetGrid()

    const intensity = this.params.intensity

    switch (this.params.mode) {
      case 'thrust':
        this.applyThrustDisplacement(intensity, this.animTime)
        if (this.params.jiggle > 0.1) {
          const jigglePhase = Math.sin(this.animTime * 3)
          this.applyJiggleImpulse(jigglePhase * this.params.jiggle * 20, 0, this.animTime * 2)
        }
        break
      case 'breathe':
        this.applyBreathingDisplacement(intensity, this.animTime)
        this.applyWaveDisplacement('x', 0.05, intensity * 5, this.animTime)
        break
      case 'wave':
        this.applyWaveDisplacement('y', 0.08, intensity * 20, this.animTime)
        this.applyWaveDisplacement('x', 0.04, intensity * 10, this.animTime + 1)
        break
      case 'pulse':
        this.applyRadialDisplacement(
          this.canvas.width / 2,
          this.canvas.height * 0.5,
          this.canvas.height * 0.5,
          intensity * 20,
          this.animTime
        )
        break
    }

    this.applyWaveDisplacement('x', 0.02, intensity * 3, this.animTime * 0.5)
    this.springRelax(0.85)
    this.render()

    if (this.onFrame) this.onFrame()
  }

  start() {
    if (this.running) return
    this.running = true
    this.animTime = 0
    let lastTime = performance.now()

    const loop = (now) => {
      if (!this.running) return
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now
      this.tick(dt)
      this.frameId = requestAnimationFrame(loop)
    }
    this.frameId = requestAnimationFrame(loop)
  }

  stop() {
    this.running = false
    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
    this.resetGrid()
    this.render()
  }

  destroy() {
    this.stop()
    this.canvas = null
    this.ctx = null
    this.sourceImage = null
  }
}
