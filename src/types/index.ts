/**
 * 全局类型定义 —— 与规划文档 7. 数据结构设计 一致
 */

// ============== 基础枚举 ==============
export type Rarity = 'SSR' | 'SR' | 'R'

export type Element = 'light' | 'dark' | 'fire' | 'ice' | 'thunder' | 'nature'

export type Role = 'attack' | 'defense' | 'support' | 'heal' | 'control'

export type CharacterTheme =
  | 'starlight-order'
  | 'nightfall-court'
  | 'crimson-coven'
  | 'verdant-path'
  | 'storm-vanguard'
  | 'frost-tide'
  | 'novice-guard'
  | 'gu-reverend'

export type BannerType = 'limited-character' | 'limited-weapon' | 'permanent'

export type DrawType = 'single' | 'ten'

export type CurrencyType = 'gem' | 'pinkCrystal' | 'gold'

// ============== 角色 ==============
export interface Character {
  id: string
  name: string
  title: string
  rarity: Rarity
  element: Element
  role: Role
  theme: CharacterTheme
  image: string
  description: string
  isUp?: boolean
}

// ============== 卡池 ==============
export interface Banner {
  id: string
  name: string
  type: BannerType
  cover: string
  startTime?: string
  endTime?: string
  upCharacterIds: string[]
  rates: {
    SSR: number
    SR: number
    R: number
  }
}

// ============== 抽卡结果项 ==============
export interface GachaItem {
  id: string              // 抽卡实例 ID（一次抽卡中的唯一标识）
  characterId: string     // 关联的角色 ID
  rarity: Rarity
  isNew: boolean          // 是否首次获得
  isUp: boolean           // 是否 UP 角色
}

// ============== 抽卡记录 ==============
export interface DrawRecord {
  id: string
  time: string            // ISO 字符串
  bannerId: string
  bannerName: string
  drawType: DrawType
  results: GachaItem[]
}

// ============== 货币 ==============
export interface Currency {
  gem: number
  pinkCrystal: number
  gold: number
}

// ============== 保底计数 ==============
export interface PityState {
  [bannerId: string]: number  // 距离下次 SSR 保底还剩多少抽
}

// ============== 用户设置 ==============
export interface Settings {
  animationEnabled: boolean
  soundEnabled: boolean
  skipAnimation: boolean
}

// ============== localStorage key 常量 ==============
export const STORAGE_KEYS = {
  HISTORY: 'gacha_history',
  COLLECTION: 'gacha_collection',         // Record<characterId, count>
  PITY: 'gacha_pity',
  CURRENCY: 'gacha_currency',
  SETTINGS: 'gacha_settings',
  LAST_RESULT: 'gacha_last_result',
  LAST_TICK_AT: 'gacha_last_tick_at',     // 挂机引擎上次 tick 时间戳
  IDLE_MULTIPLIER: 'gacha_idle_multiplier', // 挂机升级倍率
  DAILY_LAST_RESET: 'gacha_daily_last_reset', // 每日任务上次重置日期
  DAILY_CLAIMED: 'gacha_daily_claimed',   // 今日已领取的任务 ID 列表
  FREE_DRAW_DATE: 'gacha_free_draw_date', // 上次免费一抽的日期
  EVENTS_CLAIMED: 'gacha_events_claimed', // 活动奖励已领取 ID 列表
} as const

// ============== 商品 / 商店类型 ==============
export interface ShopItem {
  id: string
  name: string
  description: string
  icon: string
  /** 价格（消耗金币；可叠加不同的 currency 字段表示不同货币） */
  cost: Partial<Currency>
  /** 购买后立即获得 */
  reward?: Partial<Currency>
  /** 购买后状态变化（amount 可叠加） */
  effect?: { idleBoost?: number }    // 加多少挂机倍率
  /** 类型标签 */
  type: 'currency' | 'idle' | 'special'
}

// ============== 每日任务 ==============
export type TaskKind = 'draw' | 'collect' | 'browse' | 'spend' | 'idle'

export interface DailyTask {
  id: string
  name: string
  description: string
  reward: Partial<Currency>
  /** 任务目标次数（draw 10 次 / collect 1 个新角色 / browse 1 个图鉴页 / spend 500 金币 / idle 60 分钟） */
  target: number
  /** 任务类型 */
  kind: TaskKind
  icon: string
}

export interface TaskProgress {
  /** 已完成次数 */
  progress: number
}

// ============== 活动 ==============
export interface GameEvent {
  id: string
  name: string
  description: string
  icon: string
  /** 活动类别 */
  type: 'discount' | 'double' | 'login' | 'free'
  /** 折扣活动：抽卡消耗 × 折扣系数 (0~1，0.5 = 五折) */
  discountFactor?: number
  /** 双倍活动：抽卡次数 × 2 */
  doubleReward?: boolean
  /** 登录/免费奖励：领取后获得 */
  reward?: Partial<Currency>
  /** 活动截止时间（ISO） */
  endTime: string
  /** 已领取过的玩家不可重复领 */
  oneTime?: boolean
}
