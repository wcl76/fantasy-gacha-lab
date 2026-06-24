<script setup lang="ts">
/**
 * CollectionView —— 图鉴页
 * 严格按效果图：左侧筛选 + 收集进度；中间角色网格（5 列）
 */
import { computed, onMounted, ref } from 'vue'
import { useGachaStore } from '@/stores/gachaStore'
import CharacterCard from '@/components/gacha/CharacterCard.vue'
import CharacterModal from '@/components/gacha/CharacterModal.vue'
import { ELEMENT_NAME_CN, ROLE_NAME_CN } from '@/utils/format'
import type { Character, Element, Rarity, Role } from '@/types'

const store = useGachaStore()

onMounted(() => {
  // 浏览图鉴任务 +1
  store.progressTask('task_browse_collection', 1)
})

// ============ 角色详情弹窗 ============
const selectedCharacter = ref<Character | null>(null)
const modalOpen = ref(false)

function openCharacter(c: Character) {
  selectedCharacter.value = c
  modalOpen.value = true
}
function closeModal() {
  modalOpen.value = false
  selectedCharacter.value = null
}

// 筛选
const rarityFilter = ref<Rarity | 'all'>('all')
const elementFilter = ref<Element | 'all'>('all')
const roleFilter = ref<Role | 'all'>('all')
const search = ref('')
const sortBy = ref<'default' | 'rarity' | 'element'>('default')

const elements: Element[] = ['light', 'dark', 'fire', 'ice', 'thunder', 'nature']
const roles: Role[] = ['attack', 'defense', 'support', 'heal', 'control']
const elementIcons: Record<Element, string> = {
  light: '✦', dark: '☾', fire: '🔥', ice: '❄', thunder: '⚡', nature: '🌿',
}

const filtered = computed(() => {
  let list = store.characters
  if (rarityFilter.value !== 'all') {
    list = list.filter(c => c.rarity === rarityFilter.value)
  }
  if (elementFilter.value !== 'all') {
    list = list.filter(c => c.element === elementFilter.value)
  }
  if (roleFilter.value !== 'all') {
    list = list.filter(c => c.role === roleFilter.value)
  }
  if (search.value.trim()) {
    const kw = search.value.trim()
    list = list.filter(c =>
      c.name.includes(kw) || c.title.includes(kw) || c.description.includes(kw),
    )
  }
  // 排序
  if (sortBy.value === 'rarity') {
    const order = { SSR: 0, SR: 1, R: 2 }
    list = [...list].sort((a, b) => order[a.rarity] - order[b.rarity])
  } else if (sortBy.value === 'element') {
    list = [...list].sort((a, b) => a.element.localeCompare(b.element))
  }
  return list
})

// 统计
const totalCount = computed(() => store.characters.length)
const obtainedCount = computed(() => store.collectedCount)
const totalPercent = computed(() => Math.round((obtainedCount.value / totalCount.value) * 100))
const counts = computed(() => {
  const c = { SSR: 0, SR: 0, R: 0, ssrHave: 0, srHave: 0, rHave: 0 }
  store.characters.forEach(ch => {
    c[ch.rarity]++
    if ((store.collection[ch.id] ?? 0) > 0) {
      c[`${ch.rarity.toLowerCase()}Have` as 'ssrHave' | 'srHave' | 'rHave']++
    }
  })
  return c
})

function resetFilter() {
  rarityFilter.value = 'all'
  elementFilter.value = 'all'
  roleFilter.value = 'all'
  search.value = ''
}
</script>

