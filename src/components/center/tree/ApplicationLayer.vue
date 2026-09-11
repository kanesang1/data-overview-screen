<!-- 应用数据层：负责节点沿弧形轨道循环展示、悬停暂停及详情提示。 -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import applicationNodeActive from '@/assets/img/center/tree/two/application-node-active.svg'
import applicationNodeDefault from '@/assets/img/center/tree/two/application-node-default.svg'
import type { TreeNode } from '../types'
import type { ArcLayout } from './arc-layout'
import { dashboardLabels } from '@/config/dashboard-labels'
import NodeDataTooltip from './components/NodeDataTooltip.vue'

const props = defineProps<{ nodes: TreeNode[] }>()

const applicationArc: ArcLayout = { leftStart: 14.5, leftEnd: 74, edgeTop: 23, centerTop: 31.5 }
const layerElement = ref<HTMLElement | null>(null)
const visibleCount = ref(7)
const carouselPosition = ref(0)
const isPaused = ref(false)
const selectedId = ref<number | null>(null)
const nodeMinWidth = 110
const minimumVisibleCount = 7
const maximumVisibleCount = 7
const arcUsableWidthRatio = 0.76
const rotationStepDuration = 12000
const backTrackInset = 7
const backTrackLift = 1.8
const layerSize = ref({ width: 0, height: 0 })
let animationFrame: number | undefined
let animationTimestamp: number | undefined
let resizeObserver: ResizeObserver | undefined

const getSlot = (index: number) => {
  if (props.nodes.length === 0) return 0
  let slot = index - carouselPosition.value
  if (slot < -1) slot += props.nodes.length
  return slot
}

const getLastTrackSlot = () => Math.max(1, visibleCount.value - 2)

const isVisible = (index: number) => {
  const slot = getSlot(index)
  const lastSlot = getLastTrackSlot()
  return slot > -1 && slot < lastSlot + 1
}

const isInteractive = (index: number) => {
  const slot = getSlot(index)
  return slot >= 0 && slot <= getLastTrackSlot()
}

const isBackTrack = (index: number) => !isInteractive(index)

const visibleIds = computed(() => new Set(
  props.nodes.filter((_, index) => isInteractive(index)).map(node => node.id),
))

const isTooltipEligible = (index: number) => {
  const slot = getSlot(index)
  const lastSlot = getLastTrackSlot()
  return slot > 0 && slot < lastSlot
}

const hasActiveTooltip = computed(() => props.nodes.some(
  (node, index) => node.id === selectedId.value && isTooltipEligible(index),
))

const getFrontTrackPosition = (slot: number, lastSlot: number) => {
  const progress = Math.min(1, Math.max(0, slot / lastSlot))
  const arcProgress = 4 * progress * (1 - progress)
  return {
    left: applicationArc.leftStart + (applicationArc.leftEnd - applicationArc.leftStart) * progress,
    top: applicationArc.edgeTop + (applicationArc.centerTop - applicationArc.edgeTop) * arcProgress,
  }
}

const getLoopStyle = (slot: number) => {
  const lastSlot = getLastTrackSlot()
  if (slot >= 0 && slot <= lastSlot) return getFrontTrackPosition(slot, lastSlot)

  const entering = slot > lastSlot
  const turnProgress = Math.min(1, Math.abs(slot - (entering ? lastSlot : 0)))
  const horizontalInset = backTrackInset * Math.sin(turnProgress * Math.PI / 2)
  const backArcLift = backTrackLift * Math.sin(turnProgress * Math.PI)
  return {
    left: entering ? applicationArc.leftEnd - horizontalInset : applicationArc.leftStart + horizontalInset,
    top: applicationArc.edgeTop - backArcLift,
  }
}

const getCompositedPosition = (position: { left: number; top: number }) => {
  if (layerSize.value.width === 0 || layerSize.value.height === 0) {
    return { left: `${position.left}%`, top: `${position.top}%` }
  }
  return {
    left: 0,
    top: 0,
    transform: `translate3d(${position.left * layerSize.value.width / 100}px, ${position.top * layerSize.value.height / 100}px, 0)`,
  }
}

const getNodeStyle = (index: number) => {
  const slot = getSlot(index)
  const nodeVisible = isVisible(index)
  const lastSlot = getLastTrackSlot()
  const backTrack = slot < 0 || slot > lastSlot
  const position = nodeVisible ? getLoopStyle(slot) : getFrontTrackPosition(lastSlot, lastSlot)
  const edgeOpacity = slot < 0 ? slot + 1 : slot > lastSlot ? lastSlot + 1 - slot : 1
  const trackProgress = Math.min(1, Math.max(0, slot / lastSlot))
  const frontDepth = Math.sin(Math.PI * trackProgress)
  const frontOpacity = 0.38 + 0.62 * frontDepth
  const opacity = backTrack
    ? 0.38 * Math.sqrt(Math.max(0, Math.min(1, edgeOpacity)))
    : frontOpacity
  return {
    ...getCompositedPosition(position),
    zIndex: selectedId.value === props.nodes[index]?.id ? 40 : backTrack ? 1 : Math.round(10 + frontDepth * 10),
    '--node-opacity': nodeVisible ? opacity : 0,
    visibility: nodeVisible ? ('visible' as const) : ('hidden' as const),
    pointerEvents: nodeVisible && !backTrack ? ('auto' as const) : ('none' as const),
  }
}

