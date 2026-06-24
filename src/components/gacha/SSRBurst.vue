<script setup lang="ts">
/**
 * SSRBurst —— SSR 出货时的金色粒子爆发特效
 * 使用 tsParticles 但**不用 emitters 插件**，直接用 container.particles.addParticle
 * 每次 trigger 变化，在屏幕中心 push 100+ 粒子，3D 物理自动接管
 */
import type { Container, ISourceOptions, ICoordinates } from '@tsparticles/engine'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import TsParticlesBg from '@/components/layout/TsParticlesBg.vue'

const props = withDefaults(defineProps<{
  trigger: string | number | null
  enabled?: boolean
}>(), { enabled: true })

const containerRef = ref<InstanceType<typeof TsParticlesBg> | null>(null)
const ready = ref(false)

const baseOptions: ISourceOptions = {
  fullScreen: { enable: false },
  background: { color: { value: 'transparent' } },
  detectRetina: true,
  fpsLimit: 60,
  particles: {
    number: { value: 0, limit: { value: 400 } },
    color: { value: ['#f6c66b', '#ffd98a', '#fff5d0', '#9b6cff', '#ff7ad9'] },
    shape: {
      type: 'star',
      options: { star: { sides: 5 } },
    },
    opacity: {
      value: { min: 0.5, max: 1 },
      animation: { enable: true, speed: 1.2, startValue: 'max', destroy: 'min' },
    },
    size: {
      value: { min: 2, max: 7 },
      animation: { enable: true, speed: 4, startValue: 'max', destroy: 'min' },
    },
    rotate: {
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 6 },
    },
    move: {
      enable: true,
      speed: { min: 5, max: 14 },
      direction: 'none',
      gravity: { enable: true, acceleration: 9, maxSpeed: 28 },
      outModes: { default: 'destroy' },
    },
  },
  emitters: [],
}

const options = computed<ISourceOptions>(() => baseOptions)

function burst() {
  if (!props.enabled) return
  const container: Container | null = containerRef.value?.getContainer() ?? null
  if (!container) return
  const center: ICoordinates = { x: 50, y: 50 }

  // 中心爆发（星形粒子 + 重力）
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2
    const speed = 8 + Math.random() * 10
    container.particles.addParticle(center, {
      color: { value: ['#f6c66b', '#ffd98a', '#fff5d0'][i % 3] },
      size: { value: { min: 3, max: 8 } },
      move: {
        speed,
        direction: Math.round((angle * 180) / Math.PI),
        gravity: { acceleration: 8, maxSpeed: 24 },
      },
    })
  }
  // 紫色火花混合
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 4 + Math.random() * 8
    container.particles.addParticle(center, {
      color: { value: ['#9b6cff', '#ff7ad9'][i % 2] },
      size: { value: { min: 2, max: 5 } },
      move: {
        speed,
        direction: Math.round((angle * 180) / Math.PI),
        gravity: { acceleration: 6, maxSpeed: 20 },
      },
    })
  }
}

watch(() => props.trigger, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal && ready.value) burst()
})

function onReady(_c: Container) {
  ready.value = true
}

onMounted(() => { ready.value = false })
onBeforeUnmount(() => { ready.value = false })
</script>

<template>
  <div class="ssr-burst-wrap">
    <TsParticlesBg
      ref="containerRef"
      id="ssr-burst"
      :options="options"
      :enabled="enabled"
      @ready="onReady"
    />
  </div>
</template>

<style scoped>
.ssr-burst-wrap {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 200;
}
.ssr-burst-wrap :deep(.tsparticles-bg) {
  z-index: 200;
}
</style>
