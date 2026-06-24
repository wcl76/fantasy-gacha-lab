<script setup lang="ts">
/**
 * ProfileView —— 个人中心
 * - 头部：头像 + 等级 + 经验条 + 称号
 * - 玩家数据：抽卡统计、SSR 数量、平均出货
 * - 资源总览：货币、挂机倍率、当前活动
 * - 成就/称号（基础）
 * - 设置：动画开关、音效开关
 */
import { computed, ref } from 'vue'
import { useGachaStore } from '@/stores/gachaStore'
import { formatNumber, formatPercent } from '@/utils/format'
import { setSoundEnabled } from '@/utils/sound'

const store = useGachaStore()

// ============ 玩家等级（基于总抽卡数）============
const playerLevel = computed(() => {
  const draws = store.totalDraws
  if (draws < 10) return 1
  if (draws < 50) return 2
  if (draws < 200) return 3
  if (draws < 500) return 4
  if (draws < 1000) return 5
  return Math.min(99, 5 + Math.floor((draws - 1000) / 500))
})

const playerExp = computed(() => {
  const draws = store.totalDraws
  if (draws < 10) return { current: draws, target: 10 }
  if (draws < 50) return { current: draws - 10, target: 40 }
  if (draws < 200) return { current: draws - 50, target: 150 }
  if (draws < 500) return { current: draws - 200, target: 300 }
  if (draws < 1000) return { current: draws - 500, target: 500 }
  return { current: (draws - 1000) % 500, target: 500 }
})
const expPercent = computed(() => (playerExp.value.current / playerExp.value.target) * 100)

// ============ 称号系统（按总抽卡数 / SSR 数 颁发）============
const titles = [
  { id: 'rookie',  name: '见习召唤师',  minDraws: 0,    minSSR: 0, color: '#9ca3c7' },
  { id: 'seeker',  name: '星辰探索者',  minDraws: 50,   minSSR: 0, color: '#4da3ff' },
  { id: 'hunter',  name: 'SSR 猎人',     minDraws: 100,  minSSR: 5, color: '#9b6cff' },
  { id: 'master',  name: '召唤大师',     minDraws: 500,  minSSR: 15, color: '#f6c66b' },
  { id: 'legend',  name: '传说级召唤师', minDraws: 1000, minSSR: 30, color: '#ff7ad9' },
]
const currentTitle = computed(() => {
  return [...titles].reverse().find(t =>
    store.totalDraws >= t.minDraws && store.ssrCount >= t.minSSR,
  ) || titles[0]!
})
const unlockedTitles = computed(() => titles.filter(t =>
  store.totalDraws >= t.minDraws && store.ssrCount >= t.minSSR,
))
const nextTitle = computed(() => {
  return titles.find(t =>
    store.totalDraws < t.minDraws || store.ssrCount < t.minSSR,
  )
})

// ============ 成就进度（每个成就显示达成度）============
const achievements = computed(() => {
  const ssr = store.ssrCount
  const total = store.totalDraws
  const collected = store.collectedCount
  return [
    {
      id: 'first_draw', name: '初次召唤', icon: '🎰',
      desc: '完成第 1 次抽卡', progress: Math.min(1, total), target: 1, done: total >= 1,
    },
    {
      id: 'collect_5', name: '收藏家', icon: '📖',
      desc: '收集 5 个不同角色', progress: Math.min(5, collected), target: 5, done: collected >= 5,
    },
    {
      id: 'collect_15', name: '完美收藏', icon: '🏆',
      desc: '收集全部 15 个角色', progress: Math.min(15, collected), target: 15, done: collected >= 15,
    },
    {
      id: 'ssr_1', name: '欧皇初现', icon: '✨',
      desc: '获得第 1 个 SSR', progress: Math.min(1, ssr), target: 1, done: ssr >= 1,
    },
    {
      id: 'ssr_10', name: '金色传说', icon: '🌟',
      desc: '累计获得 10 个 SSR', progress: Math.min(10, ssr), target: 10, done: ssr >= 10,
    },
    {
      id: 'draws_100', name: '百抽达成', icon: '💯',
      desc: '累计召唤 100 次', progress: Math.min(100, total), target: 100, done: total >= 100,
    },
    {
      id: 'draws_500', name: '千抽之路', icon: '🎖️',
      desc: '累计召唤 500 次', progress: Math.min(500, total), target: 500, done: total >= 500,
    },
    {
      id: 'idle_upgrade_2', name: '挂机大师', icon: '⚡',
      desc: '挂机倍率 ≥ 2.0x', progress: Math.min(2, store.idleMultiplier), target: 2, done: store.idleMultiplier >= 2,
    },
  ]
})

