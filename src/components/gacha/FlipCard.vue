<script setup lang="ts">
/**
 * FlipCard —— 翻牌动画（卡背->卡面），GSAP 驱动
 * - 父级 GSAP 旋转 0 -> 180 度
 * - 子级 GSAP 也旋转 0 -> 180 度（抵消父级，让内容正向显示）
 * - 卡背/卡面 opacity 切换，避免 backface-visibility 与 GSAP matrix 冲突
 */
import gsap from 'gsap'
import { onMounted, ref, watch } from 'vue'
import { useGachaStore } from '@/stores/gachaStore'
import { playFlip } from '@/utils/sound'

const store = useGachaStore()

const props = withDefaults(defineProps<{
  flipped: boolean
  faceClass?: string
  /** 翻牌延迟（秒） */
  delay?: number
  /** 翻牌时长（秒） */
  duration?: number
}>(), {
  faceClass: '',
  delay: 0,
  duration: 0.65,
})

const innerRef = ref<HTMLElement | null>(null)
const backRef = ref<HTMLElement | null>(null)
const frontRef = ref<HTMLElement | null>(null)

function flip(toFlipped: boolean) {
  if (!innerRef.value) return
  const target = toFlipped ? 180 : 0
  // 父级整体翻转 0 -> 180（这是用户感知到的 3D 翻牌）
  gsap.to(innerRef.value, {
    rotateY: target,
    duration: props.duration,
    delay: props.delay,
    ease: toFlipped ? 'power2.out' : 'power2.in',
    transformOrigin: 'center center',
  })
  // 翻到卡面时：翻牌音效
  if (toFlipped && store.settings.soundEnabled) {
    playFlip()
  }
  if (toFlipped && backRef.value && frontRef.value) {
    // 关键：子级也同步旋转 0 -> 180，**抵消父级**让内容正向显示
    // 由于父级和子级都是 180，最终视觉上是 0 度（正向）
    gsap.to(frontRef.value, {
      rotateY: 180,
      duration: props.duration,
      delay: props.delay,
      ease: toFlipped ? 'power2.out' : 'power2.in',
      transformOrigin: 'center center',
    })
    // 翻转过半（约 45%）时切换可见性
    gsap.to(backRef.value, {
      opacity: 0,
      duration: 0.12,
      delay: props.delay + props.duration * 0.45,
      ease: 'power1.out',
    })
    // 卡面同时淡入 + 弹性放大（delay 0 让 back 淡出的同时 front 立即可见）
    gsap.fromTo(frontRef.value,
      { opacity: 0, scale: 0.92 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        delay: props.delay + props.duration * 0.45,
        ease: 'back.out(1.6)',
      },
    )
  } else if (!toFlipped && backRef.value && frontRef.value) {
    // 翻回卡背
    gsap.to(backRef.value, { opacity: 1, duration: 0.1 })
    gsap.to(frontRef.value, { opacity: 0, duration: 0.1 })
    // 子级也转回 0
    gsap.to(frontRef.value, {
      rotateY: 0,
      duration: props.duration,
      delay: props.delay,
      ease: toFlipped ? 'power2.out' : 'power2.in',
    })
  }
}

onMounted(() => {
  if (!innerRef.value) return
  gsap.set(innerRef.value, { rotateY: 0 })
  if (frontRef.value) gsap.set(frontRef.value, { rotateY: 0, opacity: 0 })
  if (backRef.value) gsap.set(backRef.value, { opacity: 1 })
})

watch(() => props.flipped, (v) => flip(v))
</script>

<template>
  <div class="flip-card">
    <div
      ref="innerRef"
      class="flip-inner"
      :class="faceClass"
    >
      <!-- 卡背 -->
      <div ref="backRef" class="flip-face flip-back">
        <div class="back-pattern" />
        <div class="back-emblem">✦</div>
      </div>
      <!-- 卡面 -->
      <div ref="frontRef" class="flip-face flip-front">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.flip-card {
  position: relative;
  width: 100%;
  height: 100%;
}

.flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  will-change: transform;
}

.flip-face {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.flip-back {
  background:
    radial-gradient(ellipse at center, rgba(155, 108, 255, 0.4) 0%, transparent 70%),
    linear-gradient(135deg, #1a1450 0%, #0a0a2a 100%);
  border: 1px solid var(--color-purple);
  box-shadow: 0 0 16px var(--color-purple);
  display: grid;
  place-items: center;
}
.flip-back::before {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px solid rgba(246, 198, 107, 0.4);
  border-radius: 6px;
}
.back-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 25% 25%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 75% 25%, rgba(246, 198, 107, 0.6), transparent),
    radial-gradient(1px 1px at 25% 75%, rgba(155, 108, 255, 0.7), transparent),
    radial-gradient(1px 1px at 75% 75%, rgba(255,255,255,0.4), transparent);
  background-size: 80px 80px;
  opacity: 0.6;
}
.back-emblem {
  position: relative;
  z-index: 1;
  font-size: 36px;
  color: var(--color-gold);
  text-shadow: 0 0 16px var(--color-gold);
  animation: emblem-glow 2s ease-in-out infinite;
}
@keyframes emblem-glow {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50%      { transform: scale(1.15); opacity: 1; }
}

/* 卡面：默认不旋转，直接用 opacity 控制可见性，避免与父级 GSAP 矩阵冲突 */
.flip-front {
  /* 不设 rotateY —— 由 GSAP 父级矩阵 + 卡面 opacity 联合控制 */
}
</style>
