<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import nodeBaseActive from '@/assets/img/center/tree/node-base-active.png'
import nodeBaseDefault from '@/assets/img/center/tree/node-base-default.png'
import scenarioNodeBase from '@/assets/img/center/tree/three/scenario-node-base.png'
import type { TreeNode } from '../types'
import { getArcStyle, type ArcLayout } from './arc-layout'
import { dashboardLabels } from '@/config/dashboard-labels'

const props = defineProps<{ scenarioNodes: TreeNode[]; foundationNodes: TreeNode[] }>()

type FoundationArcLayout = {
  leftStart: number
  leftEnd: number
  edgeTop: number
  boundaryCenterTop: number
  centerLift: number
  centerLiftRadius: number
}

const scenarioArc: ArcLayout = { leftStart: 16, leftEnd: 72, edgeTop: 40.3, centerTop: 46.56 }
const foundationArc: FoundationArcLayout = {
  leftStart: 0,
  leftEnd: 90,
  edgeTop: 36.5,
  boundaryCenterTop: 54.5,
  centerLift: 1.8,
  centerLiftRadius: 0.5,
}
const selectedScenarioId = ref<number | null>(null)
const selectedFoundationId = ref<number | null>(null)
const carouselInterval = 2500
let foundationCarouselTimer: ReturnType<typeof setInterval> | undefined

const selectNextFoundation = () => {
  if (props.foundationNodes.length === 0) return
  const currentIndex = props.foundationNodes.findIndex(node => node.id === selectedFoundationId.value)
  selectedFoundationId.value = props.foundationNodes[(currentIndex + 1) % props.foundationNodes.length].id
}

const stopFoundationCarousel = () => {
  if (foundationCarouselTimer) clearInterval(foundationCarouselTimer)
  foundationCarouselTimer = undefined
}

const startFoundationCarousel = () => {
  stopFoundationCarousel()
  foundationCarouselTimer = setInterval(selectNextFoundation, carouselInterval)
}

const selectFoundation = (id: number) => {
  stopFoundationCarousel()
  selectedFoundationId.value = id
}

onMounted(() => {
  selectNextFoundation()
  startFoundationCarousel()
})
onBeforeUnmount(stopFoundationCarousel)

const getFoundationTop = (progress: number) => {
  const distanceFromCenter = Math.abs(progress - 0.5) * 2
  const ellipseProgress = Math.sqrt(Math.max(0, 1 - distanceFromCenter ** 2))
  const boundaryTop = foundationArc.edgeTop
    + (foundationArc.boundaryCenterTop - foundationArc.edgeTop) * ellipseProgress
  const liftProgress = Math.max(0, 1 - distanceFromCenter / foundationArc.centerLiftRadius)
  return boundaryTop - foundationArc.centerLift * liftProgress ** 2
}

const getFoundationArcStyle = (index: number, count: number) => {
  if (count <= 1) return { left: `${(foundationArc.leftStart + foundationArc.leftEnd) / 2}%`, top: `${getFoundationTop(0.5)}%` }
  const sampleCount = 120
  const points = Array.from({ length: sampleCount + 1 }, (_, sampleIndex) => {
    const progress = sampleIndex / sampleCount
    return { progress, x: (foundationArc.leftStart + (foundationArc.leftEnd - foundationArc.leftStart) * progress) * 10.42, y: getFoundationTop(progress) * 8.5 }
  })
  const lengths = points.reduce<number[]>((result, point, pointIndex) => {
    if (pointIndex === 0) result.push(0)
    else result.push(result[pointIndex - 1] + Math.hypot(point.x - points[pointIndex - 1].x, point.y - points[pointIndex - 1].y))
    return result
  }, [])
  const targetLength = lengths[lengths.length - 1] * index / (count - 1)
  const upperIndex = lengths.findIndex(length => length >= targetLength)
  if (upperIndex <= 0) return { left: `${foundationArc.leftStart}%`, top: `${getFoundationTop(0)}%` }
  const segmentProgress = (targetLength - lengths[upperIndex - 1]) / (lengths[upperIndex] - lengths[upperIndex - 1] || 1)
  const progress = points[upperIndex - 1].progress + (points[upperIndex].progress - points[upperIndex - 1].progress) * segmentProgress
  const previousProgress = Math.max(0, progress - 0.002)
  const nextProgress = Math.min(1, progress + 0.002)
  const tangentAngle = Math.atan2(
    (getFoundationTop(nextProgress) - getFoundationTop(previousProgress)) * 8.5,
    (nextProgress - previousProgress) * (foundationArc.leftEnd - foundationArc.leftStart) * 10.42,
  ) * 180 / Math.PI
  return {
    left: `${foundationArc.leftStart + (foundationArc.leftEnd - foundationArc.leftStart) * progress}%`,
    top: `${getFoundationTop(progress)}%`,
    '--foundation-rotation': `${Math.max(-6, Math.min(6, tangentAngle * 0.35))}deg`,
  }
}
</script>

