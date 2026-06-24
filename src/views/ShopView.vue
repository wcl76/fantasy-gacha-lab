<script setup lang="ts">
/**
 * ShopView —— 商店页
 * 布局：左侧 3 个分类 Tab（货币/挂机/特殊）
 * 主体：商品卡片网格
 * 顶部：当前挂机状态 + 离线收益提示
 */
import { computed, ref } from 'vue'
import { useGachaStore } from '@/stores/gachaStore'
import { shopItems, MAX_IDLE_MULTIPLIER } from '@/data/shopItems'
import { formatNumber } from '@/utils/format'
import type { Currency, ShopItem } from '@/types'
import { playBuy } from '@/utils/sound'

const store = useGachaStore()

type TabKey = 'all' | 'currency' | 'idle' | 'special'
const activeTab = ref<TabKey>('all')

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '🛍️' },
  { key: 'currency', label: '货币', icon: '💎' },
  { key: 'idle', label: '挂机升级', icon: '⚡' },
  { key: 'special', label: '特殊', icon: '🎟️' },
]

const filtered = computed<ShopItem[]>(() => {
  if (activeTab.value === 'all') return shopItems
  return shopItems.filter(i => i.type === activeTab.value)
})

/** 提示信息（最近一次操作） */
const toast = ref<{ msg: string; type: 'success' | 'error' } | null>(null)
let toastTimer = 0
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toast.value = { msg, type }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toast.value = null }, 2500)
}

function canAfford(cost: Partial<Currency>): boolean {
  if (cost.gem && store.currency.gem < cost.gem) return false
  if (cost.pinkCrystal && store.currency.pinkCrystal < cost.pinkCrystal) return false
  if (cost.gold && store.currency.gold < cost.gold) return false
  return true
}

function costText(cost: Partial<Currency>): string {
  const parts: string[] = []
  if (cost.gem) parts.push(`💎 ${formatNumber(cost.gem)}`)
  if (cost.pinkCrystal) parts.push(`💗 ${formatNumber(cost.pinkCrystal)}`)
  if (cost.gold) parts.push(`🪙 ${formatNumber(cost.gold)}`)
  return parts.join(' + ')
}

function buy(item: ShopItem) {
  if (item.effect?.idleBoost) {
    if (store.idleMultiplier + item.effect.idleBoost > MAX_IDLE_MULTIPLIER) {
      showToast(`挂机倍率已达上限 ${MAX_IDLE_MULTIPLIER}x`, 'error')
      return
    }
  }
  if (!canAfford(item.cost)) {
    showToast('货币不足，无法购买', 'error')
    return
  }
  const ok = store.spend(item.cost)
  if (!ok) {
    showToast('货币不足，无法购买', 'error')
    return
  }
  // 任务：消费金币触发 spend_500
  if (item.cost.gold) store.progressTask('task_spend_500', item.cost.gold)
  if (item.reward) {
    store.addCurrency(item.reward)
  }
  if (item.effect?.idleBoost) {
    store.setIdleMultiplier(store.idleMultiplier + item.effect.idleBoost)
  }
  if (store.settings.soundEnabled) playBuy()
  showToast(`✓ 购买成功：${item.name}`)
}
</script>

