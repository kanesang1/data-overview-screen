<script setup lang="ts">
defineProps<{ title: string; icon?: string }>()
</script>

<template>
  <section class="panel-section">
    <header class="panel-section__header">
      <span class="panel-section__marker" aria-hidden="true" />
      <img v-if="icon" class="panel-section__icon" :src="icon" alt="" />
      <h2>{{ title }}</h2>
    </header>
    <div class="panel-section__content"><slot /></div>
  </section>
</template>

<style scoped>
.panel-section { min-width: 0; }
.panel-section__header { display: flex; align-items: center; height: 3.7037vh; padding: .7407vh .8333vw; background: linear-gradient(90deg, #1e3f7e 0%, rgba(31, 67, 138, .2) 100%); }
.panel-section__marker { flex: 0 0 .1563vw; width: .1563vw; height: 1.4815vh; margin-right: .6771vw; background: #57d2ff; }
.panel-section__icon { flex: 0 0 1.25vw; width: 1.25vw; height: 1.25vw; margin-right: .4167vw; object-fit: contain; }
h2 { margin: 0; font-size: .9375vw; font-weight: 700; line-height: normal; letter-spacing: .0281vw; background: linear-gradient(180deg, #fff 0%, #64c7ff 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.panel-section__content { min-height: 0; }
</style>
