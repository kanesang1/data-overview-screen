<script setup lang="ts">
import { ref } from 'vue'
import metricOne from '@/assets/img/center/total-view-icon/overview-metric-01.svg'
import metricTwo from '@/assets/img/center/total-view-icon/overview-metric-02.svg'
import metricThree from '@/assets/img/center/total-view-icon/overview-metric-03.svg'
import metricFour from '@/assets/img/center/total-view-icon/overview-metric-04.svg'
import architectureBackground from '@/assets/img/center/tree/architecture-background.png'
import nodeActive from '@/assets/img/center/tree/node-active.png'
import nodeInactive from '@/assets/img/center/tree/node-inactive.png'
import nodeBaseActive from '@/assets/img/center/tree/node-base-active.png'
import nodeBaseDefault from '@/assets/img/center/tree/node-base-default.png'
import serviceIconDefault from '@/assets/img/center/tree/one/service-node-01.png'
import serviceIconActive from '@/assets/img/center/tree/one/service-node-02.png'
import applicationIcon from '@/assets/img/center/tree/two/application-node-icon.svg'
import applicationBase from '@/assets/img/center/tree/two/application-node-base.svg'
import scenarioIconOne from '@/assets/img/center/tree/three/scenario-node-icon-01.svg'
import scenarioIconTwo from '@/assets/img/center/tree/three/scenario-node-icon-02.svg'
import scenarioIconThree from '@/assets/img/center/tree/three/scenario-node-icon-03.svg'
import scenarioIconFour from '@/assets/img/center/tree/three/scenario-node-icon-04.svg'
import scenarioNodeBase from '@/assets/img/center/tree/three/scenario-node-base.png'
import sourceCenterMark from '@/assets/img/center/tree/four/source-center-marker.svg'
import sourceOrbDefault from '@/assets/img/center/tree/four/source-node-default.png'
import sourceOrbActive from '@/assets/img/center/tree/four/source-node-active.png'

type MetricNode = { id: number; label: string; value?: string; unit?: string; icon?: string }
type ArcLayout = { leftStart: number; leftEnd: number; edgeTop: number; centerTop: number }
type FoundationArcLayout = {
  leftStart: number
  leftEnd: number
  edgeTop: number
  boundaryCenterTop: number
  centerLift: number
  centerLiftRadius: number
}

const serviceArc: ArcLayout = { leftStart: 19.5, leftEnd: 67.4, edgeTop: 1, centerTop: 4.95 }
const applicationArc: ArcLayout = { leftStart: 14.5, leftEnd: 74, edgeTop: 23, centerTop: 31.5 }
const scenarioArc: ArcLayout = { leftStart: 16, leftEnd: 72, edgeTop: 40.3, centerTop: 46.56 }
const foundationArc: FoundationArcLayout = {
  leftStart: 0,
  leftEnd: 90,
  edgeTop: 36.5,
  boundaryCenterTop: 54.5,
  centerLift: 1.8,
  centerLiftRadius: 0.5,
}

const getEqualArcProgress = (index: number, count: number, layout: ArcLayout) => {
  if (count <= 1) return 0.5

  const sampleCount = 100
  const points = Array.from({ length: sampleCount + 1 }, (_, sampleIndex) => {
    const progress = sampleIndex / sampleCount
    return {
      progress,
      x: (layout.leftStart + (layout.leftEnd - layout.leftStart) * progress) * 10.42,
      y: (layout.edgeTop + (layout.centerTop - layout.edgeTop) * 4 * progress * (1 - progress)) * 8.5,
    }
  })
  const lengths = points.map((point, pointIndex) => {
    if (pointIndex === 0) return 0
    const previous = points[pointIndex - 1]
    return Math.hypot(point.x - previous.x, point.y - previous.y)
  })
  const cumulativeLengths = lengths.reduce<number[]>((result, length) => {
    result.push((result[result.length - 1] ?? 0) + length)
    return result
  }, [])
  const targetLength = (cumulativeLengths[cumulativeLengths.length - 1] ?? 0) * index / (count - 1)
  const upperIndex = cumulativeLengths.findIndex(length => length >= targetLength)
  if (upperIndex <= 0) return 0

  const lowerLength = cumulativeLengths[upperIndex - 1]
  const upperLength = cumulativeLengths[upperIndex]
  const segmentProgress = upperLength === lowerLength ? 0 : (targetLength - lowerLength) / (upperLength - lowerLength)
  return points[upperIndex - 1].progress + (points[upperIndex].progress - points[upperIndex - 1].progress) * segmentProgress
}

