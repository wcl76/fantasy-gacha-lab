import type { GameEvent } from '@/types'

/**
 * 活动列表 —— 限时活动，到期后自动隐藏
 * 截止时间基于当前日期动态计算（启动后 +N 天）
 */
function isoOffsetDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

export const gameEvents: GameEvent[] = [
  {
    id: 'event_first_login',
    name: '新人欢迎礼',
    description: '首次登录即可领取 2000 宝石 + 500 金币，欢迎来到幻想召唤研究所！',
    icon: '🎁',
    type: 'login',
    reward: { gem: 2000, gold: 500 },
    endTime: isoOffsetDays(30),
    oneTime: true,
  },
  {
    id: 'event_discount_50',
    name: '半价召唤祭',
    description: '活动期间单抽 80 / 十连 800 宝石，限时 7 天',
    icon: '💸',
    type: 'discount',
    discountFactor: 0.5,
    endTime: isoOffsetDays(7),
  },
  {
    id: 'event_double_idle',
    name: '双倍挂机节',
    description: '活动期间挂机收益 ×2，让星辰之力快速积蓄',
    icon: '✨',
    type: 'double',
    doubleReward: true,
    endTime: isoOffsetDays(14),
  },
  {
    id: 'event_free_ticket',
    name: '免费十连券',
    description: '每天登录送 1 张免费十连券，最多领取 3 张',
    icon: '🎟️',
    type: 'free',
    reward: { gem: 1600 },
    endTime: isoOffsetDays(7),
  },
]