<template>
  <div class="collection-view">
    <div class="collection-layout">
      <!-- 左侧筛选 -->
      <aside class="filter-sidebar">
        <!-- 筛选 -->
        <div class="panel filter-panel">
          <div class="filter-header">
            <h3 class="filter-title">筛选 <span>FILTER</span></h3>
            <button class="reset-btn" @click="resetFilter">重置</button>
          </div>

          <!-- 稀有度 -->
          <div class="filter-group">
            <div class="filter-buttons">
              <button
                v-for="r in (['all', 'SSR', 'SR', 'R'] as const)"
                :key="r"
                class="filter-btn"
                :class="{ active: rarityFilter === r, [`rarity-${r.toLowerCase()}`]: r !== 'all' }"
                @click="rarityFilter = r"
              >
                {{ r === 'all' ? '全部' : r }}
              </button>
            </div>
          </div>

          <!-- 元素 -->
          <div class="filter-group">
            <div class="group-label">元素</div>
            <div class="filter-icons">
              <button
                class="icon-btn"
                :class="{ active: elementFilter === 'all' }"
                @click="elementFilter = 'all'"
                title="全部"
              >⊕</button>
              <button
                v-for="el in elements"
                :key="el"
                class="icon-btn"
                :class="{ active: elementFilter === el }"
                @click="elementFilter = el"
                :title="ELEMENT_NAME_CN[el]"
              >{{ elementIcons[el] }}</button>
            </div>
          </div>

          <!-- 类型 -->
          <div class="filter-group">
            <div class="group-label">类型</div>
            <div class="filter-icons">
              <button
                class="icon-btn"
                :class="{ active: roleFilter === 'all' }"
                @click="roleFilter = 'all'"
                title="全部"
              >⊕</button>
              <button
                v-for="r in roles"
                :key="r"
                class="icon-btn"
                :class="{ active: roleFilter === r }"
                @click="roleFilter = r"
                :title="ROLE_NAME_CN[r]"
              >
                <span v-if="r === 'attack'">⚔</span>
                <span v-else-if="r === 'defense'">🛡</span>
                <span v-else-if="r === 'support'">✦</span>
                <span v-else-if="r === 'heal'">✚</span>
                <span v-else>⊕</span>
              </button>
            </div>
          </div>

          <!-- 搜索 -->
          <div class="filter-search">
            <input
              v-model="search"
              type="text"
              placeholder="搜索角色名称"
              class="search-input"
            />
            <span class="search-icon">🔍</span>
          </div>
        </div>

        <!-- 收集进度 -->
        <div class="panel progress-panel">
          <div class="progress-header">
            <h3 class="progress-title">收藏进度 <span>COLLECTION PROGRESS</span></h3>
          </div>
          <div class="progress-ring">
            <div class="ring-num">{{ totalPercent }}%</div>
            <div class="ring-sub">已收集</div>
          </div>
          <ul class="progress-list">
            <li><span>角色总数</span><strong>{{ obtainedCount }} / {{ totalCount }}</strong></li>
            <li class="r-ssr"><span>SSR 角色</span><strong>{{ counts.ssrHave }} / {{ counts.SSR }}</strong></li>
            <li class="r-sr"><span>SR 角色</span><strong>{{ counts.srHave }} / {{ counts.SR }}</strong></li>
            <li class="r-r"><span>R 角色</span><strong>{{ counts.rHave }} / {{ counts.R }}</strong></li>
          </ul>
          <button class="view-uncollected-btn">查看未收集</button>
        </div>
      </aside>

      <!-- 右侧角色网格 -->
      <main class="grid-main">
        <div class="grid-header">
          <h2 class="grid-title">图鉴 <span>COLLECTION</span></h2>
          <div class="grid-controls">
            <select v-model="sortBy" class="sort-select">
              <option value="default">默认排序</option>
              <option value="rarity">按稀有度</option>
              <option value="element">按元素</option>
            </select>
            <span class="grid-count">显示：{{ filtered.length }} 个角色</span>
          </div>
        </div>

        <div class="char-grid">
          <div
            v-for="c in filtered"
            :key="c.id"
            class="char-cell"
            @click="openCharacter(c)"
          >
            <CharacterCard
              :character="c"
              :is-up="c.isUp"
              :obtained="!!store.collection[c.id]"
              :count="store.collection[c.id] ?? 0"
            />
          </div>
        </div>

        <div v-if="filtered.length === 0" class="grid-empty">
          没有符合条件的角色
        </div>
      </main>
    </div>

    <!-- 角色详情弹窗 -->
    <CharacterModal
      v-if="modalOpen"
      :character="selectedCharacter"
      :obtained="selectedCharacter ? !!store.collection[selectedCharacter.id] : false"
      :count="selectedCharacter ? store.collection[selectedCharacter.id] ?? 0 : 0"
      @close="closeModal"
    />
  </div>
</template>

<style scoped>
.collection-view { width: 100%; }
.collection-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
}
@media (max-width: 1000px) { .collection-layout { grid-template-columns: 1fr; } }

