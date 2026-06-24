<script setup lang="ts">
/**
 * CharacterModal —— 角色详情弹窗
 * - SSR/SR/R 三种稀有度配色
 * - 大立绘 + 完整属性 + 故事背景
 * - 收藏状态：已获得/未获得
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Character } from '@/types'
import { ELEMENT_NAME_CN, ROLE_NAME_CN } from '@/utils/format'
import { charactersById } from '@/data/characters'

const props = defineProps<{
  character: Character | null
  obtained?: boolean
  count?: number
}>()

const emit = defineEmits<{
  close: []
}>()

const previewOpen = ref(false)

/** 图片路径拼接 base URL */
const imageSrc = computed(() => {
  if (!props.character) return ''
  const base = import.meta.env.BASE_URL || '/'
  return `${base.replace(/\/+$/, '')}${props.character.image}`
})

// 元素对应的 emoji
const elementEmoji: Record<string, string> = {
  light: '✨', dark: '🌙', fire: '🔥', ice: '❄️', thunder: '⚡', nature: '🌿',
}

// 同稀有度的角色列表（用于「同稀有度其他角色」推荐）
const sameRarityChars = computed(() => {
  if (!props.character) return []
  return Object.values(charactersById)
    .filter(c => c.rarity === props.character!.rarity && c.id !== props.character!.id)
    .slice(0, 4)
})

// ESC 关闭
function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (previewOpen.value) {
    previewOpen.value = false
    return
  }
  emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

watch(() => props.character?.id, () => {
  previewOpen.value = false
})

// 星星数量
const stars = computed(() => {
  if (!props.character) return 0
  return ({ SSR: 5, SR: 4, R: 3 } as const)[props.character.rarity]
})

function close() {
  emit('close')
}

function openPreview() {
  previewOpen.value = true
}

function closePreview() {
  previewOpen.value = false
}
</script>

<template>
  <Transition name="modal">
    <div v-if="character" class="modal-mask" @click.self="close">
      <div class="modal-container" :class="`rarity-${character.rarity.toLowerCase()}`">
        <!-- 装饰性边框光 -->
        <div class="modal-glow" />

        <!-- 关闭按钮 -->
        <button class="modal-close" @click="close">✕</button>

        <div class="modal-body">
          <!-- 左侧：大立绘 + 稀有度徽章 -->
          <div class="modal-left">
            <button
              class="portrait-stage"
              type="button"
              :aria-label="`查看${character.name}完整立绘`"
              @click="openPreview"
            >
              <div class="portrait-glow" />
              <img
                class="portrait-image"
                :src="imageSrc"
                :alt="`${character.name} ${character.title}`"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              >
              <div class="portrait-emoji">{{ elementEmoji[character.element] }}</div>
              <div class="portrait-initials">{{ character.name.charAt(0) }}</div>
              <span class="portrait-zoom">⌕</span>
            </button>
            <div class="portrait-rarity">{{ character.rarity }}</div>
            <div v-if="obtained" class="portrait-check">✓ 已收藏</div>
            <div v-else class="portrait-locked">🔒 未获得</div>
          </div>

          <!-- 右侧：详细信息 -->
          <div class="modal-right">
            <div class="info-name">
              <h2 class="char-name">{{ character.name }}</h2>
              <span class="char-title">{{ character.title }}</span>
            </div>

            <div class="info-stars">
              <span v-for="i in stars" :key="i" class="star">★</span>
            </div>

            <div class="info-tags">
              <span class="tag tag-element">
                <span class="tag-icon">{{ elementEmoji[character.element] }}</span>
                {{ ELEMENT_NAME_CN[character.element] }}
              </span>
              <span class="tag tag-role">
                ⚔ {{ ROLE_NAME_CN[character.role] }}
              </span>
              <span v-if="character.isUp" class="tag tag-up">⭐ UP</span>
              <span v-if="obtained && count && count > 1" class="tag tag-count">
                ✕ {{ count }}
              </span>
            </div>

            <div class="info-desc">
              <h3 class="desc-title">✦ 角色故事</h3>
              <p>{{ character.description }}</p>
            </div>

            <div class="info-attr">
              <h3 class="attr-title">✦ 基础属性</h3>
              <div class="attr-grid">
                <div class="attr-cell">
                  <div class="attr-key">HP</div>
                  <div class="attr-val">
                    <div class="attr-bar" style="--p: 70%"><span /></div>
                  </div>
                </div>
                <div class="attr-cell">
                  <div class="attr-key">ATK</div>
                  <div class="attr-val">
                    <div class="attr-bar" style="--p: 80%"><span /></div>
                  </div>
                </div>
                <div class="attr-cell">
                  <div class="attr-key">DEF</div>
                  <div class="attr-val">
                    <div class="attr-bar" style="--p: 60%"><span /></div>
                  </div>
                </div>
                <div class="attr-cell">
                  <div class="attr-key">SPD</div>
                  <div class="attr-val">
                    <div class="attr-bar" style="--p: 75%"><span /></div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="sameRarityChars.length > 0" class="info-related">
              <h3 class="related-title">✦ 同稀有度角色</h3>
              <div class="related-list">
                <div
                  v-for="c in sameRarityChars"
                  :key="c.id"
                  class="related-item"
                  :class="`rarity-${c.rarity.toLowerCase()}`"
                  :title="c.name + ' · ' + c.title"
                >
                  <span class="related-emoji">{{ elementEmoji[c.element] }}</span>
                  <span class="related-name">{{ c.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Transition name="preview">
        <div v-if="previewOpen" class="image-preview" @click.self="closePreview">
          <button class="preview-close" @click="closePreview">✕</button>
          <img
            class="preview-image"
            :src="imageSrc"
            :alt="`${character.name} ${character.title} 完整立绘`"
          >
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 500;
  display: grid;
  place-items: center;
  padding: 24px;
}
.modal-container {
  position: relative;
  width: 100%;
  max-width: 760px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--color-panel-deep);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-xl);
  padding: 0;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.5);
}
.rarity-ssr { border-color: var(--color-ssr); box-shadow: 0 0 32px var(--color-ssr-glow), 0 16px 64px rgba(0,0,0,0.5); }
.rarity-sr  { border-color: var(--color-sr);  box-shadow: 0 0 24px var(--color-sr-glow), 0 16px 64px rgba(0,0,0,0.5); }
.rarity-r   { border-color: var(--color-r);   box-shadow: 0 0 16px var(--color-r-glow), 0 16px 64px rgba(0,0,0,0.5); }

