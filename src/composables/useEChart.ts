import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export function useEChart(option: Ref<EChartsOption>) {
  const el = ref<HTMLElement>()
  let chart: echarts.ECharts | undefined
  let observer: ResizeObserver | undefined

  onMounted(() => {
    if (!el.value) return
    chart = echarts.init(el.value)
    chart.setOption(option.value)
    observer = new ResizeObserver(() => chart?.resize())
    observer.observe(el.value)
  })

  watch(option, (value) => chart?.setOption(value, true), { deep: true })

  onBeforeUnmount(() => {
    observer?.disconnect()
    chart?.dispose()
  })

  return { el }
}
