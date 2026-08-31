# 数据总览大屏

基于 Vue 3、TypeScript、Vite 与 ECharts 的 1920 × 1080 数据可视化大屏框架。

## 启动

```bash
npm install
npm run dev
```

## 目录

- `src/views`：页面视图
- `src/components`：大屏面板、图表和中间数据架构组件
- `src/composables/useScreenFit.ts`：1920 × 1080 等比缩放适配
- `src/data`：页面模拟数据与 ECharts 配置
- `public/figma/design-reference.png`：Figma 节点导出参考图，仅用于视觉校对
- `public/figma/raw-*.png`：Figma 原始位图素材

设计稿：[产品设计 ts](https://www.figma.com/design/lPvqKFwXdXol8Ca540ldkU/%E4%BA%A7%E5%93%81%E8%AE%BE%E8%AE%A1-ts-?node-id=8507-15273&m=dev)
