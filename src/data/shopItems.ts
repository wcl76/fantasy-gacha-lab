import type { ShopItem } from '@/types'

/**
 * 商店商品数据
 * - currency: 直接给货币（碎片箱、抽卡券等）
 * - idle: 提升挂机倍率
 * - special: 特殊商品（重置保底等）
 */
export const shopItems: ShopItem[] = [
  {
    id: 'item_gem_small',
    name: '宝石袋 (小)',
    description: '立刻获得 1000 宝石',
    icon: '💎',
    cost: { gold: 200 },
    reward: { gem: 1000 },
    type: 'currency',
  },
  {
    id: 'item_gem_large',
    name: '宝石箱 (大)',
    description: '立刻获得 5000 宝石',
    icon: '💎',
    cost: { gold: 800 },
    reward: { gem: 5000 },
    type: 'currency',
  },
  {
    id: 'item_pink_small',
    name: '粉晶袋',
    description: '立刻获得 500 粉晶',
    icon: '💗',
    cost: { gold: 300 },
    reward: { pinkCrystal: 500 },
    type: 'currency',
  },
  {
    id: 'item_gold_small',
    name: '金币袋',
    description: '立刻获得 2000 金币',
    icon: '🪙',
    cost: { gem: 200 },
    reward: { gold: 2000 },
    type: 'currency',
  },
  {
    id: 'item_idle_boost',
    name: '挂机加速器',
    description: '永久提升挂机倍率 +0.5x',
    icon: '⚡',
    cost: { gold: 500 },
    effect: { idleBoost: 0.5 },
    type: 'idle',
  },
  {
    id: 'item_idle_boost_mega',
    name: '挂机增幅核心',
    description: '永久提升挂机倍率 +1.0x',
    icon: '⚡',
    cost: { gold: 2000 },
    effect: { idleBoost: 1.0 },
    type: 'idle',
  },
  {
    id: 'item_special_ticket',
    name: '限定抽卡券',
    description: '立刻获得 800 宝石（折合半价十连）',
    icon: '🎟️',
    cost: { pinkCrystal: 200 },
    reward: { gem: 800 },
    type: 'special',
  },
]

/** 限制最大挂机倍率（防止溢出） */
export const MAX_IDLE_MULTIPLIER = 10
