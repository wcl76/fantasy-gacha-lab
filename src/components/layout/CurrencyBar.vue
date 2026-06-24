<script setup lang="ts">
/**
 * CurrencyBar —— 货币栏（顶部右侧 + 头像 + 等级）
 * 货币从 gacha store 读取，模拟「+」按钮的 click 行为
 */
import { useGachaStore } from '@/stores/gachaStore'
import { formatNumber } from '@/utils/format'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const store = useGachaStore()
const router = useRouter()

function goProfile() {
  router.push({ name: 'profile' })
}

interface CurrencyItem {
  type: 'gem' | 'pinkCrystal' | 'gold'
  label: string
  icon: string
  color: string
}

const items: CurrencyItem[] = [
  { type: 'gem',         label: '蓝宝石', icon: '💎', color: '#4da3ff' },
  { type: 'pinkCrystal', label: '粉晶',   icon: '💗', color: '#ff7ad9' },
  { type: 'gold',        label: '金币',   icon: '🪙', color: '#f6c66b' },
]

const values = computed(() => ({
  gem: store.currency.gem,
  pinkCrystal: store.currency.pinkCrystal,
  gold: store.currency.gold,
}))

function onAdd(type: CurrencyItem['type']) {
  // MVP: 弹个简单提示，后续可接入商店页
  alert(`+ 按钮被点击（${type}），后续可跳转到商店页`)
}
</script>

<template>
  <div class="currency-bar">
    <div
      v-for="item in items"
      :key="item.type"
      class="currency-pill"
      :class="`currency-pill-${item.type}`"
      :style="{ '--pill-color': item.color }"
    >
      <span class="currency-icon">{{ item.icon }}</span>
      <span class="currency-value">{{ formatNumber(values[item.type]) }}</span>
      <button class="currency-add" @click="onAdd(item.type)" aria-label="增加">+</button>
    </div>

    <!-- 头像 + 等级 -->
    <div class="avatar" title="点击进入个人中心" @click="goProfile">
      <div class="avatar-img">🦄</div>
      <div class="avatar-level">Lv.68</div>
    </div>
  </div>
</template>

<style scoped>
.currency-bar {
  min-width: 0;
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
}

.currency-pill {
  min-width: 0;
  flex: 1 1 120px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px 6px 12px;
  background: var(--color-panel);
  border: 1px solid var(--color-border-soft);
  border-radius: 24px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  transition: border-color 0.2s;
}
.currency-pill:hover {
  border-color: var(--pill-color);
}
.currency-icon {
  font-size: 14px;
  filter: drop-shadow(0 0 4px var(--pill-color));
}
.currency-value {
  min-width: 0;
  max-width: 76px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.currency-add {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--pill-color);
  color: #0a0a1a;
  font-weight: 700;
  font-size: 14px;
  line-height: 1;
  display: grid;
  place-items: center;
  transition: transform 0.15s;
}
.currency-add:hover {
  transform: scale(1.15);
}

.avatar {
  flex: 0 0 44px;
  position: relative;
  width: 44px;
  height: 44px;
  margin-left: 6px;
  cursor: pointer;
  transition: transform 0.2s;
}
.avatar:hover { transform: scale(1.08); }
.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 30%, #ffe4a3 0%, #f6c66b 40%, #c89a3a 100%);
  display: grid;
  place-items: center;
  font-size: 24px;
  border: 2px solid var(--color-gold);
  box-shadow: 0 0 12px rgba(246, 198, 107, 0.4);
  overflow: hidden;
}
.avatar-level {
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-panel-deep);
  color: var(--color-gold);
  font-size: 10px;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 8px;
  border: 1px solid var(--color-gold);
  white-space: nowrap;
}

@media (max-width: 1500px) {
  .currency-bar {
    gap: 8px;
  }

  .currency-pill {
    flex-basis: 108px;
    padding: 6px 7px 6px 10px;
  }

  .currency-pill-gold {
    display: none;
  }

  .currency-value {
    max-width: 68px;
  }

  .avatar {
    margin-left: 2px;
  }
}

@media (max-width: 1180px) {
  .currency-pill {
    flex: 0 0 auto;
    padding: 6px;
  }

  .currency-value {
    display: none;
  }
}
</style>
