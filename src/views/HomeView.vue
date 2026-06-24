<script setup lang="ts">
/**
 * HomeView —— 首页
 * 严格按效果图复刻：Banner + 精选卡池列表 + 今日任务 + 快速数据 + 热门角色
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGachaStore } from '@/stores/gachaStore'
import { charactersById } from '@/data/characters'
import GachaBanner from '@/components/gacha/GachaBanner.vue'
import DrawButton from '@/components/gacha/DrawButton.vue'
import { formatNumber, formatPercent } from '@/utils/format'
import { dailyTasks } from '@/data/dailyTasks'
import type { Currency } from '@/types'
import { playClaim } from '@/utils/sound'

const router = useRouter()
const store = useGachaStore()

const currentBanner = computed(() => store.currentBanner)
const featuredChar = computed(() => {
  const id = currentBanner.value.upCharacterIds[0]
  return id ? charactersById[id] ?? null : null
})

const hotCharacters = computed(() => {
  // 展示前 5 个 SSR + 部分 SR
  return store.characters.filter(c => c.rarity === 'SSR' || c.rarity === 'SR').slice(0, 6)
})

const tasks = computed(() => {
  store.checkDailyReset()
  return store.taskProgressView
})

const claimedCount = computed(() => Object.values(tasks.value).filter(t => t.claimed).length)
const totalTasks = computed(() => Object.keys(tasks.value).length)

const taskList = computed(() => {
  const view = tasks.value
  return [
    { id: 'task_draw_10',       name: '进行 1 次十连抽',         icon: '🎰' },
    { id: 'task_collect_new',   name: '收集 1 个新角色',         icon: '✨' },
    { id: 'task_browse_collection', name: '浏览图鉴',            icon: '📖' },
    { id: 'task_spend_500',      name: '商店消费 500 金币',       icon: '🛍️' },
    { id: 'task_idle_60',        name: '挂机收益累积 60 分钟',    icon: '⏱️' },
  ].map(t => {
    const p = view[t.id] ?? { current: 0, target: 1, claimed: false, done: false }
    return { ...t, ...p }
  })
})

function rewardText(reward: Partial<Currency>): string {
  const parts: string[] = []
  if (reward.gem) parts.push(`💎 ×${reward.gem}`)
  if (reward.pinkCrystal) parts.push(`💗 ×${reward.pinkCrystal}`)
  if (reward.gold) parts.push(`🪙 ×${reward.gold}`)
  return parts.join(' ')
}

function claimTask(id: string) {
  const r = store.claimTaskReward(id)
  if (r.ok && store.settings.soundEnabled) playClaim()
  taskToast.value = r.msg
  setTimeout(() => { taskToast.value = null }, 2500)
}

const taskToast = ref<string | null>(null)

const quickStats = computed(() => ([
  { label: '总召唤',   value: formatNumber(store.totalDraws),          icon: '🎰' },
  { label: 'SSR 收集', value: formatNumber(store.ssrCount),            icon: '🌟' },
  { label: '图鉴进度', value: `${store.collectedCount}/${store.characters.length}`, icon: '📖' },
  { label: '保底',     value: `${store.currentPity}/90`,                 icon: '✨' },
]))

function goSummon() {
  router.push({ name: 'summon' })
}
function goRecords() {
  router.push({ name: 'records' })
}
function goCollection() {
  router.push({ name: 'collection' })
}
function goEvents() {
  router.push({ name: 'events' })
}

const unclaimedEventCount = computed(() => {
  return store.activeEvents.filter(e =>
    e.reward && !store.isEventClaimed(e.id),
  ).length
})
</script>

<template>
  <div class="home-view">
    <!-- 主 Banner -->
    <section class="section-banner">
      <GachaBanner :banner="currentBanner" :featured="featuredChar" />

      <!-- Banner 下方快捷按钮 -->
      <div class="quick-actions panel">
        <DrawButton type="single" :cost="160" :currency="store.currency.gem" @click="goSummon" />
        <DrawButton type="ten"   :cost="1600" :currency="store.currency.gem" @click="goSummon" />
        <button class="ghost-btn" @click="goCollection">角色预览</button>
        <button class="ghost-btn" @click="goRecords">查看卡池详情</button>
        <button class="ghost-btn" @click="goEvents">
          限时活动
          <span v-if="unclaimedEventCount > 0" class="dot-tag">{{ unclaimedEventCount }}</span>
        </button>
      </div>
    </section>

    <!-- 今日任务 + 快速数据 -->
    <section class="section-grid">
      <!-- 今日任务 -->
      <div class="panel task-panel">
        <div class="panel-header">
          <h3 class="panel-title">今日任务 <span class="panel-title-en">DAILY TASKS</span></h3>
          <span class="panel-tag">{{ claimedCount }} / {{ totalTasks }}</span>
        </div>
        <ul class="task-list">
          <li
            v-for="t in taskList"
            :key="t.id"
            class="task-item"
            :class="{
              done: t.done && !t.claimed,
              claimed: t.claimed,
            }"
          >
            <span class="task-icon">{{ t.icon }}</span>
            <div class="task-body">
              <div class="task-name">{{ t.name }}</div>
              <div class="task-meta">
                <span class="task-progress">{{ t.current }} / {{ t.target }}</span>
                <span class="task-reward">
                  {{ rewardText(dailyTasks.find(x => x.id === t.id)?.reward ?? {}) }}
                </span>
              </div>
            </div>
            <button
              v-if="!t.claimed"
              class="task-claim"
              :class="{ ready: t.done }"
              :disabled="!t.done"
              @click="claimTask(t.id)"
            >
              {{ t.done ? '领取' : '未完成' }}
            </button>
            <span v-else class="task-claimed">✓ 已领</span>
          </li>
        </ul>
      </div>

      <!-- 快速数据 -->
      <div class="panel stats-panel">
        <div class="panel-header">
          <h3 class="panel-title">快速数据 <span class="panel-title-en">QUICK STATS</span></h3>
        </div>
        <div class="stats-grid">
          <div v-for="s in quickStats" :key="s.label" class="stat-cell">
            <div class="stat-icon">{{ s.icon }}</div>
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
        <div class="ssr-rate">
          <span class="label">SSR 出货率</span>
          <span class="value">{{ formatPercent(store.ssrRate) }}</span>
        </div>
      </div>
    </section>

    <!-- 热门角色 -->
    <section class="section-hot">
      <div class="section-header">
        <h2 class="section-title">热门角色 <span class="section-title-en">HOT CHARACTERS</span></h2>
        <button class="more-btn" @click="goCollection">查看全部 →</button>
      </div>
      <div class="hot-grid">
        <div v-for="c in hotCharacters" :key="c.id" class="hot-slot">
          <div class="hot-card" :class="`rarity-${c.rarity.toLowerCase()}`">
            <div class="hot-glow" />
            <div class="hot-portrait">
              <div class="hot-initials">{{ c.name.charAt(0) }}</div>
            </div>
            <div class="hot-info">
              <div class="hot-name">{{ c.name }}</div>
              <div class="hot-rarity">{{ c.rarity }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ============ Banner 区 ============ */
