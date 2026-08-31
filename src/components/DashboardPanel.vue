<script setup lang="ts">
defineProps<{ title: string; symbol?: string }>()
</script>

<template>
  <section class="panel">
    <header class="panel__header">
      <span class="panel__symbol">{{ symbol ?? '◆' }}</span>
      <h2>{{ title }}</h2>
    </header>
    <div class="panel__body"><slot /></div>
  </section>
</template>

<style scoped>
.panel { position: relative; }
.panel__header {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  background: linear-gradient(90deg, rgba(20, 79, 157, .9), rgba(11, 43, 91, .25));
  border-left: 3px solid #27c8ff;
  box-shadow: inset 0 0 20px rgba(35, 121, 255, .16);
}
.panel__header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 39px;
  height: 1px;
  background: linear-gradient(90deg, #3edaff, transparent);
}
.panel__symbol { color: #9fe8ff; font-size: 17px; }
h2 { margin: 0; color: #c7ebff; font-size: 18px; font-weight: 600; letter-spacing: 1px; }
.panel__body { min-height: 0; padding: 16px 10px 8px; }
</style>
