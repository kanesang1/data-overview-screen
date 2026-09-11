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
  tooltip?: {
    projectName: string
    projectCount: string | number
    items: Array<{
      key: string
      value: string | number
    }>
  }
  gallery?: {
    title: string
    items: Array<{
      src: string
      description: string
      layout: 'square' | 'wide'
    }>
  }
  dimensionScores?: {
    waveformScore: number
    targetScore: number
    clutterScore: number
    sceneScore: number
    climateScore: number
  }
}
