<script setup lang="ts">
/**
 * ResultView —— 抽卡结果页
 * 严格按效果图：顶部标题 + 10 张结果卡横排 + 底部三块（统计/励志语/再抽+分享+幸运值）
 * 翻牌动画：GSAP timeline 编排 10 张卡依次翻面，SSR 卡翻面时触发粒子爆发
 */
import gsap from 'gsap'
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGachaStore } from '@/stores/gachaStore'
import { charactersById } from '@/data/characters'
import { formatPercent } from '@/utils/format'
import { PITY_LIMIT } from '@/utils/gacha'
import FlipCard from '@/components/gacha/FlipCard.vue'
import SSRBurst from '@/components/gacha/SSRBurst.vue'
import SSRGoldFlash from '@/components/gacha/SSRGoldFlash.vue'
import { playRarity } from '@/utils/sound'

const router = useRouter()
const store = useGachaStore()

const result = computed(() => store.lastResult)

// 翻牌状态：每个卡独立 flipped
const flipped = ref<boolean[]>([])
const ssrBurstTrigger = ref<number>(0)
const ssrFlashRef = ref<InstanceType<typeof SSRGoldFlash> | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const footerRef = ref<HTMLElement | null>(null)

// 保存 setTimeout 句柄，便于取消
const pendingTimers = ref<number[]>([])

function clearPendingTimers() {
  pendingTimers.value.forEach(id => clearTimeout(id))
  pendingTimers.value = []
}

/** 主时间轴（用于清理和防重复） */
let mainTimeline: gsap.core.Timeline | null = null

/** GSAP 编排：标题入场 → 结果卡牌飞行入场 + 翻面 → 底部三块入场 */
function runTimeline() {
  if (!result.value) return

  // 取消之前未触发的 setTimeout + 时间轴（避免快速连抽时混乱）
  clearPendingTimers()
  if (mainTimeline) {
    mainTimeline.kill()
    mainTimeline = null
  }

  // 0. 结果卡片整体初始状态：缩小 + 透明（翻面前）
  const cardSlots = document.querySelectorAll('.result-card-slot')
  if (cardSlots.length > 0) {
    gsap.set(cardSlots, { opacity: 0, y: 30, scale: 0.7 })
  }

  // 1. 标题入场（淡入 + 上滑）
  if (titleRef.value) {
    gsap.fromTo(titleRef.value,
      { opacity: 0, y: -20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)' },
    )
  }

  // 2. 10 张卡依次翻面（用 GSAP Timeline 替代 setTimeout，更可靠）
  flipped.value = new Array(result.value.results.length).fill(false)
  // 等 nextTick 让 v-for 渲染 FlipCard
  nextTick(() => {
    const tl = gsap.timeline()
    mainTimeline = tl
    result.value!.results.forEach((item, idx) => {
      const entryDelay = 0.3 + idx * 0.1
      const flipDelay = entryDelay + 0.4

      // 飞行入场
      if (cardSlots[idx]) {
        tl.to(cardSlots[idx], {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: 'back.out(1.4)',
        }, entryDelay)
      }

      // 翻面（用 call 在 timeline 中插入回调）
      tl.call(() => {
        flipped.value[idx] = true
        if (item.rarity === 'SSR') {
          ssrBurstTrigger.value++
          if (ssrFlashRef.value) ssrFlashRef.value.flash()
        }
        if (store.settings.soundEnabled) {
          playRarity(item.rarity)
        }
      }, [], flipDelay)
    })

    // 3. 底部三块整体入场
    const footerDelay = 0.3 + result.value!.results.length * 0.1 + 0.6
    if (footerRef.value) {
      tl.fromTo(footerRef.value,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        footerDelay,
      )
    }
  })
}

watch(result, (newVal) => {
  if (newVal) {
    nextTick(() => runTimeline())
  } else {
    flipped.value = []
  }
}, { immediate: true })

const enriched = computed(() => {
  if (!result.value) return []
  return result.value.results.map(r => ({
    ...r,
    character: charactersById[r.characterId]!,
  }))
})