.filter-sidebar { display: flex; flex-direction: column; gap: 16px; }
.filter-panel { padding: 16px 18px; }

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border-soft);
}
.filter-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-bright);
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.filter-title span {
  font-size: 10px;
  color: var(--color-muted);
  letter-spacing: 2px;
  font-weight: 400;
}
.reset-btn {
  font-size: 12px;
  color: var(--color-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}
.reset-btn:hover { color: var(--color-gold); }
.reset-btn::before { content: '↺'; }

.filter-group { margin-bottom: 14px; }
.group-label {
  font-size: 12px;
  color: var(--color-muted);
  margin-bottom: 8px;
}
.filter-buttons {
  display: flex;
  gap: 4px;
}
.filter-btn {
  flex: 1;
  padding: 6px 0;
  border-radius: 6px;
  background: var(--color-panel-light);
  border: 1px solid transparent;
  color: var(--color-muted);
  font-weight: 700;
  font-family: var(--font-display);
  font-size: 12px;
  transition: all 0.2s;
}
.filter-btn:hover { color: var(--color-text); border-color: var(--color-border); }
.filter-btn.active { background: var(--color-panel); color: var(--color-text-bright); border-color: var(--color-gold); }
.filter-btn.rarity-ssr.active { color: var(--color-ssr); border-color: var(--color-ssr); }
.filter-btn.rarity-sr.active  { color: var(--color-sr);  border-color: var(--color-sr); }
.filter-btn.rarity-r.active   { color: var(--color-r);   border-color: var(--color-r); }

.filter-icons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-panel-light);
  border: 1px solid transparent;
  color: var(--color-muted);
  display: grid;
  place-items: center;
  font-size: 14px;
  transition: all 0.2s;
}
.icon-btn:hover { color: var(--color-text-bright); border-color: var(--color-border); }
.icon-btn.active {
  background: var(--color-panel);
  color: var(--color-gold);
  border-color: var(--color-gold);
  box-shadow: 0 0 8px var(--color-ssr-glow);
}

.filter-search {
  position: relative;
  margin-top: 8px;
}
.search-input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  background: var(--color-panel-light);
  border: 1px solid var(--color-border-soft);
  border-radius: 20px;
  color: var(--color-text);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--color-purple); }
.search-icon {
  position: absolute;
  left: 10px; top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  opacity: 0.5;
}

/* 收集进度 */
.progress-panel { padding: 18px; text-align: center; }
.progress-header {
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border-soft);
}
.progress-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-bright);
  display: flex;
  align-items: baseline;
  gap: 6px;
  justify-content: center;
}
.progress-title span {
  font-size: 9px;
  color: var(--color-muted);
  letter-spacing: 1.5px;
  font-weight: 400;
}
.progress-ring {
  width: 130px;
  height: 130px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background:
    conic-gradient(var(--color-gold) 0% v-bind('totalPercent + "%"'), rgba(246, 198, 107, 0.15) v-bind('totalPercent + "%"') 100%);
  display: grid;
  place-items: center;
  position: relative;
  box-shadow: 0 0 24px var(--color-ssr-glow);
}
.progress-ring::after {
  content: '';
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  background: var(--color-panel-deep);
}
.ring-num, .ring-sub {
  position: relative;
  z-index: 1;
}
.ring-num {
  font-size: 32px;
  font-weight: 800;
  font-family: var(--font-display);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}
.ring-sub {
  font-size: 11px;
  color: var(--color-muted);
  margin-top: 4px;
}
.progress-list {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  text-align: left;
  font-size: 12px;
}
.progress-list li {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  color: var(--color-muted);
}
.progress-list li strong { color: var(--color-text-bright); font-variant-numeric: tabular-nums; }
.progress-list .r-ssr strong { color: var(--color-ssr); }
.progress-list .r-sr  strong { color: var(--color-sr); }
.progress-list .r-r   strong { color: var(--color-r); }
.view-uncollected-btn {
  width: 100%;
  padding: 8px;
  background: var(--color-panel-light);
  border: 1px solid var(--color-border-soft);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 12px;
  transition: all 0.2s;
}
.view-uncollected-btn:hover { border-color: var(--color-gold); color: var(--color-gold); }

/* 角色网格 */
.grid-main { min-width: 0; }
.grid-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}
.grid-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-bright);
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.grid-title span {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 2px;
}
.grid-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}
.sort-select {
  padding: 6px 10px;
  background: var(--color-panel);
  border: 1px solid var(--color-border-soft);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 12px;
  outline: none;
  cursor: pointer;
}
.grid-count { color: var(--color-muted); font-size: 12px; }

.char-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}
.char-cell {
  cursor: pointer;
  transition: transform 0.2s;
}
.char-cell:hover { transform: translateY(-3px); }
@media (max-width: 1200px) { .char-grid { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 800px)  { .char-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 500px)  { .char-grid { grid-template-columns: repeat(2, 1fr); } }

.grid-empty {
  padding: 60px 20px;
  text-align: center;
  color: var(--color-muted);
}
</style>
