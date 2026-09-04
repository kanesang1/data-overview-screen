<script setup lang="ts">
import CenterStage from '@/components/CenterStage.vue'
import LeftSidebar from '@/components/LeftSidebar.vue'
import RightSidebar from '@/components/RightSidebar.vue'
import background from '@/assets/img/bg/dashboard-background.png'
import headerBg from '@/assets/img/bg/dashboard-header.png'
import leftFrame from '@/assets/img/bg/dashboard-frame-left.png'
import rightFrame from '@/assets/img/bg/dashboard-frame-right.png'
import bottomFrame from '@/assets/img/bg/dashboard-footer.png'
import leftDecoration from '@/assets/img/bg/sidebar-decoration-left.png'
import rightDecoration from '@/assets/img/bg/sidebar-decoration-right.png'
import { dashboardLabels } from '@/config/dashboard-labels'

const labels = dashboardLabels.pageHeader
</script>

<template>
  <main class="viewport"><div class="screen">
    <img class="screen__background" :src="background" alt="" /><img class="screen__frame screen__frame--left" :src="leftFrame" alt="" /><img class="screen__frame screen__frame--right" :src="rightFrame" alt="" /><img class="screen__header-art" :src="headerBg" alt="" /><img class="screen__footer-art" :src="bottomFrame" alt="" />
    <header class="topbar"><h1>{{ labels.title }}</h1><button type="button">{{ labels.platform }}</button></header>
    <img class="sidebar-frame sidebar-frame--left" :src="leftDecoration" alt="" /><LeftSidebar class="column column--left" />
    <CenterStage />
    <img class="sidebar-frame sidebar-frame--right" :src="rightDecoration" alt="" /><RightSidebar class="column column--right" />
  </div></main>
</template>

<style scoped>
.viewport, .screen { position: fixed; inset: 0; overflow: hidden; }.viewport { background: #020812; }.screen { color: #d9f3ff; }.screen__background, .screen__frame, .screen__header-art, .screen__footer-art, .sidebar-frame { position: absolute; pointer-events: none; user-select: none; }.screen__background { z-index: 0; inset: 0; width: 100vw; height: 100vh; }.screen__frame { z-index: 5; top: 0; width: 60.7813vw; height: 100vh; }.screen__frame--left { left: 0; }.screen__frame--right { right: 0; }.screen__header-art { z-index: 2; top: 0; left: 0; width: 100vw; height: 8.8889vh; }.screen__footer-art { z-index: 4; bottom: 0; left: 30.4688vw; width: 39.8958vw; height: 3.8889vh; }.topbar { position: absolute; z-index: 6; top: 0; left: 0; width: 100vw; height: 8.8889vh; }.topbar h1 { margin: 2.2222vh 0 0; text-align: center; color: #d8f4ff; font-size: 1.6667vw; font-weight: 700; line-height: 4.4444vh; letter-spacing: .3646vw; text-shadow: 0 0 .625vw rgba(106, 203, 255, .8); }.topbar button { position: absolute; top: 2.4074vh; right: 2.0833vw; height: 2.963vh; padding: 0 .625vw; color: #d7f1ff; font-size: .7292vw; border: 1px solid #3678bf; background: rgba(19, 61, 119, .78); }.sidebar-frame { z-index: 3; top: 8.4259vh; width: 22.9688vw; height: 90.2778vh; }.sidebar-frame--left { left: 1.0417vw; }.sidebar-frame--right { right: 1.0417vw; }.column { position: absolute; z-index: 4; top: 8.4259vh; width: 21.1458vw; height: 90.0926vh; }.column--left { left: 1.6667vw; }.column--right { right: 1.6667vw; }
</style>