const getArcStyle = (index: number, count: number, layout: ArcLayout) => {
  const progress = getEqualArcProgress(index, count, layout)
  const arcProgress = 4 * progress * (1 - progress)
  return {
    left: `${layout.leftStart + (layout.leftEnd - layout.leftStart) * progress}%`,
    top: `${layout.edgeTop + (layout.centerTop - layout.edgeTop) * arcProgress}%`,
  }
}

const getFoundationTop = (progress: number) => {
  const distanceFromCenter = Math.abs(progress - 0.5) * 2
  const ellipseProgress = Math.sqrt(Math.max(0, 1 - distanceFromCenter ** 2))
  const boundaryTop = foundationArc.edgeTop
    + (foundationArc.boundaryCenterTop - foundationArc.edgeTop) * ellipseProgress
  const liftProgress = Math.max(0, 1 - distanceFromCenter / foundationArc.centerLiftRadius)
  return boundaryTop - foundationArc.centerLift * liftProgress ** 2
}

const getFoundationArcStyle = (index: number, count: number) => {
  if (count <= 1) {
    return {
      left: `${(foundationArc.leftStart + foundationArc.leftEnd) / 2}%`,
      top: `${getFoundationTop(0.5)}%`,
    }
  }

  const sampleCount = 120
  const points = Array.from({ length: sampleCount + 1 }, (_, sampleIndex) => {
    const progress = sampleIndex / sampleCount
    return {
      progress,
      x: (foundationArc.leftStart + (foundationArc.leftEnd - foundationArc.leftStart) * progress) * 10.42,
      y: getFoundationTop(progress) * 8.5,
    }
  })
  const cumulativeLengths = points.reduce<number[]>((lengths, point, pointIndex) => {
    if (pointIndex === 0) {
      lengths.push(0)
      return lengths
    }
    const previous = points[pointIndex - 1]
    lengths.push(lengths[pointIndex - 1] + Math.hypot(point.x - previous.x, point.y - previous.y))
    return lengths
  }, [])
  const targetLength = cumulativeLengths[cumulativeLengths.length - 1] * index / (count - 1)
  const upperIndex = cumulativeLengths.findIndex(length => length >= targetLength)
  if (upperIndex <= 0) {
    return { left: `${foundationArc.leftStart}%`, top: `${getFoundationTop(0)}%` }
  }

  const lowerLength = cumulativeLengths[upperIndex - 1]
  const upperLength = cumulativeLengths[upperIndex]
  const segmentProgress = upperLength === lowerLength ? 0 : (targetLength - lowerLength) / (upperLength - lowerLength)
  const progress = points[upperIndex - 1].progress
    + (points[upperIndex].progress - points[upperIndex - 1].progress) * segmentProgress
  const angleSample = 0.002
  const previousProgress = Math.max(0, progress - angleSample)
  const nextProgress = Math.min(1, progress + angleSample)
  const curveWidth = (foundationArc.leftEnd - foundationArc.leftStart) * 10.42
  const tangentAngle = Math.atan2(
    (getFoundationTop(nextProgress) - getFoundationTop(previousProgress)) * 8.5,
    (nextProgress - previousProgress) * curveWidth,
  ) * 180 / Math.PI
  const rotation = Math.max(-6, Math.min(6, tangentAngle * 0.35))
  return {
    left: `${foundationArc.leftStart + (foundationArc.leftEnd - foundationArc.leftStart) * progress}%`,
    top: `${getFoundationTop(progress)}%`,
    '--foundation-rotation': `${rotation}deg`,
  }
}

