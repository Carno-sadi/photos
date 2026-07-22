export default class IntimateAudioEngine {
  constructor() {
    this.audioContext = null
    this.audioElement = null
    this.isPlaying = false
    this.volume = 0.5
    this.loop = true
    this.currentSrc = null
  }

  init() {
    this.audioElement = new Audio()
    this.audioElement.loop = this.loop
    this.audioElement.volume = this.volume
    this.audioElement.preload = 'auto'
  }

  playBlob(blob) {
    if (!this.audioElement) this.init()
    this.stop()
    const url = URL.createObjectURL(blob)
    this.currentSrc = url
    this.audioElement.src = url
    this.audioElement.play().then(() => {
      this.isPlaying = true
    }).catch(() => {})
  }

  play() {
    if (this.audioElement && this.audioElement.src) {
      this.audioElement.play().then(() => {
        this.isPlaying = true
      }).catch(() => {})
    }
  }

  pause() {
    if (this.audioElement) {
      this.audioElement.pause()
      this.isPlaying = false
    }
  }

  toggle() {
    if (this.isPlaying) this.pause()
    else this.play()
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.currentTime = 0
      if (this.currentSrc) {
        URL.revokeObjectURL(this.currentSrc)
        this.currentSrc = null
      }
    }
    this.isPlaying = false
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val))
    if (this.audioElement) this.audioElement.volume = this.volume
  }

  setLoop(val) {
    this.loop = val
    if (this.audioElement) this.audioElement.loop = val
  }

  destroy() {
    this.stop()
    this.audioElement = null
    this.audioContext = null
  }
}
