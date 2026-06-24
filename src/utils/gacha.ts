/**
 * 抽卡核心算法 —— 严格遵循规划文档 9. 核心抽卡逻辑
 * - 90 抽保底（pityCount 89 时下一次必出 SSR）
 * - SSR 后保底计数重置
 * - 十连抽至少 1 个 SR 或以上
 * - 抽到 SSR/SR/R 后调用回调更新 pity
 */

import type { Banner, Character, GachaItem, Rarity } from '@/types'

/** 基础概率（与规划文档一致） */
export const BASE_RATES = {
  SSR: 0.02,
  SR: 0.12,
  R: 0.86,
} as const

/** 90 抽保底（pity 达到 89 时下一次必出） */
export const PITY_LIMIT = 90
export const PITY_HARD_TRIGGER = 89

/** 根据保底计数判定本次稀有度 */
function rollRarity(pityCount: number): Rarity {
  // 90 抽保底：上一抽 pityCount=89 时本次必出
  if (pityCount >= PITY_HARD_TRIGGER) {
    return 'SSR'
  }

  const random = Math.random()
  if (random < BASE_RATES.SSR) return 'SSR'
  if (random < BASE_RATES.SSR + BASE_RATES.SR) return 'SR'
  return 'R'
}

/** 从指定稀有度的角色池中随机抽一个；UP 角色有加权 */
function pickCharacter(
  pool: Character[],
  rarity: Rarity,
  banner: Banner,
): Character {
  const candidates = pool.filter(c => c.rarity === rarity)
  if (candidates.length === 0) {
    // 兜底：返回第一个角色（极端情况下）
    return pool[0]!
  }

  // UP 加权：banner.upCharacterIds 中的角色获得额外权重
  const upIds = new Set(banner.upCharacterIds)
  const upChars = candidates.filter(c => upIds.has(c.id))
  const normalChars = candidates.filter(c => !upIds.has(c.id))

  if (rarity === 'SSR' && upChars.length > 0) {
    // SSR 50% 概率是 UP 角色
    if (Math.random() < 0.5) {
      return upChars[Math.floor(Math.random() * upChars.length)]!
    }
  }

  if (rarity === 'SR' && upChars.length > 0) {
    // SR 30% 概率是 UP 角色
    if (Math.random() < 0.3) {
      return upChars[Math.floor(Math.random() * upChars.length)]!
    }
  }

  // 普通抽取
  const list = normalChars.length > 0 ? normalChars : candidates
  return list[Math.floor(Math.random() * list.length)]!
}

/** 单抽 */
export function drawOne(
  pool: Character[],
  banner: Banner,
  pityCount: number,
  collection: Record<string, number>,
): { result: GachaItem; newPity: number } {
  const rarity = rollRarity(pityCount)
  const char = pickCharacter(pool, rarity, banner)
  const isNew = !(collection[char.id] && collection[char.id] > 0)
  const isUp = banner.upCharacterIds.includes(char.id)

  const result: GachaItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    characterId: char.id,
    rarity,
    isNew,
    isUp,
  }

  // SSR 重置保底，其他递增
  const newPity = rarity === 'SSR' ? 0 : pityCount + 1

  return { result, newPity }
}

/** 十连抽：保底至少 1 个 SR 或以上 */
export function drawTen(
  pool: Character[],
  banner: Banner,
  pityCount: number,
  collection: Record<string, number>,
): { results: GachaItem[]; newPity: number } {
  const results: GachaItem[] = []
  let pity = pityCount

  for (let i = 0; i < 10; i++) {
    const { result, newPity } = drawOne(pool, banner, pity, collection)
    results.push(result)
    pity = newPity
  }

  // 十连保底：至少 1 个 SR 或以上
  const hasSrOrAbove = results.some(r => r.rarity === 'SSR' || r.rarity === 'SR')
  if (!hasSrOrAbove) {
    // 把最后一张强制替换为 SR（直接 roll SR rarity，不走 pity 路径）
    const srCandidates = pool.filter(c => c.rarity === 'SR')
    let srChar: Character
    if (srCandidates.length > 0) {
      // 50% 概率是 UP（如果有）
      const upIds = new Set(banner.upCharacterIds)
      const upSr = srCandidates.filter(c => upIds.has(c.id))
      if (upSr.length > 0 && Math.random() < 0.5) {
        srChar = upSr[Math.floor(Math.random() * upSr.length)]!
      } else {
        srChar = srCandidates[Math.floor(Math.random() * srCandidates.length)]!
      }
    } else {
      // 没有 SR 角色（极端情况），fallback 到 SSR
      const ssrCandidates = pool.filter(c => c.rarity === 'SSR')
      srChar = ssrCandidates[Math.floor(Math.random() * ssrCandidates.length)] ?? pool[0]!
    }
    const srResult: GachaItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      characterId: srChar.id,
      rarity: 'SR',
      isNew: !(collection[srChar.id] && collection[srChar.id] > 0),
      isUp: banner.upCharacterIds.includes(srChar.id),
    }
    results[results.length - 1] = srResult
  }

  return { results, newPity: pity }
}
