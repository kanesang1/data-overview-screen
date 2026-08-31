<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>
<template><div class="layer-label">{{ title }}</div></template>
<style scoped>
.layer-label { position: absolute; z-index: 5; left: 50%; bottom: -8px; transform: translateX(-50%); width: 160px; height: 34px; display: grid; place-items: center; color: #d9f6ff; font-size: 17px; font-weight: 600; background: linear-gradient(180deg, #2b8ed1, #0b3979); border: 1px solid #63d9ff; clip-path: polygon(9% 0, 91% 0, 100% 50%, 91% 100%, 9% 100%, 0 50%); text-shadow: 0 0 10px #80eaff; box-shadow: 0 0 20px #269bf1; }
</style>
