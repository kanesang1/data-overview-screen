<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getDataOverview, getDatasetPreview } from '@/api'
import type { DataOverviewData, DatasetPreviewItem } from '@/api'
import metricOne from '@/assets/img/center/total-view-icon/overview-metric-01.svg'
import metricTwo from '@/assets/img/center/total-view-icon/overview-metric-02.svg'
import metricThree from '@/assets/img/center/total-view-icon/overview-metric-03.svg'
import metricFour from '@/assets/img/center/total-view-icon/overview-metric-04.svg'
import architectureBackground from '@/assets/img/center/tree/architecture-background.png'
import foundationIconOne from '@/assets/img/center/tree/three/Vector.svg'
import foundationIconTwo from '@/assets/img/center/tree/three/Vector (1).svg'
import foundationIconThree from '@/assets/img/center/tree/three/Vector (2).svg'
import foundationIconFour from '@/assets/img/center/tree/three/Vector (3).svg'
import foundationIconFive from '@/assets/img/center/tree/three/Vector (4).svg'
import foundationIconSix from '@/assets/img/center/tree/three/Vector (5).svg'
import foundationIconSeven from '@/assets/img/center/tree/three/Vector (6).svg'
import foundationIconEight from '@/assets/img/center/tree/three/Vector (7).svg'
import foundationIconNine from '@/assets/img/center/tree/three/Vector (8).svg'
import { dashboardLabels } from '@/config/dashboard-labels'
import TopMetrics from './center/cards/TopMetrics.vue'
import ApplicationLayer from './center/tree/ApplicationLayer.vue'
import FoundationLayer from './center/tree/FoundationLayer.vue'
import ServiceLayer from './center/tree/ServiceLayer.vue'
import SourceLayer from './center/tree/SourceLayer.vue'
import {
  scenarioNodes,
} from './center/mock-data'
import type { MetricCard, TreeNode } from './center/types'
import './center/tree/tree-shared.css'

const applicationNodes = ref<TreeNode[]>([])
const foundationNodes = ref<TreeNode[]>([])
const foundationIcons = [
  foundationIconOne, foundationIconTwo, foundationIconThree,
  foundationIconFour, foundationIconFive, foundationIconSix,
  foundationIconSeven, foundationIconEight, foundationIconNine,
]
const metrics = ref<MetricCard[]>([])
const serviceNodes = ref<TreeNode[]>([])

const mapOverviewMetrics = (data: DataOverviewData): MetricCard[] => {
  const { fieldLabels, fieldUnits } = dashboardLabels.centerOverview

  return [
    { label: fieldLabels.totalCnt, value: String(data.totalCnt), unit: fieldUnits.totalCnt, icon: metricOne },
    { label: fieldLabels.recordMom, value: String(data.recordMom), unit: fieldUnits.recordMom, icon: metricTwo },
    { label: fieldLabels.totalTable, value: String(data.totalTable), unit: fieldUnits.totalTable, icon: metricThree },
    { label: fieldLabels.totalSize, value: String(data.totalSize), unit: fieldUnits.totalSize, icon: metricFour },
  ]
}

const resolvePublicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

const mapPreviewNode = (item: DatasetPreviewItem, index: number, type: 1 | 2 | 3): TreeNode => {
  const node: TreeNode = {
    id: index + 1,
    label: item.dataset_name,
    value: String(item.dataset_cnt),
    unit: dashboardLabels.centerTree.service.fieldUnits.serviceCnt,
    tooltip: {
      projectName: item.dataset_name,
      projectCount: item.dataset_cnt,
      items: Array.isArray(item.key_list)
        ? item.key_list.map(detail => ({ key: detail.key_name, value: detail.key_value }))
        : [],
    },
  }
  if (type === 1) {
    node.unit = dashboardLabels.centerTree.foundation.fieldUnits.datasetCnt
    node.icon = foundationIcons[index % foundationIcons.length]
  }
  if (type === 3) {
    const galleryConfig = dashboardLabels.centerTree.service.imageGalleries[index]
    node.gallery = galleryConfig ? {
      title: item.dataset_name,
      items: galleryConfig.items.map(image => ({
        src: resolvePublicAsset(image.src),
        description: image.description,
        layout: image.layout,
      })),
    } : undefined
  }
  return node
}

const loadDatasetNodes = async () => {
  const [foundationResult, applicationResult, overviewResult, servicesResult] = await Promise.allSettled([
    getDatasetPreview({ data_type: 1 }),
    getDatasetPreview({ data_type: 2 }),
    getDataOverview(),
    getDatasetPreview({ data_type: 3 }),
  ])

  if (foundationResult.status === 'fulfilled') {
    const response = foundationResult.value
    if (response.code === 200 && Array.isArray(response.data)) {
      foundationNodes.value = response.data.map((item, index) => mapPreviewNode(item, index, 1))
    }
  }
  if (applicationResult.status === 'fulfilled') {
    const response = applicationResult.value
    if (response.code === 200 && Array.isArray(response.data)) {
      applicationNodes.value = response.data.map((item, index) => mapPreviewNode(item, index, 2))
    }
  }
  if (overviewResult.status === 'fulfilled') {
    const response = overviewResult.value
    if (response.code === 200 && response.data) {
      metrics.value = mapOverviewMetrics(response.data)
    }
  }
  if (servicesResult.status === 'fulfilled') {
    const response = servicesResult.value
    if (response.code === 200 && Array.isArray(response.data)) {
      serviceNodes.value = response.data.map((item, index) => mapPreviewNode(item, index, 3))
    }
  }
}

onMounted(() => {
  void loadDatasetNodes()
})
</script>

<template>
  <section class="center-stage" aria-label="中部数据架构总览">
    <TopMetrics :metrics="metrics" />
    <div class="architecture">
      <img class="architecture__background" :src="architectureBackground" alt="" />
      <ServiceLayer :nodes="serviceNodes" />
      <ApplicationLayer :nodes="applicationNodes" />
      <FoundationLayer :scenario-nodes="scenarioNodes" :foundation-nodes="foundationNodes" />
      <SourceLayer />
    </div>
  </section>
</template>

<style scoped>
.center-stage { position: absolute; z-index: 1; top: 8.8889vh; right: 23.6979vw; bottom: 3.8889vh; left: 23.6979vw; }
.center-stage:has(.tree-layer.has-active-tooltip) { z-index: 100; }
.architecture { position: relative; width: min(54.2708vw, 96.4559vh); height: auto; aspect-ratio: 1042 / 850; margin: 1.6667vh 0 0 50%; transform: translateX(-50%); container-type: inline-size; }
.architecture__background { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; pointer-events: none; user-select: none; }
</style>