.section-banner {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.quick-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  flex-wrap: wrap;
}
.ghost-btn {
  position: relative;
  padding: 12px 24px;
  border-radius: var(--radius-lg);
  background: var(--color-panel);
  border: 1px solid var(--color-purple);
  color: var(--color-purple-bright);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 1px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.ghost-btn:hover {
  background: rgba(155, 108, 255, 0.15);
  color: var(--color-text-bright);
  border-color: var(--color-gold);
}
.dot-tag {
  display: inline-flex;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  align-items: center;
  justify-content: center;
  background: var(--color-pink);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 9px;
  box-shadow: 0 0 8px rgba(255, 122, 217, 0.6);
  animation: dot-pulse 1.5s ease-in-out infinite;
}
@keyframes dot-pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.15); }
}

/* ============ 两列网格 ============ */
.section-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
}
@media (max-width: 900px) {
  .section-grid { grid-template-columns: 1fr; }
}

.panel {
  padding: 20px 24px;
}
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
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-bright);
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.panel-title-en {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 2px;
  font-weight: 400;
}
.panel-tag {
  padding: 2px 10px;
  background: var(--gradient-gold);
  color: #1a0f2e;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}

/* 任务 */
.task-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.task-item {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--color-panel-light);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  transition: border-color 0.2s, opacity 0.2s;
}
.task-item.done { border-color: var(--color-gold); }
.task-item.claimed { opacity: 0.5; }
.task-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  font-size: 18px;
  background: var(--color-panel);
  border-radius: 50%;
  border: 1px solid var(--color-border-soft);
}
.task-body { min-width: 0; }
.task-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 2px;
}
.task-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
}
.task-progress {
  color: var(--color-muted);
  font-variant-numeric: tabular-nums;
}
.task-reward {
  color: var(--color-gold);
  font-weight: 600;
}
.task-claim {
  padding: 6px 12px;
  background: var(--color-panel);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
  color: var(--color-dim);
  font-size: 12px;
  font-weight: 700;
  cursor: not-allowed;
  transition: all 0.2s;
  white-space: nowrap;
}
.task-claim.ready {
  background: var(--gradient-gold);
  color: #1a0f2e;
  border-color: var(--color-gold);
  cursor: pointer;
  box-shadow: 0 0 10px var(--color-ssr-glow);
}
.task-claim.ready:hover { transform: scale(1.05); box-shadow: 0 0 16px var(--color-ssr); }
.task-claimed {
  color: var(--color-dim);
  font-size: 11px;
  font-weight: 700;
}

