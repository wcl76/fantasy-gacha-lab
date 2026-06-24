<script setup lang="ts">
/**
 * TsParticlesBg —— 通用 tsParticles 粒子背景组件
 * 引擎初始化在 main.ts 全局 Particles(app, { init }) 中完成
 * 这里只负责渲染 <VueParticles> 容器（VueParticles 由 vue3 全局注册）
 * 并暴露 container 给父组件
 */
import type { Container, ISourceOptions } from '@tsparticles/engine'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  /** 粒子配置 */
  options: ISourceOptions
  /** ID 必需：容器 id */
  id: string
  /** 是否启用 */
  enabled?: boolean
}>(), { enabled: true })

const init = ref(false)
const container = ref<Container | null>(null)

function onLoaded(c: Container) {
  container.value = c
  emit('ready', c)
}

const emit = defineEmits<{
  ready: [container: Container]
}>()

onMounted(() => { init.value = true })
onBeforeUnmount(() => { init.value = false; container.value = null })

defineExpose({
  /** 获取底层 tsParticles container（类型宽松） */
  getContainer: () => container.value as unknown as Container | null,
})
</script>

<template>
  <VueParticles
    v-if="init"
    :id="id"
    class="tsparticles-bg"
    :options="options"
    @particles-loaded="onLoaded"
  />
</template>

<style scoped>
.tsparticles-bg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
</style>
