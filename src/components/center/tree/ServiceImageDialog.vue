<script setup lang="ts">
import type { TreeNode } from '../types'

defineProps<{
  gallery: NonNullable<TreeNode['gallery']>
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <div class="service-image-dialog__backdrop" @click.self="emit('close')">
      <section class="service-image-dialog" role="dialog" aria-modal="true" :aria-label="gallery.title">
        <header class="service-image-dialog__header">
          <h3>{{ gallery.title }}</h3>
          <button type="button" aria-label="关闭图片弹窗" @click="emit('close')">×</button>
        </header>
        <div class="service-image-dialog__grid">
          <figure
            v-for="(item, index) in gallery.items"
            :key="`${item.src}-${index}`"
            :class="`service-image-dialog__item--${item.layout}`"
          >
            <img :src="item.src" alt="" />
            <figcaption>{{ item.description }}</figcaption>
          </figure>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.service-image-dialog__backdrop {
  position: fixed;
  z-index: 3000;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, .35);
}
.service-image-dialog {
  display: flex;
  max-height: 96vh;
  width: 30.2083vw;
  box-sizing: border-box;
  flex-direction: column;
  padding: .7407vh .8333vw 1.1111vh;
  border: 1px solid rgba(255, 255, 255, .18);
  border-radius: .4167vw;
  background: #2b3b69;
  box-shadow: 0 .3704vh 2.2917vw rgba(0, 0, 0, .25);
  font-family: "Source Han Sans CN", "Microsoft YaHei", sans-serif;
}
.service-image-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.1111vh;
}
.service-image-dialog__header h3 {
  margin: 0;
  color: #fff;
  font-size: .8333vw;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
}
.service-image-dialog__header button {
  width: 1.25vw;
  height: 1.25vw;
  padding: 0;
  border: 0;
  color: rgba(255, 255, 255, .60);
  font: 400 1.25vw/1 "Microsoft YaHei", sans-serif;
  background: transparent;
  cursor: pointer;
}
.service-image-dialog__grid {
  display: flex;
  align-content: flex-start;
  align-items: flex-start;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 1.1111vh .8333vw;
  overflow-x: hidden;
  overflow-y: auto;
}
.service-image-dialog__grid figure { min-width: 0; margin: 0; }
.service-image-dialog__item--square { width: 6.6667vw; flex: 0 0 6.6667vw; }
.service-image-dialog__item--wide { width: 19.4271vw; flex: 0 0 19.4271vw; }
.service-image-dialog__grid img {
  display: block;
  width: 100%;
  height: 11.8519vh;
  object-fit: fill;
}
.service-image-dialog__grid figcaption {
  margin-top: .5556vh;
  overflow: hidden;
  color: rgba(255, 255, 255, .60);
  font-size: .7292vw;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
