export type MetricCard = {
  label: string
  value: string
  unit: string
  icon: string
}

export type TreeNode = {
  id: number
  label: string
  value?: string
  unit?: string
  icon?: string
  dimensionScores?: {
    waveformScore: number
    targetScore: number
    clutterScore: number
    sceneScore: number
    climateScore: number
  }
}
