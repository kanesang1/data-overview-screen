<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import nodeBaseActive from '@/assets/img/center/tree/node-base-active.png'
import nodeBaseDefault from '@/assets/img/center/tree/node-base-default.png'
import scenarioNodeBase from '@/assets/img/center/tree/three/scenario-node-base.png'
import type { TreeNode } from '../types'
import { getArcStyle, type ArcLayout } from './arc-layout'
import { dashboardLabels } from '@/config/dashboard-labels'

const props = defineProps<{ scenarioNodes: TreeNode[]; foundationNodes: TreeNode[] }>()

// SVG export sizes include shadow padding; preserve their native scale at 1920 × 1080.
const foundationIconSizes = [[53, 48], [45, 48], [49, 48], [48, 46], [64, 64], [46, 46], [42, 48], [42, 42], [44, 44]]
const getFoundationIconStyle = (index: number) => {
  const [width, height] = foundationIconSizes[index % foundationIconSizes.length]
  return { width: `${width / 1042 * 100}cqw`, height: `${height / 1042 * 100}cqw` }
}

type DimensionScoreKey = keyof NonNullable<TreeNode['dimensionScores']>

const dimensionScoreFields: DimensionScoreKey[] = [
  'waveformScore',
  'targetScore',
  'clutterScore',
  'sceneScore',
  'climateScore',
]

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

watch(() => props.foundationNodes, (nodes) => {
  if (!nodes.some(node => node.id === selectedFoundationId.value)) selectNextFoundation()
})

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
  <section
    class="tree-layer"
    :class="{ 'has-active-tooltip': selectedFoundationId !== null }"
    :aria-label="dashboardLabels.centerTree.foundation.title"
  >
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
        <img class="foundation-icon" :src="node.icon" :style="getFoundationIconStyle(index)" alt="" />
      </span>
      <span class="node-label">{{ node.label }}</span>
      <span class="node-metric"><b>{{ node.value }}</b><small>{{ node.unit }}</small></span>
      <span v-if="node.dimensionScores" class="dimension-tooltip" role="tooltip">
        <strong>{{ node.label }}</strong>
        <span v-for="field in dimensionScoreFields" :key="field" class="dimension-tooltip__row">
          <span>{{ dashboardLabels.common.qualityDimensions.fieldLabels[field] }}</span>
          <b>{{ node.dimensionScores[field] }}{{ dashboardLabels.common.qualityDimensions.fieldUnits[field] }}</b>
        </span>
      </span>
    </button>
  </section>
</template>

<style scoped>
.tree-layer.has-active-tooltip { z-index: 300; }
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
.foundation-icon { position: absolute; z-index: 2; left: 50%; bottom: 1.1516cqw; transform: translateX(-50%); object-fit: contain; }
.foundation-node.is-active .foundation-visual { filter: brightness(1.18) drop-shadow(0 0 .8637cqw rgba(81,218,255,.8)); }
.foundation-node.is-active .foundation-icon { filter: brightness(1.5); }
.foundation-node .node-label { margin-top: -.3839cqw; color: rgba(255,255,255,.70); font-size: 1.3436cqw; font-weight: 400; line-height: normal; }
.foundation-node .node-metric { margin-top: .1919cqw; }
.foundation-node .node-metric b { color: rgba(149,229,255,.80); font-size: 1.5355cqw; font-weight: 700; }
.foundation-node .node-metric small { color: rgba(255,255,255,.60); font-size: 1.1516cqw; font-weight: 400; }
.foundation-node.is-active .node-label { color: #fff; font-weight: 700; }
.foundation-node.is-active .node-metric b { color: #95e5ff; }
.foundation-node.is-active { z-index: 40; }
.dimension-tooltip { position: absolute; z-index: 30; bottom: calc(100% + .7678cqw); left: 50%; display: none; width: max-content; min-width: 11.5163cqw; box-sizing: border-box; padding: .9597cqw 1.1516cqw; border: 1px solid #2c8fdb; border-radius: .3839cqw; color: #dff4ff; font-size: 1.5355cqw; font-weight: 400; line-height: 1.5; text-align: left; white-space: nowrap; background: rgba(5, 21, 45, .94); box-shadow: 0 .2879cqw .9597cqw rgba(0, 0, 0, .28); transform: translateX(-50%) rotate(calc(-1 * var(--foundation-rotation, 0deg))); pointer-events: none; }
.dimension-tooltip::after { content: ''; position: absolute; top: 100%; left: 50%; width: .5758cqw; height: .5758cqw; border-right: 1px solid #2c8fdb; border-bottom: 1px solid #2c8fdb; background: rgba(5, 21, 45, .94); transform: translate(-50%, -50%) rotate(45deg); }
.foundation-node.is-active .dimension-tooltip { display: block; }
.dimension-tooltip > strong { display: block; margin-bottom: .4798cqw; color: #fff; font-size: 1.7274cqw; font-weight: 600; text-align: left; }
.dimension-tooltip__row { display: flex; align-items: center; justify-content: flex-start; gap: .7678cqw; text-align: left; }
.dimension-tooltip__row b { color: #dff4ff; font-weight: 600; }
</style>
