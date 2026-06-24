<script setup lang="ts">
/**
 * CharacterCard —— 角色卡（用于图鉴、UP 列表、结果等）
 * 视觉效果严格按效果图：
 * - SSR: 金色光晕 + 顶部稀有度标签 + 角色立绘 + 底部名称/职业/星级
 * - SR:  紫色光晕
 * - R:   蓝色弱光
 * - 未获得: 灰度 + 半透明
 */
import { computed } from 'vue'
import type { Character } from '@/types'
import { ELEMENT_NAME_CN, ROLE_NAME_CN, formatNumber } from '@/utils/format'

const props = defineProps<{
  character: Character
  obtained?: boolean      // 是否已获得
  count?: number          // 重复获得次数
  showNew?: boolean       // 是否展示 NEW! 角标
  isUp?: boolean          // UP 角标
  size?: 'sm' | 'md' | 'lg'
}>()

const rarityClass = computed(() => `rarity-${props.character.rarity.toLowerCase()}`)
const sizeClass = computed(() => `size-${props.size ?? 'md'}`)

/** 图片路径：需要拼接 Vite base URL（/fantasy-gacha-lab/ + /characters/...） */
const imageSrc = computed(() => {
  const base = import.meta.env.BASE_URL || '/'
  return `${base.replace(/\/+$/, '')}${props.character.image}`
})

const themeName: Record<string, string> = {
  'starlight-order': '星辉圣序',
  'nightfall-court': '夜幕王庭',
  'crimson-coven': '绯焰秘会',
  'verdant-path': '森绿旅途',
  'storm-vanguard': '雷鸣先锋',
  'frost-tide': '霜潮回响',
  'novice-guard': '见习卫队',
}

// 元素对应的 emoji 装饰（占位用）
const elementEmoji: Record<string, string> = {
  light: '✨', dark: '🌙', fire: '🔥', ice: '❄️', thunder: '⚡', nature: '🌿',
}

const stars = computed(() => {
  return {
    SSR: 5,
    SR: 4,
    R: 3,
  }[props.character.rarity]
})

const obtainedText = computed(() => {
  if (!props.obtained) return '未获得'
  if (props.count && props.count > 1) return `已收集 · ${formatNumber(props.count)}`
  return '已收集'
})
</script>

<template>
  <div
    class="char-card"
    :class="[rarityClass, sizeClass, { locked: !obtained }]"
  >
    <!-- 顶部稀有度标签 -->
    <div class="rarity-badge">
      <span class="rarity-text">{{ character.rarity }}</span>
    </div>

    <!-- NEW 角标 -->
    <div v-if="showNew" class="new-badge">NEW!</div>

    <!-- UP 角标 -->
    <div v-if="isUp" class="up-badge">UP</div>

    <!-- 元素角标 -->
    <div class="element-badge" :title="ELEMENT_NAME_CN[character.element]">
      {{ elementEmoji[character.element] }}
    </div>

    <!-- 立绘区 -->
    <div class="portrait">
      <div class="portrait-glow" />
      <img
        class="portrait-image"
        :src="imageSrc"
        :alt="`${character.name} ${character.title}`"
        loading="lazy"
        @error="($event.target as HTMLImageElement).style.display = 'none'"
      >
      <div class="portrait-placeholder">
        <!-- 第一版用 emoji + 渐变占位立绘 -->
        <div class="portrait-emoji">
          {{ character.element === 'fire' ? '🔥'
            : character.element === 'ice' ? '❄️'
            : character.element === 'thunder' ? '⚡'
            : character.element === 'nature' ? '🌿'
            : character.element === 'dark' ? '🌙'
            : '✨' }}
        </div>
        <div class="portrait-initials">{{ character.name.charAt(0) }}</div>
      </div>
    </div>

    <!-- 信息区 -->
    <div class="info">
      <div class="name">{{ character.name }}</div>
      <div class="title-zh">{{ character.title }}</div>
      <div class="meta">
        <span class="role">{{ ROLE_NAME_CN[character.role] }}</span>
        <span class="dot">·</span>
        <span class="element">{{ ELEMENT_NAME_CN[character.element] }}</span>
      </div>
      <div class="theme">{{ themeName[character.theme] }}</div>
      <p class="desc">{{ character.description }}</p>
      <div class="status" :class="{ locked: !obtained }">
        {{ obtainedText }}
      </div>
      <div class="stars">
        <span v-for="i in stars" :key="i" class="star">★</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.char-card {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  padding: 8px;
  box-sizing: border-box;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.12), transparent 22%),
    linear-gradient(180deg, rgba(20, 24, 50, 0.92) 0%, rgba(8, 10, 28, 0.98) 100%);
  border: 2px solid var(--color-border);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  cursor: pointer;
}
.char-card::before {
  content: '';
  position: absolute;
  inset: 4px;
  z-index: 1;
  border-radius: calc(var(--radius-md) - 3px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  pointer-events: none;
}
.char-card::after {
  content: '';
  position: absolute;
  inset: 8px;
  z-index: 1;
  border-radius: calc(var(--radius-md) - 5px);
  background:
    linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent),
    repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 8px);
  mix-blend-mode: screen;
  pointer-events: none;
}

