<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import CurrencyBar from '@/components/layout/CurrencyBar.vue'
import StarField from '@/components/layout/StarField.vue'
import { useGachaStore } from '@/stores/gachaStore'

const store = useGachaStore()
let ticker: number | null = null

onMounted(() => {
  // 启动时先结算一次离线累积
  store.tick()
  // 每秒 tick 一次（每秒 push 货币 = 1/60 基础产出；按比例计算）
  ticker = window.setInterval(() => {
    store.tick()
  }, 1000)
})

onBeforeUnmount(() => {
  if (ticker) {
    clearInterval(ticker)
    ticker = null
  }
})
</script>

<template>
  <StarField />
  <div class="app-shell">
    <AppHeader>
      <template #right>
        <CurrencyBar />
      </template>
    </AppHeader>

    <main class="app-main">
      <router-view v-slot="{ Component, route }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </router-view>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.app-shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.app-main {
  flex: 1;
  width: 100%;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 24px;
}

/* 页面切换过渡 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