const metrics = [
  { label: '总记录', value: '262', unit: '亿条', icon: metricOne },
  { label: '记录环比', value: '28.5%', unit: '↑', icon: metricTwo },
  { label: '总表数', value: '57.8', unit: '万张', icon: metricThree },
  { label: '总容量', value: '31.8', unit: 'TB', icon: metricFour },
]

// 后续接入接口时，只需用接口结果替换下面四组数组；id 同时作为选中态和图标绑定依据。
const serviceNodes: MetricNode[] = Array.from({ length: 4 }, (_, index) => ({
  id: index + 1,
  label: ['交换服务', '共享服务', '目录服务', '治理服务'][index],
  value: ['1209', '986', '732', '645'][index],
  unit: '个',
}))

const applicationNodes: MetricNode[] = Array.from({ length: 6 }, (_, index) => ({
  id: index + 1,
  label: ['政务应用', '业务应用', '分析应用', '移动应用', '开放应用', '协同应用'][index],
}))

const scenarioNodes: MetricNode[] = Array.from({ length: 4 }, (_, index) => ({
  id: index + 1,
  label: ['应用场景一', '应用场景二', '应用场景三', '应用场景四'][index],
  icon: [scenarioIconOne, scenarioIconTwo, scenarioIconThree, scenarioIconFour][index],
}))

const foundationNodes: MetricNode[] = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  label: ['人口库', '法人库', '空间库', '电子证照', '信用库', '事项库', '资源库', '主题库', '专题库'][index],
  value: ['33.09', '28.76', '45.20', '19.86', '37.42', '26.18', '41.06', '30.55', '35.72'][index],
  unit: '万条',
  icon: applicationIcon,
}))

const sourceNodes: MetricNode[] = [
  { id: 1, label: '接口采集', value: '99.21', unit: '万条' },
  { id: 2, label: '库表交换', value: '37.11', unit: '万条' },
  { id: 3, label: '文件导入', value: '21.98', unit: '万条' },
  { id: 4, label: '实时接入', value: '67.89', unit: '万条' },
  { id: 5, label: '人工填报', value: '123.98', unit: '万条' },
  { id: 6, label: '其他来源', value: '3.54', unit: '万条' },
]

const selectedServiceId = ref<number | null>(null)
const selectedApplicationId = ref<number | null>(null)
const selectedScenarioId = ref<number | null>(null)
const selectedFoundationId = ref<number | null>(null)
const selectedSourceId = ref<number | null>(null)
</script>

