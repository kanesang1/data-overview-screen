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
type DatasetIdentityField = 'datasetId' | 'datasetDesc'

export interface DashboardLabels {
  pageHeader: { title: string; platform: string }
  common: {
    /** 左上角、应用数据层和基础数据层共用的五维评分文案。 */
    qualityDimensions: {
      fieldLabels: Record<QualityScoreField, string>
      fieldUnits: Record<QualityScoreField, string>
    }
    /** 左下角和数据来源层共用的数据来源文案。 */
    dataSources: { fieldLabels: SourceFieldLabels }
  }
  leftTop: {
    title: string
    dimensionTitle: string
    dimensionUnit: string
  }
  leftBottom: { title: string; fieldUnit: string }
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
    application: {
      title: string
      fieldLabels: Record<DatasetIdentityField, string>
    }
    foundation: {
      title: string
      fieldLabels: Record<DatasetIdentityField | 'datasetCnt', string>
      fieldUnits: Record<'datasetCnt', string>
    }
    source: { title: string; fieldUnit: string }
  }
}

const emptySourceFieldLabels = (): SourceFieldLabels => ({
  actual: '', simulation: '', imported: '', yellow_sea: '', bohai: '', east_sea: '',
})

const emptyLabels: DashboardLabels = {
  pageHeader: { title: '', platform: '' },
  common: {
    qualityDimensions: {
      fieldLabels: { waveformScore: '', targetScore: '', clutterScore: '', sceneScore: '', climateScore: '' },
      fieldUnits: { waveformScore: '', targetScore: '', clutterScore: '', sceneScore: '', climateScore: '' },
    },
    dataSources: { fieldLabels: emptySourceFieldLabels() },
  },
  leftTop: {
    title: '',
    dimensionTitle: '',
    dimensionUnit: '',
  },
  leftBottom: { title: '', fieldUnit: '' },
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
    application: {
      title: '',
      fieldLabels: { datasetId: '', datasetDesc: '' },
    },
    foundation: {
      title: '',
      fieldLabels: { datasetId: '', datasetDesc: '', datasetCnt: '' },
      fieldUnits: { datasetCnt: '' },
    },
    source: { title: '', fieldUnit: '' },
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
