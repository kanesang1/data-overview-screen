import metricOne from '@/assets/img/center/total-view-icon/overview-metric-01.svg'
import metricTwo from '@/assets/img/center/total-view-icon/overview-metric-02.svg'
import metricThree from '@/assets/img/center/total-view-icon/overview-metric-03.svg'
import metricFour from '@/assets/img/center/total-view-icon/overview-metric-04.svg'
import foundationIcon from '@/assets/img/center/tree/two/application-node-icon.svg'
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

export const applicationNodes: TreeNode[] = [
  '全市政务数据共享交换服务管理应用',
  '城市运行综合监测分析管理服务应用',
  '公共资源交易数据协同监管服务应用',
  '基层社会治理联动指挥调度服务应用',
  '生态环境质量监测预警分析服务应用',
  '公共安全风险研判预警处置服务应用',
  '城市交通运行态势分析管理服务应用',
  '全民医疗健康数据便民服务管理应用',
  '公共教育资源统筹配置管理服务应用',
  '市场主体综合监管分析决策服务应用',
  '基本民生服务保障协同管理服务应用',
  '突发事件应急指挥联动调度服务应用',
].map((label, index) => ({ id: index + 1, label }))

export const scenarioNodes: TreeNode[] = [
  { id: 1, label: '应用场景一', icon: scenarioIconOne },
  { id: 2, label: '应用场景二', icon: scenarioIconTwo },
  { id: 3, label: '应用场景三', icon: scenarioIconThree },
  { id: 4, label: '应用场景四', icon: scenarioIconFour },
]

export const foundationNodes: TreeNode[] = [
  ['人口库', '33.09'], ['法人库', '28.76'], ['空间库', '45.20'],
  ['电子证照', '19.86'], ['信用库', '37.42'], ['事项库', '26.18'],
  ['资源库', '41.06'], ['主题库', '30.55'], ['专题库', '35.72'],
].map(([label, value], index) => ({ id: index + 1, label, value, unit: '万条', icon: foundationIcon }))

export const sourceNodes: TreeNode[] = [
  { id: 1, label: '接口采集', value: '99.21', unit: '万条' },
  { id: 2, label: '库表交换', value: '37.11', unit: '万条' },
  { id: 3, label: '文件导入', value: '21.98', unit: '万条' },
  { id: 4, label: '实时接入', value: '67.89', unit: '万条' },
  { id: 5, label: '人工填报', value: '123.98', unit: '万条' },
  { id: 6, label: '其他来源', value: '3.54', unit: '万条' },
]
