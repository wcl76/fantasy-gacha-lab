import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  Banner,
  Character,
  Currency,
  DrawRecord,
  GameEvent,
  PityState,
  Settings,
} from '@/types'
import { STORAGE_KEYS } from '@/types'
import { banners as bannerData, DEFAULT_BANNER_ID } from '@/data/banners'
import { characters as characterData } from '@/data/characters'
import { dailyTasks } from '@/data/dailyTasks'
import { gameEvents } from '@/data/gameEvents'
import { drawOne, drawTen } from '@/utils/gacha'
import { loadJSON, saveJSON } from '@/utils/storage'

/** 每种货币每分钟的挂机产出（基础值；可被 idleMultiplier 放大） */
const BASE_IDLE_RATES = {
  gem: 1200,        // 💎 1200 颗/分钟（即每秒 20 颗，方便观察）
  pinkCrystal: 600,  // 💗 600 颗/分钟（每秒 10 颗）
  gold: 2400,        // 🪙 2400 颗/分钟（每秒 40 颗）
} as const

/** 离线累积上限（毫秒） */
const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000   // 8 小时

/**
 * 抽卡主 store —— 整合所有抽卡相关状态、localStorage 持久化、抽卡操作、挂机货币
 */
export const useGachaStore = defineStore('gacha', () => {
  // ============== 静态数据 ==============
  const characters = ref<Character[]>(characterData)
  const banners = ref<Banner[]>(bannerData)

  // ============== 用户状态（持久化） ==============
  const currency = ref<Currency>(
    loadJSON<Currency>(STORAGE_KEYS.CURRENCY, { gem: 24850, pinkCrystal: 3420, gold: 128 }),
  )
  const collection = ref<Record<string, number>>(
    loadJSON<Record<string, number>>(STORAGE_KEYS.COLLECTION, {}),
  )
  const history = ref<DrawRecord[]>(
    loadJSON<DrawRecord[]>(STORAGE_KEYS.HISTORY, []),
  )
  const pity = ref<PityState>(
    loadJSON<PityState>(STORAGE_KEYS.PITY, {}),
  )
  const settings = ref<Settings>(
    loadJSON<Settings>(STORAGE_KEYS.SETTINGS, {
      animationEnabled: true,
      soundEnabled: false,
      skipAnimation: false,
    }),
  )
  const lastResult = ref<DrawRecord | null>(
    loadJSON<DrawRecord | null>(STORAGE_KEYS.LAST_RESULT, null),
  )
  /** 上次离线 tick 时间戳（用于离线补发） */
  const lastTickAt = ref<number>(
    loadJSON<number>(STORAGE_KEYS.LAST_TICK_AT, Date.now()),
  )
  /** 挂机升级倍率（玩家购买升级后增加） */
  const idleMultiplier = ref<number>(
    loadJSON<number>(STORAGE_KEYS.IDLE_MULTIPLIER, 1),
  )
  /** 每日任务上次重置日期 (YYYY-MM-DD) */
  const dailyLastReset = ref<string>(
    loadJSON<string>(STORAGE_KEYS.DAILY_LAST_RESET, ''),
  )
  /** 今日已领取奖励的任务 ID 列表 */
  const dailyClaimed = ref<string[]>(
    loadJSON<string[]>(STORAGE_KEYS.DAILY_CLAIMED, []),
  )
  /** 任务进度（按 kind 累计：draw/collect/spend/idle） */
  const taskProgress = ref<Record<string, number>>({})
  /** 上次免费一抽的日期 (YYYY-MM-DD)；'free' 类型活动也会用 */
  const freeDrawDate = ref<string>(
    loadJSON<string>(STORAGE_KEYS.FREE_DRAW_DATE, ''),
  )
  /** 活动奖励已领取 ID 列表（oneTime 活动） */
  const eventsClaimed = ref<string[]>(
    loadJSON<string[]>(STORAGE_KEYS.EVENTS_CLAIMED, []),
  )

  // ============== 当前选中卡池 ==============
  const currentBannerId = ref<string>(DEFAULT_BANNER_ID)
  const currentBanner = computed<Banner>(
    () => banners.value.find(b => b.id === currentBannerId.value) || banners.value[0]!,
  )
  const currentPity = computed(() => pity.value[currentBannerId.value] ?? 0)

  // ============== 统计计算 ==============
  const totalDraws = computed(() =>
    history.value.reduce((sum, r) => sum + r.results.length, 0),
  )
  const ssrCount = computed(() =>
    history.value.reduce(
      (sum, r) => sum + r.results.filter(x => x.rarity === 'SSR').length,
      0),
  )
  const ssrRate = computed(() =>
    totalDraws.value > 0 ? ssrCount.value / totalDraws.value : 0,
  )
  const avgPerSSR = computed(() =>
    ssrCount.value > 0 ? totalDraws.value / ssrCount.value : 0,
  )
  /** 已收集角色数（去重） */
  const collectedCount = computed(() =>
    Object.values(collection.value).filter(v => v > 0).length,
  )

  // ============== 操作 ==============
  function setCurrentBanner(bannerId: string) {
    if (banners.value.some(b => b.id === bannerId)) {
      currentBannerId.value = bannerId
    }
  }

  /** 单抽（自动应用活动折扣） */
  function performSingleDraw(): DrawRecord {
    const banner = currentBanner.value
    const pityCount = pity.value[banner.id] ?? 0
    const { result, newPity } = drawOne(characters.value, banner, pityCount, collection.value)

    pity.value[banner.id] = newPity
    collection.value[result.characterId] = (collection.value[result.characterId] ?? 0) + 1
    // 扣货币（应用活动折扣）
    const cost = Math.floor(160 * activeDiscount.value)
    currency.value.gem = Math.max(0, currency.value.gem - cost)
    // 任务进度：抽卡 +1；首次获得（isNew）+1
    progressTask('task_draw_10', 1)
    if (result.isNew) progressTask('task_collect_new', 1)

    const record: DrawRecord = {
      id: `rec_${Date.now()}`,
      time: new Date().toISOString(),
      bannerId: banner.id,
      bannerName: banner.name,
      drawType: 'single',
      results: [result],
    }
    history.value.unshift(record)
    lastResult.value = record
    persist()
    return record
  }

  /** 十连抽（自动应用活动折扣） */
  function performTenDraw(): DrawRecord {
    const banner = currentBanner.value
    const pityCount = pity.value[banner.id] ?? 0
    const { results, newPity } = drawTen(characters.value, banner, pityCount, collection.value)

    pity.value[banner.id] = newPity
    results.forEach(r => {
      collection.value[r.characterId] = (collection.value[r.characterId] ?? 0) + 1
    })
    // 扣货币（应用活动折扣）
    const cost = Math.floor(1600 * activeDiscount.value)
    currency.value.gem = Math.max(0, currency.value.gem - cost)
    // 任务进度：抽卡 +1（计为一次十连动作）；新角色 +n
    progressTask('task_draw_10', 1)
    results.forEach(r => { if (r.isNew) progressTask('task_collect_new', 1) })

    const record: DrawRecord = {
      id: `rec_${Date.now()}`,
      time: new Date().toISOString(),
      bannerId: banner.id,
      bannerName: banner.name,
      drawType: 'ten',
      results,
    }
    history.value.unshift(record)
    lastResult.value = record
    persist()
    return record
  }

  /** 清除历史 */
  function clearHistory() {
    history.value = []
    lastResult.value = null
    persist()
  }

  /** 重置整个存档 */
  function resetAll() {
    currency.value = { gem: 24850, pinkCrystal: 3420, gold: 128 }
    collection.value = {}
    history.value = []
    pity.value = {}
    lastResult.value = null
    lastTickAt.value = Date.now()
    idleMultiplier.value = 1
    _resetIdleAccumulator()
    persist()
  }

  // ============== 货币操作 ==============
  /** 增加货币（用于挂机产出、商店购买返利、任务奖励） */
  function addCurrency(c: Partial<Currency>) {
    if (c.gem) currency.value.gem += c.gem
    if (c.pinkCrystal) currency.value.pinkCrystal += c.pinkCrystal
    if (c.gold) currency.value.gold += c.gold
  }

  /** 消费货币（返回是否成功） */
  function spend(c: Partial<Currency>): boolean {
    if (c.gem && currency.value.gem < c.gem) return false
    if (c.pinkCrystal && currency.value.pinkCrystal < c.pinkCrystal) return false
    if (c.gold && currency.value.gold < c.gold) return false
    if (c.gem) currency.value.gem -= c.gem
    if (c.pinkCrystal) currency.value.pinkCrystal -= c.pinkCrystal
    if (c.gold) currency.value.gold -= c.gold
    persist()
    return true
  }

  // ============== 活动系统 ==============
  /** 当前生效的活动（未过期） */
  const activeEvents = computed<GameEvent[]>(() => {
    const now = Date.now()
    return gameEvents.filter(e => new Date(e.endTime).getTime() > now)
  })

  /** 当前活动的折扣系数（用于抽卡：0.5 = 五折）；多个折扣取最低 */
  const activeDiscount = computed(() => {
    const discounts = activeEvents.value
      .filter(e => e.type === 'discount' && e.discountFactor !== undefined)
      .map(e => e.discountFactor!)
    return discounts.length > 0 ? Math.min(...discounts) : 1
  })

  /** 当前是否双倍挂机 */
  const idleDouble = computed(() =>
    activeEvents.value.some(e => e.type === 'double' && e.doubleReward),
  )

  /** 实际挂机倍率（受双倍活动影响） */
  const effectiveIdleMultiplier = computed(() =>
    idleMultiplier.value * (idleDouble.value ? 2 : 1),
  )

  /** 计算单抽实际消耗（受折扣影响） */
  const singleDrawCost = computed(() => Math.floor(160 * activeDiscount.value))
  /** 计算十连抽实际消耗 */
  const tenDrawCost = computed(() => Math.floor(1600 * activeDiscount.value))

  /** 活动是否已领取 */
  function isEventClaimed(eventId: string): boolean {
    return eventsClaimed.value.includes(eventId)
  }
  /** 领取活动奖励 */
  function claimEventReward(eventId: string): { ok: boolean; msg: string } {
    const event = gameEvents.find(e => e.id === eventId)
    if (!event) return { ok: false, msg: '活动不存在' }
    if (!activeEvents.value.some(e => e.id === eventId)) return { ok: false, msg: '活动已结束' }
    if (isEventClaimed(eventId)) return { ok: false, msg: '已领取过' }
    if (event.reward) addCurrency(event.reward)
    eventsClaimed.value.push(eventId)
    persist()
    return { ok: true, msg: `✓ 领取成功：${event.name}` }
  }

  // ============== 每日任务系统 ==============
  /** 当前日期 YYYY-MM-DD */
  function todayStr(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  /** 检查并重置每日任务（跨天） */
  function checkDailyReset() {
    const today = todayStr()
    if (dailyLastReset.value !== today) {
      dailyClaimed.value = []
      taskProgress.value = {}
      dailyLastReset.value = today
      persist()
    }
  }

  /** 任务进度：taskId -> progress（0..target） */
  const taskProgressView = computed<Record<string, { current: number; target: number; claimed: boolean; done: boolean }>>(() => {
    const view: Record<string, { current: number; target: number; claimed: boolean; done: boolean }> = {}
    for (const task of dailyTasks) {
      const current = taskProgress.value[task.id] ?? 0
      const claimed = dailyClaimed.value.includes(task.id)
      view[task.id] = {
        current,
        target: task.target,
        claimed,
        done: current >= task.target,
      }
    }
    return view
  })

  /** 推进任务进度 */
  function progressTask(taskId: string, amount = 1) {
    const task = dailyTasks.find(t => t.id === taskId)
    if (!task) return
    const current = taskProgress.value[taskId] ?? 0
    taskProgress.value[taskId] = Math.min(current + amount, task.target)
    persist()
  }

  /** 领取任务奖励 */
  function claimTaskReward(taskId: string): { ok: boolean; msg: string } {
    const task = dailyTasks.find(t => t.id === taskId)
    if (!task) return { ok: false, msg: '任务不存在' }
    if (dailyClaimed.value.includes(taskId)) return { ok: false, msg: '已领取过' }
    const current = taskProgress.value[taskId] ?? 0
    if (current < task.target) return { ok: false, msg: '任务未完成' }
    addCurrency(task.reward)
    dailyClaimed.value.push(taskId)
    persist()
    return { ok: true, msg: `✓ 领取成功：${task.name}` }
  }

  // ============== 免费一抽 ==============
  /** 今日是否还有免费一抽额度（每天 1 次；'free' 活动期间额外 +1） */
  const freeDrawAvailable = computed(() => {
    checkDailyReset()
    const today = todayStr()
    const baseAvailable = freeDrawDate.value !== today
    // 活动期间每获得一张额外券 +1
    const extraTickets = eventsClaimed.value.filter(id => {
      const e = gameEvents.find(x => x.id === id)
      return e?.type === 'free' && e.endTime && new Date(e.endTime) > new Date()
    }).length
    // 简单模型：基础 1 + 已领取的 free 活动数
    return { baseAvailable, extraAvailable: extraTickets, today }
  })

  /** 执行免费一抽（不扣货币） */
  function performFreeDraw(): DrawRecord | null {
    const today = todayStr()
    if (freeDrawDate.value === today) return null   // 今日基础已用
    const record = performSingleDraw()              // 内部已扣 gem；需退还
    currency.value.gem += singleDrawCost.value     // 退还（用实际消耗，避免双倍活动后扣多了）
    // 任务进度 +1（draw）
    progressTask('task_draw_10', 1)
    freeDrawDate.value = today
    persist()
    return record
  }

  // ============== 挂机引擎 ==============
  /** 每分钟产出（基础值 × 倍率；包含双倍活动） */
  const idleRates = computed<Currency>(() => ({
    gem: Math.floor(BASE_IDLE_RATES.gem * effectiveIdleMultiplier.value),
    pinkCrystal: Math.floor(BASE_IDLE_RATES.pinkCrystal * effectiveIdleMultiplier.value),
    gold: Math.floor(BASE_IDLE_RATES.gold * effectiveIdleMultiplier.value),
  }))

  /**
   * 推进 tick：按流逝的毫秒数结算挂机产出
   * 会在首次调用时处理离线累积（lastTickAt 距今的差值，封顶 8 小时）
   * 每 1 秒 tick 一次；每分钟用浮点累加器结算（保留小数）
   */
  function tick() {
    const now = Date.now()
    const elapsedMs = Math.max(0, now - lastTickAt.value)
    if (elapsedMs === 0) return
    // 离线累积封顶（最多累积 8 小时）
    const cappedMs = Math.min(elapsedMs, OFFLINE_CAP_MS)
    // 浮点累加分钟数
    fractionalIdleMinutes.value += cappedMs / 60000
    lastTickAt.value = now
    // 当累积满 1 分钟时结算；不足 1 分钟的等下次
    if (fractionalIdleMinutes.value >= 1) {
      const wholeMinutes = Math.floor(fractionalIdleMinutes.value)
      fractionalIdleMinutes.value -= wholeMinutes
      // 使用 effectiveIdleMultiplier（受双倍活动影响）
      const m = effectiveIdleMultiplier.value
      addCurrency({
        gem: Math.floor(BASE_IDLE_RATES.gem * m * wholeMinutes),
        pinkCrystal: Math.floor(BASE_IDLE_RATES.pinkCrystal * m * wholeMinutes),
        gold: Math.floor(BASE_IDLE_RATES.gold * m * wholeMinutes),
      })
      // 任务进度：挂机分钟数
      progressTask('task_idle_60', wholeMinutes)
      persist()
    }
  }

  /** 未结算的挂机分钟数（浮点，用于跨 tick 累积） */
  const fractionalIdleMinutes = ref<number>(0)

  /** 升级挂机倍率（每次 +0.5 倍，消耗金币 500 * 当前倍率） */
  function upgradeIdle(): { ok: boolean; cost: number } {
    const cost = Math.floor(500 * idleMultiplier.value)
    if (currency.value.gold < cost) return { ok: false, cost }
    currency.value.gold -= cost
    idleMultiplier.value = Math.round((idleMultiplier.value + 0.5) * 10) / 10
    persist()
    return { ok: true, cost }
  }

  /** 直接设置挂机倍率（商店商品使用，参数为绝对值） */
  function setIdleMultiplier(value: number) {
    idleMultiplier.value = Math.round(value * 10) / 10
    persist()
  }

  /** 挂机升级当前等级（0/1/2/3...） */
  const idleLevel = computed(() => Math.round((idleMultiplier.value - 1) / 0.5))

  /** 重置挂机累加器（用于 resetAll） */
  function _resetIdleAccumulator() { fractionalIdleMinutes.value = 0 }

  // ============== 持久化 ==============
  function persist() {
    saveJSON(STORAGE_KEYS.CURRENCY, currency.value)
    saveJSON(STORAGE_KEYS.COLLECTION, collection.value)
    saveJSON(STORAGE_KEYS.HISTORY, history.value)
    saveJSON(STORAGE_KEYS.PITY, pity.value)
    saveJSON(STORAGE_KEYS.SETTINGS, settings.value)
    saveJSON(STORAGE_KEYS.LAST_RESULT, lastResult.value)
    saveJSON(STORAGE_KEYS.LAST_TICK_AT, lastTickAt.value)
    saveJSON(STORAGE_KEYS.IDLE_MULTIPLIER, idleMultiplier.value)
    saveJSON(STORAGE_KEYS.DAILY_LAST_RESET, dailyLastReset.value)
    saveJSON(STORAGE_KEYS.DAILY_CLAIMED, dailyClaimed.value)
    saveJSON(STORAGE_KEYS.FREE_DRAW_DATE, freeDrawDate.value)
    saveJSON(STORAGE_KEYS.EVENTS_CLAIMED, eventsClaimed.value)
  }

  return {
    // 静态
    characters,
    banners,
    // 状态
    currency,
    collection,
    history,
    pity,
    settings,
    lastResult,
    lastTickAt,
    idleMultiplier,
    currentBannerId,
    currentBanner,
    currentPity,
    // 计算
    totalDraws,
    ssrCount,
    ssrRate,
    avgPerSSR,
    collectedCount,
    idleRates,
    idleLevel,
    activeEvents,
    activeDiscount,
    idleDouble,
    effectiveIdleMultiplier,
    singleDrawCost,
    tenDrawCost,
    freeDrawAvailable,
    taskProgressView,
    // 操作
    setCurrentBanner,
    performSingleDraw,
    performTenDraw,
    performFreeDraw,
    clearHistory,
    resetAll,
    addCurrency,
    spend,
    tick,
    upgradeIdle,
    setIdleMultiplier,
    isEventClaimed,
    claimEventReward,
    progressTask,
    claimTaskReward,
    checkDailyReset,
    persist,
  }
})
