import type { Banner } from '@/types'

/**
 * 卡池示例数据。
 * 默认第一个卡池为「星穹之主 · 艾莉娅 限时 UP」，与规划文档 7.2 一致。
 */
export const banners: Banner[] = [
  {
    id: 'banner_001',
    name: '星穹之主 · 艾莉娅 限时 UP',
    type: 'limited-character',
    cover: '/banners/aliya-banner.png',
    startTime: '2026-06-01 00:00:00',
    endTime: '2026-08-01 00:00:00',
    upCharacterIds: ['char_001', 'char_002'],
    rates: {
      SSR: 0.02,
      SR: 0.12,
      R: 0.86,
    },
  },
  {
    id: 'banner_002',
    name: '绯焰魔女 · 伊芙琳 限时 UP',
    type: 'limited-character',
    cover: '/banners/ifeilin-banner.png',
    startTime: '2026-06-15 00:00:00',
    endTime: '2026-08-15 00:00:00',
    upCharacterIds: ['char_003'],
    rates: {
      SSR: 0.02,
      SR: 0.12,
      R: 0.86,
    },
  },
  {
    id: 'banner_003',
    name: '常驻召唤',
    type: 'permanent',
    cover: '/banners/permanent-banner.png',
    upCharacterIds: [],
    rates: {
      SSR: 0.02,
      SR: 0.12,
      R: 0.86,
    },
  },
]

/** 默认选中的卡池 ID */
export const DEFAULT_BANNER_ID = 'banner_001'