<template>
  <div class="shop-view">
    <!-- 顶部：货币状态 + 挂机状态 -->
    <div class="shop-header panel">
      <div class="header-left">
        <h2 class="header-title">商店 <span class="header-en">SHOP</span></h2>
        <p class="header-tip">用金币购买道具、货币和挂机升级</p>
      </div>
      <div class="header-right">
        <div class="stat-box">
          <div class="stat-label">当前挂机倍率</div>
          <div class="stat-value">
            <span class="value-num">{{ store.idleMultiplier }}x</span>
            <span class="value-tag">Lv.{{ store.idleLevel }}</span>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-label">每分钟产出</div>
          <div class="stat-value small">
            <span>💎 {{ store.idleRates.gem }}</span>
            <span>💗 {{ store.idleRates.pinkCrystal }}</span>
            <span>🪙 {{ store.idleRates.gold }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分类 Tab -->
    <div class="shop-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="tab-btn"
        :class="{ active: activeTab === t.key }"
        @click="activeTab = t.key"
      >
        <span class="tab-icon">{{ t.icon }}</span>
        <span class="tab-label">{{ t.label }}</span>
      </button>
    </div>

    <!-- 商品网格 -->
    <div class="shop-grid">
      <div
        v-for="item in filtered"
        :key="item.id"
        class="item-card panel"
        :class="[`type-${item.type}`, { 'cant-afford': !canAfford(item.cost) }]"
      >
        <div class="item-icon">{{ item.icon }}</div>
        <div class="item-info">
          <div class="item-name">{{ item.name }}</div>
          <div class="item-desc">{{ item.description }}</div>
          <div class="item-cost">{{ costText(item.cost) }}</div>
        </div>
        <button
          class="buy-btn"
          :disabled="!canAfford(item.cost)"
          @click="buy(item)"
        >
          购买
        </button>
      </div>
    </div>

    <!-- 提示 -->
    <transition name="toast">
      <div
        v-if="toast"
        class="shop-toast"
        :class="`toast-${toast.type}`"
      >
        {{ toast.msg }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.shop-view {
  position: relative;
}

/* ============ 头部 ============ */
.shop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
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
.header-right {
  display: flex;
  gap: 14px;
}
.stat-box {
  padding: 10px 16px;
  background: var(--color-panel-light);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  min-width: 140px;
}
.stat-label {
  font-size: 11px;
  color: var(--color-muted);
  margin-bottom: 4px;
  letter-spacing: 1px;
}
.stat-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}
.value-num {
  font-size: 22px;
  color: var(--color-gold);
  font-family: var(--font-display);
}
.value-tag {
  padding: 1px 6px;
  background: var(--gradient-purple);
  color: #fff;
  font-size: 10px;
  border-radius: 8px;
}
.stat-value.small {
  font-size: 12px;
  color: var(--color-text);
  gap: 10px;
}

/* ============ Tabs ============ */
.shop-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  padding: 6px;
  background: var(--color-panel);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  width: fit-content;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}
.tab-btn:hover { color: var(--color-text-bright); background: var(--color-panel-light); }
.tab-btn.active {
  background: var(--gradient-gold);
  color: #1a0f2e;
  box-shadow: 0 0 12px var(--color-ssr-glow);
}
.tab-icon { font-size: 14px; }

/* ============ 商品网格 ============ */
.shop-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
@media (max-width: 1000px) { .shop-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px)  { .shop-grid { grid-template-columns: 1fr; } }

.item-card {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 14px;
  padding: 14px 16px;
  align-items: center;
  transition: transform 0.2s, border-color 0.2s;
}
.item-card:hover { transform: translateY(-2px); border-color: var(--color-border-strong); }
.item-card.type-currency { border-left: 3px solid var(--color-r); }
.item-card.type-idle     { border-left: 3px solid var(--color-purple); }
.item-card.type-special  { border-left: 3px solid var(--color-pink); }
.item-card.cant-afford { opacity: 0.55; }
.item-card.cant-afford .buy-btn { background: var(--color-panel-light); color: var(--color-dim); box-shadow: none; cursor: not-allowed; }

.item-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  background: var(--color-panel-light);
  display: grid;
  place-items: center;
  font-size: 36px;
  box-shadow: inset 0 0 0 1px var(--color-border-soft);
}
.item-info { min-width: 0; }
.item-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-bright);
  margin-bottom: 2px;
}
.item-desc {
  font-size: 12px;
  color: var(--color-muted);
  margin-bottom: 6px;
  line-height: 1.4;
}
.item-cost {
  font-size: 12px;
  color: var(--color-gold);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.buy-btn {
  padding: 8px 18px;
  background: var(--gradient-gold);
  color: #1a0f2e;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 1px;
  box-shadow: 0 0 8px var(--color-ssr-glow);
  transition: transform 0.15s, box-shadow 0.15s;
  white-space: nowrap;
}
.buy-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 0 14px var(--color-ssr);
}
.buy-btn:active:not(:disabled) { transform: scale(0.97); }

/* ============ Toast ============ */
.shop-toast {
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
  box-shadow: 0 8px 24px rgba(74, 175, 90, 0.45);
}
.toast-error {
  background: linear-gradient(135deg, #7a2a2a, #af4a4a);
  color: #fff;
  box-shadow: 0 8px 24px rgba(175, 74, 74, 0.45);
}
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
.toast-leave-to   { opacity: 0; transform: translateX(-50%) translateY(-12px); }
</style>