<template>
  <section class="center-stage" aria-label="中部数据架构总览">
    <div class="metric-list">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card">
        <img :src="metric.icon" alt="" />
        <div><span>{{ metric.label }}</span><strong>{{ metric.value }}</strong><small>{{ metric.unit }}</small></div>
      </article>
    </div>

    <div class="architecture">
      <img class="architecture__background" :src="architectureBackground" alt="" />

      <h2 class="layer-title layer-title--service">数据服务</h2>
      <h2 class="layer-title layer-title--application">应用数据</h2>
      <h2 class="layer-title layer-title--foundation">基础数据</h2>
      <h2 class="layer-title layer-title--source">数据来源</h2>

      <div class="node-ring node-ring--service">
        <button
          v-for="(node, index) in serviceNodes"
          :key="node.id"
          class="tree-node service-node"
          :class="{ 'is-active': selectedServiceId === node.id }"
          :style="getArcStyle(index, serviceNodes.length, serviceArc)"
          type="button"
          :aria-pressed="selectedServiceId === node.id"
          @mouseenter="selectedServiceId = node.id"
          @mouseleave="selectedServiceId = null"
          @focus="selectedServiceId = node.id"
          @blur="selectedServiceId = null"
        >
          <span class="service-visual">
            <img class="service-base" :src="selectedServiceId === node.id ? nodeActive : nodeInactive" alt="" />
            <img class="service-icon" :src="selectedServiceId === node.id ? serviceIconActive : serviceIconDefault" alt="" />
          </span>
          <span class="node-label">{{ node.label }}</span>
          <span class="node-metric"><b>{{ node.value }}</b><small>{{ node.unit }}</small></span>
        </button>
      </div>

      <div class="node-ring node-ring--application">
        <button
          v-for="(node, index) in applicationNodes"
          :key="node.id"
          class="tree-node application-node"
          :class="{ 'is-active': selectedApplicationId === node.id }"
          :style="getArcStyle(index, applicationNodes.length, applicationArc)"
          type="button"
          :aria-pressed="selectedApplicationId === node.id"
          @mouseenter="selectedApplicationId = node.id"
          @mouseleave="selectedApplicationId = null"
          @focus="selectedApplicationId = node.id"
          @blur="selectedApplicationId = null"
        >
          <span class="application-visual">
            <img class="application-base" :src="applicationBase" alt="" />
            <svg
              v-if="selectedApplicationId === node.id"
              class="application-selection-frame"
              viewBox="0 0 60 60"
              aria-hidden="true"
            >
              <path
                d="M10 .5H.5V10 M50 .5h9.5V10 M.5 50v9.5H10 M50 59.5h9.5V50"
                fill="none"
                stroke="#15F6FF"
                stroke-width=".44"
                vector-effect="non-scaling-stroke"
              />
            </svg>
          </span>
          <span class="node-label">{{ node.label }}</span>
        </button>
      </div>

      <div class="node-ring node-ring--scenario" aria-label="基础数据应用场景">
        <button
          v-for="(node, index) in scenarioNodes"
          :key="node.id"
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
      </div>

      <div class="node-ring node-ring--foundation">
        <button
          v-for="(node, index) in foundationNodes"
          :key="node.id"
          class="tree-node foundation-node"
          :class="{ 'is-active': selectedFoundationId === node.id }"
          :style="getFoundationArcStyle(index, foundationNodes.length)"
          type="button"
          :aria-pressed="selectedFoundationId === node.id"
          @mouseenter="selectedFoundationId = node.id"
          @mouseleave="selectedFoundationId = null"
          @focus="selectedFoundationId = node.id"
          @blur="selectedFoundationId = null"
        >
          <span class="foundation-visual">
            <img class="foundation-base" :src="nodeBaseDefault" alt="" />
            <img v-if="selectedFoundationId === node.id" class="foundation-glow" :src="nodeBaseActive" alt="" />
            <img class="foundation-icon" :src="node.icon" alt="" />
          </span>
          <span class="node-label">{{ node.label }}</span>
          <span class="node-metric"><b>{{ node.value }}</b><small>{{ node.unit }}</small></span>
        </button>
      </div>

      <div class="node-ring node-ring--source">
        <img class="source-center-mark" :src="sourceCenterMark" alt="" />
        <button
          v-for="node in sourceNodes"
          :key="node.id"
          class="tree-node source-node"
          :class="{ 'is-active': selectedSourceId === node.id }"
          type="button"
          :aria-pressed="selectedSourceId === node.id"
          @mouseenter="selectedSourceId = node.id"
          @mouseleave="selectedSourceId = null"
          @focus="selectedSourceId = node.id"
          @blur="selectedSourceId = null"
        >
          <span class="source-orb">
            <img class="source-orb-background source-orb-background--default" :src="sourceOrbDefault" alt="" />
            <img class="source-orb-background source-orb-background--active" :src="sourceOrbActive" alt="" />
            <span class="source-orb-active-core">
              <img :src="sourceOrbActive" alt="" />
            </span>
            <b>{{ node.value }}</b><small>{{ node.unit }}</small>
          </span>
          <span class="node-label">{{ node.label }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.center-stage { position: absolute; z-index: 1; top: 8.8889vh; right: 23.6979vw; bottom: 3.8889vh; left: 23.6979vw; }
.metric-list { display: flex; justify-content: center; gap: .625vw; padding-top: 1.6667vh; margin-bottom: 1.6667vh; }
.metric-card { display: flex; align-items: center; width: 11.4583vw; height: 6.4815vh; box-sizing: border-box; padding: .9259vh .7813vw; background: linear-gradient(0deg, rgba(30, 63, 126, .40) 0%, rgba(31, 67, 138, .08) 100%); }
.metric-card img { flex: 0 0 2.6042vw; width: 2.6042vw; height: 2.6042vw; margin-right: .5208vw; object-fit: contain; }
.metric-card span { display: block; color: rgba(255,255,255,.60); font-size: .7292vw; font-weight: 400; line-height: normal; }
.metric-card strong { margin-right: .2083vw; font-size: 1.3542vw; font-weight: 900; line-height: normal; background: linear-gradient(180deg, #fff 0%, #64c7ff 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.metric-card small { color: rgba(255,255,255,.40); font-size: .625vw; font-weight: 400; line-height: normal; }

.architecture { position: relative; width: min(54.2708vw, 96.4559vh); height: auto; aspect-ratio: 1042 / 850; margin: 1.6667vh 0 0 50%; transform: translateX(-50%); container-type: inline-size; }
.architecture__background { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; pointer-events: none; user-select: none; }
.layer-title { position: absolute; z-index: 4; left: 50%; width: 14.4%; margin: 0; transform: translateX(-50%); color: transparent; text-align: center; text-shadow: 0 .1919cqw 0 rgba(0,0,0,.30); font-size: 1.9194cqw; font-style: normal; font-weight: 700; line-height: normal; letter-spacing: .0576cqw; white-space: nowrap; background: linear-gradient(180deg, #fff 22.22%, #95ccff 75.93%); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.layer-title--service { top: 20.85%; }
.layer-title--application { top: 42.05%; }
.layer-title--foundation { top: 67.95%; }
.layer-title--source { top: 89.5%; }

.node-ring { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
.node-ring > * { pointer-events: auto; }
.tree-node { position: absolute; width: 12%; padding: 0; border: 0; color: inherit; background: transparent; cursor: pointer; font-family: inherit; outline: none; }
.tree-node:focus-visible .node-label { text-decoration: underline; text-decoration-color: rgba(149,229,255,.8); text-underline-offset: .2879cqw; }
.node-label, .node-metric { display: block; text-align: center; white-space: nowrap; }
.node-label { margin-top: .3839cqw; line-height: 1; }
.node-metric { margin-top: .096cqw; line-height: 1; }
.node-metric b, .node-metric small { font-style: normal; line-height: 1; }

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

.application-node { top: 27.2%; }
.application-visual { position: relative; display: block; width: 5.3743cqw; height: 5.3743cqw; margin: 0 auto; overflow: visible; transition: filter .25s ease, transform .25s ease; }
.application-selection-frame { position: absolute; z-index: 2; top: 50%; left: 50%; width: 6.142cqw; height: 6.142cqw; overflow: visible; transform: translate(-50%, -50%); pointer-events: none; }
.application-base { display: block; width: 5.3743cqw; height: 5.3743cqw; opacity: .56; filter: saturate(.72) brightness(.78); transition: opacity .25s ease, filter .25s ease; }
.application-node .node-label { color: rgba(255,255,255,.70); font-size: 1.3436cqw; font-weight: 400; line-height: normal; }
.application-node.is-active .application-visual { transform: translateY(-.2879cqw); filter: drop-shadow(0 0 .7678cqw #63dcff); }
.application-node.is-active .application-base { opacity: 1; filter: brightness(1.24); }
.application-node.is-active .node-label { color: #fff; font-weight: 700; }

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
.foundation-base { position: absolute; left: 50%; bottom: 0; width: 9.405cqw; height: 7.8695cqw; transform: translateX(-50%); object-fit: contain; }
.foundation-glow { position: absolute; z-index: 1; left: 50%; bottom: 0; width: 9.405cqw; height: 7.8695cqw; transform: translateX(-50%); object-fit: contain; pointer-events: none; }
.foundation-icon { position: absolute; z-index: 2; left: 50%; bottom: 2.3033cqw; width: 4.0307cqw; height: 5.3743cqw; transform: translateX(-50%); }
.foundation-node.is-active .foundation-visual { filter: brightness(1.18) drop-shadow(0 0 .8637cqw rgba(81,218,255,.8)); }
.foundation-node.is-active .foundation-icon { filter: brightness(1.5); }
.foundation-node .node-label { margin-top: -.3839cqw; color: rgba(255,255,255,.70); font-size: 1.3436cqw; font-weight: 400; line-height: normal; }
.foundation-node .node-metric { margin-top: .1919cqw; }
.foundation-node .node-metric b { color: rgba(149,229,255,.80); font-size: 1.5355cqw; font-weight: 700; }
.foundation-node .node-metric small { color: rgba(255,255,255,.60); font-size: 1.1516cqw; font-weight: 400; }
.foundation-node.is-active .node-label { color: #fff; font-weight: 700; }
.foundation-node.is-active .node-metric b { color: #95e5ff; }

.source-node { top: 72.5%; width: 12%; }
.source-node:nth-of-type(1) { left: 10.5%; top: 68.8%; }
.source-node:nth-of-type(2) { left: 22%; top: 74.2%; }
.source-node:nth-of-type(3) { left: 34%; top: 77.2%; }
.source-node:nth-of-type(4) { left: 52%; top: 77.2%; }
.source-node:nth-of-type(5) { left: 64%; top: 74.2%; }
.source-node:nth-of-type(6) { left: 77.5%; top: 68.8%; }
.source-center-mark { position: absolute; left: 50%; top: 77.2%; width: 8.1574cqw; height: 7.4856cqw; transform: translateX(-50%); object-fit: contain; pointer-events: none; }
.source-orb { position: relative; display: flex; width: 7.4856cqw; height: 7.4856cqw; margin: 0 auto; flex-direction: column; align-items: center; justify-content: center; }
.source-orb-background { position: absolute; z-index: 0; top: 50%; left: 50%; transform: translate(-50%, -50%); object-fit: contain; pointer-events: none; transition: opacity .12s ease; }
.source-orb-background--default { width: 7.4856cqw; height: 7.4856cqw; opacity: 1; }
.source-orb-background--active { width: 10.5566cqw; height: 10.5566cqw; opacity: 0; }
.source-orb-active-core { position: absolute; z-index: 1; top: 50%; left: 50%; width: 8.4453cqw; height: 8.4453cqw; overflow: hidden; border-radius: 50%; opacity: 0; transform: translate(-50%, -50%); pointer-events: none; transition: opacity .12s ease; }
.source-orb-active-core img { position: absolute; top: 50%; left: 50%; width: 14.4914cqw; height: 14.4914cqw; max-width: none; transform: translate(-50%, -50%); object-fit: contain; }
.source-orb b { position: relative; z-index: 2; color: rgba(255,255,255,.80); text-align: center; font-size: 1.7274cqw; font-weight: 700; line-height: normal; }
.source-orb small { position: relative; z-index: 2; color: rgba(255,255,255,.70); font-size: 1.1516cqw; font-weight: 400; line-height: normal; }
.source-node .node-label { color: rgba(255,255,255,.70); font-size: 1.3436cqw; font-weight: 400; line-height: normal; }
.source-node.is-active .source-orb-background--default { opacity: 0; }
.source-node.is-active .source-orb-background--active { opacity: 1; }
.source-node.is-active .source-orb-active-core { opacity: 1; }
.source-node.is-active .source-orb b { color: #fff; font-size: 1.9194cqw; }
.source-node.is-active .node-label { color: #fff; font-weight: 700; }

</style>