.size-sm { width: 100%; aspect-ratio: 3/4.45; }
.size-md { width: 100%; aspect-ratio: 3/4.65; }
.size-lg { width: 100%; aspect-ratio: 3/4.8; }

.char-card:hover {
  transform: translateY(-4px);
}

/* ============ 稀有度配色 ============ */
.rarity-ssr {
  border-color: var(--color-ssr);
  background:
    radial-gradient(circle at 18% 8%, rgba(255, 244, 184, 0.32), transparent 28%),
    linear-gradient(160deg, #5a330a 0%, #f6c66b 18%, #3a1d07 36%, #141026 72%, #7d4c12 100%);
  box-shadow: 0 0 18px var(--color-ssr-glow), inset 0 0 0 1px rgba(255,255,255,0.22);
}
.rarity-ssr:hover { box-shadow: 0 0 28px var(--color-ssr), inset 0 0 0 1px var(--color-ssr); }
.rarity-sr {
  border-color: var(--color-sr);
  background:
    radial-gradient(circle at 18% 8%, rgba(229, 193, 255, 0.28), transparent 28%),
    linear-gradient(160deg, #3b1b62 0%, #b48cff 18%, #20143f 40%, #0d0c26 76%, #7c4ac4 100%);
  box-shadow: 0 0 14px var(--color-sr-glow), inset 0 0 0 1px rgba(255,255,255,0.18);
}
.rarity-r {
  border-color: var(--color-r);
  background:
    radial-gradient(circle at 18% 8%, rgba(142, 197, 255, 0.22), transparent 28%),
    linear-gradient(160deg, #15365d 0%, #6fb7ff 18%, #102540 40%, #080f22 76%, #336a99 100%);
  box-shadow: 0 0 8px var(--color-r-glow), inset 0 0 0 1px rgba(255,255,255,0.14);
}

/* 未获得 */
.char-card.locked {
  filter: grayscale(0.6) brightness(0.6);
  opacity: 0.65;
}

/* ============ 顶部稀有度标签 ============ */
.rarity-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 5;
  padding: 2px 10px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 1px;
  color: #1a0f2e;
  background: var(--color-ssr);
  box-shadow: 0 0 8px currentColor;
}
.rarity-sr .rarity-badge { background: var(--color-sr); color: #1a0f2e; }
.rarity-r  .rarity-badge { background: var(--color-r);  color: #04132e; }

/* NEW 角标 */
.new-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 5;
  padding: 2px 8px;
  background: linear-gradient(135deg, #ff5fa8, #ff7ad9);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 4px;
  box-shadow: 0 0 12px rgba(255, 122, 217, 0.6);
  animation: shine 1.6s ease-in-out infinite;
}
@keyframes shine {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.08); }
}

/* UP 角标 */
.up-badge {
  position: absolute;
  top: 38px;
  right: 14px;
  z-index: 5;
  padding: 1px 6px;
  background: var(--color-gold);
  color: #1a0f2e;
  font-size: 9px;
  font-weight: 700;
  border-radius: 3px;
  letter-spacing: 1px;
}

/* 元素角标 */
.element-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 4;
  font-size: 18px;
  filter: drop-shadow(0 0 6px currentColor);
  opacity: 0.9;
}
.rarity-ssr .element-badge { right: 50px; }   /* 留位置给 NEW */
.char-card:not(.rarity-ssr) .element-badge { right: 8px; }

/* ============ 立绘区 ============ */
.portrait {
  position: relative;
  z-index: 2;
  height: 58%;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: calc(var(--radius-md) - 4px);
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(5, 7, 20, 0.62);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.45);
}
.portrait-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center,
    var(--color-ssr-glow) 0%, transparent 60%);
  animation: portrait-pulse 3s ease-in-out infinite;
}
.rarity-sr .portrait-glow { background: radial-gradient(ellipse at center, var(--color-sr-glow) 0%, transparent 60%); }
.rarity-r  .portrait-glow { background: radial-gradient(ellipse at center, var(--color-r-glow)  0%, transparent 60%); }
.char-card.locked .portrait-glow { display: none; }

