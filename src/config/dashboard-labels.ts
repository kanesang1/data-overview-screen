import { reactive } from 'vue'

type SourceFieldLabels = {
  actual: string
  simulation: string
  imported: string
  yellow_sea: string
  bohai: string
  east_sea: string
}

type QualityScoreField = 'waveformScore' | 'targetScore' | 'clutterScore' | 'sceneScore' | 'climateScore'

export interface DashboardLabels {
  pageHeader: { title: string; platform: string }
  leftTop: {
    title: string
    fieldLabels: Record<QualityScoreField, string>
    fieldUnits: Record<QualityScoreField | 'datasetCnt', string>
  }
  leftBottom: { title: string; fieldLabels: SourceFieldLabels; fieldUnit: string }
  rightTop: {
    title: string
    fieldLabels: Record<'tableCnt' | 'departmentRatio', string>
    fieldUnits: Record<'tableCnt' | 'departmentRatio', string>
  }
  rightBottom: {
    title: string
    fieldLabels: Record<'changeCnt' | 'changeRate', string>
    fieldUnits: Record<'changeCnt' | 'changeRate', string>
    unitTitle: string
    monthSuffix: string
  }
  centerTree: {
    service: { title: string }
    application: { title: string }
    foundation: { title: string }
    source: { title: string; fieldLabels: SourceFieldLabels; fieldUnit: string }
  }
}

const emptySourceFieldLabels = (): SourceFieldLabels => ({
  actual: '', simulation: '', imported: '', yellow_sea: '', bohai: '', east_sea: '',
})

const emptyLabels: DashboardLabels = {
  pageHeader: { title: '', platform: '' },
  leftTop: {
    title: '',
    fieldLabels: { waveformScore: '', targetScore: '', clutterScore: '', sceneScore: '', climateScore: '' },
    fieldUnits: { datasetCnt: '', waveformScore: '', targetScore: '', clutterScore: '', sceneScore: '', climateScore: '' },
  },
  leftBottom: { title: '', fieldLabels: emptySourceFieldLabels(), fieldUnit: '' },
  rightTop: {
    title: '',
    fieldLabels: { tableCnt: '', departmentRatio: '' },
    fieldUnits: { tableCnt: '', departmentRatio: '' },
  },
  rightBottom: {
    title: '',
    fieldLabels: { changeCnt: '', changeRate: '' },
    fieldUnits: { changeCnt: '', changeRate: '' },
    unitTitle: '',
    monthSuffix: '',
  },
  centerTree: {
    service: { title: '' },
    application: { title: '' },
    foundation: { title: '' },
    source: { title: '', fieldLabels: emptySourceFieldLabels(), fieldUnit: '' },
  },
}

export const dashboardLabels = reactive<DashboardLabels>(emptyLabels)

function mergeLabels(target: Record<string, unknown>, source: Record<string, unknown>) {
  Object.entries(source).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const targetValue = target[key]
      if (targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
        mergeLabels(targetValue as Record<string, unknown>, value as Record<string, unknown>)
      }
    } else if (typeof value === 'string' && key in target) {
      target[key] = value
    }
  })
}

/** 在应用挂载前加载打包后仍可修改的模块文案。 */
export async function loadDashboardLabels() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}config/dashboard-labels.json`, { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    mergeLabels(dashboardLabels as unknown as Record<string, unknown>, await response.json())
  } catch (error) {
    console.error('[界面文案配置] 加载失败：', error)
  }
}
