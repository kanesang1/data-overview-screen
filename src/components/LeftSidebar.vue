<script setup lang="ts">
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { computed, onMounted, ref, shallowRef } from 'vue'
import { getDataAssetSource, getDataEvaluateDetail } from '@/api'
import type { DataEvaluateDetailItem, DataSourceData } from '@/api'
import { dashboardLabels } from '@/config/dashboard-labels'
import EChart from '@/components/EChart.vue'
import PanelSection from '@/components/PanelSection.vue'
import qualityIcon from '@/assets/img/left/panel-icon-quality.svg'
import sourceIcon from '@/assets/img/left/panel-icon-source.svg'
import qualityDimensions from '@/assets/img/left/quality-dimensions.png'

const labels = { quality: dashboardLabels.leftTop.title, source: dashboardLabels.leftBottom.title }
const qualityDetail = ref<DataEvaluateDetailItem>()
const dimensions = computed(() => qualityDetail.value ? [
  { name: dashboardLabels.leftTop.fieldLabels.waveformScore, value: qualityDetail.value.waveformScore, field: 'waveformScore' as const },
  { name: dashboardLabels.leftTop.fieldLabels.targetScore, value: qualityDetail.value.targetScore, field: 'targetScore' as const },
  { name: dashboardLabels.leftTop.fieldLabels.clutterScore, value: qualityDetail.value.clutterScore, field: 'clutterScore' as const },
] : [])
const sourceDefinitions: Array<{ name: string; key: keyof DataSourceData }> = [
  { name: dashboardLabels.leftBottom.fieldLabels.actual, key: 'actual' },
  { name: dashboardLabels.leftBottom.fieldLabels.simulation, key: 'simulation' },
  { name: dashboardLabels.leftBottom.fieldLabels.imported, key: 'imported' },
  { name: dashboardLabels.leftBottom.fieldLabels.yellow_sea, key: 'yellow_sea' },
  { name: dashboardLabels.leftBottom.fieldLabels.bohai, key: 'bohai' },
  { name: dashboardLabels.leftBottom.fieldLabels.east_sea, key: 'east_sea' },
]
const sourceLegend = ref(sourceDefinitions.map((item) => ({ ...item, value: 0 })))
const sourceColors = [['#2d95f5', '#207edb'], ['#4857d1', '#3339b5'], ['#a144dc', '#7a2bb5'], ['#ca5590', '#a93471'], ['#13b39f', '#008d80'], ['#e3a33d', '#bd7423']]
const createSourceSeriesData = () => sourceLegend.value.map((item, index) => ({ name: item.key, value: item.value, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: sourceColors[index][0] }, { offset: 1, color: sourceColors[index][1] }]) } }))
const sourceOption = shallowRef<EChartsOption>({
  tooltip: {
    trigger: 'item', backgroundColor: 'rgba(5, 21, 45, .94)', borderColor: '#2c8fdb', textStyle: { color: '#dff4ff' },
    formatter: params => {
      const datum = params as { name: string; value: number }
      return (sourceLegend.value.find(item => item.key === datum.name)?.name ?? datum.name) + '<br/>' + datum.value + dashboardLabels.leftBottom.fieldUnit
    },
  },
  legend: { show: false, selectedMode: true },
  series: [{ type: 'pie', roseType: 'radius', radius: ['0%', '95%'], center: ['50%', '55%'], startAngle: 90, label: { show: false }, emphasis: { scale: false }, itemStyle: { borderWidth: 0 }, data: [] }],
})
const sourceChart = ref<InstanceType<typeof EChart>>()
const sourceSelection = ref(sourceDefinitions.map(() => true))
const toggleSource = (index: number) => {
  sourceSelection.value[index] = !sourceSelection.value[index]
  sourceChart.value?.dispatchAction({ type: 'legendToggleSelect', name: sourceLegend.value[index].key })
}

const loadQualityDetail = async () => {
  // 业务参数放在使用接口的 Vue 模块中，后续在这里调整。
  const response = await getDataEvaluateDetail({ datasetId: 0 })
  if (response.code === 200) qualityDetail.value = response.data?.[0]
}

const loadAssetSource = async () => {
  const response = await getDataAssetSource()
  if (response.code !== 200 || !response.data) return
  sourceLegend.value = sourceDefinitions.map((item) => ({ ...item, value: response.data[item.key] }))
  sourceOption.value = {
    ...sourceOption.value,
    series: [{ ...((sourceOption.value.series as object[])[0]), data: createSourceSeriesData() }],
  }
}

onMounted(() => {
  void Promise.allSettled([loadQualityDetail(), loadAssetSource()])
})
</script>