const summary = computed(() => {
  if (!result.value) return { SSR: 0, SR: 0, R: 0, total: 0 }
  const counts = { SSR: 0, SR: 0, R: 0 }
  result.value.results.forEach(r => {
    counts[r.rarity]++
  })
  return { ...counts, total: result.value.results.length }
})

const luckyValue = computed(() => {
  if (!result.value) return 0
  return Math.min(100, 50 + summary.value.SSR * 20 + summary.value.SR * 5)
})

const luckComment = computed(() => {
  if (summary.value.SSR >= 1) return '欧气满满的一次召唤！愿星光指引你前行的道路！'
  if (summary.value.SR >= 2) return '不错不错，RP 正在悄悄积累～'
  return '继续保持，下一发说不定就出奇迹！'
})

const pityLeft = computed(() => PITY_LIMIT - store.currentPity)

function redrawTen() {
  store.performTenDraw()
}
function goSummon() {
  router.push({ name: 'summon' })
}
function share() {
  if (navigator.share) {
    navigator.share({
      title: '幻想召唤研究所',
      text: `我在幻想召唤研究所抽到 ${summary.value.SSR} 个 SSR, ${summary.value.SR} 个 SR！`,
    }).catch(() => {})
  } else {
    alert('分享结果：\n' +
      `SSR ×${summary.value.SSR}  SR ×${summary.value.SR}  R ×${summary.value.R}\n` +
      `幸运值 ${luckyValue.value}/100`)
  }
}
</script>

<template>
  <div class="result-view">
    <!-- SSR 出货特效层 -->
    <SSRBurst :trigger="ssrBurstTrigger" :enabled="true" />
    <!-- SSR 全屏金色脉冲 -->
    <SSRGoldFlash ref="ssrFlashRef" />

    <div v-if="!result" class="empty panel">
      <h2>暂无召唤结果</h2>
      <p>请先到召唤页进行抽卡</p>
      <button class="primary-btn" @click="goSummon">前往召唤</button>
    </div>

    <template v-else>
      <!-- 顶部标题 -->
      <div ref="titleRef" class="result-header">
        <div class="title-decoration" />
        <h1 class="result-title">召唤结果</h1>
        <div class="title-en">DRAW RESULTS</div>
        <div class="title-decoration" />
      </div>

      <!-- 结果卡片横排（带翻牌动画） -->
      <div class="result-cards">
        <div
          v-for="(r, idx) in enriched"
          :key="r.id"
          class="result-card-slot"
        >
          <FlipCard
            :flipped="flipped[idx] ?? false"
            :face-class="`rarity-${r.rarity.toLowerCase()}`"
            :delay="0"
            :duration="0.65"
          >
            <div class="result-card" :class="`rarity-${r.rarity.toLowerCase()}`">
              <div v-if="r.isNew" class="new-badge">NEW!</div>
              <div class="rarity-badge">{{ r.rarity }}</div>
              <div class="result-portrait">
                <div class="result-glow" />
                <img
                  class="result-image"
                  :src="r.character.image.startsWith('/fantasy-gacha-lab/') ? r.character.image : `/fantasy-gacha-lab${r.character.image}`"
                  :alt="`${r.character.name} ${r.character.title}`"
                  loading="lazy"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                >
                <div class="result-emoji">
                  {{ r.character.element === 'fire' ? '🔥'
                    : r.character.element === 'ice' ? '❄️'
                    : r.character.element === 'thunder' ? '⚡'
                    : r.character.element === 'nature' ? '🌿'
                    : r.character.element === 'dark' ? '🌙'
                    : '✨' }}
                </div>
                <div class="result-initials">{{ r.character.name.charAt(0) }}</div>
              </div>
              <div class="result-name">{{ r.character.name }}</div>
              <div class="result-title-zh">{{ r.character.title }}</div>
              <p class="result-desc">{{ r.character.description }}</p>
              <div class="result-stars">
                <span v-for="i in ({SSR: 5, SR: 4, R: 3})[r.rarity]" :key="i" class="star">★</span>
              </div>
            </div>
          </FlipCard>
        </div>
      </div>

      <!-- 底部三块 -->
      <div ref="footerRef" class="result-footer">
        <!-- 本次获得 -->
        <div class="panel footer-panel">
          <h3 class="footer-title">本次获得 <span class="footer-title-en">SUMMARY</span></h3>
          <div class="summary-row">
            <div class="summary-cell s-ssr">SSR <strong>{{ summary.SSR }}</strong></div>
            <div class="summary-cell s-sr">SR <strong>{{ summary.SR }}</strong></div>
            <div class="summary-cell s-r">R <strong>{{ summary.R }}</strong></div>
          </div>
          <p class="summary-note">
            本次召唤共获得 {{ summary.total }} 个道具，已转化为对应星灵碎片 ⓘ
          </p>
          <p class="summary-rate">
            本次 SSR 命中率：<strong>{{ formatPercent(summary.SSR / Math.max(1, summary.total)) }}</strong>
          </p>
        </div>

        <!-- 中间励志语 + 按钮 -->
        <div class="panel footer-panel center-panel">
          <p class="luck-comment">「{{ luckComment }}」</p>
          <div class="action-buttons">
            <button class="gold-btn" @click="redrawTen">
              <div class="btn-title">再抽一次</div>
              <div class="btn-cost"><span>💎</span> ×10</div>
            </button>
            <button class="blue-btn" @click="goSummon">
              <div class="btn-title">返回召唤</div>
            </button>
            <button class="purple-btn" @click="share">
              <span class="share-icon">↗</span>
              <span>分享结果</span>
            </button>
          </div>
        </div>

        <!-- 幸运值 -->
        <div class="panel footer-panel lucky-panel">
          <h3 class="footer-title">幸运值</h3>
          <div class="lucky-value">
            <span class="lucky-num">{{ luckyValue }}</span>
            <span class="lucky-max">/ 100</span>
          </div>
          <div class="lucky-ring" :style="{ '--p': luckyValue + '%' }">
            <div class="lucky-ring-inner" />
          </div>
          <p class="lucky-note">
            再召唤 <strong>{{ pityLeft }}</strong> 次必得 <span class="text-gold">SSR</span>
          </p>
        </div>
      </div>

      <p class="result-tip">
        小贴士：重复获得的角色将自动转化为对应星灵碎片，可在图鉴中查看 ⓘ
      </p>
    </template>
  </div>
