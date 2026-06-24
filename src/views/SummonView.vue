<script setup lang="ts">
/**
 * SummonView —— 召唤页
 * - 顶部卡池类型切换
 * - 大 Banner
 * - 单抽 / 十连 按钮
 * - 保底进度条
 * - 概率详情
 * - 本期 UP 角色列表
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGachaStore } from '@/stores/gachaStore'
import { charactersById } from '@/data/characters'
import GachaBanner from '@/components/gacha/GachaBanner.vue'
import DrawButton from '@/components/gacha/DrawButton.vue'
import CharacterCard from '@/components/gacha/CharacterCard.vue'
import { BASE_RATES, PITY_LIMIT } from '@/utils/gacha'
import { formatPercent } from '@/utils/format'

const router = useRouter()
const store = useGachaStore()

const currentBanner = computed(() => store.currentBanner)
const featured = computed(() => {
  const id = currentBanner.value.upCharacterIds[0]
  return id ? charactersById[id] ?? null : null
})
const upCharacters = computed(() =>
  currentBanner.value.upCharacterIds
    .map(id => charactersById[id])
    .filter((c): c is NonNullable<typeof c> => Boolean(c)),
)

const pityPercent = computed(() => (store.currentPity / PITY_LIMIT) * 100)
const pityLeft = computed(() => PITY_LIMIT - store.currentPity)

function selectBanner(id: string) {
  store.setCurrentBanner(id)
}

function onSingle() {
  store.performSingleDraw()
  router.push({ name: 'result' })
}
function onTen() {
  store.performTenDraw()
  router.push({ name: 'result' })
}
function onFreeDraw() {
  const rec = store.performFreeDraw()
  if (rec) router.push({ name: 'result' })
  else alert('今日免费一抽已使用')
}

const freeAvailable = computed(() => store.freeDrawAvailable)
const activeEvents = computed(() => store.activeEvents)
const singleCost = computed(() => store.singleDrawCost)
const tenCost = computed(() => store.tenDrawCost)
</script>

<template>
  <div class="summon-view">
    <!-- 卡池类型切换 -->
    <div class="banner-tabs panel">
      <button
        v-for="b in store.banners"
        :key="b.id"
        class="banner-tab"
        :class="{ active: b.id === currentBanner.id }"
        @click="selectBanner(b.id)"
      >
        <span class="tab-label">{{ b.name }}</span>
        <span class="tab-type">
          {{ b.type === 'limited-character' ? '限定角色'
            : b.type === 'limited-weapon' ? '限定武器'
            : '常驻' }}
        </span>
      </button>
    </div>

    <!-- 活动 banner（限时） -->
    <div v-if="activeEvents.length > 0" class="event-banner">
      <span class="event-tag">活动</span>
      <div class="event-list">
        <span v-for="e in activeEvents.slice(0, 2)" :key="e.id" class="event-item">
          <span class="event-icon">{{ e.icon }}</span>
          <span class="event-name">{{ e.name }}</span>
        </span>
      </div>
    </div>

    <!-- 主 Banner -->
    <GachaBanner :banner="currentBanner" :featured="featured" />

    <!-- 抽卡按钮区 -->
    <div class="panel draw-panel">
      <div class="draw-buttons">
        <DrawButton type="single" :cost="singleCost"  :currency="store.currency.gem" @click="onSingle" />
        <div class="draw-divider" />
        <DrawButton type="ten"   :cost="tenCost" :currency="store.currency.gem" @click="onTen" />
      </div>
      <!-- 免费一抽 -->
      <button
        class="free-draw-btn"
        :disabled="!freeAvailable.baseAvailable"
        @click="onFreeDraw"
      >
        <span class="free-icon">🎁</span>
        <span class="free-text">
          <span class="free-title">每日免费一抽</span>
          <span class="free-sub">
            {{ freeAvailable.baseAvailable
              ? (activeEvents.find(e => e.type === 'free') ? `可用 · 活动额外 +${freeAvailable.extraAvailable} 张券` : '可用 · 每天 1 次')
              : '今日已使用' }}
          </span>
        </span>
      </button>

      <!-- 保底进度 -->
      <div class="pity-bar">
        <div class="pity-info">
          <span class="pity-label">
            <span class="dot" :class="{ warn: pityLeft <= 10 }" />
            90 抽保底进度
          </span>
          <span class="pity-count">
            <span class="current">{{ store.currentPity }}</span>
            <span class="sep">/</span>
            <span class="total">{{ PITY_LIMIT }}</span>
          </span>
        </div>
        <div
          class="pity-track"
          :class="{
            danger: pityLeft <= 10 && pityLeft > 5,
            extreme: pityLeft <= 5,
          }"
        >
          <div class="pity-fill" :style="{ width: pityPercent + '%' }" />
          <div v-if="pityLeft <= 10" class="pity-warn-tag" :class="{ extreme: pityLeft <= 5 }">
            再 {{ pityLeft }} 抽必出 SSR！
          </div>
        </div>
      </div>
    </div>

    <!-- 双列：概率详情 + UP 角色 -->
    <div class="info-grid">
      <!-- 概率详情 -->
      <div class="panel rates-panel">
        <div class="panel-header">
          <h3 class="panel-title">概率详情 <span class="panel-title-en">PROBABILITY</span></h3>
          <button class="more-btn">概率说明</button>
        </div>
        <ul class="rates-list">
          <li class="rate-row rarity-ssr">
            <span class="rate-rarity">SSR</span>
            <div class="rate-bar"><div class="rate-fill" :style="{ width: BASE_RATES.SSR * 100 * 5 + '%' }" /></div>
            <span class="rate-value">{{ formatPercent(BASE_RATES.SSR) }}</span>
          </li>
          <li class="rate-row rarity-sr">
            <span class="rate-rarity">SR</span>
            <div class="rate-bar"><div class="rate-fill" :style="{ width: BASE_RATES.SR * 100 * 5 + '%' }" /></div>
            <span class="rate-value">{{ formatPercent(BASE_RATES.SR) }}</span>
          </li>
          <li class="rate-row rarity-r">
            <span class="rate-rarity">R</span>
            <div class="rate-bar"><div class="rate-fill" :style="{ width: BASE_RATES.R * 100 * 1.1 + '%' }" /></div>
            <span class="rate-value">{{ formatPercent(BASE_RATES.R) }}</span>
          </li>
        </ul>
        <p class="rates-note">
          ※ 90 抽内必出 SSR；十连抽必出至少 1 个 SR 或以上。
        </p>
      </div>

      <!-- UP 角色 -->
      <div class="panel up-panel">
        <div class="panel-header">
          <h3 class="panel-title">本期 UP <span class="panel-title-en">FEATURED</span></h3>
          <span class="up-count">{{ upCharacters.length }} 位</span>
        </div>
        <div v-if="upCharacters.length > 0" class="up-grid">
          <CharacterCard
            v-for="c in upCharacters"
            :key="c.id"
            :character="c"
            :is-up="true"
            :obtained="!!store.collection[c.id]"
            :count="store.collection[c.id] ?? 0"
            size="sm"
          />
        </div>
        <div v-else class="up-empty">常驻池无 UP 角色</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summon-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 卡池 Tab */
