import metricOne from '@/assets/img/center/total-view-icon/overview-metric-01.svg'
import metricTwo from '@/assets/img/center/total-view-icon/overview-metric-02.svg'
import metricThree from '@/assets/img/center/total-view-icon/overview-metric-03.svg'
import metricFour from '@/assets/img/center/total-view-icon/overview-metric-04.svg'
import scenarioIconOne from '@/assets/img/center/tree/three/scenario-node-icon-01.svg'
import scenarioIconTwo from '@/assets/img/center/tree/three/scenario-node-icon-02.svg'
import scenarioIconThree from '@/assets/img/center/tree/three/scenario-node-icon-03.svg'
import scenarioIconFour from '@/assets/img/center/tree/three/scenario-node-icon-04.svg'
import type { MetricCard, TreeNode } from './types'

export const metrics: MetricCard[] = [
  { label: '总记录', value: '262', unit: '亿条', icon: metricOne },
  { label: '记录环比', value: '28.5%', unit: '↑', icon: metricTwo },
  { label: '总表数', value: '57.8', unit: '万张', icon: metricThree },
  { label: '总容量', value: '31.8', unit: 'TB', icon: metricFour },
]

export const serviceNodes: TreeNode[] = [
  { id: 1, label: '交换服务', value: '1209', unit: '个' },
  { id: 2, label: '共享服务', value: '986', unit: '个' },
  { id: 3, label: '目录服务', value: '732', unit: '个' },
  { id: 4, label: '治理服务', value: '645', unit: '个' },
]

export const scenarioNodes: TreeNode[] = [
  { id: 1, label: '应用场景一', icon: scenarioIconOne },
  { id: 2, label: '应用场景二', icon: scenarioIconTwo },
  { id: 3, label: '应用场景三', icon: scenarioIconThree },
  { id: 4, label: '应用场景四', icon: scenarioIconFour },
]
