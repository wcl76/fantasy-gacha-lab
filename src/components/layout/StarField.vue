<script setup lang="ts">
/**
 * StarField —— 全局背景星空
 * - 静态 CSS 星点 + 紫金光晕
 * - tsParticles 流星层（金/紫双色，自上而下或自右向左划过）
 */
import type { ISourceOptions } from '@tsparticles/engine'
import TsParticlesBg from './TsParticlesBg.vue'

/** 流星粒子配置 */
const meteorOptions: ISourceOptions = {
  fullScreen: { enable: false },
  background: { color: { value: 'transparent' } },
  detectRetina: true,
  fpsLimit: 60,
  particles: {
    number: { value: 0 },
    color: { value: ['#f6c66b', '#9b6cff', '#ff7ad9'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.4, max: 1 },
      animation: { enable: true, speed: 1.5, startValue: 'max', destroy: 'min' },
    },
    size: { value: { min: 1, max: 2.5 } },
    move: {
      enable: true,
      speed: { min: 8, max: 16 },
      direction: 'bottom-left',
      straight: false,
      outModes: { default: 'destroy' },
    },
    life: {
      duration: { sync: true, value: 1.2 },
      count: 1,
    },
    rotate: {
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 10 },
    },
    twinkle: {
      particles: { enable: true, frequency: 0.05, opacity: 1 },
    },
  },
  emitters: [
    {
      direction: 'bottom-left',
      rate: { delay: 0.8, quantity: 1 },
      position: { x: 50, y: -10 },
      size: { width: 100, height: 0, mode: 'percent' },
      life: { duration: 0.1, count: 1 },
    },
    {
      direction: 'bottom-left',
      rate: { delay: 2.4, quantity: 1 },
      position: { x: 110, y: 30 },
      size: { width: 0, height: 30, mode: 'percent' },
      life: { duration: 0.1, count: 1 },
    },
  ],
}
</script>

<template>
  <div class="starfield" aria-hidden="true">
    <!-- 静态星点层 -->
    <div class="starfield-layer starfield-layer-1" />
    <div class="starfield-layer starfield-layer-2" />
    <div class="starfield-layer starfield-layer-3" />
    <!-- 紫金大光晕 -->
    <div class="starfield-glow glow-1" />
    <div class="starfield-glow glow-2" />
    <div class="starfield-glow glow-3" />
    <!-- tsParticles 流星层 -->
    <TsParticlesBg id="meteors" :options="meteorOptions" />
  </div>
</template>

<style scoped>
.starfield {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.starfield-layer {
  position: absolute;
  inset: 0;
  background-repeat: repeat;
  opacity: 0.6;
}

.starfield-layer-1 {
  background-image:
    radial-gradient(1px 1px at 20% 30%, #fff, transparent),
    radial-gradient(1px 1px at 60% 70%, rgba(255,255,255,0.6), transparent),
    radial-gradient(1.5px 1.5px at 40% 80%, rgba(255,255,255,0.7), transparent),
    radial-gradient(1px 1px at 80% 20%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 90% 60%, rgba(155,108,255,0.7), transparent),
    radial-gradient(1.2px 1.2px at 10% 90%, rgba(246,198,107,0.6), transparent);
  background-size: 600px 600px;
  animation: drift 240s linear infinite;
}
.starfield-layer-2 {
  background-image:
    radial-gradient(1px 1px at 30% 40%, rgba(255,255,255,0.4), transparent),
    radial-gradient(1px 1px at 70% 20%, rgba(184,147,255,0.5), transparent),
    radial-gradient(1.5px 1.5px at 15% 65%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 85% 85%, rgba(77,163,255,0.6), transparent);
  background-size: 900px 900px;
  animation: drift 360s linear infinite reverse;
  opacity: 0.5;
}
.starfield-layer-3 {
  background-image:
    radial-gradient(2px 2px at 50% 50%, rgba(246,198,107,0.4), transparent),
    radial-gradient(1.5px 1.5px at 25% 75%, rgba(255,122,217,0.4), transparent);
  background-size: 1200px 1200px;
  animation: drift 480s linear infinite;
  opacity: 0.4;
}

@keyframes drift {
  0%   { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-300px, -200px, 0); }
}

.starfield-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: pulse 8s ease-in-out infinite;
}
.glow-1 {
  width: 600px; height: 600px;
  top: -200px; left: -150px;
  background: radial-gradient(circle, rgba(155, 108, 255, 0.45) 0%, transparent 70%);
}
.glow-2 {
  width: 500px; height: 500px;
  top: 30%; right: -200px;
  background: radial-gradient(circle, rgba(246, 198, 107, 0.3) 0%, transparent 70%);
  animation-delay: 2s;
}
.glow-3 {
  width: 700px; height: 700px;
  bottom: -250px; left: 30%;
  background: radial-gradient(circle, rgba(255, 122, 217, 0.3) 0%, transparent 70%);
  animation-delay: 4s;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.7; }
}
</style>
