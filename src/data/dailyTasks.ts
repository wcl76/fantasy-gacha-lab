import type { DailyTask } from '@/types'

/**
 * 每日任务列表 —— 每天 0 点自动重置进度
 */
export const dailyTasks: DailyTask[] = [
  {
    id: 'task_draw_10',
    name: '进行 1 次十连抽',
    description: '召唤 10 次即可完成',
    reward: { gem: 100 },
    target: 1,
    kind: 'draw',
    icon: '🎰',
  },
  {
    id: 'task_collect_new',
    name: '收集 1 个新角色',
    description: '首次获得任意角色',
    reward: { pinkCrystal: 20 },
    target: 1,
    kind: 'collect',
    icon: '✨',
  },
  {
    id: 'task_browse_collection',
    name: '浏览图鉴',
    description: '进入图鉴页面即可',
    reward: { gem: 50 },
    target: 1,
    kind: 'browse',
    icon: '📖',
  },
  {
    id: 'task_spend_500',
    name: '商店消费 500 金币',
    description: '在商店购买任意商品',
    reward: { pinkCrystal: 30 },
    target: 500,
    kind: 'spend',
    icon: '🛍️',
  },
  {
    id: 'task_idle_60',
    name: '挂机收益累积 60 分钟',
    description: '让角色们在召唤所积蓄力量',
    reward: { gem: 200 },
    target: 60,
    kind: 'idle',
    icon: '⏱️',
  },
]
