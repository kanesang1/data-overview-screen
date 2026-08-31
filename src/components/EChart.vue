<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { toRef } from 'vue'
import { useEChart } from '@/composables/useEChart'

const props = defineProps<{ option: EChartsOption }>()
const { el } = useEChart(toRef(props, 'option'))
</script>

<template><div ref="el" class="chart" /></template>

<style scoped>.chart { width: 100%; height: 100%; }</style>
