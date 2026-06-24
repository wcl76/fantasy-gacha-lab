import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import Particles from '@tsparticles/vue3'
import { loadSlim } from '@tsparticles/slim'
import type { Engine } from '@tsparticles/engine'
import './assets/styles/global.css'

const app = createApp(App)

// @tsparticles/vue3 的 default export 是 install function (y)，
// 接收 (app, options) 注册 VueParticles 全局组件到 app
Particles(app, {
  init: async (engine: Engine) => {
    await loadSlim(engine)
  },
})

app.use(createPinia())
app.use(router)
app.mount('#app')
