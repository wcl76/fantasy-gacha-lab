<script setup lang="ts">
/**
 * DrawButton —— 召唤按钮（单抽 / 十连抽）
 * - 金色渐变 + 发光 + 悬停脉冲（CSS）
 * - 点击波纹：GSAP 驱动（精准弹性 + 缩放）
 * - 点击瞬间整体 brightness flash
 */
import gsap from 'gsap'
import { computed, ref, useTemplateRef } from 'vue'
import { useGachaStore } from '@/stores/gachaStore'
import { playClick } from '@/utils/sound'

const store = useGachaStore()

const props = defineProps<{
  type: 'single' | 'ten'
  cost: number
  currency: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const label = computed(() => (props.type === 'single' ? '单抽' : '十连抽'))
const enLabel = computed(() => (props.type === 'single' ? 'SINGLE DRAW' : 'TEN DRAW'))
const notEnough = computed(() => props.currency < props.cost)

const btnRef = useTemplateRef<HTMLButtonElement>('btn')
const ripples = ref<{ id: number; x: number; y: number; size: number }[]>([])
let rippleId = 0

function onClick(e: MouseEvent) {
  if (props.disabled || notEnough.value) return

  // 播放点击音效
  if (store.settings.soundEnabled) playClick()

  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const size = Math.max(rect.width, rect.height) * 1.5

  const id = ++rippleId
  ripples.value.push({ id, x, y, size })

  // 下一帧用 GSAP 启动动画
  requestAnimationFrame(() => {
    const rippleEl = btnRef.value?.querySelector(`[data-ripple="${id}"]`) as HTMLElement | null
    if (rippleEl) {
      gsap.fromTo(rippleEl,
        { scale: 0, opacity: 0.85, xPercent: -50, yPercent: -50 },
        {
          scale: 1.2,
          opacity: 0,
          duration: 0.85,
          ease: 'power2.out',
          onComplete: () => {
            ripples.value = ripples.value.filter(r => r.id !== id)
          },
        },
      )
    }
  })

  // 整体 brightness flash
  if (btnRef.value) {
    gsap.fromTo(btnRef.value,
      { filter: 'brightness(1) saturate(1)' },
      {
        filter: 'brightness(1.4) saturate(1.3)',
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut',
      },
    )
    // 缩放反馈
    gsap.fromTo(btnRef.value,
      { scale: 1 },
      { scale: 0.94, duration: 0.08, yoyo: true, repeat: 1, ease: 'power2.inOut' },
    )
  }

  emit('click')
}
</script>

<template>
  <button
    ref="btn"
    class="draw-btn"
    :class="[`type-${type}`, { disabled: disabled || notEnough }]"
    :disabled="disabled || notEnough"
    @click="onClick"
  >
    <div class="btn-glow" />
    <div class="btn-inner">
      <div class="btn-label-zh">{{ label }}</div>
      <div class="btn-label-en">{{ enLabel }}</div>
      <div class="btn-cost">
        <span class="cost-icon">💎</span>
        <span class="cost-value">{{ cost }}</span>
        <span v-if="type === 'ten'" class="cost-multi">×10</span>
      </div>
    </div>
    <!-- 点击波纹（GSAP 驱动） -->
    <span
      v-for="r in ripples"
      :key="r.id"
      :data-ripple="r.id"
      class="ripple"
      :style="{
        left: r.x + 'px',
        top: r.y + 'px',
        width: r.size + 'px',
        height: r.size + 'px',
      }"
    />
  </button>
</template>

<style scoped>
.draw-btn {
  position: relative;
  padding: 14px 36px;
  border-radius: var(--radius-lg);
  background: var(--gradient-gold);
  color: #1a0f2e;
  font-weight: 700;
  letter-spacing: 2px;
  box-shadow:
    0 0 24px var(--color-ssr-glow),
    inset 0 0 0 1px rgba(255, 255, 255, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
  min-width: 160px;
  will-change: transform;
}
.draw-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 0 36px var(--color-ssr),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}
.draw-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}
.draw-btn:disabled, .draw-btn.disabled {
  background: linear-gradient(180deg, #6b6b85 0%, #3a3a55 100%);
  color: #999;
  box-shadow: none;
  cursor: not-allowed;
}

.btn-glow {
  position: absolute;
  inset: -50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}
.draw-btn:hover:not(:disabled) .btn-glow {
  opacity: 0.6;
  animation: btn-rotate 2s linear infinite;
}
@keyframes btn-rotate {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.btn-label-zh {
  font-size: 18px;
  font-weight: 800;
}
.btn-label-en {
  font-size: 10px;
  letter-spacing: 1.5px;
  opacity: 0.7;
}
.btn-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 2px 10px;
  background: rgba(26, 15, 46, 0.25);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}
.cost-icon { font-size: 12px; }
.cost-value { font-variant-numeric: tabular-nums; }
.cost-multi {
  margin-left: 2px;
  padding: 0 4px;
  background: rgba(255, 122, 217, 0.8);
  color: #fff;
  border-radius: 8px;
  font-size: 10px;
}

.type-ten {
  padding: 16px 48px;
  min-width: 200px;
}
.type-ten .btn-label-zh {
  font-size: 20px;
}

/* 点击波纹（GSAP 控制 transform/opacity） */
.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  pointer-events: none;
  transform: scale(0);
  mix-blend-mode: screen;
}
</style>
