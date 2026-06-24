<script setup lang="ts">
/**
 * RecordsView —— 抽卡记录页
 * 严格按效果图：4 个统计卡 + 抽卡历史表格 + 分页 + 导出/清空
 */
import { computed, ref } from 'vue'
import { useGachaStore } from '@/stores/gachaStore'
import { charactersById } from '@/data/characters'
import { formatNumber, formatPercent, formatTime } from '@/utils/format'

const store = useGachaStore()

const bannerFilter = ref<string>('all')
const currentPage = ref(1)
const pageSize = 10

const filteredRecords = computed(() => {
  if (bannerFilter.value === 'all') return store.history
  return store.history.filter(r => r.bannerId === bannerFilter.value)
})

const totalPages = computed(() => Math.max(1, Math.ceil(rows.value.length / pageSize)))

// 重新计算时回到第一页
import { watch } from 'vue'
watch([bannerFilter, () => store.history.length], () => { currentPage.value = 1 })

// 表格行展开：把每条记录的 results 拍平为多行
interface HistoryRow {
  recordId: string
  recordTime: string
  bannerName: string
  drawNumber: number          // 这是该记录中的第几抽
  itemName: string
  rarity: 'SSR' | 'SR' | 'R'
  rarityClass: string
  drawType: 'single' | 'ten'
}

const rows = computed<HistoryRow[]>(() => {
  const out: HistoryRow[] = []
  filteredRecords.value.forEach((r, recIdx) => {
    r.results.forEach((item, idx) => {
      const ch = charactersById[item.characterId]
      out.push({
        recordId: r.id,
        recordTime: r.time,
        bannerName: r.bannerName,
        drawNumber: recIdx * 10 + idx + 1,
        itemName: ch?.title ? `${ch.name} · ${ch.title}` : item.characterId,
        rarity: item.rarity,
        rarityClass: `r-${item.rarity.toLowerCase()}`,
        drawType: r.drawType,
      })
    })
  })
  // 表格按时间倒序拍平
  return out
})

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return rows.value.slice(start, start + pageSize)
})