.modal-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at top, rgba(155, 108, 255, 0.15) 0%, transparent 60%);
  pointer-events: none;
  border-radius: var(--radius-xl);
}
.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-panel);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text);
  font-size: 16px;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
}
.modal-close:hover {
  background: var(--color-pink);
  color: #fff;
  transform: rotate(90deg);
}

.modal-body {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 28px;
  padding: 32px;
  position: relative;
}
@media (max-width: 700px) { .modal-body { grid-template-columns: 1fr; padding: 20px; } }

/* 左侧 */
.modal-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.portrait-stage {
  position: relative;
  width: 200px;
  height: 200px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  overflow: hidden;
  background: transparent;
  cursor: zoom-in;
}
.portrait-stage:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 4px;
}
.portrait-stage:hover .portrait-image {
  transform: scale(1.05);
}
.portrait-glow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  filter: blur(40px);
  animation: pulse-glow 3s ease-in-out infinite;
}
.rarity-ssr .portrait-glow { background: radial-gradient(circle, var(--color-ssr-glow) 0%, transparent 60%); }
.rarity-sr .portrait-glow { background: radial-gradient(circle, var(--color-sr-glow) 0%, transparent 60%); }
.rarity-r .portrait-glow { background: radial-gradient(circle, var(--color-r-glow) 0%, transparent 60%); }
@keyframes pulse-glow {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%      { opacity: 1; transform: scale(1.05); }
}
.portrait-image {
  position: absolute;
  inset: 0;
  z-index: 3;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  border-radius: 50%;
  filter: saturate(1.08) contrast(1.04);
  transition: transform 0.25s ease;
}
.portrait-emoji {
  position: absolute;
  font-size: 80px;
  opacity: 0.25;
  z-index: 1;
}
.portrait-initials {
  position: relative;
  z-index: 2;
  font-size: 96px;
  font-weight: 800;
  font-family: var(--font-display);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 32px var(--color-ssr-glow);
}
.portrait-zoom {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 4;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(8, 10, 28, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: var(--color-text-bright);
  font-size: 18px;
  line-height: 1;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.36);
}
.rarity-sr .portrait-initials {
  background: var(--gradient-purple);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.rarity-r .portrait-initials {
  background: linear-gradient(180deg, #8ec5ff 0%, #4da3ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.portrait-rarity {
  padding: 4px 16px;
  border-radius: 12px;
  font-weight: 800;
  font-family: var(--font-display);
  letter-spacing: 2px;
  font-size: 14px;
  background: var(--color-gold);
  color: #1a0f2e;
  box-shadow: 0 0 12px currentColor;
}
.rarity-sr .portrait-rarity { background: var(--color-sr); }
.rarity-r  .portrait-rarity { background: var(--color-r); color: #04132e; }

.portrait-check {
  padding: 4px 10px;
  background: linear-gradient(135deg, #2a7a3a, #4aaf5a);
  color: #fff;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}
.portrait-locked {
  padding: 4px 10px;
  background: var(--color-panel-light);
  color: var(--color-muted);
  border: 1px dashed var(--color-border-soft);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

/* 右侧 */
.modal-right {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.info-name {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}
.char-name {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-bright);
  letter-spacing: 2px;
}
.char-title {
  font-size: 14px;
  color: var(--color-gold);
  letter-spacing: 1px;
}
.info-stars {
  display: flex;
  gap: 4px;
  color: var(--color-ssr);
  font-size: 18px;
  text-shadow: 0 0 4px currentColor;
}
.rarity-sr .info-stars { color: var(--color-sr); }
.rarity-r .info-stars { color: var(--color-r); }

.info-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}
.tag-icon { font-size: 12px; }
.tag-element { background: rgba(155, 108, 255, 0.15); color: var(--color-purple-bright); border: 1px solid var(--color-purple); }
.tag-role   { background: rgba(77, 163, 255, 0.15); color: var(--color-r); border: 1px solid var(--color-r); }
.tag-up     { background: var(--gradient-gold); color: #1a0f2e; }
.tag-count  { background: var(--gradient-pink); color: #fff; }

.info-desc, .info-attr, .info-related {
  background: var(--color-panel);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: 12px 14px;
}
.desc-title, .attr-title, .related-title {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--color-gold);
  letter-spacing: 1px;
  font-weight: 700;
}
.info-desc p {
  margin: 0;
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.7;
  font-style: italic;
}

.attr-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
}
.attr-cell {
  display: grid;
  grid-template-columns: 50px 1fr;
  align-items: center;
  gap: 8px;
}
.attr-key {
  font-size: 11px;
  color: var(--color-muted);
  font-weight: 700;
  letter-spacing: 1px;
}
.attr-val {
  display: flex;
  align-items: center;
}
.attr-bar {
  flex: 1;
  height: 6px;
  background: rgba(155, 108, 255, 0.15);
  border-radius: 3px;
  overflow: hidden;
}
.attr-bar span {
  display: block;
  width: var(--p, 50%);
  height: 100%;
  background: var(--gradient-gold);
  border-radius: 3px;
}

.related-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.related-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--color-panel-light);
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  font-size: 11px;
}
.rarity-ssr.related-item { border-color: var(--color-ssr); }
.rarity-sr.related-item { border-color: var(--color-sr); }
.related-emoji { font-size: 12px; }

/* 完整立绘预览 */
.image-preview {
  position: fixed;
  inset: 0;
  z-index: 520;
  display: grid;
  place-items: center;
  padding: 28px;
  background: rgba(0, 0, 0, 0.86);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.preview-image {
  width: min(92vw, 720px);
  height: min(88vh, 920px);
  object-fit: contain;
  filter: drop-shadow(0 0 26px rgba(246, 198, 107, 0.24));
}
.preview-close {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 2;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-panel);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-bright);
  font-size: 20px;
  cursor: pointer;
}
.preview-close:hover {
  background: var(--color-pink);
  color: #fff;
}

/* 过渡 */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s;
}
.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s, opacity 0.3s;
}
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-container { transform: scale(0.92); opacity: 0; }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-container { transform: scale(0.96); opacity: 0; }

.preview-enter-active, .preview-leave-active {
  transition: opacity 0.22s ease;
}
.preview-enter-active .preview-image,
.preview-leave-active .preview-image {
  transition: transform 0.22s ease, opacity 0.22s ease;
}
.preview-enter-from,
.preview-leave-to {
  opacity: 0;
}
.preview-enter-from .preview-image,
.preview-leave-to .preview-image {
  transform: scale(0.96);
  opacity: 0;
}
</style>
