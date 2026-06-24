<script setup lang="ts">
/**
 * EventsView —— 活动中心
 * 展示当前生效的活动，可领取奖励 / 查看详情
 */
import { computed, ref } from 'vue'
import { useGachaStore } from '@/stores/gachaStore'
import { gameEvents } from '@/data/gameEvents'
import { formatNumber } from '@/utils/format'

const store = useGachaStore()

const toast = ref<{ msg: string; type: 'success' | 'error' } | null>(null)
let toastTimer = 0
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toast.value = { msg, type }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toast.value = null }, 2500)
}

const events = computed(() => gameEvents.map(e => ({
  ...e,
  isActive: new Date(e.endTime).getTime() > Date.now(),
  claimed: store.isEventClaimed(e.id),
})))

const activeCount = computed(() => events.value.filter(e => e.isActive).length)

function timeLeft(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return '已结束'
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  if (days > 0) return `${days} 天 ${hours} 小时`
  const minutes = Math.floor((ms % 3600000) / 60000)
  return `${hours} 小时 ${minutes} 分钟`
}

function claim(id: string) {
  const r = store.claimEventReward(id)
  showToast(r.msg, r.ok ? 'success' : 'error')
}

function rewardText(reward: Record<string, number>): string {
  const parts: string[] = []
  if (reward.gem) parts.push(`💎 ×${formatNumber(reward.gem)}`)
  if (reward.pinkCrystal) parts.push(`💗 ×${formatNumber(reward.pinkCrystal)}`)
  if (reward.gold) parts.push(`🪙 ×${formatNumber(reward.gold)}`)
  return parts.join(' ')
}

const typeName: Record<string, string> = {
  login: '登录',
  discount: '折扣',
  double: '双倍',
  free: '免费',
}
const typeColor: Record<string, string> = {
  login: 'pink',
  discount: 'gold',
  double: 'purple',
  free: 'blue',
}
</script>

<template>
  <div class="events-view">
    <!-- 顶部 -->
    <div class="panel events-header">
      <div class="header-text">
        <h2 class="header-title">活动中心 <span class="header-en">EVENTS</span></h2>
        <p class="header-tip">当前 {{ activeCount }} 个活动进行中</p>
      </div>
      <div class="header-tag">
        <span class="header-tag-num">{{ activeCount }}</span>
        <span class="header-tag-label">进行中</span>
      </div>
    </div>

    <!-- 活动列表 -->
    <div class="events-list">
      <div
        v-for="e in events"
        :key="e.id"
        class="event-card panel"
        :class="[`type-${e.type}`, { ended: !e.isActive, claimed: e.claimed }]"
      >
        <!-- 顶部装饰条 -->
        <div class="event-strip" :class="`strip-${typeColor[e.type]}`" />

        <div class="event-icon">{{ e.icon }}</div>

        <div class="event-info">
          <div class="event-row1">
            <span class="type-pill" :class="`pill-${typeColor[e.type]}`">{{ typeName[e.type] }}</span>
            <h3 class="event-name">{{ e.name }}</h3>
          </div>
          <p class="event-desc">{{ e.description }}</p>
          <div class="event-meta">
            <span v-if="e.reward" class="meta-reward">🎁 {{ rewardText(e.reward) }}</span>
            <span v-if="e.discountFactor" class="meta-discount">💸 {{ Math.floor(e.discountFactor * 100) }}% OFF</span>
            <span v-if="e.doubleReward" class="meta-double">⚡ 产出 ×2</span>
            <span class="meta-time">⏱ {{ timeLeft(e.endTime) }}</span>
          </div>
        </div>

        <div class="event-action">
          <button
            v-if="!e.claimed && e.reward"
            class="event-btn"
            :disabled="!e.isActive"
            @click="claim(e.id)"
          >
            {{ e.isActive ? '领取' : '已结束' }}
          </button>
          <span v-else-if="e.claimed" class="event-claimed">✓ 已领</span>
          <span v-else-if="!e.reward" class="event-auto">自动生效</span>
        </div>
      </div>
    </div>

    <transition name="toast">
      <div
        v-if="toast"
        class="events-toast"
        :class="`toast-${toast.type}`"
      >
        {{ toast.msg }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.events-view {
  position: relative;
}

/* 顶部 */
.events-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  margin-bottom: 20px;
}
.header-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-bright);
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.header-en {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 2px;
}
.header-tip {
  margin: 0;
  color: var(--color-muted);
  font-size: 12px;
}
.header-tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 24px;
  background: linear-gradient(135deg, rgba(255, 122, 217, 0.15), rgba(246, 198, 107, 0.15));
  border: 1px solid var(--color-pink);
  border-radius: var(--radius-md);
}
.header-tag-num {
  font-size: 28px;
  font-weight: 800;
  font-family: var(--font-display);
  background: var(--gradient-pink);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}
