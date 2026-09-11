<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getDataAssetApplication } from '@/api'
import type { DataAssetApplicationItem } from '@/api'
import { dashboardLabels } from '@/config/dashboard-labels'
import PanelSection from '@/components/PanelSection.vue'
import appIcon from '@/assets/img/right/panel-icon-application.svg'
import applicationOrb from '@/assets/img/right/application-orb.png'

const labels = {
  application: dashboardLabels.rightTop.title,
  table: dashboardLabels.rightTop.fieldLabels.tableCnt,
  unit: dashboardLabels.rightTop.fieldUnits.tableCnt,
  ratio: dashboardLabels.rightTop.fieldLabels.departmentRatio,
  ratioUnit: dashboardLabels.rightTop.fieldUnits.departmentRatio,
}
const departments = ref<DataAssetApplicationItem[]>([])
const loadApplication = async () => {
  const response = await getDataAssetApplication()
  if (response.code === 200) departments.value = response.data ?? []
}

onMounted(() => {
  void Promise.allSettled([loadApplication()])
})
</script>

<template>
    <PanelSection class="legacy-application" :title="labels.application" :icon="appIcon">
      <div class="application-content"><div class="department-grid"><article v-for="item in departments" :key="item.departmentName"><h3>{{ item.departmentName }}</h3><p>{{ labels.table }} <b>{{ item.tableCnt }}</b><small>{{ labels.unit }}</small></p><p>{{ labels.ratio }} <b>{{ item.departmentRatio }}{{ labels.ratioUnit }}</b></p></article></div><div class="application-orb" aria-hidden="true"><img class="application-orb__ripples" :src="applicationOrb" alt="" /><img class="application-orb__core" :src="applicationOrb" alt="" /></div></div>
    </PanelSection>
</template>

<style scoped>
.legacy-application { width: 21.1458vw; }
.application-content { position: relative; width: 21.1458vw; height: 36.0185vh; }.department-grid { display: grid; grid-template-columns: repeat(2, 9.8958vw); column-gap: 1.3542vw; row-gap: 1.8519vh; padding-top: 1.8519vh; }.department-grid article { width: 9.8958vw; height: 12.037vh; background: linear-gradient(90deg, rgba(30, 63, 126, .3) 0%, rgba(31, 67, 138, 0) 100%); }.department-grid article:nth-child(even) { background: linear-gradient(270deg, rgba(30, 63, 126, .3) 0%, rgba(31, 67, 138, 0) 100%); }.department-grid article:nth-child(3) { clip-path: polygon(0 0, 100% 0, 100% 100%, 1.9444vw 100%, 0 calc(100% - 5.1852vh)); }.department-grid h3 { height: 2.6852vh; margin: 0; padding: .463vh .5208vw; color: rgba(255,255,255,.8); font-size: .7292vw; font-weight: 500; background: linear-gradient(90deg, rgba(38, 91, 170, .8), rgba(17, 45, 91, .15)); }.department-grid article:nth-child(even) h3 { text-align: right; background: linear-gradient(270deg, rgba(38, 91, 170, .8), rgba(17, 45, 91, .15)); }.department-grid p { margin: .7407vh 1.4583vw 0; color: rgba(255,255,255,.6); font-size: .625vw; }.department-grid article:nth-child(even) p { text-align: right; }.department-grid b { margin-left: .7292vw; font-size: 1.0417vw; font-weight: 900; background: linear-gradient(180deg, #fff 0%, #64c7ff 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }.department-grid small { margin-left: .2083vw; color: rgba(255,255,255,.4); font-size: .625vw; }.application-orb { position: absolute; z-index: 2; top: 12.037vh; left: 50%; width: 5vw; height: 5vw; transform: translateX(-50%); }
/* Split the original artwork with masks so only the outer rings scale. */
.application-orb { pointer-events: none; }
.application-orb__ripples,
.application-orb__core { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.application-orb__ripples {
  -webkit-mask-image: radial-gradient(circle closest-side, transparent 64%, #000 65%);
  mask-image: radial-gradient(circle closest-side, transparent 64%, #000 65%);
  transform-origin: center;
  animation: application-orb-ripple 2.8s ease-in-out infinite;
}
.application-orb__core { clip-path: circle(32% at 50% 50%); }
@keyframes application-orb-ripple {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(.84); opacity: .65; }
}
@media (prefers-reduced-motion: reduce) {
  .application-orb__ripples { animation: none; }
}
.application-content { transform: translateY(.2778vh); }
</style>
