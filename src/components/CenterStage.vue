<script setup lang="ts">
import metricOne from '@/assets/img/center/total-view-icon/overview-metric-01.svg'
import metricTwo from '@/assets/img/center/total-view-icon/overview-metric-02.svg'
import metricThree from '@/assets/img/center/total-view-icon/overview-metric-03.svg'
import metricFour from '@/assets/img/center/total-view-icon/overview-metric-04.svg'
import architectureBackground from '@/assets/img/center/tree/architecture-background.png'

const metrics = [
  { label: '总记录', value: '262', unit: '亿条', icon: metricOne },
  { label: '记录环比', value: '28.5%', unit: '↑', icon: metricTwo },
  { label: '总表数', value: '57.8', unit: '万张', icon: metricThree },
  { label: '总容量', value: '31.8', unit: 'TB', icon: metricFour },
]
</script>

<template>
  <section class="center-stage" aria-label="中部内容区域">
    <div class="metric-list">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card">
        <img :src="metric.icon" alt="" />
        <div><span>{{ metric.label }}</span><strong>{{ metric.value }}</strong><small>{{ metric.unit }}</small></div>
      </article>
    </div>
    <img class="architecture-background" :src="architectureBackground" alt="" />
  </section>
</template>

<style scoped>
.center-stage { position: absolute; z-index: 1; top: 8.8889vh; right: 23.6979vw; bottom: 3.8889vh; left: 23.6979vw; }
.metric-list { display: flex; justify-content: center; gap: .625vw; padding-top: 1.6667vh; margin-bottom: 1.6667vh; }
.metric-card { display: flex; align-items: center; width: 11.4583vw; height: 6.4815vh; box-sizing: border-box; padding: .9259vh .7813vw; background: linear-gradient(0deg, rgba(30, 63, 126, .40) 0%, rgba(31, 67, 138, .08) 100%); }
.metric-card img { flex: 0 0 2.6042vw; width: 2.6042vw; height: 2.6042vw; margin-right: .5208vw; object-fit: contain; }
.metric-card span { display: block; color: rgba(255,255,255,.60); font-size: .7292vw; font-weight: 400; line-height: normal; }
.metric-card strong { margin-right: .2083vw; font-size: 1.3542vw; font-weight: 900; line-height: normal; background: linear-gradient(180deg, #fff 0%, #64c7ff 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.metric-card small { color: rgba(255,255,255,.40); font-size: .625vw; font-weight: 400; line-height: normal; }
.architecture-background { display: block; width: 54.2708vw; height: 78.7037vh; margin: 1.6667vh 0 0 50%; object-fit: contain; transform: translateX(-50%); }
</style>
