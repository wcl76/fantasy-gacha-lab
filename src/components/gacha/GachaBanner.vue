<script setup lang="ts">
/**
 * GachaBanner —— 卡池主 Banner
 * 严格按效果图复刻：大立绘 + 角色信息 + SSR 标识 + 限时 UP 文案 + 剩余时间
 * 浮动光点改用 tsParticles
 */
import type { ISourceOptions } from '@tsparticles/engine'
import { computed } from 'vue'
import type { Banner, Character } from '@/types'
import TsParticlesBg from '@/components/layout/TsParticlesBg.vue'

const props = defineProps<{
  banner: Banner
  featured: Character | null
}>()

/** 图片路径拼接 base URL */
const featureImageSrc = computed(() => {
  if (!props.featured) return ''
  const base = import.meta.env.BASE_URL || '/'
  return `${base.replace(/\/+$/, '')}${props.featured.image}`
})

const endDate = computed(() => {
  if (!props.banner.endTime) return null
  return new Date(props.banner.endTime.replace(/-/g, '/'))
})

const timeLeft = computed(() => {
  if (!endDate.value) return '常驻'
  const ms = endDate.value.getTime() - Date.now()
  if (ms <= 0) return '已结束'
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return `${days} 天 ${hours} 小时`
})

/** 浮动光点（环绕主立绘）tsParticles 配置 */
const floatOptions: ISourceOptions = {
  fullScreen: { enable: false },
  background: { color: { value: 'transparent' } },
  detectRetina: true,
  fpsLimit: 60,
  particles: {
    number: { value: 18, density: { enable: false } },
    color: { value: ['#f6c66b', '#9b6cff', '#ff7ad9'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.3, max: 0.9 },
      animation: { enable: true, speed: 1.5, sync: false },
    },
    size: { value: { min: 1.5, max: 4 } },
    move: {
      enable: true,
      speed: { min: 0.5, max: 1.5 },
      direction: 'none',
      random: true,
      straight: false,
      outModes: { default: 'bounce' },
    },
    twinkle: {
      particles: { enable: true, frequency: 0.08, opacity: 1 },
    },
  },
}
</script>

<template>
  <div class="gacha-banner">
    <div class="banner-inner">
      <!-- 左侧文字信息 -->
      <div class="banner-left">
        <div class="banner-tag">LIMITED UP</div>
        <div class="banner-rarity">SSR</div>
        <h2 class="banner-title">{{ banner.name }}</h2>
        <p v-if="featured" class="banner-subtitle">
          {{ featured.title }} · {{ featured.name }}
        </p>
        <p class="banner-desc">
          限定角色登场，限时概率大幅提升！
        </p>
        <div class="banner-time">
          <span class="time-icon">⏱</span>
          <span>剩余时间：{{ timeLeft }}</span>
        </div>
      </div>

      <!-- 右侧立绘占位 -->
      <div class="banner-right">
        <div class="hero-portrait">
          <div class="hero-glow" />
          <!-- tsParticles 浮动光点 -->
          <div class="hero-floats">
            <TsParticlesBg :id="`banner-float-${banner.id}`" :options="floatOptions" />
          </div>
          <img
            v-if="featured"
            class="hero-image"
            :src="featureImageSrc"
            :alt="`${featured.name} ${featured.title}`"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          >
          <div class="hero-emoji">
            {{ featured?.element === 'fire' ? '🔥'
              : featured?.element === 'ice' ? '❄️'
              : featured?.element === 'thunder' ? '⚡'
              : featured?.element === 'nature' ? '🌿'
              : featured?.element === 'dark' ? '🌙'
              : '✨' }}
          </div>
          <div class="hero-initials">
            {{ featured?.name.charAt(0) ?? '✦' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gacha-banner {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background:
    radial-gradient(ellipse at right, rgba(155, 108, 255, 0.35) 0%, transparent 60%),
    radial-gradient(ellipse at left, rgba(246, 198, 107, 0.18) 0%, transparent 60%),
    linear-gradient(135deg, #1a1450 0%, #0a0a2a 100%);
  border: 1px solid var(--color-purple);
  box-shadow: 0 0 32px rgba(155, 108, 255, 0.35);
  min-height: 260px;
}
.gacha-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 20% 30%, #fff, transparent),
    radial-gradient(1px 1px at 60% 70%, rgba(255,255,255,0.6), transparent),
    radial-gradient(1.5px 1.5px at 80% 20%, rgba(246, 198, 107, 0.8), transparent),
    radial-gradient(1px 1px at 40% 80%, rgba(255, 255, 255, 0.5), transparent);
  background-size: 400px 400px;
  opacity: 0.5;
  pointer-events: none;
}

.banner-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 24px;
  padding: 36px 40px;
  min-height: 260px;
}

.banner-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}
.banner-tag {
  display: inline-block;
  width: fit-content;
  padding: 3px 10px;
  background: var(--gradient-gold);
  color: #1a0f2e;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  border-radius: 4px;
  box-shadow: 0 0 12px var(--color-ssr-glow);
}
.banner-rarity {
  font-size: 56px;
  font-weight: 800;
  font-family: var(--font-display);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  text-shadow: 0 0 24px var(--color-ssr-glow);
  margin-top: 4px;
}
.banner-title {
  margin: 4px 0 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-bright);
  letter-spacing: 1px;
}
.banner-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--color-gold-bright);
}
.banner-desc {
  margin: 4px 0 0;
  color: var(--color-muted);
  font-size: 13px;
}
.banner-time {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 6px 12px;
  background: var(--color-panel);
  border: 1px solid var(--color-border-soft);
  border-radius: 20px;
  color: var(--color-text);
  font-size: 12px;
}
.time-icon { color: var(--color-gold); }

/* 右侧立绘 */
.banner-right {
  position: relative;
  display: grid;
  place-items: center;
}
.hero-portrait {
  position: relative;
  width: 200px;
  height: 200px;
  display: grid;
  place-items: center;
}
.hero-glow {
  position: absolute;
  inset: -20px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--color-ssr-glow) 0%, transparent 65%);
  animation: hero-pulse 3s ease-in-out infinite;
}
@keyframes hero-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50%      { opacity: 0.9; transform: scale(1.08); }
}
.hero-image {
  position: absolute;
  right: -26px;
  bottom: -44px;
  z-index: 3;
  width: min(360px, 46vw);
  max-width: none;
  height: auto;
  filter: drop-shadow(0 0 26px var(--color-ssr-glow)) saturate(1.08) contrast(1.04);
  pointer-events: none;
}
.hero-emoji {
  position: absolute;
  font-size: 80px;
  opacity: 0.3;
  filter: drop-shadow(0 0 30px var(--color-gold));
}
.hero-initials {
  position: relative;
  font-size: 96px;
  font-weight: 800;
  font-family: var(--font-display);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 32px var(--color-ssr-glow);
  z-index: 1;
}

/* 浮动光点（tsParticles 容器） */
.hero-floats {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}
.hero-floats :deep(.tsparticles-bg) {
  position: absolute !important;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  z-index: 2;
}
.hero-floats :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
}
</style>