</template>

<style scoped>
.result-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 80px 24px;
}
.empty h2 { color: var(--color-text-bright); margin: 0 0 8px; }
.empty p { color: var(--color-muted); margin: 0 0 24px; }
.primary-btn {
  padding: 12px 32px;
  background: var(--gradient-gold);
  color: #1a0f2e;
  border-radius: 24px;
  font-weight: 700;
  box-shadow: 0 0 16px var(--color-ssr-glow);
}

/* 顶部标题 */
.result-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px 0 8px;
}
.title-decoration {
  flex: 1;
  max-width: 200px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-gold), transparent);
  position: relative;
}
.title-decoration::before, .title-decoration::after {
  content: '✦';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gold);
  font-size: 14px;
  text-shadow: 0 0 8px var(--color-gold);
}
.title-decoration::before { left: 20%; }
.title-decoration::after  { right: 20%; }
.result-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-bright);
  letter-spacing: 6px;
  font-family: var(--font-zh);
  text-shadow: 0 0 12px var(--color-gold);
}
.title-en {
  font-size: 12px;
  color: var(--color-gold);
  letter-spacing: 4px;
  font-family: var(--font-display);
}

/* 结果卡片 */
.result-cards {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 10px;
  padding: 16px 0;
}
@media (max-width: 1200px) { .result-cards { grid-template-columns: repeat(5, 1fr); } }
@media (max-width: 700px)  { .result-cards { grid-template-columns: repeat(2, 1fr); } }

.result-card-slot {
  position: relative;
  aspect-ratio: 3/4.2;
}

