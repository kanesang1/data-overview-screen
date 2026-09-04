<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getDataSource } from '@/api'
import type { DataSourceData } from '@/api'
import { dashboardLabels } from '@/config/dashboard-labels'
import sourceCenterMark from '@/assets/img/center/tree/four/source-center-marker.svg'
import sourceOrbDefault from '@/assets/img/center/tree/four/source-node-default.png'
import sourceOrbActive from '@/assets/img/center/tree/four/source-node-active.png'
import type { TreeNode } from '../types'

const sourceDefinitions: Array<{ key: keyof DataSourceData; label: string }> = [
  { key: 'actual', label: dashboardLabels.centerTree.source.fieldLabels.actual },
  { key: 'simulation', label: dashboardLabels.centerTree.source.fieldLabels.simulation },
  { key: 'imported', label: dashboardLabels.centerTree.source.fieldLabels.imported },
  { key: 'yellow_sea', label: dashboardLabels.centerTree.source.fieldLabels.yellow_sea },
  { key: 'bohai', label: dashboardLabels.centerTree.source.fieldLabels.bohai },
  { key: 'east_sea', label: dashboardLabels.centerTree.source.fieldLabels.east_sea },
]
const nodes = ref<TreeNode[]>(sourceDefinitions.map((item, index) => ({ id: index + 1, label: item.label, value: '--', unit: dashboardLabels.centerTree.source.fieldUnit })))
const selectedId = ref<number | null>(null)

onMounted(async () => {
  try {
    const response = await getDataSource()
    if (response.code !== 200 || !response.data) return
    nodes.value = sourceDefinitions.map((item, index) => ({
      id: index + 1,
      label: item.label,
      value: String(response.data[item.key]),
      unit: dashboardLabels.centerTree.source.fieldUnit,
    }))
  } catch (error) {
    console.error('[数据来源] 加载失败：', error)
  }
})
</script>

<template>
  <section class="tree-layer" :aria-label="dashboardLabels.centerTree.source.title">
    <h2 class="layer-title layer-title--source">{{ dashboardLabels.centerTree.source.title }}</h2>
    <img class="source-center-mark" :src="sourceCenterMark" alt="" />
    <button
      v-for="node in nodes"
      :key="node.id"
      class="tree-node source-node"
      :class="{ 'is-active': selectedId === node.id }"
      type="button"
      :aria-pressed="selectedId === node.id"
      @mouseenter="selectedId = node.id"
      @mouseleave="selectedId = null"
      @focus="selectedId = node.id"
      @blur="selectedId = null"
    >
      <span class="source-orb">
        <img class="source-orb-background source-orb-background--default" :src="sourceOrbDefault" alt="" />
        <img class="source-orb-background source-orb-background--active" :src="sourceOrbActive" alt="" />
        <span class="source-orb-active-core"><img :src="sourceOrbActive" alt="" /></span>
        <b>{{ node.value }}</b><small>{{ node.unit }}</small>
      </span>
      <span class="node-label">{{ node.label }}</span>
    </button>
  </section>
</template>

<style scoped>
.source-node { top: 72.5%; width: 12%; }
.source-node:nth-of-type(1) { left: 10.5%; top: 68.8%; }
.source-node:nth-of-type(2) { left: 22%; top: 74.2%; }
.source-node:nth-of-type(3) { left: 34%; top: 77.2%; }
.source-node:nth-of-type(4) { left: 52%; top: 77.2%; }
.source-node:nth-of-type(5) { left: 64%; top: 74.2%; }
.source-node:nth-of-type(6) { left: 77.5%; top: 68.8%; }
.source-center-mark { position: absolute; left: 50%; top: 77.2%; width: 8.1574cqw; height: 7.4856cqw; transform: translateX(-50%); object-fit: contain; pointer-events: none; }
.source-orb { position: relative; display: flex; width: 7.4856cqw; height: 7.4856cqw; margin: 0 auto; flex-direction: column; align-items: center; justify-content: center; animation: source-orb-breathe 3s ease-in-out infinite; will-change: transform; }
.source-node:nth-of-type(2n) .source-orb { animation-delay: -.75s; }
.source-node:nth-of-type(3n) .source-orb { animation-delay: -1.5s; }
.source-orb-background { position: absolute; z-index: 0; top: 50%; left: 50%; transform: translate(-50%, -50%); object-fit: contain; pointer-events: none; transition: opacity .12s ease; }
.source-orb-background--default { width: 7.4856cqw; height: 7.4856cqw; opacity: 1; }
.source-orb-background--active { width: 10.5566cqw; height: 10.5566cqw; opacity: 0; }
.source-orb-active-core { position: absolute; z-index: 1; top: 50%; left: 50%; width: 8.4453cqw; height: 8.4453cqw; overflow: hidden; border-radius: 50%; opacity: 0; transform: translate(-50%, -50%); pointer-events: none; transition: opacity .12s ease; }
.source-orb-active-core img { position: absolute; top: 50%; left: 50%; width: 14.4914cqw; height: 14.4914cqw; max-width: none; transform: translate(-50%, -50%); object-fit: contain; }
.source-orb b { position: relative; z-index: 2; color: rgba(255,255,255,.80); text-align: center; font-size: 1.7274cqw; font-weight: 700; line-height: normal; }
.source-orb small { position: relative; z-index: 2; color: rgba(255,255,255,.70); font-size: 1.1516cqw; font-weight: 400; line-height: normal; }
.source-node .node-label { color: rgba(255,255,255,.70); font-size: 1.3436cqw; font-weight: 400; line-height: normal; }
.source-node.is-active .source-orb-background--default { opacity: 0; }
.source-node.is-active .source-orb-background--active, .source-node.is-active .source-orb-active-core { opacity: 1; }
.source-node.is-active .source-orb b { color: #fff; font-size: 1.9194cqw; }
.source-node.is-active .node-label { color: #fff; font-weight: 700; }
@keyframes source-orb-breathe {
  0%, 100% { transform: translateY(.2879cqw) scale(.985); }
  50% { transform: translateY(-.7678cqw) scale(1.025); }
}
@media (prefers-reduced-motion: reduce) { .source-orb { animation: none; } }
</style>
