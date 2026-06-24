/**
 * @tsparticles/vue3 模块的 default export 是 install function
 * 它注册了全局组件 'VueParticles'，我们在模板里用 <VueParticles> 即可
 */
declare module '@tsparticles/vue3' {
  import type { ISourceOptions, Engine } from '@tsparticles/engine'
  import type { App } from 'vue'

  interface ParticlesInstallOptions {
    init?: (engine: Engine) => void | Promise<void>
  }
  /** install function: 接收 app，调用 app.provide + app.component('VueParticles', ...) */
  const Particles: (app: App, options?: ParticlesInstallOptions) => void
  export default Particles
}