.result-card {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-md);
  background:
    linear-gradient(145deg, rgba(255,255,255,0.14), transparent 24%),
    linear-gradient(180deg, rgba(20, 24, 50, 0.9) 0%, rgba(8, 10, 28, 0.95) 100%);
  border: 2px solid var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 7px 6px 8px;
  overflow: hidden;
}
.result-card::before {
  content: '';
  position: absolute;
  inset: 4px;
  z-index: 1;
  border-radius: calc(var(--radius-md) - 4px);
  border: 1px solid rgba(255,255,255,0.16);
  pointer-events: none;
}
.rarity-ssr.result-card {
  border-color: var(--color-ssr);
  background:
    radial-gradient(circle at 18% 8%, rgba(255, 244, 184, 0.28), transparent 28%),
    linear-gradient(160deg, #5a330a 0%, #f6c66b 18%, #3a1d07 38%, #111028 72%, #7d4c12 100%);
  box-shadow: 0 0 20px var(--color-ssr-glow);
}
.rarity-sr.result-card  {
  border-color: var(--color-sr);
  background:
    radial-gradient(circle at 18% 8%, rgba(229, 193, 255, 0.24), transparent 28%),
    linear-gradient(160deg, #3b1b62 0%, #b48cff 18%, #20143f 42%, #0d0c26 76%, #7c4ac4 100%);
  box-shadow: 0 0 12px var(--color-sr-glow);
}
.rarity-r.result-card   {
  border-color: var(--color-r);
  background:
    radial-gradient(circle at 18% 8%, rgba(142, 197, 255, 0.2), transparent 28%),
    linear-gradient(160deg, #15365d 0%, #6fb7ff 18%, #102540 42%, #080f22 76%, #336a99 100%);
  box-shadow: 0 0 6px var(--color-r-glow);
}

.rarity-badge {
  position: absolute;
  top: 4px; left: 4px;
  z-index: 2;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 800;
  font-size: 9px;
  letter-spacing: 1px;
  color: #1a0f2e;
  background: var(--color-ssr);
}
.rarity-sr .rarity-badge { background: var(--color-sr); }
.rarity-r  .rarity-badge { background: var(--color-r); color: #04132e; }

.new-badge {
  position: absolute;
  top: 4px; right: 4px;
  z-index: 2;
  padding: 1px 5px;
  background: var(--gradient-pink);
  color: #fff;
  font-size: 8px;
  font-weight: 800;
  border-radius: 3px;
}

.result-portrait {
  position: relative;
  flex: 1;
  width: 100%;
  display: grid;
  place-items: center;
  margin: 14px 0 6px;
  z-index: 2;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.22);
  background: rgba(5, 7, 20, 0.6);
}
.result-glow {
  position: absolute;
  inset: 10%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--color-ssr-glow) 0%, transparent 65%);
  animation: portrait-pulse 3s ease-in-out infinite;
}
.rarity-sr .result-glow { background: radial-gradient(circle, var(--color-sr-glow) 0%, transparent 65%); }
.rarity-r  .result-glow { background: radial-gradient(circle, var(--color-r-glow)  0%, transparent 65%); }
@keyframes portrait-pulse {
  0%, 100% { opacity: 0.5; transform: scale(0.95); }
  50%      { opacity: 1;   transform: scale(1.05); }
}
.result-image {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  filter: saturate(1.08) contrast(1.04);
}
.result-emoji {
  position: absolute;
  font-size: 36px;
  opacity: 0.25;
}
.result-initials {
  position: relative;
  z-index: 1;
  font-size: 40px;
  font-weight: 800;
  font-family: var(--font-display);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.rarity-sr .result-initials {
  background: var(--gradient-purple);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.rarity-r .result-initials {
  background: linear-gradient(180deg, #8ec5ff 0%, #4da3ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.result-name {
  position: relative;
  z-index: 2;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-bright);
  text-align: center;
}
.result-title-zh {
  position: relative;
  z-index: 2;
  font-size: 10px;
  color: var(--color-muted);
  text-align: center;
  margin-top: 1px;
}
.result-desc {
  position: relative;
  z-index: 2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 28px;
  margin: 5px 0 0;
  padding: 4px 5px;
  width: 100%;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.24);
  color: rgba(246, 240, 255, 0.8);
  font-size: 9px;
  line-height: 1.35;
  text-align: left;
}
.result-stars {
  position: relative;
  z-index: 2;
  margin-top: 4px;
  color: var(--color-ssr);
  font-size: 9px;
  letter-spacing: 1.5px;
}
.rarity-sr .result-stars { color: var(--color-sr); }
.rarity-r  .result-stars { color: var(--color-r); }

/* 底部三块 */
.result-footer {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 16px;
}
@media (max-width: 1000px) { .result-footer { grid-template-columns: 1fr; } }
.footer-panel {
  padding: 18px 20px;
}
.footer-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-bright);
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.footer-title-en {
  font-size: 10px;
  color: var(--color-muted);
  letter-spacing: 2px;
  font-weight: 400;
}

/* Summary */
.summary-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.summary-cell {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  border-radius: 6px;
  font-weight: 800;
  font-family: var(--font-display);
  letter-spacing: 1px;
}
.summary-cell strong {
  font-size: 20px;
  margin-left: 4px;
}
.s-ssr { background: rgba(246, 198, 107, 0.15); color: var(--color-ssr); border: 1px solid var(--color-ssr); }
.s-sr  { background: rgba(184, 147, 255, 0.15); color: var(--color-sr);  border: 1px solid var(--color-sr); }
.s-r   { background: rgba(77, 163, 255, 0.15);  color: var(--color-r);   border: 1px solid var(--color-r); }
.summary-note {
  margin: 0;
  font-size: 11px;
  color: var(--color-muted);
  font-style: italic;
}
.summary-rate {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--color-muted);
}
.summary-rate strong {
  color: var(--color-ssr);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* 中心 */
.center-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.luck-comment {
  text-align: center;
  font-size: 14px;
  color: var(--color-gold-bright);
  font-style: italic;
  margin: 0 0 16px;
}
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}
.gold-btn, .blue-btn, .purple-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  font-weight: 700;
  transition: transform 0.2s;
  min-width: 100px;
}
.gold-btn:hover, .blue-btn:hover, .purple-btn:hover { transform: translateY(-2px); }
.gold-btn {
  background: var(--gradient-gold);
  color: #1a0f2e;
  box-shadow: 0 0 14px var(--color-ssr-glow);
}
.blue-btn {
  background: linear-gradient(135deg, #2a5fc8 0%, #4da3ff 100%);
  color: #fff;
  box-shadow: 0 0 14px rgba(77, 163, 255, 0.45);
}
.purple-btn {
  flex-direction: row;
  gap: 6px;
  background: var(--gradient-purple);
  color: #fff;
  box-shadow: 0 0 14px var(--color-purple);
}
.share-icon { font-size: 14px; }
.btn-title { font-size: 13px; }
.btn-cost {
  margin-top: 2px;
  font-size: 10px;
  opacity: 0.85;
  display: flex;
  align-items: center;
  gap: 3px;
}

/* Lucky */
.lucky-panel { display: flex; flex-direction: column; align-items: center; }
.lucky-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}
.lucky-num {
  font-size: 36px;
  font-weight: 800;
  font-family: var(--font-display);
  background: var(--gradient-purple);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.lucky-max { font-size: 12px; color: var(--color-muted); }
.lucky-ring {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(var(--color-purple) 0% var(--p), rgba(155, 108, 255, 0.15) var(--p) 100%);
  display: grid;
  place-items: center;
  margin-bottom: 8px;
}
.lucky-ring::after {
  content: '✦';
  position: absolute;
  font-size: 24px;
  color: var(--color-gold);
  text-shadow: 0 0 8px var(--color-gold);
}
.lucky-ring-inner {
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: var(--color-panel-deep);
}
.lucky-note {
  margin: 0;
  font-size: 11px;
  color: var(--color-muted);
  text-align: center;
}
.lucky-note strong { color: var(--color-text-bright); margin: 0 2px; }

.result-tip {
  text-align: center;
  font-size: 12px;
  color: var(--color-muted);
  font-style: italic;
  margin: 0;
}
</style>