function exportCSV() {
  const header = ['时间', '卡池', '抽数', '道具', '稀有度', '类型']
  const lines = rows.value.map(r => [
    formatTime(r.recordTime),
    r.bannerName,
    r.drawNumber,
    r.itemName,
    r.rarity,
    r.drawType === 'single' ? '单抽' : '十连',
  ].join(','))
  const csv = '\uFEFF' + [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gacha-history-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function clearHistory() {
  if (confirm('确定要清空所有抽卡记录吗？此操作不可恢复。')) {
    store.clearHistory()
  }
}
</script>

<template>
  <div class="records-view">
    <div class="grid-main">
      <div class="page-header">
        <h2 class="page-title">记录 <span>RECORDS</span></h2>
      </div>

      <!-- 4 个统计卡 -->
      <div class="stat-cards">
        <div class="panel stat-card">
          <div class="stat-label">总召唤次数</div>
          <div class="stat-value">{{ formatNumber(store.totalDraws) }}</div>
        </div>
        <div class="panel stat-card highlight-ssr">
          <div class="stat-label">SSR 获得数</div>
          <div class="stat-value">{{ formatNumber(store.ssrCount) }}</div>
        </div>
        <div class="panel stat-card highlight-purple">
          <div class="stat-label">SSR 概率</div>
          <div class="stat-value">{{ formatPercent(store.ssrRate) }}</div>
        </div>
        <div class="panel stat-card highlight-gold">
          <div class="stat-label">平均每 SSR</div>
          <div class="stat-value">{{ store.avgPerSSR > 0 ? store.avgPerSSR.toFixed(2) : '—' }}</div>
        </div>
      </div>

      <!-- 抽卡历史 -->
      <div class="panel history-panel">
        <div class="history-header">
          <h3 class="history-title">抽卡历史 <span>DRAW HISTORY</span></h3>
          <div class="history-tools">
            <select v-model="bannerFilter" class="filter-select">
              <option value="all">全部卡池</option>
              <option v-for="b in store.banners" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
            <button class="tool-btn" @click="exportCSV">导出记录</button>
            <button class="tool-btn danger" @click="clearHistory">清空记录</button>
          </div>
        </div>

        <div v-if="rows.length === 0" class="empty">
          <div class="empty-icon">📜</div>
          <p>暂无抽卡记录</p>
          <router-link to="/summon" class="empty-link">前往召唤 →</router-link>
        </div>

        <table v-else class="history-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>卡池名称</th>
              <th>获得物品</th>
              <th>稀有度</th>
              <th>抽数</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in pagedRows" :key="idx">
              <td class="time-cell">{{ formatTime(row.recordTime) }}</td>
              <td>{{ row.bannerName }}</td>
              <td class="item-cell">
                <span class="rarity-dot" :class="row.rarityClass" />
                <span class="item-name" :class="row.rarityClass">{{ row.itemName }}</span>
                <span class="item-rarity" :class="row.rarityClass">{{ row.rarity }}</span>
              </td>
              <td><span class="rarity-pill" :class="row.rarityClass">{{ row.rarity }}</span></td>
              <td class="draw-num">第 {{ row.drawNumber }} 抽</td>
            </tr>
          </tbody>
        </table>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination">
          <span class="page-info">仅显示最近 500 条记录</span>
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹</button>
          <button
            v-for="p in totalPages"
            :key="p"
            class="page-num"
            :class="{ active: p === currentPage }"
            @click="currentPage = p"
          >{{ p }}</button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.records-view { width: 100%; }
.page-header { margin-bottom: 16px; }
.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-bright);
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.page-title span {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 2px;
}

/* 统计卡 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
@media (max-width: 800px) { .stat-cards { grid-template-columns: repeat(2, 1fr); } }
.stat-card {
  padding: 18px 20px;
  text-align: left;
  position: relative;
  overflow: hidden;
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--color-border);
}
.stat-card.highlight-ssr::before    { background: var(--color-ssr); box-shadow: 0 0 12px var(--color-ssr); }
.stat-card.highlight-purple::before { background: var(--color-purple); box-shadow: 0 0 12px var(--color-purple); }
.stat-card.highlight-gold::before   { background: var(--color-gold); box-shadow: 0 0 12px var(--color-gold); }
.stat-label { font-size: 12px; color: var(--color-muted); margin-bottom: 6px; }
.stat-value {
  font-size: 28px;
  font-weight: 800;
  font-family: var(--font-display);
  color: var(--color-text-bright);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.highlight-ssr .stat-value    { color: var(--color-ssr); }
.highlight-purple .stat-value { color: var(--color-purple-bright); }
.highlight-gold .stat-value   { color: var(--color-gold); }

/* 历史面板 */
.history-panel { padding: 20px 24px; }
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-soft);
}
.history-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-bright);
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.history-title span {
  font-size: 10px;
  color: var(--color-muted);
  letter-spacing: 2px;
  font-weight: 400;
}
.history-tools { display: flex; gap: 8px; align-items: center; }
.filter-select {
  padding: 6px 10px;
  background: var(--color-panel-light);
  border: 1px solid var(--color-border-soft);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 12px;
  outline: none;
}
.tool-btn {
  padding: 6px 14px;
  background: var(--color-panel-light);
  border: 1px solid var(--color-border-soft);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 12px;
  transition: all 0.2s;
}
.tool-btn:hover { border-color: var(--color-purple); color: var(--color-purple-bright); }
.tool-btn.danger:hover { border-color: #ff5fa8; color: #ff5fa8; }

/* 表格 */
.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.history-table th {
  text-align: left;
  padding: 10px 12px;
  color: var(--color-muted);
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 1px;
  border-bottom: 1px solid var(--color-border-soft);
}
.history-table td {
  padding: 12px;
  color: var(--color-text);
  border-bottom: 1px solid rgba(155, 108, 255, 0.08);
}
.history-table tr:hover td {
  background: var(--color-panel-light);
}
.time-cell {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: var(--color-muted);
  white-space: nowrap;
}
.item-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rarity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.rarity-dot.r-ssr { background: var(--color-ssr); box-shadow: 0 0 6px var(--color-ssr); }
.rarity-dot.r-sr  { background: var(--color-sr); }
.rarity-dot.r-r   { background: var(--color-r); }
.item-name.r-ssr { color: var(--color-ssr); font-weight: 700; }
.item-name.r-sr  { color: var(--color-sr); font-weight: 600; }
.item-name.r-r   { color: var(--color-text); }
.item-rarity {
  margin-left: auto;
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: 1px;
}
.item-rarity.r-ssr { color: var(--color-ssr); }
.item-rarity.r-sr  { color: var(--color-sr); }
.item-rarity.r-r   { color: var(--color-r); }
.rarity-pill {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-weight: 800;
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 1px;
}
.rarity-pill.r-ssr { background: rgba(246, 198, 107, 0.15); color: var(--color-ssr); border: 1px solid var(--color-ssr); }
.rarity-pill.r-sr  { background: rgba(184, 147, 255, 0.15); color: var(--color-sr);  border: 1px solid var(--color-sr); }
.rarity-pill.r-r   { background: rgba(77, 163, 255, 0.15);  color: var(--color-r);   border: 1px solid var(--color-r); }
.draw-num {
  text-align: right;
  color: var(--color-muted);
  font-variant-numeric: tabular-nums;
}

/* 空状态 */
.empty {
  padding: 60px 20px;
  text-align: center;
  color: var(--color-muted);
}
.empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.5; }
.empty-link {
  display: inline-block;
  margin-top: 12px;
  padding: 8px 20px;
  background: var(--gradient-gold);
  color: #1a0f2e;
  border-radius: 20px;
  font-weight: 700;
  font-size: 13px;
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-soft);
}
.page-info { margin-right: auto; color: var(--color-muted); font-size: 12px; }
.page-btn, .page-num {
  min-width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--color-panel-light);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text);
  font-size: 13px;
  display: grid;
  place-items: center;
  padding: 0 8px;
  transition: all 0.2s;
}
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.page-btn:not(:disabled):hover, .page-num:hover {
  border-color: var(--color-purple);
  color: var(--color-purple-bright);
}
.page-num.active {
  background: var(--gradient-gold);
  color: #1a0f2e;
  border-color: var(--color-gold);
  box-shadow: 0 0 8px var(--color-ssr-glow);
}
</style>
