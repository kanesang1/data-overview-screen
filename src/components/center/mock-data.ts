import { computed } from 'vue'
import { dashboardLabels } from '@/config/dashboard-labels'
import scenarioIconOne from '@/assets/img/center/tree/three/scenario-node-icon-01.svg'
import scenarioIconTwo from '@/assets/img/center/tree/three/scenario-node-icon-02.svg'
import scenarioIconThree from '@/assets/img/center/tree/three/scenario-node-icon-03.svg'
import scenarioIconFour from '@/assets/img/center/tree/three/scenario-node-icon-04.svg'
import type { TreeNode } from './types'

export const scenarioNodes = computed<TreeNode[]>(() => [
  { id: 1, label: dashboardLabels.centerTree.scenario.fieldLabels.scenarioOne, icon: scenarioIconOne },
  { id: 2, label: dashboardLabels.centerTree.scenario.fieldLabels.scenarioTwo, icon: scenarioIconTwo },
  { id: 3, label: dashboardLabels.centerTree.scenario.fieldLabels.scenarioThree, icon: scenarioIconThree },
  { id: 4, label: dashboardLabels.centerTree.scenario.fieldLabels.scenarioFour, icon: scenarioIconFour },
])
