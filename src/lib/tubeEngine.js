const SKIN_A = '#d4a574'
const SKIN_B = '#c9956b'
const LINE_A = '#8a6a4a'
const LINE_B = '#8a6a4a'

const POSES = {
  missionary: {
    a: {
      x: 0, y: 0, rotation: 0,
      head: -5, spine: 0,
      leftShoulder: 45, rightShoulder: 45,
      leftElbow: 60, rightElbow: 60,
      leftHip: -80, rightHip: -80,
      leftKnee: -70, rightKnee: -70,
    },
    b: {
      x: 0, y: -22, rotation: -3,
      head: 10, spine: 15,
      leftShoulder: -30, rightShoulder: -30,
      leftElbow: -45, rightElbow: -45,
      leftHip: 5, rightHip: 5,
      leftKnee: -10, rightKnee: -10,
    },
  },
  doggy: {
    a: {
      x: 0, y: 0, rotation: 0,
      head: -30, spine: -40,
      leftShoulder: -80, rightShoulder: -80,
      leftElbow: -60, rightElbow: -60,
      leftHip: 20, rightHip: 20,
      leftKnee: -60, rightKnee: -60,
    },
    b: {
      x: 3, y: -18, rotation: 5,
      head: 5, spine: -5,
      leftShoulder: 30, rightShoulder: 30,
      leftElbow: -20, rightElbow: -20,
      leftHip: -10, rightHip: -10,
      leftKnee: 0, rightKnee: 0,
    },
  },
  cowgirl: {
    a: {
      x: 0, y: 0, rotation: 0,
      head: 0, spine: 0,
      leftShoulder: 30, rightShoulder: 30,
      leftElbow: 40, rightElbow: 40,
      leftHip: -20, rightHip: -20,
      leftKnee: -30, rightKnee: -30,
    },
    b: {
      x: 0, y: -30, rotation: 0,
      head: 0, spine: 5,
      leftShoulder: -10, rightShoulder: -10,
      leftElbow: -30, rightElbow: -30,
      leftHip: 70, rightHip: 70,
      leftKnee: 80, rightKnee: 80,
    },
  },
  oral: {
    a: {
      x: 0, y: 10, rotation: 5,
      head: 5, spine: 0,
      leftShoulder: 20, rightShoulder: 20,
      leftElbow: 30, rightElbow: 30,
      leftHip: -40, rightHip: -40,
      leftKnee: -50, rightKnee: -50,
    },
    b: {
      x: 0, y: -35, rotation: -20,
      head: 30, spine: 30,
      leftShoulder: 10, rightShoulder: 10,
      leftElbow: 30, rightElbow: 30,
      leftHip: 40, rightHip: 40,
      leftKnee: 50, rightKnee: 50,
    },
  },
  passion: {
    a: {
      x: 0, y: 0, rotation: -10,
      head: -5, spine: -10,
      leftShoulder: -20, rightShoulder: -20,
      leftElbow: -30, rightElbow: -30,
      leftHip: 30, rightHip: 20,
      leftKnee: 40, rightKnee: 35,
    },
    b: {
      x: -15, y: -8, rotation: -10,
      head: -5, spine: -5,
      leftShoulder: 20, rightShoulder: 20,
      leftElbow: 30, rightElbow: 30,
      leftHip: -30, rightHip: -20,
      leftKnee: -40, rightKnee: -35,
    },
  },
}

export default class TubeEngine {
  constructor() {
    this.time = 0
    this.phase = 0
    this.intensity = 0.5
    this.depth = 0.5
    this.speed = 0.5
    this.currentPose = 'missionary'
    this.scale = 1

    this.bodyA = this.makeBody(SKIN_A, LINE_A)
    this.bodyB = this.makeBody(SKIN_B, LINE_B)
    this.setPose('missionary', 0)
  }

