<script setup lang="ts">
import { computed } from 'vue'
import PanelSection from '@/components/PanelSection.vue'
import appIcon from '@/assets/img/right/panel-icon-application.svg'
import goldCrown from '@/assets/img/right/ranking-crown-gold.svg'
import silverCrown from '@/assets/img/right/ranking-crown-silver.svg'
import bronzeCrown from '@/assets/img/right/ranking-crown-bronze.svg'
import { assetUsagePreview, type AssetUsageItem } from './asset-usage-data'

const props = withDefaults(defineProps<{ items?: readonly AssetUsageItem[]; loading?: boolean; error?: string }>(), {
  items: () => assetUsagePreview,
})
defineEmits<{ retry: [] }>()
const rows = computed(() => props.items.slice(0, 5))
const crowns = [goldCrown, silverCrown, bronzeCrown]
</script>

<template>
  <PanelSection title="数据集资产使用" :icon="appIcon">
    <div class="asset-usage-content">
      <table class="asset-usage-table" aria-label="数据集资产使用排名">
        <colgroup><col class="rank-column" /><col class="name-column" /><col class="count-column" /></colgroup>
        <thead><tr><th scope="col">排名</th><th scope="col">资产名称</th><th scope="col">使用次数</th></tr></thead>
        <tbody>
          <tr v-if="loading || error || !rows.length"><td colspan="3" class="usage-status" aria-live="polite">{{ loading ? '加载中…' : error || '暂无使用数据' }}<button v-if="error && !loading" type="button" @click="$emit('retry')">重试</button></td></tr>
          <tr v-for="(item, index) in rows" :key="item.id">
            <td class="rank-cell">
              <span v-if="index < 3" class="rank-medal" :class="'rank-medal--' + (index + 1)">
                <img :src="crowns[index]" alt="" /><span>{{ index + 1 }}</span>
              </span>
              <span v-else>{{ index + 1 }}</span>
            </td>
            <td class="asset-name" :title="item.assetName">{{ item.assetName }}</td>
            <td class="usage-count">{{ item.usageCount }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </PanelSection>
</template>

<style scoped>
/* 1920 × 1080 设计基准；与大屏现有 vw / vh 布局同步缩放。 */
.asset-usage-content { width: 100%; height: 36.0185vh; padding-top: 1.481481vh; }
.asset-usage-table { width: calc(100% - .052083vw); margin-left: .052083vw; border-collapse: collapse; table-layout: fixed; }
.rank-column { width: 16.049383%; }
.name-column { width: 62.962963%; }
.count-column { width: 20.987654%; }
th, td { padding: 0; line-height: normal; }
thead tr { height: 2.962963vh; background: #213354; box-shadow: 0 -.092593vh 0 0 rgba(0, 0, 0, .1) inset; }
th { color: rgba(255, 255, 255, .6); text-align: center; font-size: .677083vw; font-weight: 400; }
th:nth-child(2), .asset-name { padding-left: 1.770833vw; text-align: left; }
th:nth-child(3), .usage-count { padding-left: .46875vw; text-align: left; }
tbody tr { height: 4.074074vh; background: rgba(30, 63, 126, .26); box-shadow: 0 -.092593vh 0 0 rgba(255, 255, 255, .1) inset; }
.rank-cell { color: rgba(255, 255, 255, .6); text-align: center; font-size: .677083vw; font-weight: 500; }
.rank-medal { position: relative; display: inline-block; width: 1.5625vw; height: 2.314815vh; vertical-align: middle; font-size: .625vw; font-weight: 900; text-shadow: .026042vw .046296vh 0 rgba(255, 255, 255, .7); }
.rank-medal img { display: block; width: 100%; height: 100%; }
.rank-medal > span { position: absolute; inset: 0; display: flex; align-items: flex-end; justify-content: center; padding-bottom: .092593vh; }
.rank-medal--1 { color: #895000; }
.rank-medal--2 { color: #606060; }
.rank-medal--3 { color: #5b3717; }
.asset-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: rgba(255, 255, 255, .8); font-size: .729167vw; font-weight: 400; }
.usage-count { color: #1bffe1; font-size: .729167vw; font-weight: 700; font-variant-numeric: tabular-nums; }
.usage-status { text-align: center; color: rgba(255,255,255,.6); font-size: .677083vw; }
.usage-status button { margin-left: .520833vw; border: 0; padding: 0; background: transparent; color: #1bffe1; cursor: pointer; }
</style>
