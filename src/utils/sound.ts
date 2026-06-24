/**
 * sound.ts —— 简易音频引擎
 * 用 Web Audio API 合成音效（无需外部 mp3/wav 资源）
 * - click: 短促高频 click
 * - flip: 翻牌（频率下扫）
 * - ssr: SSR 出货（上升琶音 + 金色铃声）
 * - buy: 购买成功（两声叮咚）
 * - error: 错误（低音 buzzer）
 */

let ctx: AudioContext | null = null
let enabled = true

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      return null
    }
  }
  return ctx
}

export function setSoundEnabled(value: boolean) {
  enabled = value
}

function playTone({
  freq,
  duration = 0.1,
  type = 'sine' as OscillatorType,
  volume = 0.15,
  attack = 0.005,
  decay = 0.05,
  delay = 0,
  freqEnd,
}: {
  freq: number
  duration?: number
  type?: OscillatorType
  volume?: number
  attack?: number
  decay?: number
  delay?: number
  freqEnd?: number
}) {
  if (!enabled) return
  const ac = getCtx()
  if (!ac) return
  if (ac.state === 'suspended') ac.resume()

  const osc = ac.createOscillator()
  const gain = ac.createGain()
  const startTime = ac.currentTime + delay

  osc.type = type
  osc.frequency.setValueAtTime(freq, startTime)
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(0.0001, freqEnd), startTime + duration)
  }

  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + decay)

  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start(startTime)
  osc.stop(startTime + duration + decay + 0.05)
}

/** 点击按钮：短促高频 click */
export function playClick() {
  playTone({ freq: 1200, freqEnd: 800, duration: 0.04, volume: 0.1, type: 'square' })
}

/** 翻牌：频率下扫 */
export function playFlip() {
  playTone({ freq: 600, freqEnd: 200, duration: 0.25, volume: 0.12, type: 'sine' })
}

/** SSR 出货：上升琶音 + 金色铃声 */
export function playSSR() {
  // 4 音上升琶音
  const notes = [523, 659, 784, 1047]   // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    playTone({ freq, duration: 0.25, volume: 0.18, type: 'triangle', delay: i * 0.08 })
  })
  // 尾音叮
  setTimeout(() => {
    playTone({ freq: 1568, duration: 0.3, volume: 0.2, type: 'sine' })   // G6
  }, 360)
}

/** SR 出货：短琶音 */
export function playSR() {
  const notes = [523, 659, 784]   // C5 E5 G5
  notes.forEach((freq, i) => {
    playTone({ freq, duration: 0.2, volume: 0.15, type: 'triangle', delay: i * 0.06 })
  })
}

/** R 出货：单音 */
export function playR() {
  playTone({ freq: 392, duration: 0.12, volume: 0.12, type: 'sine' })
}

/** 购买成功：两声叮咚 */
export function playBuy() {
  playTone({ freq: 880, duration: 0.1, volume: 0.15, type: 'sine', delay: 0 })
  playTone({ freq: 1320, duration: 0.15, volume: 0.15, type: 'sine', delay: 0.1 })
}

/** 错误：低音 buzzer */
export function playError() {
  playTone({ freq: 200, freqEnd: 100, duration: 0.2, volume: 0.12, type: 'sawtooth' })
}

/** 任务领取：清脆铃声 */
export function playClaim() {
  const notes = [659, 880, 1175]   // E5 A5 D6
  notes.forEach((freq, i) => {
    playTone({ freq, duration: 0.15, volume: 0.18, type: 'sine', delay: i * 0.05 })
  })
}

/** 一键播放稀有度音效 */
export function playRarity(rarity: 'SSR' | 'SR' | 'R') {
  if (rarity === 'SSR') playSSR()
  else if (rarity === 'SR') playSR()
  else playR()
}