// ============ 详细统计 ============
const stats = computed(() => [
  { label: '总召唤次数', value: formatNumber(store.totalDraws), icon: '🎰' },
  { label: 'SSR 获得数', value: formatNumber(store.ssrCount), icon: '🌟' },
  { label: 'SR 获得数', value: formatNumber(store.history.reduce((s, r) => s + r.results.filter(x => x.rarity === 'SR').length, 0)), icon: '💜' },
  { label: 'SSR 出货率', value: formatPercent(store.ssrRate), icon: '📈' },
  { label: '平均每 SSR', value: store.avgPerSSR > 0 ? store.avgPerSSR.toFixed(2) : '—', icon: '🎯' },
  { label: '图鉴完成度', value: `${store.collectedCount}/${store.characters.length}`, icon: '🖼️' },
  { label: '历史记录', value: formatNumber(store.history.length), icon: '📋' },
  { label: '保底进度', value: `${store.currentPity}/90`, icon: '✨' },
])

// ============ 设置 ============
const animationEnabled = ref(store.settings.animationEnabled)
const soundEnabled = ref(store.settings.soundEnabled)

function toggleAnimation() {
  animationEnabled.value = !animationEnabled.value
  store.settings.animationEnabled = animationEnabled.value
  store.persist()
}
function toggleSound() {
  soundEnabled.value = !soundEnabled.value
  store.settings.soundEnabled = soundEnabled.value
  store.persist()
  // 同步通知 sound 引擎
  setSoundEnabled(soundEnabled.value)
}

function resetAll() {
  if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
    store.resetAll()
    location.reload()
  }
}
</script>

