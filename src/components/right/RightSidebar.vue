<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getDatasetAssetUsageSummary } from '@/api'
import AssetUsageRanking from './AssetUsageRanking.vue'
import type { AssetUsageItem } from './asset-usage-data'
import DataAssetChangeTrend from './DataAssetChangeTrend.vue'

const usageItems = ref<AssetUsageItem[]>([])
const usageLoading = ref(true)
const usageError = ref('')

async function loadUsageSummary() {
  usageLoading.value = true
  usageError.value = ''
  try {
    const response = await getDatasetAssetUsageSummary()
    if (response.code !== 200) throw new Error(response.message || '加载失败')
    usageItems.value = response.data.topByUsage.slice(0, 5).map(item => ({
      id: item.id, assetName: item.name, usageCount: item.usageCount,
    }))
  } catch {
    usageItems.value = []
    usageError.value = '加载失败，请确认登录后重试'
  } finally {
    usageLoading.value = false
  }
}

onMounted(() => {
  void Promise.allSettled([loadUsageSummary()])
})
</script>

<template>
  <aside class="right-sidebar">
    <AssetUsageRanking :items="usageItems" :loading="usageLoading" :error="usageError" @retry="loadUsageSummary" />
    <DataAssetChangeTrend />
  </aside>
</template>

<style scoped>
.right-sidebar { display: flex; align-items: flex-end; flex-direction: column; gap: 0; }.right-sidebar :deep(.panel-section) { width: 20.8vw; }.right-sidebar :deep(.panel-section--secondary) { width: 17.7083vw; }
</style>
