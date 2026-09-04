<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getDataEvaluateDetail, getDataOverview, getDataServices } from '@/api'
import type { DataEvaluateDetailItem, DataOverviewData, DataServiceItem } from '@/api'
import metricOne from '@/assets/img/center/total-view-icon/overview-metric-01.svg'
import metricTwo from '@/assets/img/center/total-view-icon/overview-metric-02.svg'
import metricThree from '@/assets/img/center/total-view-icon/overview-metric-03.svg'
import metricFour from '@/assets/img/center/total-view-icon/overview-metric-04.svg'
import architectureBackground from '@/assets/img/center/tree/architecture-background.png'
import foundationIcon from '@/assets/img/center/tree/two/application-node-icon.svg'
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

const mapServiceNode = (item: DataServiceItem): TreeNode => ({
  id: item.id,
  label: item.serviceDesc,
  value: String(item.serviceCnt),
  unit: dashboardLabels.centerTree.service.fieldUnits.serviceCnt,
})

const mapApplicationNode = (item: DataEvaluateDetailItem): TreeNode => ({
  id: item.datasetId,
  label: item.datasetDesc,
  dimensionScores: {
    waveformScore: item.waveformScore,
    targetScore: item.targetScore,
    clutterScore: item.clutterScore,
    sceneScore: item.sceneScore,
    climateScore: item.climateScore,
  },
})

const mapFoundationNode = (item: DataEvaluateDetailItem): TreeNode => ({
  id: item.datasetId,
  label: item.datasetDesc,
  value: String(item.datasetCnt),
  unit: dashboardLabels.centerTree.foundation.fieldUnits.datasetCnt,
  icon: foundationIcon,
  dimensionScores: {
    waveformScore: item.waveformScore,
    targetScore: item.targetScore,
    clutterScore: item.clutterScore,
    sceneScore: item.sceneScore,
    climateScore: item.climateScore,
  },
})

const loadDatasetNodes = async () => {
  const [foundationResult, applicationResult, overviewResult, servicesResult] = await Promise.allSettled([
    getDataEvaluateDetail({ datasetType: 1 }),
    getDataEvaluateDetail({ datasetType: 2 }),
    getDataOverview(),
    getDataServices(),
  ])

  if (foundationResult.status === 'fulfilled') {
    const response = foundationResult.value
    if (response.code === 200 && Array.isArray(response.data)) {
      foundationNodes.value = response.data.map(mapFoundationNode)
    }
  }
  if (applicationResult.status === 'fulfilled') {
    const response = applicationResult.value
    if (response.code === 200 && Array.isArray(response.data)) {
      applicationNodes.value = response.data.map(mapApplicationNode)
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
      serviceNodes.value = response.data.map(mapServiceNode)
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
.architecture { position: relative; width: min(54.2708vw, 96.4559vh); height: auto; aspect-ratio: 1042 / 850; margin: 1.6667vh 0 0 50%; transform: translateX(-50%); container-type: inline-size; }
.architecture__background { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; pointer-events: none; user-select: none; }
</style>