<template>
  <div class="profile-view">
    <!-- 头部：玩家信息 -->
    <div class="panel profile-header">
      <div class="avatar-box">
        <div class="avatar-img">🦄</div>
        <div class="avatar-badge">Lv.{{ playerLevel }}</div>
      </div>
      <div class="header-info">
        <div class="info-row1">
          <h2 class="player-name">玩家 UID: 114514</h2>
          <span class="title-badge" :style="{ background: currentTitle.color }">
            🏅 {{ currentTitle.name }}
          </span>
        </div>
        <div class="exp-bar">
          <div class="exp-track">
            <div class="exp-fill" :style="{ width: expPercent + '%' }" />
          </div>
          <span class="exp-text">{{ playerExp.current }} / {{ playerExp.target }} EXP</span>
        </div>
        <p class="header-tip">
          累计召唤 <strong>{{ store.totalDraws }}</strong> 次 ·
          SSR <strong>{{ store.ssrCount }}</strong> 个
        </p>
      </div>
    </div>

    <!-- 详细统计 + 货币 -->
    <div class="row">
      <div class="panel stats-panel">
        <h3 class="panel-title">详细统计 <span class="panel-title-en">STATISTICS</span></h3>
        <div class="stats-grid">
          <div v-for="s in stats" :key="s.label" class="stat-cell">
            <div class="stat-icon">{{ s.icon }}</div>
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div class="panel resources-panel">
        <h3 class="panel-title">资源总览 <span class="panel-title-en">RESOURCES</span></h3>
        <div class="resource-row">
          <div class="resource-cell">
            <div class="r-icon">💎</div>
            <div class="r-info">
              <div class="r-value">{{ formatNumber(store.currency.gem) }}</div>
              <div class="r-label">宝石</div>
            </div>
          </div>
          <div class="resource-cell">
            <div class="r-icon">💗</div>
            <div class="r-info">
              <div class="r-value">{{ formatNumber(store.currency.pinkCrystal) }}</div>
              <div class="r-label">粉晶</div>
            </div>
          </div>
          <div class="resource-cell">
            <div class="r-icon">🪙</div>
            <div class="r-info">
              <div class="r-value">{{ formatNumber(store.currency.gold) }}</div>
              <div class="r-label">金币</div>
            </div>
          </div>
        </div>
        <div class="divider" />
        <div class="resource-row">
          <div class="resource-cell small">
            <div class="r-icon">⚡</div>
            <div class="r-info">
              <div class="r-value">{{ store.idleMultiplier }}x</div>
              <div class="r-label">挂机倍率</div>
            </div>
          </div>
          <div class="resource-cell small">
            <div class="r-icon">🎁</div>
            <div class="r-info">
              <div class="r-value">{{ store.activeEvents.length }}</div>
              <div class="r-label">生效活动</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 称号 -->
    <div class="panel titles-panel">
      <h3 class="panel-title">称号系统 <span class="panel-title-en">TITLES</span></h3>
      <div class="titles-list">
        <div
          v-for="t in titles"
          :key="t.id"
          class="title-card"
          :class="{ unlocked: unlockedTitles.includes(t) }"
          :style="{ '--title-color': t.color }"
        >
          <div class="title-icon">🏅</div>
          <div class="title-info">
            <div class="title-name">{{ t.name }}</div>
            <div class="title-req">
              召唤 {{ t.minDraws }} 次 · SSR {{ t.minSSR }} 个
            </div>
          </div>
          <div v-if="unlockedTitles.includes(t)" class="title-check">✓</div>
          <div v-else class="title-locked">🔒</div>
        </div>
      </div>
      <p v-if="nextTitle" class="title-hint">
        下一称号：<strong :style="{ color: nextTitle.color }">{{ nextTitle.name }}</strong>
        （需召唤 {{ nextTitle.minDraws }} 次 + SSR {{ nextTitle.minSSR }} 个）
      </p>
    </div>

    <!-- 成就 -->
    <div class="panel achievements-panel">
      <h3 class="panel-title">成就 <span class="panel-title-en">ACHIEVEMENTS</span></h3>
      <div class="achievements-grid">
        <div
          v-for="a in achievements"
          :key="a.id"
          class="achievement-card"
          :class="{ unlocked: a.done }"
        >
          <div class="ach-icon">{{ a.icon }}</div>
          <div class="ach-info">
            <div class="ach-name">{{ a.name }}</div>
            <div class="ach-desc">{{ a.desc }}</div>
            <div class="ach-progress">
              <div class="ach-track">
                <div class="ach-fill" :style="{ width: (a.progress / a.target * 100) + '%' }" />
              </div>
              <span class="ach-num">{{ a.progress }} / {{ a.target }}</span>
            </div>
          </div>
          <div v-if="a.done" class="ach-check">✓</div>
        </div>
      </div>
    </div>

    <!-- 设置 -->
    <div class="panel settings-panel">
      <h3 class="panel-title">设置 <span class="panel-title-en">SETTINGS</span></h3>
      <div class="settings-list">
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-icon">✨</div>
            <div>
              <div class="setting-name">动画效果</div>
              <div class="setting-desc">启用翻牌/粒子/SSR 特效</div>
            </div>
          </div>
          <button class="toggle" :class="{ on: animationEnabled }" @click="toggleAnimation">
            <span class="toggle-knob" />
          </button>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-icon">🔊</div>
            <div>
              <div class="setting-name">音效</div>
              <div class="setting-desc">抽卡/翻牌/点击音效</div>
            </div>
          </div>
          <button class="toggle" :class="{ on: soundEnabled }" @click="toggleSound">
            <span class="toggle-knob" />
          </button>
        </div>
        <div class="setting-item danger">
          <div class="setting-info">
            <div class="setting-icon">⚠️</div>
            <div>
              <div class="setting-name">重置存档</div>
              <div class="setting-desc">清空所有数据，回到初始状态</div>
            </div>
          </div>
          <button class="reset-btn" @click="resetAll">重置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ============ 头部 ============ */
