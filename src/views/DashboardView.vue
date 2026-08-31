<script setup lang="ts">
import DashboardPanel from '@/components/DashboardPanel.vue'
import DataArchitecture from '@/components/DataArchitecture.vue'
import EChart from '@/components/EChart.vue'
import { useScreenFit } from '@/composables/useScreenFit'
import { departments, qualityOption, sourceOption, trendOption } from '@/data/dashboard'

const { canvasStyle } = useScreenFit()
</script>

<template>
  <main class="viewport">
    <div class="screen" :style="canvasStyle">
      <div class="screen__edge" />
      <header class="topbar">
        <h1>数据总览</h1>
        <button type="button">管理平台</button>
      </header>

      <aside class="column column--left">
        <DashboardPanel title="数据质量评价" symbol="▣">
          <div class="quality-chart"><EChart :option="qualityOption" /></div>
          <div class="quality-metrics"><span>维度1<b>33.09万条</b></span><span>维度2<b>33.09万条</b></span><span>维度3<b>33.09万条</b></span></div>
        </DashboardPanel>
        <DashboardPanel title="数据资产来源" symbol="▥">
          <div class="source-chart"><EChart :option="sourceOption" /></div>
        </DashboardPanel>
      </aside>

      <section class="center"><DataArchitecture /></section>

      <aside class="column column--right">
        <DashboardPanel title="数据资产应用" symbol="◆">
          <div class="departments">
            <article v-for="item in departments" :key="item.name">
              <h3>{{ item.name }}</h3>
              <p>表 <strong>{{ item.count }}</strong><small>万张</small></p>
              <p>占比 <strong>{{ item.rate }}</strong></p>
            </article>
          </div>
        </DashboardPanel>
        <DashboardPanel title="数据资产变化" symbol="◉">
          <div class="trend-chart"><EChart :option="trendOption" /></div>
        </DashboardPanel>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.viewport { position: fixed; inset: 0; overflow: hidden; background: #01050d; }
.screen { position: absolute; left: 50%; top: 50%; transform-origin: center; overflow: hidden; color: #d6f4ff; background: linear-gradient(rgba(2,10,23,.68), rgba(2,10,23,.52)), url('/figma/raw-5.png') center/cover no-repeat; }
.screen::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 52%, rgba(13, 67, 161, .12), rgba(1, 7, 18, .62) 72%); pointer-events: none; }
.screen__edge { position: absolute; z-index: 10; inset: 8px; pointer-events: none; border: 1px solid rgba(74, 175, 255, .8); clip-path: polygon(0 0, 37% 0, 39% 1.2%, 61% 1.2%, 63% 0, 100% 0, 100% 100%, 63% 100%, 61% 98.8%, 39% 98.8%, 37% 100%, 0 100%); box-shadow: inset 0 0 24px rgba(46, 138, 255, .8); }
.topbar { position: absolute; z-index: 4; left: 0; top: 0; width: 100%; height: 95px; background: linear-gradient(135deg, transparent 28%, rgba(16,74,145,.5) 37%, rgba(29,101,182,.35) 50%, rgba(16,74,145,.5) 63%, transparent 72%); border-top: 2px solid #74bfff; }
.topbar::after { content: ''; position: absolute; left: 635px; right: 635px; bottom: 13px; height: 2px; background: linear-gradient(90deg, transparent, #8bd9ff, transparent); box-shadow: 0 0 15px #6ecbff; }
.topbar h1 { margin: 22px 0 0; text-align: center; font-family: 'Microsoft YaHei', sans-serif; font-size: 32px; letter-spacing: 8px; text-shadow: 0 0 14px #80cfff; }
.topbar button { position: absolute; right: 38px; top: 20px; color: #d3efff; font-size: 13px; padding: 8px 14px; border: 1px solid #2e6da9; background: rgba(22, 65, 122, .8); }
.column { position: absolute; z-index: 3; top: 88px; width: 405px; display: grid; gap: 40px; }
.column--left { left: 50px; }
.column--right { right: 50px; }
.center { position: absolute; z-index: 2; left: 420px; right: 420px; top: 105px; bottom: 0; }
.quality-chart { height: 245px; }
.quality-metrics { display: flex; justify-content: space-around; margin-top: -22px; color: #99c9e8; font-size: 13px; text-align: center; }
.quality-metrics b { display: block; margin-top: 7px; color: #b7eaff; }
.source-chart { height: 315px; }
.departments { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px 18px; }
.departments article { height: 112px; padding: 0 14px; background: linear-gradient(135deg, rgba(20,68,139,.62), rgba(8,29,62,.24)); border: 1px solid rgba(36,106,183,.22); }
.departments h3 { height: 28px; margin: 0 -14px 10px; padding: 5px 12px; color: #9dcef1; font-size: 14px; background: linear-gradient(90deg, rgba(32,83,158,.7), transparent); }
.departments article:nth-child(even) h3 { text-align: right; }
.departments p { margin: 8px 0; color: #87a9c4; font-size: 12px; }
.departments strong { margin-left: 18px; color: #d5f0ff; font-size: 19px; }
.departments small { color: #7195b0; }
.trend-chart { height: 310px; }
</style>
