export default class AudioAnalyzer {
  constructor() {
    this.audioContext = null
    this.analyser = null
    this.sourceNode = null
    this.dataArray = null
    this.bufferLength = 0
    this.connected = false

    this.bpm = 120
    this.amplitude = 0
    this.beatDetected = false

    this.beatThreshold = 0.25
    this.beatDecay = 0.98
    this.beatCutoff = 0.1
    this.prevAmplitude = 0
  }

  connect(audioElement) {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      this.sourceNode = this.audioContext.createMediaElementSource(audioElement)
      this.sourceNode.connect(this.analyser)
      this.analyser.connect(this.audioContext.destination)
      this.bufferLength = this.analyser.frequencyBinCount
      this.dataArray = new Uint8Array(this.bufferLength)
      this.connected = true
    } catch {
      this.connected = false
    }
  }

  disconnect() {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.connected = false
    this.analyser = null
    this.sourceNode = null
  }

  getByteFrequencyData() {
    if (!this.connected || !this.analyser) return null
    this.analyser.getByteFrequencyData(this.dataArray)
    return this.dataArray
  }

  getByteTimeDomainData() {
    if (!this.connected || !this.analyser) return null
    this.analyser.getByteTimeDomainData(this.dataArray)
    return this.dataArray
  }

  getAmplitude() {
    const data = this.getByteTimeDomainData()
    if (!data) return 0
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      const val = (data[i] - 128) / 128
      sum += val * val
    }
    this.amplitude = Math.sqrt(sum / data.length)
    return this.amplitude
  }

  detectBeat() {
    const amp = this.getAmplitude()
    if (amp > this.beatThreshold && this.prevAmplitude <= this.beatThreshold) {
      this.beatDetected = true
    } else {
      this.beatDetected = false
    }
    this.prevAmplitude = amp
    return this.beatDetected
  }

  getFrequencyRange(low, high) {
    const data = this.getByteFrequencyData()
    if (!data) return 0
    const binLow = Math.floor((low / (this.audioContext.sampleRate / 2)) * this.bufferLength)
    const binHigh = Math.ceil((high / (this.audioContext.sampleRate / 2)) * this.bufferLength)
    let sum = 0
    let count = 0
    for (let i = binLow; i < Math.min(binHigh, data.length); i++) {
      sum += data[i]
      count++
    }
    return count > 0 ? sum / count / 255 : 0
  }

  getBassLevel() {
    return this.getFrequencyRange(20, 250)
  }

  getMidLevel() {
    return this.getFrequencyRange(250, 2000)
  }

  getHighLevel() {
    return this.getFrequencyRange(2000, 8000)
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  destroy() {
    this.disconnect()
  }
}