const updateLayout = (width: number, height: number) => {
  layerSize.value = { width, height }
  const maxCount = Math.floor(width * arcUsableWidthRatio / nodeMinWidth)
  visibleCount.value = Math.min(maximumVisibleCount, props.nodes.length, Math.max(minimumVisibleCount, maxCount))
}

const rotateNodes = (timestamp: number) => {
  if (animationTimestamp === undefined) animationTimestamp = timestamp
  const elapsed = Math.min(timestamp - animationTimestamp, 100)
  carouselPosition.value = props.nodes.length > 0
    ? (carouselPosition.value + elapsed / rotationStepDuration) % props.nodes.length
    : 0
  animationTimestamp = timestamp
  animationFrame = requestAnimationFrame(rotateNodes)
}

const stop = () => {
  if (animationFrame !== undefined) cancelAnimationFrame(animationFrame)
  animationFrame = undefined
  animationTimestamp = undefined
}

const start = () => {
  stop()
  if (!isPaused.value) animationFrame = requestAnimationFrame(rotateNodes)
}

const pause = () => { isPaused.value = true; stop() }
const resume = () => { isPaused.value = false; start() }

onMounted(() => {
  if (layerElement.value) {
    const bounds = layerElement.value.getBoundingClientRect()
    updateLayout(bounds.width, bounds.height)
    resizeObserver = new ResizeObserver(([entry]) => updateLayout(entry.contentRect.width, entry.contentRect.height))
    resizeObserver.observe(layerElement.value)
  }
  start()
})

onBeforeUnmount(() => { stop(); resizeObserver?.disconnect() })

watch(() => props.nodes.length, (nodeCount) => {
  carouselPosition.value = nodeCount > 0 ? carouselPosition.value % nodeCount : 0
  if (layerElement.value) {
    const bounds = layerElement.value.getBoundingClientRect()
    updateLayout(bounds.width, bounds.height)
  }
})
</script>

<template>
  <section
    ref="layerElement"
    class="tree-layer"
    :class="{ 'has-active-tooltip': hasActiveTooltip }"
    aria-label="应用数据，顺时针自动轮播"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="resume"
  >
    <h2 class="layer-title layer-title--application">{{ dashboardLabels.centerTree.application.title }}</h2>
    <button
      v-for="(node, index) in nodes"
      :key="node.id"
      class="tree-node application-node"
      :class="{ 'is-active': selectedId === node.id, 'is-back-track': isBackTrack(index), 'can-show-tooltip': isTooltipEligible(index) }"
      :style="getNodeStyle(index)"
      type="button"
      :aria-pressed="selectedId === node.id"
      :aria-hidden="!visibleIds.has(node.id)"
      :tabindex="visibleIds.has(node.id) ? 0 : -1"
      @mouseenter="selectedId = node.id"
      @mouseleave="selectedId = null"
      @focus="selectedId = node.id"
      @blur="selectedId = null"
    >
      <span class="application-visual">
        <img class="application-icon" :src="selectedId === node.id ? applicationNodeActive : applicationNodeDefault" alt="" />
      </span>
      <span class="node-label">{{ node.label }}</span>
      <NodeDataTooltip v-if="node.tooltip" :data="node.tooltip" />
    </button>
  </section>
</template>

<style scoped>
.application-node { top: 27.2%; width: 12%; will-change: transform, opacity; backface-visibility: hidden; }
.tree-layer.has-active-tooltip { z-index: 200; }
.application-visual { position: relative; display: block; width: 4.4146cqw; height: 4.1147cqw; margin: 0 auto; overflow: visible; opacity: var(--node-opacity, 1); transition: filter .25s ease; }
.application-icon { display: block; width: 100%; height: 100%; object-fit: contain; }
.application-node .node-label { display: -webkit-box; min-height: 2.5em; overflow: hidden; color: rgba(255,255,255,.70); font-size: 1.3436cqw; font-weight: 400; line-height: 1.25; white-space: normal; overflow-wrap: anywhere; opacity: var(--node-opacity, 1); transition: opacity .2s ease; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.application-node.is-back-track .node-label { opacity: calc(var(--node-opacity, 1) * .58); }
.application-node.is-back-track .application-icon { filter: brightness(.78) saturate(.72); }
.application-node.is-active .application-visual { filter: drop-shadow(0 0 .7678cqw #63dcff); }
.application-node.is-active .node-label { color: #fff; font-weight: 700; }
.application-node :deep(.node-data-tooltip) { width: max-content; max-width: 22cqw; }
.application-node.is-active.can-show-tooltip :deep(.node-data-tooltip) { display: block; }
@media (prefers-reduced-motion: reduce) { .application-node { transition: none; } }
</style>