  makeBody(skin, line) {
    return {
      x: 0, y: 0, rotation: 0,
      skin, line,
      angles: { head: 0, spine: 0, leftShoulder: 0, rightShoulder: 0, leftElbow: 0, rightElbow: 0, leftHip: 0, rightHip: 0, leftKnee: 0, rightKnee: 0 },
      targetAngles: { head: 0, spine: 0, leftShoulder: 0, rightShoulder: 0, leftElbow: 0, rightElbow: 0, leftHip: 0, rightHip: 0, leftKnee: 0, rightKnee: 0 },
      prevAngles: { head: 0, spine: 0, leftShoulder: 0, rightShoulder: 0, leftElbow: 0, rightElbow: 0, leftHip: 0, rightHip: 0, leftKnee: 0, rightKnee: 0 },
    }
  }

  setPose(name) {
    this.currentPose = name
    const pose = POSES[name]
    if (!pose) return
    this.bodyA.targetAngles = { ...pose.a }
    this.bodyB.targetAngles = { ...pose.b }
    this.bodyA.x = pose.a.x; this.bodyA.y = pose.a.y; this.bodyA.rotation = pose.a.rotation
    this.bodyB.x = pose.b.x; this.bodyB.y = pose.b.y; this.bodyB.rotation = pose.b.rotation
  }

  thrustAmount(intensity, depth, t) {
    const raw = Math.sin(t * 3)
    const shaped = raw > 0 ? Math.pow(raw, 0.4) : -Math.pow(-raw, 0.6)
    return shaped * intensity * depth * 6
  }

  update(dt) {
    this.time += dt * this.speed
    const t = this.time
    const intensity = this.intensity
    const depth = this.depth

    const thrust = this.thrustAmount(intensity, depth, t)

    const a = this.bodyA; const b = this.bodyB
    const lerpSpeed = 8
    const keys = ['head','spine','leftShoulder','rightShoulder','leftElbow','rightElbow','leftHip','rightHip','leftKnee','rightKnee']

    for (const k of keys) {
      a.angles[k] += (a.targetAngles[k] - a.angles[k]) * Math.min(1, dt * lerpSpeed)
      b.angles[k] += (b.targetAngles[k] - b.angles[k]) * Math.min(1, dt * lerpSpeed)
    }

    switch (this.currentPose) {
      case 'missionary':
        a.angles.leftHip += thrust * 2
        a.angles.rightHip += thrust * 2
        b.angles.spine += Math.sin(t * 1.5) * intensity * 3
        b.y = POSES.missionary.b.y + thrust * 0.5
        break
      case 'doggy':
        b.angles.leftHip += thrust * 1.5
        b.angles.rightHip += thrust * 1.5
        a.angles.spine += Math.sin(t * 3) * intensity * 2
        b.x = POSES.doggy.b.x + thrust * 0.3
        b.y = POSES.doggy.b.y + thrust * 0.5
        break
      case 'cowgirl':
        b.y = POSES.cowgirl.b.y + Math.abs(thrust) * 1.5
        b.angles.leftHip += thrust * 0.8
        b.angles.rightHip += thrust * 0.8
        break
      case 'oral':
        b.y = POSES.oral.b.y + thrust * 0.8
        b.angles.head += thrust * 2
        b.angles.spine += thrust * 0.5
        break
      case 'passion':
        a.x = POSES.passion.a.x + Math.sin(t * 1.8) * intensity * 2
        b.x = POSES.passion.b.x + Math.sin(t * 1.8 + 0.5) * intensity * 2
        a.y = POSES.passion.a.y + Math.cos(t * 2) * intensity * 1.5
        b.y = POSES.passion.b.y + Math.cos(t * 2 + 0.5) * intensity * 1.5
        break
    }
  }

  draw(ctx, w, h) {
    ctx.save()
    const cx = w / 2
    const cy = h / 2
    const s = Math.min(w, h) / 200

    ctx.translate(cx, cy + 20 * s)
    ctx.scale(s, s)

    this.drawBody(ctx, this.bodyA, false)
    this.drawBody(ctx, this.bodyB, true)

    ctx.restore()
  }

