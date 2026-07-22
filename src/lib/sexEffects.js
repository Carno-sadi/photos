export default class SexEffects {
  constructor() {
    this.particles = []
    this.drips = []
    this.condomOn = false
    this.lubeOn = false
    this.pillVisible = false
    this.pillPulse = 0
    this.cumState = 'none' // 'none' | 'inside' | 'outside'
    this.cumTimer = 0
    this.cumAlpha = 0
    this.lubeTimer = 0
    this.sparkles = []
  }

  toggleCondom() {
    this.condomOn = !this.condomOn
  }

  toggleLube() {
    this.lubeOn = !this.lubeOn
    if (this.lubeOn) this.lubeTimer = 2
  }

  togglePill() {
    this.pillVisible = !this.pillVisible
    if (this.pillVisible) this.pillPulse = 0
  }

  triggerCumInside() {
    this.cumState = 'inside'
    this.cumTimer = 3
    this.cumAlpha = 1
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * 20,
        y: -10 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 60,
        vy: -20 + Math.random() * 40,
        life: 1 + Math.random() * 1.5,
        maxLife: 2.5,
        size: 2 + Math.random() * 3,
        type: 'cum',
        alpha: 0.8 + Math.random() * 0.2,
      })
    }
  }

  triggerCumOutside() {
    this.cumState = 'outside'
    this.cumTimer = 3
    this.cumAlpha = 1
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 20 + Math.random() * 40
      this.particles.push({
        x: (Math.random() - 0.5) * 30,
        y: -5 + Math.random() * 15,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 1 + Math.random() * 2,
        maxLife: 3,
        size: 1.5 + Math.random() * 2.5,
        type: 'cum',
        alpha: 0.7 + Math.random() * 0.3,
      })
    }
    for (let i = 0; i < 8; i++) {
      this.drips.push({
        x: (Math.random() - 0.5) * 20,
        y: 5 + Math.random() * 10,
        length: 5 + Math.random() * 12,
        speed: 15 + Math.random() * 25,
        life: 1.5 + Math.random() * 1.5,
      })
    }
  }

  triggerMore() {
    for (let i = 0; i < 15; i++) {
      this.sparkles.push({
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 40,
        size: 2 + Math.random() * 4,
        life: 0.5 + Math.random() * 0.8,
        maxLife: 1.3,
        vx: (Math.random() - 0.5) * 20,
        vy: -10 + Math.random() * -20,
        color: `hsl(${Math.random() * 60 + 300}, 80%, 60%)`,
      })
    }
  }

  update(dt) {
    this.pillPulse += dt

    this.cumTimer -= dt
    if (this.cumTimer <= 0) {
      this.cumAlpha *= 0.98
      if (this.cumAlpha < 0.01) this.cumState = 'none'
    }

    this.lubeTimer -= dt
    if (this.lubeTimer < 0) this.lubeTimer = 0

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 50 * dt
      p.life -= dt
      p.alpha *= 0.995
      if (p.life <= 0 || p.alpha < 0.01) {
        this.particles.splice(i, 1)
      }
    }

    for (let i = this.drips.length - 1; i >= 0; i--) {
      const d = this.drips[i]
      d.y += d.speed * dt
      d.life -= dt
      if (d.life <= 0) this.drips.splice(i, 1)
    }

    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i]
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.vy += 20 * dt
      s.life -= dt
      if (s.life <= 0) this.sparkles.splice(i, 1)
    }
  }

  draw(ctx, w, h, thrustPhase) {
    const cx = w / 2
    const cy = h / 2
    const s = Math.min(w, h) / 200

    ctx.save()
    ctx.translate(cx, cy + 20 * s)

    if (this.condomOn) {
      ctx.save()
      ctx.globalAlpha = 0.25
      ctx.strokeStyle = '#ff6b9d'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.ellipse(0, -5 * s, 14 * s, 16 * s, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeRect(-14 * s, -20 * s, 28 * s, 16 * s)
      ctx.restore()
    }

    if (this.lubeOn) {
      const lubeAlpha = Math.min(1, this.lubeTimer * 2)
      ctx.save()
      ctx.globalAlpha = 0.15 * lubeAlpha
      const g = ctx.createRadialGradient(0, 0, 5 * s, 0, 0, 25 * s)
      g.addColorStop(0, 'rgba(200, 180, 255, 0.4)')
      g.addColorStop(0.5, 'rgba(200, 180, 255, 0.15)')
      g.addColorStop(1, 'rgba(200, 180, 255, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.ellipse(0, 0, 25 * s, 20 * s, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.globalAlpha = 0.3 * lubeAlpha
      ctx.strokeStyle = 'rgba(220, 200, 255, 0.5)'
      ctx.lineWidth = 1.5
      for (let i = 0; i < 5; i++) {
        const angle = i * 1.2 + thrustPhase * 0.3
        const dist = 15 + Math.sin(i + thrustPhase * 2) * 5
        ctx.beginPath()
        ctx.moveTo(Math.cos(angle) * dist * s, Math.sin(angle) * dist * s)
        ctx.lineTo(Math.cos(angle) * (dist + 5) * s, Math.sin(angle) * (dist + 5) * s)
        ctx.stroke()
      }
      ctx.restore()
    }

    for (const d of this.drips) {
      ctx.save()
      ctx.globalAlpha = d.life / 2 * 0.6
      ctx.strokeStyle = 'rgba(240, 230, 255, 0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(d.x * s, d.y * s)
      ctx.lineTo(d.x * s + Math.sin(d.y * 0.5) * 3, (d.y + d.length) * s)
      ctx.stroke()
      ctx.restore()
    }

    for (const p of this.particles) {
      ctx.save()
      ctx.globalAlpha = p.alpha * Math.min(1, p.life / p.maxLife * 2)
      ctx.fillStyle = 'rgba(255, 240, 220, 0.8)'
      ctx.beginPath()
      ctx.arc(p.x * s, p.y * s, p.size * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    if (this.pillVisible) {
      const pulse = Math.sin(this.pillPulse * 3) * 0.1 + 0.9
      ctx.save()
      const px = -20 * s
      const py = -30 * s
      ctx.translate(px, py)
      ctx.rotate(this.pillPulse * 0.5)
      ctx.scale(pulse, pulse)

      const g = ctx.createRadialGradient(-1, -1, 1, 0, 0, 6 * s)
      g.addColorStop(0, '#a0d8ff')
      g.addColorStop(0.5, '#7ec8f0')
      g.addColorStop(1, '#4a9bc7')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.ellipse(0, 0, 6 * s, 4 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#3a7a9f'
      ctx.lineWidth = 0.5
      ctx.stroke()

      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.beginPath()
      ctx.ellipse(-1.5 * s, -1 * s, 2 * s, 1.5 * s, -0.3, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    if (this.cumState !== 'none' && this.cumAlpha > 0.01) {
      ctx.save()
      ctx.globalAlpha = this.cumAlpha * 0.3
      const g = ctx.createRadialGradient(0, 5 * s, 2 * s, 0, 5 * s, 15 * s)
      g.addColorStop(0, 'rgba(255, 240, 220, 0.5)')
      g.addColorStop(0.5, 'rgba(255, 240, 220, 0.2)')
      g.addColorStop(1, 'rgba(255, 240, 220, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.ellipse(0, 5 * s, 15 * s, 10 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    for (const sp of this.sparkles) {
      ctx.save()
      ctx.globalAlpha = Math.max(0, sp.life / sp.maxLife)
      ctx.fillStyle = sp.color
      ctx.shadowColor = sp.color
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(sp.x * s, sp.y * s, sp.size * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    ctx.restore()
  }
}
