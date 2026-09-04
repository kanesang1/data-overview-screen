<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getDataEvaluateDetail } from '@/api'
import type { DataEvaluateDetailItem } from '@/api'
import architectureBackground from '@/assets/img/center/tree/architecture-background.png'
import foundationIcon from '@/assets/img/center/tree/two/application-node-icon.svg'
import { dashboardLabels } from '@/config/dashboard-labels'
import TopMetrics from './center/cards/TopMetrics.vue'
import ApplicationLayer from './center/tree/ApplicationLayer.vue'
import FoundationLayer from './center/tree/FoundationLayer.vue'
import ServiceLayer from './center/tree/ServiceLayer.vue'
import SourceLayer from './center/tree/SourceLayer.vue'
import {
  metrics,
  scenarioNodes,
  serviceNodes,
} from './center/mock-data'
import type { TreeNode } from './center/types'
import './center/tree/tree-shared.css'

const applicationNodes = ref<TreeNode[]>([])
const foundationNodes = ref<TreeNode[]>([])

const mapApplicationNode = (item: DataEvaluateDetailItem): TreeNode => ({
  id: item.datasetId,
  label: item.datasetDesc,
})

const mapFoundationNode = (item: DataEvaluateDetailItem): TreeNode => ({
  id: item.datasetId,
  label: item.datasetDesc,
  value: String(item.datasetCnt),
  unit: dashboardLabels.centerTree.foundation.fieldUnits.datasetCnt,
  icon: foundationIcon,
})

const loadDatasetNodes = async () => {
  const [foundationResult, applicationResult] = await Promise.allSettled([
    getDataEvaluateDetail({ datasetType: 1 }),
    getDataEvaluateDetail({ datasetType: 2 }),
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