  drawBody(ctx, body, isFront) {
    const { angles, skin, line, x: bx, y: by, rotation } = body

    ctx.save()
    ctx.translate(bx, by)
    ctx.rotate(rotation * Math.PI / 180)

    ctx.lineCap = 'round'
    ctx.fillStyle = skin
    ctx.strokeStyle = line
    ctx.lineWidth = 2.5

    const s = (body === this.bodyB && (this.currentPose === 'missionary' || this.currentPose === 'cowgirl')) ? -1 : 1
    if (s < 0) ctx.scale(-1, 1)

    const neckY = -50; const shoulderY = -40
    const chestY = -25; const waistY = -5
    const hipY = 10; const groinY = 20
    const headR = 12
    const spine = angles.spine * Math.PI / 180

    const isFemale = skin === SKIN_A

    this.drawArm(ctx, angles.leftShoulder, angles.leftElbow, chestY, skin, line)

    this.drawLeg(ctx, angles.leftHip, angles.leftKnee, hipY, groinY, skin, line)

    const pts = [
      { y: neckY, w: neckY * 0.18 },
      { y: shoulderY, w: isFemale ? 18 : 22 },
      { y: chestY, w: isFemale ? 22 : 20 },
      { y: waistY, w: 14 },
      { y: hipY, w: isFemale ? 25 : 20 },
      { y: groinY, w: 12 },
    ]

    ctx.beginPath()
    for (let i = 0; i < pts.length; i++) {
      const px = pts[i].y * Math.sin(spine)
      const py = pts[i].y * Math.cos(spine)
      if (i === 0) ctx.moveTo(px - pts[i].w, py)
      else ctx.lineTo(px - pts[i].w, py)
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const px = pts[i].y * Math.sin(spine)
      const py = pts[i].y * Math.cos(spine)
      ctx.lineTo(px + pts[i].w, py)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    if (isFemale) {
      const bx = Math.sin(spine) * chestY + 8
      const by = Math.cos(spine) * chestY
      ctx.beginPath(); ctx.ellipse(bx, by, 5, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.ellipse(-bx, by, 5, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    } else {
      const gy = Math.cos(spine) * groinY + 4
      const gx = Math.sin(spine) * groinY
      ctx.beginPath(); ctx.ellipse(gx, gy, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    }

    this.drawArm(ctx, angles.rightShoulder, angles.rightElbow, chestY, skin, line)
    this.drawLeg(ctx, angles.rightHip, angles.rightKnee, hipY, groinY, skin, line, true)

    const headX = Math.sin(spine) * 10
    const headY = neckY - 5 + Math.cos(spine) * 5
    ctx.beginPath(); ctx.arc(headX, headY, headR, 0, Math.PI * 2); ctx.fill(); ctx.stroke()

    ctx.restore()
  }

  drawArm(ctx, shoulderAngle, elbowAngle, chestY, skin, line) {
    const sa = shoulderAngle * Math.PI / 180
    const ea = elbowAngle * Math.PI / 180

    const sx = Math.sin(sa - 1.5) * 22
    const sy = Math.cos(sa - 1.5) * 22 + chestY

    const ex = sx + Math.sin(sa + ea + 1.5) * 20
    const ey = sy + Math.cos(sa + ea + 1.5) * 20

    ctx.lineWidth = 10
    ctx.beginPath(); ctx.moveTo(0, chestY); ctx.lineTo(sx, sy); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke()
  }

  drawLeg(ctx, hipAngle, kneeAngle, hipY, groinY, skin, line) {
    const ha = hipAngle * Math.PI / 180
    const ka = kneeAngle * Math.PI / 180

    const hx = Math.sin(ha) * 12
    const hy = Math.cos(ha) * 12 + hipY

    const kx = hx + Math.sin(ha + ka + 0.3) * 22
    const ky = hy + Math.cos(ha + ka + 0.3) * 22

    const ax = kx + Math.sin(ha + ka - 0.2) * 20
    const ay = ky + Math.cos(ha + ka - 0.2) * 20

    ctx.lineWidth = 12
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.stroke()
    ctx.lineWidth = 10
    ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(ax, ay); ctx.stroke()
  }

  getThrustPhase() {
    return Math.sin(this.time * 3)
  }
}
