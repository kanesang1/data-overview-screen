<script setup lang="ts">
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{ option: EChartsOption }>()
const host = ref<HTMLDivElement>()
let chart: echarts.ECharts | undefined
const resize = () => chart?.resize()
const dispatchAction = (payload: { type: string; [key: string]: unknown }) => chart?.dispatchAction(payload as never)
defineExpose({ dispatchAction })

const render = () => chart?.setOption(props.option, { notMerge: true })

onMounted(() => {
  if (!host.value) return
  chart = echarts.init(host.value)
  render()
  window.addEventListener('resize', resize)
})

watch(() => props.option, render, { deep: true })
onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
})
</script>

<template><div ref="host" class="chart" /></template>

<style scoped>.chart { width: 100%; height: 100%; }</style>
