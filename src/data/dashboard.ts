import type { EChartsOption } from 'echarts'

export const qualityOption: EChartsOption = {
  radar: {
    center: ['50%', '46%'], radius: '55%',
    indicator: [{ name: '完整性', max: 100 }, { name: '准确性', max: 100 }, { name: '一致性', max: 100 }],
    axisName: { color: '#8edaff', fontSize: 12 },
    splitArea: { areaStyle: { color: ['rgba(18,68,145,.18)', 'rgba(16,95,190,.08)'] } },
    splitLine: { lineStyle: { color: '#2567ae' } }, axisLine: { lineStyle: { color: '#2567ae' } },
  },
  series: [{ type: 'radar', symbolSize: 5, lineStyle: { color: '#29c7ff' }, areaStyle: { color: 'rgba(32,126,255,.56)' }, data: [{ value: [92, 88, 90] }] }],
}

export const sourceOption: EChartsOption = {
  color: ['#2e91ea', '#4650d7', '#7a4bd1', '#c23a87', '#18aa8c'],
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, left: 'center', textStyle: { color: '#8bbce1', fontSize: 11 }, itemWidth: 10, itemHeight: 7 },
  series: [{ type: 'pie', radius: ['0%', '58%'], center: ['50%', '43%'], roseType: 'radius', label: { show: false }, data: [
    { value: 42.12, name: '采集数据' }, { value: 33.75, name: '仿真数据' }, { value: 24.87, name: '引进数据' }, { value: 17.43, name: '内部数据' }, { value: 9.21, name: '内容标签' },
  ] }],
}

export const trendOption: EChartsOption = {
  grid: { left: 42, right: 18, top: 26, bottom: 30 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'], axisLine: { lineStyle: { color: '#36567d' } }, axisLabel: { color: '#7292af', fontSize: 10 } },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(67,111,151,.3)' } }, axisLabel: { color: '#7292af', fontSize: 10 } },
  series: [
    { type: 'bar', data: [230,300,260,140,260,180,350,420,180,130,160,320], barWidth: 10, itemStyle: { color: '#1688ed' } },
    { type: 'line', data: [260,340,230,310,370,280,390,460,190,230,240,380], symbolSize: 6, lineStyle: { color: '#13f2df', width: 2 }, itemStyle: { color: '#0b182b', borderColor: '#18fff1', borderWidth: 2 } },
  ],
}

export const departments = [
  { name: '部门1', count: '16.2', rate: '28.5%' },
  { name: '部门2', count: '8.1', rate: '14.5%' },
  { name: '部门3', count: '20.5', rate: '54.7%' },
  { name: '部门4', count: '13.2', rate: '18.5%' },
]
