import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页 · Fantasy Gacha Lab' },
  },
  {
    path: '/summon',
    name: 'summon',
    component: () => import('@/views/SummonView.vue'),
    meta: { title: '召唤 · Fantasy Gacha Lab' },
  },
  {
    path: '/result',
    name: 'result',
    component: () => import('@/views/ResultView.vue'),
    meta: { title: '召唤结果 · Fantasy Gacha Lab' },
  },
  {
    path: '/collection',
    name: 'collection',
    component: () => import('@/views/CollectionView.vue'),
    meta: { title: '图鉴 · Fantasy Gacha Lab' },
  },
  {
    path: '/records',
    name: 'records',
    component: () => import('@/views/RecordsView.vue'),
    meta: { title: '记录 · Fantasy Gacha Lab' },
  },
  {
    path: '/shop',
    name: 'shop',
    component: () => import('@/views/ShopView.vue'),
    meta: { title: '商店 · Fantasy Gacha Lab' },
  },
  {
    path: '/events',
    name: 'events',
    component: () => import('@/views/EventsView.vue'),
    meta: { title: '活动 · Fantasy Gacha Lab' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { title: '个人中心 · Fantasy Gacha Lab' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  // GitHub Pages 推荐使用 hash 路由，避免刷新 404
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }
})

export default router