.banner-tabs {
  display: flex;
  gap: 6px;
  padding: 8px;
  overflow-x: auto;
}
.banner-tab {
  flex: 1;
  min-width: 180px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: transparent;
  border: 1px solid transparent;
  text-align: left;
  color: var(--color-muted);
  transition: all 0.25s;
}
.banner-tab:hover {
  background: var(--color-panel-light);
  color: var(--color-text);
}
.banner-tab.active {
  background: var(--color-panel);
  border-color: var(--color-gold);
  box-shadow: 0 0 16px rgba(246, 198, 107, 0.25);
  color: var(--color-text-bright);
}
.tab-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
}
.tab-type {
  display: block;
  font-size: 11px;
  margin-top: 2px;
  opacity: 0.7;
  letter-spacing: 1px;
}

/* 抽卡区 */
.draw-panel {
  padding: 24px;
}
.draw-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 16px;
}
.draw-divider {
  width: 1px;
  height: 50px;
  background: linear-gradient(180deg, transparent, var(--color-border), transparent);
}

/* 免费一抽 */
.free-draw-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 18px;
  background: linear-gradient(135deg, rgba(255, 122, 217, 0.15), rgba(155, 108, 255, 0.15));
  border: 1px solid var(--color-pink);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}
.free-draw-btn:not(:disabled):hover {
  background: linear-gradient(135deg, rgba(255, 122, 217, 0.3), rgba(155, 108, 255, 0.3));
  box-shadow: 0 0 20px rgba(255, 122, 217, 0.4);
  transform: translateY(-1px);
}
.free-draw-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: var(--color-border-soft);
  background: var(--color-panel-light);
}
.free-icon {
  font-size: 28px;
  filter: drop-shadow(0 0 8px var(--color-pink));
}
.free-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  text-align: left;
}
.free-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-pink-bright);
}
.free-sub {
  font-size: 11px;
  color: var(--color-muted);
  font-weight: 400;
}