.header-tag-label {
  font-size: 10px;
  color: var(--color-muted);
  letter-spacing: 1.5px;
  margin-top: 2px;
}

/* 活动列表 */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.event-card {
  display: grid;
  grid-template-columns: 4px 64px 1fr auto;
  gap: 14px;
  padding: 16px 18px 16px 0;
  align-items: center;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s;
}
.event-card:hover:not(.ended) { transform: translateY(-2px); border-color: var(--color-border-strong); }
.event-card.ended { opacity: 0.5; }
.event-card.claimed .event-name { color: var(--color-dim); }

/* 顶部装饰条 */
.event-strip {
  width: 4px;
  height: 100%;
}
.strip-pink { background: var(--color-pink); }
.strip-gold { background: var(--color-gold); }
.strip-purple { background: var(--color-purple); }
.strip-blue { background: var(--color-r); }

.event-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  background: var(--color-panel-light);
  display: grid;
  place-items: center;
  font-size: 32px;
  box-shadow: inset 0 0 0 1px var(--color-border-soft);
}

.event-info { min-width: 0; }
.event-row1 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.type-pill {
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
}
.pill-pink   { background: rgba(255, 122, 217, 0.2); color: var(--color-pink-bright); border: 1px solid var(--color-pink); }
.pill-gold   { background: rgba(246, 198, 107, 0.2); color: var(--color-gold); border: 1px solid var(--color-gold); }
.pill-purple { background: rgba(155, 108, 255, 0.2); color: var(--color-purple-bright); border: 1px solid var(--color-purple); }
.pill-blue   { background: rgba(77, 163, 255, 0.2); color: var(--color-r); border: 1px solid var(--color-r); }
.event-name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-bright);
}
.event-desc {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--color-muted);
  line-height: 1.5;
}
.event-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 11px;
}
.meta-reward   { color: var(--color-gold); font-weight: 600; }
.meta-discount { color: var(--color-gold); font-weight: 700; }
.meta-double   { color: var(--color-purple-bright); font-weight: 700; }
.meta-time     { color: var(--color-muted); }

.event-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.event-btn {
  padding: 10px 20px;
  background: var(--gradient-gold);
  color: #1a0f2e;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 1px;
  box-shadow: 0 0 10px var(--color-ssr-glow);
  transition: transform 0.15s, box-shadow 0.15s;
  white-space: nowrap;
}
.event-btn:not(:disabled):hover {
  transform: scale(1.05);
  box-shadow: 0 0 16px var(--color-ssr);
}
.event-btn:disabled {
  background: var(--color-panel-light);
  color: var(--color-dim);
  box-shadow: none;
  cursor: not-allowed;
}
.event-claimed {
  padding: 10px 20px;
  color: var(--color-dim);
  font-size: 11px;
  font-weight: 700;
}
.event-auto {
  padding: 10px 20px;
  color: var(--color-purple-bright);
  font-size: 11px;
  font-weight: 700;
  font-style: italic;
}

/* Toast */
.events-toast {
  position: fixed;
  top: 96px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 24px;
  font-weight: 700;
  font-size: 13px;
  z-index: 300;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  pointer-events: none;
}
.toast-success {
  background: linear-gradient(135deg, #2a7a3a, #4aaf5a);
  color: #fff;
}
.toast-error {
  background: linear-gradient(135deg, #7a2a2a, #af4a4a);
  color: #fff;
}
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
.toast-leave-to   { opacity: 0; transform: translateX(-50%) translateY(-12px); }
</style>
