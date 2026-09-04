<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import nodeActive from '@/assets/img/center/tree/node-active.png'
import nodeInactive from '@/assets/img/center/tree/node-inactive.png'
import serviceIconDefault from '@/assets/img/center/tree/one/service-node-01.png'
import serviceIconActive from '@/assets/img/center/tree/one/service-node-02.png'
import type { TreeNode } from '../types'
import { getArcStyle, type ArcLayout } from './arc-layout'
import { dashboardLabels } from '@/config/dashboard-labels'

const props = defineProps<{ nodes: TreeNode[] }>()

const serviceArc: ArcLayout = { leftStart: 19.5, leftEnd: 67.4, edgeTop: 1, centerTop: 4.95 }
const selectedId = ref<number | null>(null)
const carouselInterval = 2500
let carouselTimer: ReturnType<typeof setInterval> | undefined

const selectNextNode = () => {
  if (props.nodes.length === 0) return
  const currentIndex = props.nodes.findIndex(node => node.id === selectedId.value)
  selectedId.value = props.nodes[(currentIndex + 1) % props.nodes.length].id
}

const stopCarousel = () => {
  if (carouselTimer) clearInterval(carouselTimer)
  carouselTimer = undefined
}

const startCarousel = () => {
  stopCarousel()
  carouselTimer = setInterval(selectNextNode, carouselInterval)
}

const selectNode = (id: number) => {
  stopCarousel()
  selectedId.value = id
}

onMounted(() => {
  selectNextNode()
  startCarousel()
})
onBeforeUnmount(stopCarousel)
</script>

<template>
  <section class="tree-layer" :aria-label="dashboardLabels.centerTree.service.title">
    <h2 class="layer-title layer-title--service">{{ dashboardLabels.centerTree.service.title }}</h2>
    <button
      v-for="(node, index) in nodes"
      :key="node.id"
      class="tree-node service-node"
      :class="{ 'is-active': selectedId === node.id }"
      :style="getArcStyle(index, nodes.length, serviceArc)"
      type="button"
      :aria-pressed="selectedId === node.id"
      @mouseenter="selectNode(node.id)"
      @mouseleave="startCarousel"
      @focus="selectNode(node.id)"
      @blur="startCarousel"
    >
      <span class="service-visual">
        <img class="service-base" :src="selectedId === node.id ? nodeActive : nodeInactive" alt="" />
        <img class="service-icon" :src="selectedId === node.id ? serviceIconActive : serviceIconDefault" alt="" />
      </span>
      <span class="node-label">{{ node.label }}</span>
      <span class="node-metric"><b>{{ node.value }}</b><small>{{ node.unit }}</small></span>
    </button>
  </section>
</template>

<style scoped>
.service-node { top: 1.2%; }
.service-visual { position: relative; display: block; width: 8.4453cqw; height: 8.4453cqw; margin: 0 auto; }
.service-base { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; transition: filter .25s ease, transform .25s ease; }
.service-icon { position: absolute; top: .4798cqw; left: 50%; width: 5.4702cqw; height: 5.4702cqw; transform: translateX(-50%); transition: filter .25s ease, transform .25s ease; }
.service-node:not(.is-active) .service-visual { opacity: .78; }
.service-node.is-active .service-icon { filter: drop-shadow(0 0 .7678cqw #9cf4ff); transform: translateX(-50%) translateY(-.2879cqw); }
.service-node .node-label { color: rgba(255,255,255,.70); font-size: 1.3436cqw; font-weight: 400; line-height: normal; }
.service-node .node-metric b { color: #95e5ff; font-size: 1.5355cqw; font-weight: 700; }
.service-node .node-metric small { color: rgba(255,255,255,.60); font-size: 1.1516cqw; font-weight: 400; }
.service-node.is-active .node-label { color: #fff; font-weight: 700; }
</style>
