/**
 * 通用格式化工具
 */

/** 数字加千分位 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

/** 百分比 0.0225 -> 2.25% */
export function formatPercent(ratio: number, digits = 2): string {
  return `${(ratio * 100).toFixed(digits)}%`
}

/** ISO 时间 -> YYYY-MM-DD HH:mm:ss */
export function formatTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 中文元素名 */
export const ELEMENT_NAME_CN: Record<string, string> = {
  light: '光辉',
  dark: '暗影',
  fire: '烈焰',
  ice: '寒霜',
  thunder: '雷霆',
  nature: '自然',
}

/** 中文职业名 */
export const ROLE_NAME_CN: Record<string, string> = {
  attack: '攻击',
  defense: '防御',
  support: '辅助',
  heal: '治疗',
  control: '控制',
}

/** 中文稀有度 */
export const RARITY_NAME_CN: Record<string, string> = {
  SSR: 'SSR',
  SR: 'SR',
  R: 'R',
}
