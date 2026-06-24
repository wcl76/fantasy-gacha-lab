<script setup lang="ts">
/**
 * SSRGoldFlash —— SSR 出货时的全屏金色脉冲
 * - 全屏金色径向渐变 flash
 * - 屏幕震动（高频率轻微震动）
 * - 持续 0.8s 后淡出
 * 触发：result-view 翻到 SSR 卡时调用 expose.burst()
 */
import { onBeforeUnmount, ref } from 'vue'
import gsap from 'gsap'

const flashEl = ref<HTMLElement | null>(null)
const overlayEl = ref<HTMLElement | null>(null)

let activeTween: gsap.core.Tween | null = null

function flash() {
  if (!flashEl.value) return
  if (activeTween) activeTween.kill()

  // 全屏金色脉冲：3 次连续放大-缩小
  activeTween = gsap.fromTo(flashEl.value,
    { opacity: 0, scale: 0.6 },
    {
      opacity: 0.9,
      scale: 1.4,
      duration: 0.4,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1,
    },
  )

  // 屏幕震动（轻微水平）
  if (overlayEl.value) {
    gsap.fromTo(overlayEl.value,
      { x: 0 },
      {
        x: 8,
        duration: 0.04,
        yoyo: true,
        repeat: 12,
        ease: 'power1.inOut',
        onComplete: () => { gsap.set(overlayEl.value, { x: 0 }) },
      },
    )
  }
}

defineExpose({ flash })

onBeforeUnmount(() => {
  if (activeTween) activeTween.kill()
})
</script>

<template>
  <div ref="overlayEl" class="gold-flash-overlay" aria-hidden="true">
    <div ref="flashEl" class="gold-flash" />
  </div>
</template>

<style scoped>
.gold-flash-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 199;  /* 在 ssr-burst (200) 下方 */
}
.gold-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center,
    rgba(255, 235, 150, 0.95) 0%,
    rgba(246, 198, 107, 0.8) 15%,
    rgba(246, 198, 107, 0.4) 35%,
    rgba(155, 108, 255, 0.15) 60%,
    transparent 80%
  );
  opacity: 0;
  will-change: opacity, scale;
  mix-blend-mode: screen;
}
</style>
