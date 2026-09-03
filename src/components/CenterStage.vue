<script setup lang="ts">
import architectureBackground from '@/assets/img/center/tree/architecture-background.png'
import TopMetrics from './center/TopMetrics.vue'
import ApplicationLayer from './center/tree/ApplicationLayer.vue'
import FoundationLayer from './center/tree/FoundationLayer.vue'
import ServiceLayer from './center/tree/ServiceLayer.vue'
import SourceLayer from './center/tree/SourceLayer.vue'
import {
  applicationNodes,
  foundationNodes,
  metrics,
  scenarioNodes,
  serviceNodes,
  sourceNodes,
} from './center/mock-data'
import './center/tree/tree-shared.css'
</script>

<template>
  <section class="center-stage" aria-label="中部数据架构总览">
    <TopMetrics :metrics="metrics" />
    <div class="architecture">
      <img class="architecture__background" :src="architectureBackground" alt="" />
      <ServiceLayer :nodes="serviceNodes" />
      <ApplicationLayer :nodes="applicationNodes" />
      <FoundationLayer :scenario-nodes="scenarioNodes" :foundation-nodes="foundationNodes" />
      <SourceLayer :nodes="sourceNodes" />
    </div>
  </section>
</template>

<style scoped>
.center-stage { position: absolute; z-index: 1; top: 8.8889vh; right: 23.6979vw; bottom: 3.8889vh; left: 23.6979vw; }
.architecture { position: relative; width: min(54.2708vw, 96.4559vh); height: auto; aspect-ratio: 1042 / 850; margin: 1.6667vh 0 0 50%; transform: translateX(-50%); container-type: inline-size; }
.architecture__background { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; pointer-events: none; user-select: none; }
</style>
