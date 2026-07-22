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
      depth: 0.5,
      angle: 0,
      mode: 'missionary',
    }

    this.positionName = ''
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
        this.springs.push({ vx: 0, vy: 0, targetX: x, targetY: y })
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
    return row * (this.gridCols + 1) + col
  }

  getRowCol(idx) {
    const cols = this.gridCols + 1
    return { row: Math.floor(idx / cols), col: idx % cols }
  }

  applyMissionary(intensity, depth, time) {
    const cols = this.gridCols + 1
    const rows = this.gridRows + 1
    const cx = cols / 2
    const cy = rows * (0.5 + this.params.angle * 0.15)

    const pulse = Math.sin(time * 3) * intensity * depth * 35
    const compress = Math.sin(time * 3) * intensity * depth * 0.1

    for (let i = 0; i < this.grid.length; i++) {
      const p = this.grid[i]
      const { row, col } = this.getRowCol(i)
      const dc = col - cx
      const dr = row - cy
      const dist = Math.sqrt(dc * dc + dr * dr)
      const maxDist = Math.max(cols, rows) * 0.5
      if (dist > maxDist) continue
      const falloff = 1 - dist / maxDist
      const a = Math.atan2(dr, dc)

      p.x += Math.cos(a) * pulse * falloff * 0.25
      p.y += Math.sin(a) * pulse * falloff * 0.9

      const inZone = dr > -3 && dr < 6 && Math.abs(dc) < 5
      if (inZone) p.y += -compress * 12 * falloff
    }
    this.positionName = 'Missionary'
  }

  applyDoggy(intensity, depth, time) {
    const cols = this.gridCols + 1
    const rows = this.gridRows + 1
    const cx = cols * 0.45
    const cy = rows * (0.6 + this.params.angle * 0.12)

    const pulse = Math.sin(time * 2.8) * intensity * depth * 30
    const rock = Math.sin(time * 2.8) * intensity * 8

    for (let i = 0; i < this.grid.length; i++) {
      const p = this.grid[i]
      const { row, col } = this.getRowCol(i)
      const dc = col - cx
      const dr = row - cy
      const dist = Math.sqrt(dc * dc + dr * dr)
      const maxDist = Math.max(cols, rows) * 0.5
      if (dist > maxDist) continue
      const falloff = 1 - dist / maxDist

      p.x += dc > 0 ? pulse * falloff * 0.6 : -pulse * falloff * 0.3
      p.y += rock * falloff * (dr > 0 ? 0.7 : 0.3)

      const rearZone = dr > -2 && dr < 8 && Math.abs(dc) < 4
      if (rearZone) p.y += pulse * falloff * 0.5
      if (rearZone) p.x += rock * falloff * 0.4
    }
    this.positionName = 'Doggy'
  }

  applyCowgirl(intensity, depth, time) {
    const cols = this.gridCols + 1
    const rows = this.gridRows + 1
    const cx = cols / 2
    const cy = rows * (0.45 + this.params.angle * 0.1)

    const bounce = Math.sin(time * 3.2) * intensity * depth * 25
    const sway = Math.cos(time * 1.6) * intensity * 10

    for (let i = 0; i < this.grid.length; i++) {
      const p = this.grid[i]
      const { row, col } = this.getRowCol(i)
      const dc = col - cx
      const dr = row - cy
      const dist = Math.sqrt(dc * dc + dr * dr)
      const maxDist = Math.max(cols, rows) * 0.55
      if (dist > maxDist) continue
      const falloff = 1 - dist / maxDist

      p.y += bounce * falloff * (dr > 0 ? 0.8 : 0.4)
      p.x += sway * falloff * 0.3 + Math.sin(dc * 0.3 + time * 2) * intensity * 4 * falloff

      const centerZone = Math.abs(dr) < 4 && Math.abs(dc) < 4
      if (centerZone) p.y += bounce * falloff * 0.6
    }
    this.positionName = 'Cowgirl'
  }

  applyOral(intensity, depth, time) {
    const cols = this.gridCols + 1
    const rows = this.gridRows + 1
    const cx = cols / 2
    const cy = rows * (0.25 + this.params.angle * 0.1)

    const bob = Math.sin(time * 3.5) * intensity * depth * 20
    const tilt = Math.sin(time * 3.5 + 1) * intensity * 6

    for (let i = 0; i < this.grid.length; i++) {
      const p = this.grid[i]
      const { row, col } = this.getRowCol(i)
      const dc = col - cx
      const dr = row - cy
      const dist = Math.sqrt(dc * dc + dr * dr)
      const maxDist = Math.max(cols, rows) * 0.45
      if (dist > maxDist) continue
      const falloff = 1 - dist / maxDist

      const upperWeight = Math.max(0, 1 - dr / (rows * 0.3))
      p.y += bob * falloff * upperWeight
      p.x += tilt * falloff * (Math.abs(dc) < 3 ? 0.5 : 0.15)

      if (dr < 3 && Math.abs(dc) < 3) {
        p.x += Math.sin(dc * 0.5 + time * 4) * intensity * 3 * falloff
      }
    }
    this.positionName = 'Oral'
  }

  applyPassion(intensity, depth, time) {
    const cols = this.gridCols + 1
    const rows = this.gridRows + 1
    const cx = cols / 2

    const wave = Math.sin(time * 1.8) * intensity * depth * 20
    const roll = Math.cos(time * 1.2) * intensity * 12

    for (let i = 0; i < this.grid.length; i++) {
      const p = this.grid[i]
      const { row, col } = this.getRowCol(i)
      const dc = col - cx
      const dist = Math.sqrt(dc * dc)
      const maxDist = cols * 0.5
      if (dist > maxDist) continue
      const falloff = 1 - dist / maxDist

      const phase = (row / rows) * Math.PI * 2
      const bodyWave = Math.sin(phase + time * 1.8) * intensity * depth * 15
      p.y += bodyWave * falloff + wave * falloff * 0.3
      p.x += roll * falloff * Math.sin(phase * 0.5) * 0.5
    }
    this.positionName = 'Passion'
  }

  applyJiggleImpulse(impulseX, impulseY, time) {
    const rows = this.gridRows + 1
    const cols = this.gridCols + 1
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

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i0 = this.getGridIndex(row, col)
        const i1 = this.getGridIndex(row, col + 1)
        const i2 = this.getGridIndex(row + 1, col)
        const i3 = this.getGridIndex(row + 1, col + 1)
        const p0 = this.grid[i0]; const p1 = this.grid[i1]
        const p2 = this.grid[i2]; const p3 = this.grid[i3]
        const u0 = col / cols; const v0 = row / rows
        const u1 = (col + 1) / cols; const v1 = (row + 1) / rows
        const sx0 = u0 * imgW; const sy0 = v0 * imgH
        const sx1 = u1 * imgW; const sy1 = v1 * imgH

        ctx.save()
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p1.x, p1.y)
        ctx.lineTo(p3.x, p3.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(this.sourceImage, sx0, sy0, sx1 - sx0, sy1 - sy0, p0.x, p0.y, p1.x - p0.x, p3.y - p0.y)
        ctx.restore()
      }
    }
  }

  tick(dt) {
    if (!this.running) return
    this.animTime += dt * this.params.speed
    this.resetGrid()

    const intensity = this.params.intensity
    const depth = this.params.depth

    switch (this.params.mode) {
      case 'missionary':
        this.applyMissionary(intensity, depth, this.animTime)
        if (this.params.jiggle > 0.1) {
          this.applyJiggleImpulse(
            Math.sin(this.animTime * 3) * this.params.jiggle * 20,
            0,
            this.animTime * 2
          )
        }
        break
      case 'doggy':
        this.applyDoggy(intensity, depth, this.animTime)
        if (this.params.jiggle > 0.1) {
          this.applyJiggleImpulse(
            Math.sin(this.animTime * 2.8) * this.params.jiggle * 25,
            Math.cos(this.animTime * 2.8) * this.params.jiggle * 10,
            this.animTime * 1.5
          )
        }
        break
      case 'cowgirl':
        this.applyCowgirl(intensity, depth, this.animTime)
        if (this.params.jiggle > 0.1) {
          this.applyJiggleImpulse(
            Math.cos(this.animTime * 3.2) * this.params.jiggle * 30,
            Math.sin(this.animTime * 3.2) * this.params.jiggle * 10,
            this.animTime * 2
          )
        }
        break
      case 'oral':
        this.applyOral(intensity, depth, this.animTime)
        break
      case 'passion':
        this.applyPassion(intensity, depth, this.animTime)
        if (this.params.jiggle > 0.1) {
          this.applyJiggleImpulse(
            Math.sin(this.animTime * 1.8) * this.params.jiggle * 15,
            0,
            this.animTime * 1.5
          )
        }
        break
      case 'random':
        const pos = Math.sin(this.animTime * 0.15) * 0.5 + 0.5
        if (pos < 0.2) {
          this.applyMissionary(intensity, depth, this.animTime)
          this.positionName = 'Missionary'
        } else if (pos < 0.4) {
          this.applyDoggy(intensity, depth, this.animTime)
          this.positionName = 'Doggy'
        } else if (pos < 0.6) {
          this.applyCowgirl(intensity, depth, this.animTime)
          this.positionName = 'Cowgirl'
        } else if (pos < 0.8) {
          this.applyOral(intensity, depth, this.animTime)
          this.positionName = 'Oral'
        } else {
          this.applyPassion(intensity, depth, this.animTime)
          this.positionName = 'Passion'
        }
        break
    }

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
