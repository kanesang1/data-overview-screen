<script setup lang="ts">
import type { TreeNode } from '../types'

defineProps<{
  data: NonNullable<TreeNode['tooltip']>
}>()
</script>

<template>
  <span class="node-data-tooltip" role="tooltip">
    <strong class="node-data-tooltip__title">{{ data.projectName }}</strong>
    <span class="node-data-tooltip__row">
      <span class="node-data-tooltip__key">项目数量：</span>
      <span class="node-data-tooltip__value">{{ data.projectCount }}</span>
    </span>
    <span v-for="(item, index) in data.items" :key="`${item.key}-${index}`" class="node-data-tooltip__row">
      <span class="node-data-tooltip__key">{{ item.key }}：</span>
      <span class="node-data-tooltip__value">{{ item.value }}</span>
    </span>
  </span>
</template>

<style scoped>
.node-data-tooltip {
  position: absolute;
  z-index: 1000;
  bottom: calc(100% + .7678cqw);
  left: 50%;
  display: none;
  width: 30.3263cqw;
  height: auto;
  box-sizing: border-box;
  padding: 1.5355cqw;
  border-radius: 1.1516cqw;
  color: #fff;
  font-size: 1.3436cqw;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  text-align: left;
  white-space: normal;
  background: #2b3b69;
  box-shadow: 0 .3839cqw 4.2226cqw 0 rgba(0, 0, 0, .25);
  transform: translateX(-50%);
  pointer-events: none;
}
.node-data-tooltip__title {
  display: block;
  margin-bottom: 1.1516cqw;
  color: #fff;
  font-size: 1.5355cqw;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
}
.node-data-tooltip__row {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: start;
  margin-top: 1.1516cqw;
}
.node-data-tooltip__row:first-of-type { margin-top: 0; }
.node-data-tooltip__key { color: rgba(255, 255, 255, .60); }
.node-data-tooltip__value {
  min-width: 0;
  color: rgba(255, 255, 255, .80);
  overflow-wrap: anywhere;
}
</style>
