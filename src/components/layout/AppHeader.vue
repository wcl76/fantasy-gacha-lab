<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

interface NavItem {
  name: string
  label: string
  labelEn: string
  icon: string          // unicode emoji 或简单符号
}

const navItems: NavItem[] = [
  { name: 'home',       label: '首页', labelEn: 'HOME',       icon: '🏠' },
  { name: 'summon',     label: '召唤', labelEn: 'SUMMON',     icon: '✦' },
  { name: 'collection', label: '图鉴', labelEn: 'COLLECTION', icon: '📖' },
  { name: 'records',    label: '记录', labelEn: 'RECORDS',    icon: '📋' },
  { name: 'events',     label: '活动', labelEn: 'EVENTS',     icon: '🎁' },
  { name: 'shop',       label: '商店', labelEn: 'SHOP',       icon: '🛍️' },
  { name: 'profile',    label: '我的', labelEn: 'PROFILE',    icon: '👤' },
]

const activeName = computed(() => route.name as string)

function go(name: string) {
  if (activeName.value === name) return
  router.push({ name }).catch(() => {})
}
</script>

<template>
  <header class="app-header">
    <div class="header-inner">
      <!-- Logo -->
      <router-link to="/" class="logo" aria-label="Fantasy Gacha Lab">
        <div class="logo-icon">
          <span class="logo-star">✦</span>
        </div>
        <div class="logo-text">
          <div class="logo-title">Fantasy <span class="logo-accent">Gacha Lab</span></div>
          <div class="logo-sub">幻想召唤研究所</div>
        </div>
      </router-link>

      <!-- 导航 -->
      <nav class="nav">
        <button
          v-for="item in navItems"
          :key="item.name"
          class="nav-item"
          :class="{ active: activeName === item.name }"
          @click="go(item.name)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">
            <span class="nav-label-zh">{{ item.label }}</span>
            <span class="nav-label-en">{{ item.labelEn }}</span>
          </span>
        </button>
      </nav>

      <!-- 右侧留空（货币栏独立组件） -->
      <div class="header-slot">
        <slot name="right" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--header-height);
  background: linear-gradient(180deg, rgba(10, 14, 32, 0.95) 0%, rgba(10, 14, 32, 0.7) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border-soft);
}

.header-inner {
  width: 100%;
  margin: 0 auto;
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: clamp(12px, 1.6vw, 32px);
  overflow: hidden;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--color-text);
  flex: 0 0 auto;
}
.logo-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: radial-gradient(circle, var(--color-purple-deep) 0%, transparent 70%);
  border: 1px solid var(--color-purple);
  border-radius: 50%;
  box-shadow: 0 0 16px var(--color-purple);
}
.logo-star {
  font-size: 22px;
  color: var(--color-gold-bright);
  text-shadow: 0 0 8px var(--color-gold);
}
.logo-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  line-height: 1.1;
  font-family: var(--font-display);
}
.logo-accent {
  color: var(--color-gold);
}
.logo-sub {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 2px;
  margin-top: 2px;
}

/* 导航 */
.nav {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  overflow: hidden;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 1 auto;
  min-width: 56px;
  padding: 10px clamp(10px, 1vw, 18px);
  border-radius: 10px;
  color: var(--color-muted);
  position: relative;
  transition: all 0.25s ease;
}
.nav-item:hover {
  color: var(--color-text-bright);
  background: var(--color-panel-light);
}
.nav-item.active {
  color: var(--color-gold);
  background: var(--color-panel);
  box-shadow:
    inset 0 0 0 1px var(--color-gold),
    0 0 16px rgba(246, 198, 107, 0.25);
}
.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: var(--gradient-gold);
  border-radius: 2px;
  box-shadow: 0 0 8px var(--color-gold);
}
.nav-icon {
  font-size: 16px;
  line-height: 1;
}
.nav-label {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.1;
}
.nav-label-zh {
  font-size: 14px;
  font-weight: 600;
}
.nav-label-en {
  font-size: 9px;
  letter-spacing: 1.5px;
  opacity: 0.7;
  margin-top: 2px;
}

.header-slot {
  flex: 0 1 auto;
  min-width: 0;
  max-width: min(44vw, 520px);
  display: flex;
  align-items: center;
}

@media (max-width: 1500px) {
  .header-inner {
    padding: 0 16px;
    gap: 12px;
  }

  .logo {
    gap: 8px;
  }

  .logo-title {
    font-size: 16px;
  }

  .logo-sub {
    font-size: 10px;
    letter-spacing: 1px;
  }

  .nav-item {
    gap: 6px;
    padding: 8px 10px;
  }

  .nav-label-en {
    letter-spacing: 1px;
  }

  .header-slot {
    max-width: 380px;
  }
}

@media (max-width: 1180px) {
  .logo-text {
    display: none;
  }

  .nav-label-en {
    display: none;
  }

  .nav-item {
    padding: 8px 9px;
  }
}
</style>