/* 活动 banner */
.event-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: linear-gradient(90deg, rgba(255, 122, 217, 0.1), rgba(246, 198, 107, 0.1));
  border: 1px solid var(--color-pink);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  overflow-x: auto;
  white-space: nowrap;
}
.event-tag {
  flex-shrink: 0;
  padding: 2px 8px;
  background: var(--gradient-pink);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  border-radius: 4px;
}
.event-list {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--color-text);
}
.event-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 保底 */
.pity-bar { display: flex; flex-direction: column; gap: 8px; }
.pity-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pity-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-muted);
}
.pity-label .dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--color-gold);
  box-shadow: 0 0 8px var(--color-gold);
}
.pity-label .dot.warn { background: #ff5fa8; box-shadow: 0 0 12px #ff5fa8; animation: pulse 1s ease-in-out infinite; }
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.4); }
}
.pity-count {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
.pity-count .current { color: var(--color-gold); font-size: 18px; }
.pity-count .sep { color: var(--color-dim); margin: 0 2px; }

.pity-track {
  position: relative;
  height: 10px;
  background: var(--color-panel-light);
  border-radius: 5px;
  overflow: visible;
  border: 1px solid var(--color-border-soft);
}
.pity-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--gradient-gold);
  border-radius: 5px;
  box-shadow: 0 0 12px var(--color-gold);
  transition: width 0.4s ease, background 0.4s;
}
/* 危险状态（80-89 抽：高频呼吸 + 文字颜色） */
.pity-track.danger {
  animation: shake-warning 0.6s ease-in-out infinite;
  border-color: #ff5fa8;
  box-shadow: 0 0 16px rgba(255, 95, 168, 0.4);
}
.pity-track.danger .pity-fill {
  background: linear-gradient(90deg, #ff5fa8, #f6c66b, #ff5fa8);
  background-size: 200% 100%;
  animation: gradient-flow 1.2s linear infinite;
  box-shadow: 0 0 20px rgba(255, 95, 168, 0.6);
}
@keyframes gradient-flow {
  0%   { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}
@keyframes shake-warning {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-1px); }
  40%      { transform: translateX(1px); }
  60%      { transform: translateX(-1px); }
  80%      { transform: translateX(1px); }
}
/* 极高警告：85+ 抽 */
.pity-track.danger.extreme {
  border-color: #ffd700;
  animation: shake-warning 0.4s ease-in-out infinite, pulse-glow-extreme 0.8s ease-in-out infinite;
}
.pity-track.danger.extreme .pity-fill {
  background: linear-gradient(90deg, #ffd700, #fff5d0, #ffd700);
  background-size: 200% 100%;
  animation: gradient-flow 0.8s linear infinite;
  box-shadow: 0 0 32px rgba(255, 215, 0, 0.8);
}
@keyframes pulse-glow-extreme {
  0%, 100% { box-shadow: 0 0 16px rgba(255, 95, 168, 0.4), inset 0 0 0 1px #ff5fa8; }
  50%      { box-shadow: 0 0 32px rgba(255, 215, 0, 0.8), inset 0 0 0 2px #ffd700; }
}
.pity-warn-tag {
  position: absolute;
  top: -28px;
  right: 0;
  padding: 2px 10px;
  background: var(--gradient-pink);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border-radius: 10px;
  white-space: nowrap;
  animation: pulse 1.2s ease-in-out infinite;
  box-shadow: 0 0 12px rgba(255, 122, 217, 0.6);
}
.pity-warn-tag.extreme {
  background: linear-gradient(135deg, #ffd700, #ff5fa8);
  animation: pulse 0.5s ease-in-out infinite;
  font-size: 12px;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

/* 双列 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 20px;
}
@media (max-width: 900px) { .info-grid { grid-template-columns: 1fr; } }

.panel { padding: 20px 24px; }
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-soft);
}
.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-bright);
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.panel-title-en {
  font-size: 10px;
  color: var(--color-muted);
  letter-spacing: 2px;
  font-weight: 400;
}
.more-btn {
  color: var(--color-purple-bright);
  font-size: 12px;
}
.up-count {
  color: var(--color-gold);
  font-size: 12px;
  font-weight: 700;
}

/* 概率 */
.rates-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rate-row {
  display: grid;
  grid-template-columns: 50px 1fr 60px;
  align-items: center;
  gap: 12px;
}
.rate-rarity {
  font-weight: 800;
  font-family: var(--font-display);
  font-size: 16px;
}
.rarity-ssr .rate-rarity { color: var(--color-ssr); }
.rarity-sr  .rate-rarity { color: var(--color-sr); }
.rarity-r   .rate-rarity { color: var(--color-r); }
.rate-bar {
  position: relative;
  height: 8px;
  background: var(--color-panel-light);
  border-radius: 4px;
  overflow: hidden;
}
.rate-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 4px;
}
.rarity-ssr .rate-fill { background: var(--gradient-gold); box-shadow: 0 0 6px var(--color-ssr); }
.rarity-sr  .rate-fill { background: var(--gradient-purple); }
.rarity-r   .rate-fill { background: linear-gradient(90deg, #4da3ff, #8ec5ff); }
.rate-value {
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
  font-size: 13px;
}
.rates-note {
  margin: 12px 0 0;
  font-size: 11px;
  color: var(--color-muted);
  font-style: italic;
}

/* UP 网格 */
.up-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.up-empty {
  padding: 30px;
  text-align: center;
  color: var(--color-muted);
}
</style>
