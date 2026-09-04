<script setup lang="ts">
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { onMounted, ref, shallowRef } from 'vue'
import { getDataAssetApplication, getDataAssetChange } from '@/api'
import type { DataAssetApplicationItem } from '@/api'
import { dashboardLabels } from '@/config/dashboard-labels'
import EChart from '@/components/EChart.vue'
import PanelSection from '@/components/PanelSection.vue'
import appIcon from '@/assets/img/right/panel-icon-application.svg'
import trendIcon from '@/assets/img/right/panel-icon-trend.svg'
import applicationOrb from '@/assets/img/right/application-orb.png'

const labels = {
  application: dashboardLabels.rightTop.title,
  trend: dashboardLabels.rightBottom.title,
  table: dashboardLabels.rightTop.fieldLabels.tableCnt,
  unit: dashboardLabels.rightTop.fieldUnits.tableCnt,
  ratio: dashboardLabels.rightTop.fieldLabels.departmentRatio,
  ratioUnit: dashboardLabels.rightTop.fieldUnits.departmentRatio,
  trendUnit: dashboardLabels.rightBottom.unitTitle,
  dataVolume: dashboardLabels.rightBottom.fieldLabels.changeCnt,
  growthRate: dashboardLabels.rightBottom.fieldLabels.changeRate,
}
const departments = ref<DataAssetApplicationItem[]>([])
const trendOption = shallowRef<EChartsOption>({
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(5, 21, 45, .94)', borderColor: '#2c8fdb', textStyle: { color: '#dff4ff' } },
  legend: { show: false, selectedMode: true, data: [labels.dataVolume, labels.growthRate] },
  grid: { top: '7%', right: '14%', bottom: '14%', left: '10%' },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'], axisLine: { lineStyle: { color: '#526274' } }, axisLabel: { color: '#8ca0b4', fontSize: 10 } },
  yAxis: [
    { type: 'value', min: 0, axisLine: { lineStyle: { color: 'rgba(255, 255, 255, .40)' } }, axisLabel: { color: 'rgba(255, 255, 255, .40)', fontSize: 11, fontWeight: 400 }, splitLine: { interval: (index: number) => index !== 0, lineStyle: { color: 'rgba(255, 255, 255, .40)', type: 'solid' } } },
    { type: 'value', min: 0, max: 100, axisLabel: { color: 'rgba(255, 255, 255, .40)', fontSize: 10, formatter: (value: number) => `${value}${dashboardLabels.rightBottom.fieldUnits.changeRate}` }, splitLine: { show: false } },
  ],
  series: [
    { name: labels.dataVolume, type: 'bar', data: [], barWidth: '32%', itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#117fec' }, { offset: 1, color: 'rgba(17, 127, 236, .2)' }]) } },
    { name: labels.growthRate, type: 'line', yAxisIndex: 1, data: [], symbol: 'circle', symbolSize: 5, lineStyle: { color: '#00e8dc', width: 2 }, itemStyle: { color: '#061329', borderColor: '#00e8dc', borderWidth: 2 } },
  ],
})
const trendXAxis = trendOption.value.xAxis as { axisLine: { lineStyle: { color: string } }; axisLabel: { color: string; fontSize: number; fontWeight?: number }; axisTick?: { show: boolean } }
trendXAxis.axisLine.lineStyle.color = 'rgba(255, 255, 255, .40)'
trendXAxis.axisLabel.color = 'rgba(255, 255, 255, .40)'
trendXAxis.axisLabel.fontSize = 11
trendXAxis.axisLabel.fontWeight = 400
trendXAxis.axisTick = { show: false }
const trendChart = ref<InstanceType<typeof EChart>>()
const trendSelection = ref({ bar: true, line: true })
const toggleTrend = (kind: 'bar' | 'line') => {
  trendSelection.value[kind] = !trendSelection.value[kind]
  trendChart.value?.dispatchAction({ type: 'legendToggleSelect', name: kind === 'bar' ? labels.dataVolume : labels.growthRate })
}

const formatMonth = (month: string) => `${Number(month.slice(-2))}${dashboardLabels.rightBottom.monthSuffix}`

const loadApplication = async () => {
  const response = await getDataAssetApplication()
  if (response.code === 200) departments.value = response.data ?? []
}

const loadChangeTrend = async () => {
  // 业务参数保留在使用该接口的 Vue 模块中，后续在这里调整。
  const response = await getDataAssetChange({ queryType: 0 })
  if (response.code !== 200) return

  const data = response.data ?? []
  const series = trendOption.value.series as Array<Record<string, unknown>>
  trendOption.value = {
    ...trendOption.value,
    xAxis: { ...(trendOption.value.xAxis as object), data: data.map((item) => formatMonth(item.month)) },
    series: [
      { ...series[0], data: data.map((item) => item.changeCnt) },
      { ...series[1], data: data.map((item) => item.changeRate) },
    ],
  }
}

onMounted(() => {
  void Promise.allSettled([loadApplication(), loadChangeTrend()])
})
</script>

<template>
  <aside class="right-sidebar">
    <PanelSection :title="labels.application" :icon="appIcon">
      <div class="application-content"><div class="department-grid"><article v-for="item in departments" :key="item.departmentName"><h3>{{ item.departmentName }}</h3><p>{{ labels.table }} <b>{{ item.tableCnt }}</b><small>{{ labels.unit }}</small></p><p>{{ labels.ratio }} <b>{{ item.departmentRatio }}{{ labels.ratioUnit }}</b></p></article></div><img class="application-orb" :src="applicationOrb" alt="" /></div>
    </PanelSection>
    <PanelSection class="panel-section--secondary" :title="labels.trend" :icon="trendIcon"><div class="trend-area"><div class="trend-legend"><button :class="{ 'is-muted': !trendSelection.bar }" type="button" @click="toggleTrend('bar')"><i class="legend-bar" />{{ labels.dataVolume }}</button><button :class="{ 'is-muted': !trendSelection.line }" type="button" @click="toggleTrend('line')"><i class="legend-line" />{{ labels.growthRate }}</button></div><span class="trend-unit">{{ labels.trendUnit }}</span><div class="trend-chart"><EChart ref="trendChart" :option="trendOption" /></div></div></PanelSection>
  </aside>
</template>

<style scoped>
.right-sidebar { display: flex; align-items: flex-end; flex-direction: column; gap: 0; }.right-sidebar :deep(.panel-section) { width: 21.1458vw; }.right-sidebar :deep(.panel-section--secondary) { width: 17.7083vw; }.application-content { position: relative; width: 21.1458vw; height: 36.0185vh; }.department-grid { display: grid; grid-template-columns: repeat(2, 9.8958vw); column-gap: 1.3542vw; row-gap: 1.8519vh; padding-top: 1.8519vh; }.department-grid article { width: 9.8958vw; height: 12.037vh; background: linear-gradient(90deg, rgba(30, 63, 126, .3) 0%, rgba(31, 67, 138, 0) 100%); }.department-grid article:nth-child(even) { background: linear-gradient(270deg, rgba(30, 63, 126, .3) 0%, rgba(31, 67, 138, 0) 100%); }.department-grid article:nth-child(3) { clip-path: polygon(0 0, 100% 0, 100% 100%, 17% 100%, 0 74%); }.department-grid h3 { height: 2.6852vh; margin: 0; padding: .463vh .5208vw; color: rgba(255,255,255,.8); font-size: .7292vw; font-weight: 500; background: linear-gradient(90deg, rgba(38, 91, 170, .8), rgba(17, 45, 91, .15)); }.department-grid article:nth-child(even) h3 { text-align: right; background: linear-gradient(270deg, rgba(38, 91, 170, .8), rgba(17, 45, 91, .15)); }.department-grid p { margin: 1.1111vh 1.0938vw 0; color: rgba(255,255,255,.6); font-size: .625vw; }.department-grid b { margin-left: .7292vw; font-size: 1.0417vw; font-weight: 900; background: linear-gradient(180deg, #fff 0%, #64c7ff 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }.department-grid small { margin-left: .2083vw; color: rgba(255,255,255,.4); font-size: .625vw; }.application-orb { position: absolute; z-index: 2; top: 12.037vh; left: 50%; width: 5vw; height: 5vw; transform: translateX(-50%); }.trend-area { width: 17.7083vw; margin-top: 1.8519vh; }.trend-meta { display: flex; justify-content: space-between; color: rgba(255,255,255,.5); font-size: .5729vw; }.trend-meta div { color: rgba(255,255,255,.6); }.trend-meta button { padding:0; color:inherit; font:inherit; border:0; outline:0; appearance:none; -webkit-appearance:none; border-radius:0; box-shadow:none; background:transparent; cursor:pointer; }.trend-meta button.is-muted { opacity:.35; }.legend-bar { display:inline-block; width:.5208vw; height:.5208vw; margin-right:.2604vw; background:#117fec; }.legend-line { position:relative; display:inline-block; width:.9375vw; height:.1042vw; margin:0 .2604vw .1563vw .8333vw; vertical-align:middle; background:#00e8dc; }.legend-line::after { content:''; position:absolute; top:50%; left:50%; width:.4167vw; height:.4167vw; box-sizing:border-box; border:.1042vw solid #00e8dc; border-radius:50%; background:#061329; transform:translate(-50%,-50%); }.trend-chart { width: 17.7083vw; height: 24.7222vh; margin-top: .7407vh; }
.application-content { transform: translateY(.2778vh); }
.trend-area { margin-top: 1.4815vh; }
.trend-chart { margin-top: 1.4815vh; }
.trend-legend { display: flex; align-items: center; justify-content: flex-end; min-height: 1.0185vh; padding-right: .1042vw; color: rgba(255,255,255,.6); font-size: .5729vw; }
.trend-legend button { padding: 0; color: inherit; font: inherit; border: 0; outline: 0; appearance: none; -webkit-appearance: none; border-radius: 0; box-shadow: none; background: transparent; cursor: pointer; }
.trend-legend button.is-muted { opacity: .35; }
.trend-unit { display: block; margin-top: 1.2963vh; color: rgba(255,255,255,.5); font-size: .5729vw; }
.trend-unit + .trend-chart { margin-top: .3704vh; }
</style>