<template>
  <section class="tree-layer" :aria-label="dashboardLabels.centerTree.foundation.title">
    <h2 class="layer-title layer-title--foundation">{{ dashboardLabels.centerTree.foundation.title }}</h2>
    <button
      v-for="(node, index) in scenarioNodes"
      :key="`scenario-${node.id}`"
      class="scenario-node"
      :class="{ 'is-active': selectedScenarioId === node.id }"
      :style="getArcStyle(index, scenarioNodes.length, scenarioArc)"
      type="button"
      :aria-pressed="selectedScenarioId === node.id"
      @mouseenter="selectedScenarioId = node.id"
      @mouseleave="selectedScenarioId = null"
      @focus="selectedScenarioId = node.id"
      @blur="selectedScenarioId = null"
    >
      <span class="scenario-visual">
        <img class="scenario-base" :src="scenarioNodeBase" alt="" />
        <img v-if="selectedScenarioId === node.id" class="scenario-glow" :src="nodeBaseActive" alt="" />
        <img class="scenario-icon" :src="node.icon" alt="" />
      </span>
      <span class="node-label">{{ node.label }}</span>
    </button>

    <button
      v-for="(node, index) in foundationNodes"
      :key="`foundation-${node.id}`"
      class="tree-node foundation-node"
      :class="{ 'is-active': selectedFoundationId === node.id }"
      :style="getFoundationArcStyle(index, foundationNodes.length)"
      type="button"
      :aria-pressed="selectedFoundationId === node.id"
      @mouseenter="selectFoundation(node.id)"
      @mouseleave="startFoundationCarousel"
      @focus="selectFoundation(node.id)"
      @blur="startFoundationCarousel"
    >
      <span class="foundation-visual">
        <img class="foundation-base" :src="nodeBaseDefault" alt="" />
        <img v-if="selectedFoundationId === node.id" class="foundation-glow" :src="nodeBaseActive" alt="" />
        <img class="foundation-icon" :src="node.icon" alt="" />
      </span>
      <span class="node-label">{{ node.label }}</span>
      <span class="node-metric"><b>{{ node.value }}</b><small>{{ node.unit }}</small></span>
    </button>
  </section>
</template>

<style scoped>
.scenario-node { position: absolute; top: 45.2%; width: 12%; padding: 0; border: 0; color: inherit; text-align: center; background: transparent; cursor: pointer; font-family: inherit; outline: none; }
.scenario-visual { position: relative; display: block; width: 7.2937cqw; height: 4.9904cqw; margin: 0 auto; }
.scenario-base { position: absolute; left: 50%; bottom: -.6718cqw; width: 7.2937cqw; height: 4.9904cqw; transform: translateX(-50%); object-fit: contain; }
.scenario-glow { position: absolute; z-index: 1; left: 50%; bottom: -.6718cqw; width: 6.334cqw; height: 5.2783cqw; transform: translateX(-50%); object-fit: contain; pointer-events: none; }
.scenario-icon { position: absolute; z-index: 2; left: 50%; bottom: 1.3436cqw; width: 2.3033cqw; height: 2.3033cqw; transform: translateX(-50%); object-fit: contain; }
.scenario-node .node-label { color: rgba(255,255,255,.70); font-size: 1.3436cqw; font-weight: 400; line-height: normal; }
.scenario-node.is-active .scenario-visual { filter: brightness(1.2) drop-shadow(0 0 .7678cqw rgba(82,219,255,.85)); }
.scenario-node.is-active .scenario-icon { filter: brightness(1.4); }
.scenario-node.is-active .node-label { color: #fff; font-weight: 700; }
.scenario-node:focus-visible .node-label { text-decoration: underline; text-decoration-color: rgba(149,229,255,.8); text-underline-offset: .2879cqw; }
.foundation-node { top: 48.5%; width: 10.5%; transform: rotate(var(--foundation-rotation, 0deg)); transform-origin: 50% 50%; }
.foundation-visual { position: relative; display: block; width: 9.405cqw; height: 7.8695cqw; margin: 0 auto; transition: filter .25s ease, transform .25s ease; }
.foundation-base, .foundation-glow { position: absolute; left: 50%; bottom: 0; width: 9.405cqw; height: 7.8695cqw; transform: translateX(-50%); object-fit: contain; }
.foundation-glow { z-index: 1; pointer-events: none; }
.foundation-icon { position: absolute; z-index: 2; left: 50%; bottom: 2.3033cqw; width: 4.0307cqw; height: 5.3743cqw; transform: translateX(-50%); }
.foundation-node.is-active .foundation-visual { filter: brightness(1.18) drop-shadow(0 0 .8637cqw rgba(81,218,255,.8)); }
.foundation-node.is-active .foundation-icon { filter: brightness(1.5); }
.foundation-node .node-label { margin-top: -.3839cqw; color: rgba(255,255,255,.70); font-size: 1.3436cqw; font-weight: 400; line-height: normal; }
.foundation-node .node-metric { margin-top: .1919cqw; }
.foundation-node .node-metric b { color: rgba(149,229,255,.80); font-size: 1.5355cqw; font-weight: 700; }
.foundation-node .node-metric small { color: rgba(255,255,255,.60); font-size: 1.1516cqw; font-weight: 400; }
.foundation-node.is-active .node-label { color: #fff; font-weight: 700; }
.foundation-node.is-active .node-metric b { color: #95e5ff; }
</style>
