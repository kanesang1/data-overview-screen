/** 基础数据图标顺序：十条数据时在第八个位置额外插入第一组图标与尺寸。 */
export const getFoundationIconIndex = (index: number, itemCount: number) => {
  if (itemCount !== 10) return index
  if (index === 7) return 0
  return index > 7 ? index - 1 : index
}
