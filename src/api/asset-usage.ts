import { http } from './http'
import type { ApiResponse } from './dashboard'

export interface DatasetAssetUsageSummary {
  totalCount: number
  monthUsageCount: number
  activeCount: number
  topByUsage: Array<{ id: string; name: string; usageCount: number; updatedAt: string }>
}

export const getDatasetAssetUsageSummary = () =>
  http.get<ApiResponse<DatasetAssetUsageSummary>>('/api/dataset-assets/usage-summary', { baseURL: '/' })