.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 28px;
  position: relative;
  overflow: hidden;
}
.profile-header::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 10% 0%, rgba(155, 108, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 90% 100%, rgba(246, 198, 107, 0.1) 0%, transparent 50%);
  pointer-events: none;
}
.avatar-box {
  position: relative;
  flex-shrink: 0;
}
.avatar-img {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 30%, #ffe4a3 0%, #f6c66b 40%, #c89a3a 100%);
  display: grid;
  place-items: center;
  font-size: 56px;
  border: 3px solid var(--color-gold);
  box-shadow: 0 0 24px var(--color-ssr-glow);
}
.avatar-badge {
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--gradient-gold);
  color: #1a0f2e;
  font-size: 12px;
  font-weight: 800;
  padding: 2px 10px;
  border-radius: 10px;
  white-space: nowrap;
  border: 1px solid var(--color-gold);
}
.header-info { flex: 1; min-width: 0; }
.info-row1 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.player-name {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-bright);
}
.title-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #1a0f2e;
  box-shadow: 0 0 10px currentColor;
}
.exp-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.exp-track {
  flex: 1;
  height: 8px;
  background: var(--color-panel-light);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--color-border-soft);
}
.exp-fill {
  height: 100%;
  background: var(--gradient-gold);
  border-radius: 4px;
  box-shadow: 0 0 8px var(--color-ssr-glow);
  transition: width 0.5s;
}
.exp-text {
  font-size: 11px;
  color: var(--color-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.header-tip {
  margin: 0;
  color: var(--color-muted);
  font-size: 12px;
}
.header-tip strong { color: var(--color-gold); }

/* ============ 通用 panel ============ */
.panel {
  padding: 20px 24px;
}
.panel-title {
  margin: 0 0 14px;
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

/* ============ 统计 + 资源 两列 ============ */
.row {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
}
@media (max-width: 1000px) { .row { grid-template-columns: 1fr; } }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
@media (max-width: 700px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
.stat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px;
  background: var(--color-panel-light);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
}
.stat-icon { font-size: 20px; }
.stat-value {
  font-size: 16px;
  font-weight: 800;
  font-family: var(--font-display);
  color: var(--color-text-bright);
  font-variant-numeric: tabular-nums;
}
.stat-label {
  font-size: 10px;
  color: var(--color-muted);
}

/* 资源 */
.resource-row {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}
.resource-cell {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--color-panel-light);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
}
.resource-cell.small { padding: 8px; }
.r-icon { font-size: 28px; }
.resource-cell.small .r-icon { font-size: 22px; }
.r-info { flex: 1; min-width: 0; }
.r-value {
  font-size: 18px;
  font-weight: 800;
  font-family: var(--font-display);
  color: var(--color-text-bright);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.resource-cell.small .r-value { font-size: 14px; }
.r-label {
  font-size: 10px;
  color: var(--color-muted);
  margin-top: 2px;
}
.divider {
  height: 1px;
  background: var(--color-border-soft);
  margin: 12px 0;
}

/* ============ 称号 ============ */
.titles-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
@media (max-width: 900px) { .titles-list { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 500px) { .titles-list { grid-template-columns: repeat(2, 1fr); } }
.title-card {
  position: relative;
  padding: 14px 12px;
  background: var(--color-panel-light);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  transition: all 0.2s;
  opacity: 0.4;
}
.title-card.unlocked {
  opacity: 1;
  border-color: var(--title-color);
  box-shadow: 0 0 12px color-mix(in srgb, var(--title-color) 40%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--title-color) 8%, var(--color-panel-light)), var(--color-panel-light));
}
.title-icon {
  font-size: 24px;
  filter: grayscale(1);
}
.title-card.unlocked .title-icon { filter: none; }
.title-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  color: var(--color-text-bright);
}
.title-req {
  font-size: 10px;
  color: var(--color-muted);
  line-height: 1.3;
}
.title-check {
  position: absolute;
  top: 4px;
  right: 6px;
  color: var(--title-color);
  font-weight: 800;
  font-size: 12px;
}
.title-locked {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 10px;
  opacity: 0.6;
}
.title-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--color-muted);
  text-align: center;
}

/* ============ 成就 ============ */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
@media (max-width: 1000px) { .achievements-grid { grid-template-columns: repeat(2, 1fr); } }
.achievement-card {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-panel-light);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  transition: all 0.2s;
}
.achievement-card.unlocked {
  border-color: var(--color-gold);
  background: linear-gradient(135deg, rgba(246, 198, 107, 0.1), var(--color-panel-light));
}
.ach-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  font-size: 22px;
  background: var(--color-panel);
  border-radius: 50%;
  filter: grayscale(0.6);
}
.achievement-card.unlocked .ach-icon { filter: none; }
.ach-info { min-width: 0; }
.ach-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-bright);
}
.ach-desc {
  font-size: 10px;
  color: var(--color-muted);
  margin-top: 1px;
}
.ach-progress {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}
.ach-track {
  flex: 1;
  height: 4px;
  background: rgba(155, 108, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;
}
.ach-fill {
  height: 100%;
  background: var(--gradient-gold);
  border-radius: 2px;
}
.ach-num {
  font-size: 9px;
  color: var(--color-muted);
  font-variant-numeric: tabular-nums;
}
.ach-check {
  color: var(--color-gold);
  font-weight: 800;
  font-size: 14px;
}

/* ============ 设置 ============ */
.settings-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--color-panel-light);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
}
.setting-item.danger { border-color: rgba(255, 95, 168, 0.4); }
.setting-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.setting-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  font-size: 18px;
  background: var(--color-panel);
  border-radius: 50%;
}
.setting-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-bright);
}
.setting-desc {
  font-size: 11px;
  color: var(--color-muted);
  margin-top: 2px;
}

/* 开关 */
.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--color-dim);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
}
.toggle.on { background: var(--gradient-gold); border-color: var(--color-gold); }
.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
.toggle.on .toggle-knob { transform: translateX(20px); }

.reset-btn {
  padding: 8px 18px;
  background: linear-gradient(135deg, #7a2a2a, #af4a4a);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  transition: transform 0.15s;
}
.reset-btn:hover { transform: scale(1.05); }
</style>
