<script setup lang="ts">
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { ref } from 'vue'
import EChart from '@/components/EChart.vue'
import PanelSection from '@/components/PanelSection.vue'
import qualityIcon from '@/assets/img/left/panel-icon-quality.svg'
import sourceIcon from '@/assets/img/left/panel-icon-source.svg'
import qualityDimensions from '@/assets/img/left/quality-dimensions.png'

const labels = { quality: '数据质量评价', source: '数据资产来源' }
const qualityLabels = { title: '数据质量维度', unit: '个', dataUnit: '万条' }
const dimensions = ['维度1', '维度2', '维度3']
const sourceLegend = [
  { name: '实采数据', key: 'source-collected', value: '42.12%' },
  { name: '仿真数据', key: 'source-simulated', value: '33.75%' },
  { name: '引接数据', key: 'source-imported', value: '24.87%' },
  { name: '内容标题', key: 'source-title-primary', value: '17.43%' },
  { name: '内容标题', key: 'source-title-secondary', value: '9.21%' },
]
const sourceColors = [['#2d95f5', '#207edb'], ['#4857d1', '#3339b5'], ['#a144dc', '#7a2bb5'], ['#ca5590', '#a93471'], ['#13b39f', '#008d80']]
const sourceOption: EChartsOption = {
  tooltip: {
    trigger: 'item', backgroundColor: 'rgba(5, 21, 45, .94)', borderColor: '#2c8fdb', textStyle: { color: '#dff4ff' },
    formatter: params => {
      const datum = params as { name: string; value: number }
      return (sourceLegend.find(item => item.key === datum.name)?.name ?? datum.name) + '<br/>' + datum.value + '%'
    },
  },
  legend: { show: false, selectedMode: true },
  series: [{ type: 'pie', roseType: 'radius', radius: ['0%', '95%'], center: ['50%', '55%'], startAngle: 90, label: { show: false }, emphasis: { scale: false }, itemStyle: { borderWidth: 0 }, data: sourceLegend.map((item, index) => ({ name: item.key, value: Number.parseFloat(item.value), itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: sourceColors[index][0] }, { offset: 1, color: sourceColors[index][1] }]) } })) }],
}
const sourceChart = ref<InstanceType<typeof EChart>>()
const sourceSelection = ref(sourceLegend.map(() => true))
const toggleSource = (index: number) => {
  sourceSelection.value[index] = !sourceSelection.value[index]
  sourceChart.value?.dispatchAction({ type: 'legendToggleSelect', name: sourceLegend[index].key })
}
</script>

<template>
  <aside class="left-sidebar">
    <PanelSection :title="labels.quality" :icon="qualityIcon">
      <div class="quality-visual"><img class="quality-dimensions" :src="qualityDimensions" alt="" /><div class="quality-summary"><strong>{{ qualityLabels.title }}</strong><span><b>3</b>{{ qualityLabels.unit }}</span></div><div class="dimension-list"><div v-for="item in dimensions" :key="item"><span>{{ item }}</span><b>33.09<small>{{ qualityLabels.dataUnit }}</small></b></div></div></div>
    </PanelSection>
    <PanelSection class="panel-section--secondary" :title="labels.source" :icon="sourceIcon">
      <div class="source-chart"><EChart ref="sourceChart" :option="sourceOption" /></div>
      <div class="source-legend"><button v-for="(item, index) in sourceLegend" :key="item.key" :class="{ 'is-muted': !sourceSelection[index] }" type="button" @click="toggleSource(index)"><i :class="`dot dot--${index}`" />{{ item.name }} {{ item.value }}</button></div>
    </PanelSection>
  </aside>
</template>

<style scoped>
.left-sidebar { display: flex; align-items: flex-start; flex-direction: column; gap: 0; }.left-sidebar :deep(.panel-section) { width: 21.1458vw; }.left-sidebar :deep(.panel-section--secondary) { width: 17.7083vw; }
.quality-visual { position: relative; width: 19.6354vw; height: 36.0185vh; margin-left: .625vw; }.quality-dimensions { position: absolute; top: 1.2963vh; left: 0; display: block; width: 100%; height: 24.9074vh; }.quality-summary { position: absolute; top: 3.9815vh; left: 0; width: 100%; text-align: center; }.quality-summary strong { display: block; font-size: .8333vw; font-weight: 700; line-height: normal; background: linear-gradient(180deg, #fff 0%, #64c7ff 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }.quality-summary span { color: rgba(255,255,255,.6); font-size: .7292vw; }.quality-summary b { margin-right: .1563vw; color: #95e5ff; font-size: 1.0417vw; font-weight: 700; }.dimension-list { position: absolute; top: 28.0556vh; left: 0; width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; }.dimension-list span { display: block; color: #fff; font-size: .7292vw; }.dimension-list b { display: block; color: #95e5ff; font-size: .8333vw; font-weight: 700; }.dimension-list small { margin-left: .1042vw; color: rgba(255,255,255,.6); font-size: .625vw; font-weight: 400; }.source-chart { width: 17.7083vw; height: 23.1481vh; margin-top: 1.8519vh; }.source-legend { display: grid; grid-template-columns: repeat(2, max-content); gap: .7407vh 1.875vw; margin-top: .2778vh; margin-left: 1.1458vw; color: #c5e8ff; font-size: .625vw; line-height: 1.2; }.source-legend button { padding:0; color:inherit; font:inherit; white-space:nowrap; border:0; outline:0; appearance:none; -webkit-appearance:none; border-radius:0; box-shadow:none; background:transparent; cursor:pointer; }.source-legend .is-muted { opacity:.35; }.dot { display: inline-block; width: .5208vw; height: .5208vw; margin-right: .4167vw; vertical-align: -.0521vw; }.dot--0 { background:#258df1 }.dot--1 { background:#3645c7 }.dot--2 { background:#823cc8 }.dot--3 { background:#c13c83 }.dot--4 { background:#06a99a }
</style>
