<script setup lang="ts">
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{ option: EChartsOption }>()
const host = ref<HTMLDivElement>()
let chart: echarts.ECharts | undefined
let tooltipTimer: ReturnType<typeof setInterval> | undefined
let tooltipIndex = -1
let isMouseInside = false
const TOOLTIP_INTERVAL = 2500

const resize = () => chart?.resize()
const dispatchAction = (payload: { type: string; [key: string]: unknown }) => chart?.dispatchAction(payload as never)
defineExpose({ dispatchAction })

const getTooltipTarget = () => {
  const optionSeries = props.option.series
  const series = (Array.isArray(optionSeries) ? optionSeries : optionSeries ? [optionSeries] : []) as Array<{ data?: unknown[] }>
  const seriesIndex = series.findIndex(item => Array.isArray(item.data) && item.data.length > 0)

  if (seriesIndex < 0) return
  return { seriesIndex, dataCount: series[seriesIndex].data!.length }
}

const stopTooltipCarousel = () => {
  if (tooltipTimer) clearInterval(tooltipTimer)
  tooltipTimer = undefined
}

const showNextTooltip = () => {
  const target = getTooltipTarget()
  if (!chart || !target) return

  tooltipIndex = (tooltipIndex + 1) % target.dataCount
  chart.dispatchAction({
    type: 'showTip',
    seriesIndex: target.seriesIndex,
    dataIndex: tooltipIndex,
  })
}

const startTooltipCarousel = () => {
  stopTooltipCarousel()
  if (!chart || isMouseInside || !getTooltipTarget()) return

  showNextTooltip()
  tooltipTimer = setInterval(showNextTooltip, TOOLTIP_INTERVAL)
}

const handleMouseEnter = () => {
  isMouseInside = true
  stopTooltipCarousel()
}

const handleMouseLeave = () => {
  isMouseInside = false
  chart?.dispatchAction({ type: 'hideTip' })
  startTooltipCarousel()
}

const render = () => {
  if (!chart) return
  chart.setOption(props.option, { notMerge: true })
  tooltipIndex = -1
  startTooltipCarousel()
}

onMounted(() => {
  if (!host.value) return
  chart = echarts.init(host.value)
  render()
  window.addEventListener('resize', resize)
})

watch(() => props.option, render, { deep: true })
onBeforeUnmount(() => {
  stopTooltipCarousel()
  window.removeEventListener('resize', resize)
  chart?.dispose()
})
</script>

<template><div ref="host" class="chart" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave" /></template>

<style scoped>.chart { width: 100%; height: 100%; }</style>