<template>
  <aside class="left-sidebar">
    <PanelSection :title="labels.quality" :icon="qualityIcon">
      <div class="quality-visual"><img class="quality-dimensions" :src="qualityDimensions" alt="" /><div class="quality-summary"><strong>{{ qualityDetail?.datasetDesc ?? '--' }}</strong><span><b>{{ qualityDetail?.datasetCnt ?? '--' }}</b>{{ dashboardLabels.leftTop.fieldUnits.datasetCnt }}</span></div><div class="dimension-list"><div v-for="item in dimensions" :key="item.name"><span>{{ item.name }}</span><b>{{ item.value }}<small>{{ dashboardLabels.leftTop.fieldUnits[item.field] }}</small></b></div></div></div>
    </PanelSection>
    <PanelSection class="panel-section--secondary" :title="labels.source" :icon="sourceIcon">
      <div class="source-chart"><EChart ref="sourceChart" :option="sourceOption" /></div>
      <div class="source-legend"><button v-for="(item, index) in sourceLegend" :key="item.key" :class="{ 'is-muted': !sourceSelection[index] }" type="button" @click="toggleSource(index)"><i :class="`dot dot--${index}`" />{{ item.name }} {{ item.value }}{{ dashboardLabels.leftBottom.fieldUnit }}</button></div>
    </PanelSection>
  </aside>
</template>

<style scoped>
.left-sidebar { display: flex; align-items: flex-start; flex-direction: column; gap: 0; }.left-sidebar :deep(.panel-section) { width: 21.1458vw; }.left-sidebar :deep(.panel-section--secondary) { width: 17.7083vw; }
.quality-visual { position: relative; width: 19.6354vw; height: 36.0185vh; margin-left: .625vw; }.quality-visual::before { content: ''; position: absolute; z-index: 1; top: 7.4074vh; left: 50%; width: 11.9792vw; height: 4.4444vh; border-radius: 50%; background: radial-gradient(ellipse, rgba(79,210,255,.78) 0%, rgba(25,143,255,.42) 40%, rgba(0,111,255,0) 74%); filter: blur(.2083vw); transform: translateX(-50%) scale(.84); transform-origin: center; opacity: .48; mix-blend-mode: screen; pointer-events: none; animation: quality-platform-breathe 2.8s ease-in-out infinite; }.quality-dimensions { position: absolute; top: 1.2963vh; left: 0; display: block; width: 100%; height: 24.9074vh; }.quality-summary { position: absolute; z-index: 2; top: 3.9815vh; left: 0; width: 100%; text-align: center; }.quality-summary strong { display: block; font-size: .8333vw; font-weight: 700; line-height: normal; background: linear-gradient(180deg, #fff 0%, #64c7ff 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }.quality-summary span { color: rgba(255,255,255,.6); font-size: .7292vw; }.quality-summary b { margin-right: .1563vw; color: #95e5ff; font-size: 1.0417vw; font-weight: 700; }.dimension-list { position: absolute; top: 28.0556vh; left: 0; width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; }.dimension-list span { display: block; color: #fff; font-size: .7292vw; }.dimension-list b { display: block; color: #95e5ff; font-size: .8333vw; font-weight: 700; }.dimension-list small { margin-left: .1042vw; color: rgba(255,255,255,.6); font-size: .625vw; font-weight: 400; }.source-chart { width: 17.7083vw; height: 23.1481vh; margin-top: 2.5926vh; }.source-legend { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); justify-items: start; width: 15.4167vw; gap: .7407vh 1.0417vw; margin-top: 1.6667vh; margin-left: 1.1458vw; color: #c5e8ff; font-size: .625vw; line-height: 1.2; }.source-legend button { width: 100%; padding:0; color:inherit; font:inherit; text-align:left; white-space:nowrap; border:0; outline:0; appearance:none; -webkit-appearance:none; border-radius:0; box-shadow:none; background:transparent; cursor:pointer; }.source-legend .is-muted { opacity:.35; }.dot { display: inline-block; width: .5208vw; height: .5208vw; margin-right: .4167vw; vertical-align: -.0521vw; }.dot--0 { background:#258df1 }.dot--1 { background:#3645c7 }.dot--2 { background:#823cc8 }.dot--3 { background:#c13c83 }.dot--4 { background:#06a99a }
.dot--5 { background:#d78b2f }
@keyframes quality-platform-breathe {
  0%, 100% { opacity: .42; filter: blur(.2083vw); transform: translateX(-50%) scale(.84); }
  50% { opacity: 1; filter: blur(.3646vw); transform: translateX(-50%) scale(1.08); }
}
@media (prefers-reduced-motion: reduce) { .quality-visual::before { animation: none; } }
</style>
