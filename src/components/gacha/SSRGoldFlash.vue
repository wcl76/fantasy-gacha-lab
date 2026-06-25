<script setup lang="ts">
/**
 * SSRGoldFlash —— SSR 出货时的全屏金色脉冲
 * - 全屏金色径向渐变 flash + 屏幕震动，纯 CSS animation，不依赖 GSAP
 * 触发：result-view 翻到 SSR 卡时调用 expose.flash()
 */
import { ref } from 'vue'

const overlayEl = ref<HTMLElement | null>(null)

function flash() {
  if (!overlayEl.value) return
  // 移除动画类再重新添加，确保动画可重播
  overlayEl.value.classList.remove('flash-active')
  void overlayEl.value.offsetWidth // 强制回流
  overlayEl.value.classList.add('flash-active')
}

defineExpose({ flash })
</script>

<template>
  <div ref="overlayEl" class="gold-flash-overlay" aria-hidden="true">
    <div class="gold-flash" />
  </div>
</template>

<style scoped>
.gold-flash-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 199;  /* 在 ssr-burst (200) 下方 */
}

/* 内层金色脉冲层 */
.gold-flash {
  position: absolute;
  inset: 0;
  pointer-events: none;
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

/* 触发动画：金光脉冲 + 屏幕震动，纯 CSS compositor 线程 */
.gold-flash-overlay.flash-active {
  animation: gold-pulse 0.85s ease-out forwards;
}
.gold-flash-overlay.flash-active .gold-flash {
  animation: gold-scale 0.8s ease-out forwards;
}

@keyframes gold-pulse {
  /* 金光脉冲：先放大再缩小 */
  0%   { opacity: 0;   transform: scale(0.6); }
  20%  { opacity: 0.9; transform: scale(1.5); }
  40%  { opacity: 0.7; transform: scale(1.3); }
  55%  { opacity: 0;   transform: scale(1.8); }
  100% { opacity: 0;   transform: scale(1); }
}

@keyframes gold-scale {
  /* 内层渐变区域跟随脉冲 */
  0%   { opacity: 0; }
  15%  { opacity: 1; }
  50%  { opacity: 0.6; }
  70%  { opacity: 0; }
  100% { opacity: 0; }
}
</style>
