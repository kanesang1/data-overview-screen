# 中部树状大屏组件

此目录按“层级入口、公共子组件、布局工具、共享样式”组织，修改前可按下面的职责快速定位文件。

- `ServiceLayer.vue`：数据服务层，包含节点轮播、提示信息及图片弹窗入口。
- `ApplicationLayer.vue`：应用数据层，包含循环轨道、可见节点及交互状态。
- `FoundationLayer.vue`：应用场景与基础数据层，包含弧线布局和基础数据轮播。
- `SourceLayer.vue`：数据来源层，负责接口请求和来源节点展示。
- `components/`：各层引用的可复用或叶子 UI 组件，不在此处处理层级布局。
- `arc-layout.ts`：多层可复用的弧线等距布局计算。
- `foundation-icon-order.ts`：基础数据图标及对应尺寸的插入、顺延规则。
- `tree-shared.css`：各层共同依赖的基础类；层级特有样式保留在对应 Vue 文件中。

新增跨层复用的 UI 组件放入 `components/`；新增纯布局计算优先放入独立 TypeScript 工具文件，避免继续扩大各层组件。
