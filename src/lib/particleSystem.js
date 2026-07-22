export default class ParticleSystem {
  constructor() {
    this.particles = []
    this.emitters = []
    this.canvas = null
    this.ctx = null
  }

  init(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
  }

  addEmitter(config) {
    this.emitters.push({
      x: config.x || 0,
      y: config.y || 0,
      rate: config.rate || 5,
      lifetime: config.lifetime || 1,
      speed: config.speed || 50,
      size: config.size || 3,
      color: config.color || '255, 255, 255',
      gravity: config.gravity || 20,
      spread: config.spread || 0.5,
      decay: config.decay || 0.5,
      accum: 0,
      active: true,
    })
  }

  clearEmitters() {
    this.emitters = []
  }

  addParticle(p) {
    this.particles.push({
      x: p.x,
      y: p.y,
      vx: p.vx || 0,
      vy: p.vy || 0,
      size: p.size || 3,
      life: p.life || 1,
      maxLife: p.life || 1,
      color: p.color || '255, 255, 255',
      alpha: p.alpha || 0.8,
      decay: p.decay || 0.5,
      gravity: p.gravity || 0,
    })
  }

  emitFrom(x, y, count, color, speed, size) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const spd = (Math.random() * 0.5 + 0.5) * (speed || 50)
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 20,
        size: (Math.random() * 0.5 + 0.5) * (size || 4),
        life: 0.5 + Math.random() * 0.5,
        color: color || '255, 200, 150',
        gravity: 30,
        decay: 0.3 + Math.random() * 0.3,
      })
    }
  }

  update(dt) {
    for (let e = 0; e < this.emitters.length; e++) {
      const emitter = this.emitters[e]
      if (!emitter.active) continue
      emitter.accum += dt
      const interval = 1 / emitter.rate
      while (emitter.accum >= interval) {
        emitter.accum -= interval
        const angle = (Math.random() - 0.5) * emitter.spread * Math.PI
        const spd = (Math.random() * 0.5 + 0.5) * emitter.speed
        this.addParticle({
          x: emitter.x + (Math.random() - 0.5) * 10,
          y: emitter.y,
          vx: Math.sin(angle) * spd,
          vy: -Math.cos(angle) * spd * 0.5,
          size: (Math.random() * 0.5 + 0.5) * emitter.size,
          life: emitter.lifetime,
          color: emitter.color,
          gravity: emitter.gravity,
          decay: emitter.decay,
        })
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= p.decay * dt
      if (p.life <= 0) {
        this.particles.splice(i, 1)
        continue
      }

      p.vx *= 0.98
      p.vy += p.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.alpha = Math.max(0, p.life / p.maxLife)
    }
  }

  render() {
    const ctx = this.ctx
    if (!ctx) return

    for (const p of this.particles) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${p.color}, ${p.alpha * 0.6})`
      ctx.fill()
    }
  }

  clear() {
    this.particles = []
  }

  destroy() {
    this.clear()
    this.clearEmitters()
    this.canvas = null
    this.ctx = null
  }
}
