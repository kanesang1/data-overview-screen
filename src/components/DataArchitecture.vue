<script setup lang="ts">
import LayerLabel from './LayerLabel.vue'

const services = ['标准文字', '标准文字', '标准文字', '标准文字', '标准文字', '标准文字']
const bases = [
  ['99.21', '万条'], ['37.11', '万条'], ['21.98', '万条'],
  ['67.89', '万条'], ['123.98', '万条'], ['3.54', '万条'],
]
const scenes = ['应用场景一', '应用场景二', '应用场景三', '应用场景四']
</script>

<template>
  <div class="architecture">
    <div class="top-orbits">
      <div v-for="index in 4" :key="index" class="orbit-node">
        <span class="diamond">◆</span><small>标准文字</small><b>1209个</b>
      </div>
    </div>

    <div class="layer layer--service">
      <div class="nodes-row">
        <div v-for="(item, index) in services" :key="index" class="service-node">
          <span>▣</span><small>{{ item }}</small>
        </div>
      </div>
      <LayerLabel title="数据服务" />
    </div>

    <div class="layer layer--app">
      <div class="scene-row">
        <span v-for="item in scenes" :key="item">{{ item }}</span>
      </div>
      <LayerLabel title="应用数据" />
    </div>

    <div class="layer layer--base">
      <div class="base-row">
        <div v-for="index in 8" :key="index" class="base-node">
          <span>♟</span><small>标题文字</small><b>33.09万条</b>
        </div>
      </div>
      <LayerLabel title="基础数据" />
    </div>

    <div class="source-stage">
      <div v-for="([value, unit], index) in bases" :key="index" class="source-node">
        <strong>{{ value }}</strong><small>{{ unit }}</small><em>标题文字</em>
      </div>
      <LayerLabel title="数据来源" />
    </div>
  </div>
</template>

<style scoped>
.architecture { position: relative; height: 892px; padding-top: 18px; perspective: 900px; }
.top-orbits { height: 130px; display: flex; justify-content: center; gap: 72px; align-items: flex-start; }
.orbit-node { width: 100px; text-align: center; color: #c7ecff; }
.orbit-node:nth-child(even) { margin-top: 32px; }
.diamond { display: grid; place-items: center; margin: auto; width: 52px; height: 52px; font-size: 34px; color: #83e8ff; text-shadow: 0 0 18px #24bfff; background: radial-gradient(ellipse, rgba(44, 205, 255, .45), transparent 65%); }
.orbit-node small, .orbit-node b { display: block; font-size: 12px; font-weight: 400; }
.orbit-node b { color: #80d9ff; }
.layer { position: relative; width: 920px; margin: -4px auto 0; border-radius: 50%; background: linear-gradient(180deg, rgba(16, 62, 139, .08), rgba(20, 82, 185, .46)); border: 2px solid rgba(78, 152, 255, .75); box-shadow: inset 0 -22px 40px rgba(15, 86, 202, .35), 0 8px 28px rgba(0, 44, 123, .45); }
.layer::after { content: ''; position: absolute; inset: 45% 4% -8%; border-radius: 50%; border-bottom: 2px solid rgba(54, 145, 255, .85); }
.layer--service { height: 145px; width: 760px; }
.layer--app { height: 155px; margin-top: -42px; }
.layer--base { height: 195px; width: 1020px; margin-top: -52px; }
.nodes-row, .base-row, .scene-row { display: flex; align-items: center; justify-content: space-around; position: relative; z-index: 2; }
.service-node { margin-top: 16px; color: #9cecff; text-align: center; }
.service-node:nth-child(even) { margin-top: 60px; }
.service-node span { display: grid; place-items: center; width: 52px; height: 52px; margin: auto; font-size: 31px; color: #8fe9ff; background: linear-gradient(180deg, #18547c, #082640); border: 1px solid #48c8ff; box-shadow: 0 0 16px #188bd2; }
.service-node small { display: block; margin-top: 5px; }
.scene-row { padding: 60px 70px 0; color: #70c9ff; font-size: 14px; }
.base-row { padding-top: 45px; }
.base-node { color: #8fdcff; text-align: center; font-size: 12px; }
.base-node:nth-child(2n) { transform: translateY(24px); }
.base-node span { display: block; font-size: 30px; text-shadow: 0 0 14px #35cfff; }
.base-node small, .base-node b { display: block; font-weight: 400; }
.source-stage { width: 1020px; height: 220px; margin: -32px auto 0; display: flex; align-items: center; justify-content: space-around; padding: 0 60px 40px; position: relative; border-radius: 50%; background: radial-gradient(ellipse, rgba(42, 125, 246, .55), rgba(11, 52, 133, .3) 50%, transparent 70%); border-bottom: 2px solid #236dcc; }
.source-node { width: 92px; height: 92px; border-radius: 50%; display: grid; place-content: center; text-align: center; color: #e3f8ff; background: radial-gradient(circle at 45% 38%, #3e8bcc, #07182e 67%); box-shadow: 0 0 22px #56cfff; }
.source-node:nth-child(2n) { transform: translateY(34px); }
.source-node strong { font-size: 19px; }
.source-node small { font-size: 12px; }
.source-node em { position: absolute; transform: translate(-4px, 72px); width: 100px; font-size: 12px; font-style: normal; color: #72bdec; }
</style>