/* 快速数据 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.stat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px;
  background: var(--color-panel-light);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
}
.stat-icon { font-size: 22px; }
.stat-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text-bright);
  font-variant-numeric: tabular-nums;
}
.stat-label {
  font-size: 11px;
  color: var(--color-muted);
}
.ssr-rate {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(90deg, rgba(246, 198, 107, 0.1), rgba(155, 108, 255, 0.1));
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  font-size: 13px;
}
.ssr-rate .label { color: var(--color-muted); }
.ssr-rate .value {
  color: var(--color-gold);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* ============ 热门角色 ============ */
.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}
.section-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-bright);
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.section-title-en {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 2px;
}
.more-btn {
  color: var(--color-purple-bright);
  font-size: 13px;
  padding: 4px 0;
}
.more-btn:hover { color: var(--color-gold); }

.hot-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
}
@media (max-width: 1100px) { .hot-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 600px)  { .hot-grid { grid-template-columns: repeat(2, 1fr); } }

.hot-slot { aspect-ratio: 3/4.2; }
.hot-card {
  position: relative;
  width: 100%; height: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: linear-gradient(180deg, rgba(20, 24, 50, 0.85) 0%, rgba(8, 10, 28, 0.95) 100%);
  border: 1px solid var(--color-border);
  transition: transform 0.25s;
  cursor: pointer;
}
.hot-card:hover { transform: translateY(-4px); }
.hot-card.rarity-ssr { border-color: var(--color-ssr); box-shadow: 0 0 14px var(--color-ssr-glow); }
.hot-card.rarity-sr  { border-color: var(--color-sr);  box-shadow: 0 0 10px var(--color-sr-glow); }
.hot-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, var(--color-ssr-glow) 0%, transparent 65%);
}
.rarity-sr .hot-glow { background: radial-gradient(ellipse at center, var(--color-sr-glow) 0%, transparent 65%); }
.hot-portrait {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}
.hot-initials {
  font-size: 48px;
  font-weight: 800;
  font-family: var(--font-display);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.rarity-sr .hot-initials {
  background: var(--gradient-purple);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hot-info {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 8px 10px;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.85));
  text-align: center;
}
.hot-name { font-size: 13px; font-weight: 700; color: var(--color-text-bright); }
.hot-rarity {
  font-size: 10px;
  color: var(--color-ssr);
  letter-spacing: 1.5px;
  margin-top: 2px;
}
.rarity-sr .hot-rarity { color: var(--color-sr); }
</style>
