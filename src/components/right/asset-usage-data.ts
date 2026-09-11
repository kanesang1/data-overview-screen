export interface AssetUsageItem {
  id: string
  assetName: string
  usageCount: number
}

// 新接口提供后，将返回数据映射为此结构，传入 AssetUsageRanking 的 items 属性。
export const assetUsagePreview: AssetUsageItem[] = [
  { id: '1', assetName: 'xx目标识别场景-2024Q3', usageCount: 2105 },
  { id: '2', assetName: 'xx质心xx场景-2024批次A', usageCount: 1862 },
  { id: '3', assetName: 'xxxxxx场景-2023批次C', usageCount: 1504 },
  { id: '4', assetName: 'xx冲淡xx场景-2024批次B', usageCount: 980 },
  { id: '5', assetName: 'xx质心xx场景-2022批次A', usageCount: 760 },
]