.portrait-image {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  filter: saturate(1.08) contrast(1.04);
}
.char-card.locked .portrait-image {
  filter: grayscale(0.75) brightness(0.7);
}

@keyframes portrait-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.05); }
}

.portrait-placeholder {
  position: relative;
  z-index: 1;
  width: 80%;
  height: 80%;
  display: grid;
  place-items: center;
  background: radial-gradient(ellipse, rgba(155, 108, 255, 0.18) 0%, transparent 70%);
  border-radius: 50%;
}
.portrait-emoji {
  position: absolute;
  font-size: 56px;
  opacity: 0.25;
  filter: drop-shadow(0 0 20px currentColor);
}
.portrait-initials {
  font-size: 64px;
  font-weight: 800;
  font-family: var(--font-display);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 24px var(--color-ssr-glow);
}
.rarity-sr .portrait-initials {
  background: var(--gradient-purple);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.rarity-r .portrait-initials {
  background: linear-gradient(180deg, #8ec5ff 0%, #4da3ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ============ 信息区 ============ */
.info {
  position: relative;
  z-index: 2;
  margin-top: 8px;
  min-height: calc(42% - 8px);
  padding: 8px 10px 10px;
  text-align: center;
  border-radius: calc(var(--radius-md) - 5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.08), transparent 28%),
    rgba(8, 10, 28, 0.84);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.38);
}
.name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-bright);
}
.title-zh {
  font-size: 11px;
  color: var(--color-muted);
  margin-top: 1px;
}
.meta {
  font-size: 10px;
  color: var(--color-muted);
  margin-top: 4px;
}
.meta .dot { margin: 0 4px; opacity: 0.5; }
.theme {
  width: fit-content;
  max-width: 100%;
  margin: 5px auto 0;
  padding: 2px 8px;
  border-radius: 999px;
  color: #130d22;
  background: rgba(246, 198, 107, 0.9);
  font-size: 10px;
  font-weight: 700;
  line-height: 1.35;
}
.rarity-sr .theme { background: rgba(180, 140, 255, 0.92); color: #130d22; }
.rarity-r .theme { background: rgba(111, 183, 255, 0.92); color: #04132e; }
.desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 32px;
  margin: 6px 0 0;
  padding: 5px 7px;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.24);
  color: rgba(246, 240, 255, 0.82);
  font-size: 10px;
  line-height: 1.45;
  text-align: left;
}
.status {
  margin-top: 4px;
  font-size: 10px;
  color: var(--color-gold);
}
.status.locked { color: var(--color-dim); }
.stars {
  margin-top: 4px;
  color: var(--color-ssr);
  font-size: 10px;
  letter-spacing: 2px;
  text-shadow: 0 0 4px currentColor;
}
.rarity-sr .stars { color: var(--color-sr); }
.rarity-r  .stars { color: var(--color-r); }
</style>
