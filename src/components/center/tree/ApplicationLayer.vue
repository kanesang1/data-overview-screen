<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import applicationNodeActive from '@/assets/img/center/tree/two/application-node-active.svg'
import applicationNodeDefault from '@/assets/img/center/tree/two/application-node-default.svg'
import type { TreeNode } from '../types'
import { getArcStyle, type ArcLayout } from './arc-layout'
import { dashboardLabels } from '@/config/dashboard-labels'

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
const rotationStepDuration = 4200
const backTrackInset = 7
const backTrackLift = 1.8
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

const getLoopStyle = (slot: number) => {
  const lastSlot = getLastTrackSlot()
  const count = lastSlot + 1
  const trackSlot = Math.min(lastSlot, Math.max(0, slot))
  const position = getArcStyle(trackSlot, count, applicationArc)
  if (slot >= 0 && slot <= lastSlot) return position

  const entering = slot > lastSlot
  const turnProgress = Math.min(1, Math.abs(slot - (entering ? lastSlot : 0)))
  const horizontalInset = backTrackInset * Math.sin(turnProgress * Math.PI / 2)
  const backArcLift = backTrackLift * Math.sin(turnProgress * Math.PI)
  return {
    left: `${entering ? applicationArc.leftEnd - horizontalInset : applicationArc.leftStart + horizontalInset}%`,
    top: `${applicationArc.edgeTop - backArcLift}%`,
  }
}

const getNodeStyle = (index: number) => {
  const slot = getSlot(index)
  const nodeVisible = isVisible(index)
  const lastSlot = getLastTrackSlot()
  const backTrack = slot < 0 || slot > lastSlot
  const position = nodeVisible ? getLoopStyle(slot) : getArcStyle(lastSlot, visibleCount.value, applicationArc)
  const edgeOpacity = slot < 0 ? slot + 1 : slot > lastSlot ? lastSlot + 1 - slot : 1
  const trackProgress = Math.min(1, Math.max(0, slot / lastSlot))
  const frontDepth = Math.sin(Math.PI * trackProgress)
  const frontOpacity = 0.38 + 0.62 * frontDepth
  const opacity = backTrack
    ? 0.38 * Math.sqrt(Math.max(0, Math.min(1, edgeOpacity)))
    : frontOpacity
  return {
    ...position,
    zIndex: backTrack ? 1 : Math.round(10 + frontDepth * 10),
    opacity: nodeVisible ? opacity : 0,
    visibility: nodeVisible ? ('visible' as const) : ('hidden' as const),
    pointerEvents: nodeVisible && !backTrack ? ('auto' as const) : ('none' as const),
  }
}

const updateVisibleCount = (width: number) => {
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
    updateVisibleCount(layerElement.value.getBoundingClientRect().width)
    resizeObserver = new ResizeObserver(([entry]) => updateVisibleCount(entry.contentRect.width))
    resizeObserver.observe(layerElement.value)
  }
  start()
})

onBeforeUnmount(() => { stop(); resizeObserver?.disconnect() })
</script>

<template>
  <section
    ref="layerElement"
    class="tree-layer"
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
      :class="{ 'is-active': selectedId === node.id, 'is-back-track': isBackTrack(index) }"
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
    </button>
  </section>
</template>

<style scoped>
.application-node { top: 27.2%; width: 12%; will-change: top, left, opacity; }
.application-visual { position: relative; display: block; width: 4.4146cqw; height: 4.1147cqw; margin: 0 auto; overflow: visible; transition: filter .25s ease, transform .25s ease; }
.application-icon { display: block; width: 100%; height: 100%; object-fit: contain; }
.application-node .node-label { display: -webkit-box; min-height: 2.5em; overflow: hidden; color: rgba(255,255,255,.70); font-size: 1.3436cqw; font-weight: 400; line-height: 1.25; white-space: normal; overflow-wrap: anywhere; transition: opacity .2s ease; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.application-node.is-back-track .node-label { opacity: .22; }
.application-node.is-back-track .application-icon { filter: brightness(.78) saturate(.72); }
.application-node.is-active .application-visual { transform: translateY(-.2879cqw); filter: drop-shadow(0 0 .7678cqw #63dcff); }
.application-node.is-active .node-label { color: #fff; font-weight: 700; }
@media (prefers-reduced-motion: reduce) { .application-node { transition: none; } }
</style>
