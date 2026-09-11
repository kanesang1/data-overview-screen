/**
 * 树状大屏的通用弧线布局工具。
 * 根据节点数量按弧线实际长度等距取点，避免直接按横坐标分布导致视觉间距不均。
 */
export type ArcLayout = {
  leftStart: number
  leftEnd: number
  edgeTop: number
  centerTop: number
}

const getEqualArcProgress = (index: number, count: number, layout: ArcLayout) => {
  if (count <= 1) return 0.5

  const sampleCount = 100
  const points = Array.from({ length: sampleCount + 1 }, (_, sampleIndex) => {
    const progress = sampleIndex / sampleCount
    return {
      progress,
      x: (layout.leftStart + (layout.leftEnd - layout.leftStart) * progress) * 10.42,
      y: (layout.edgeTop + (layout.centerTop - layout.edgeTop) * 4 * progress * (1 - progress)) * 8.5,
    }
  })
  const lengths = points.map((point, pointIndex) => {
    if (pointIndex === 0) return 0
    const previous = points[pointIndex - 1]
    return Math.hypot(point.x - previous.x, point.y - previous.y)
  })
  const cumulativeLengths = lengths.reduce<number[]>((result, length) => {
    result.push((result[result.length - 1] ?? 0) + length)
    return result
  }, [])
  const targetLength = (cumulativeLengths[cumulativeLengths.length - 1] ?? 0) * index / (count - 1)
  const upperIndex = cumulativeLengths.findIndex(length => length >= targetLength)
  if (upperIndex <= 0) return 0

  const lowerLength = cumulativeLengths[upperIndex - 1]
  const upperLength = cumulativeLengths[upperIndex]
  const segmentProgress = upperLength === lowerLength ? 0 : (targetLength - lowerLength) / (upperLength - lowerLength)
  return points[upperIndex - 1].progress
    + (points[upperIndex].progress - points[upperIndex - 1].progress) * segmentProgress
}

export const getArcStyle = (index: number, count: number, layout: ArcLayout) => {
  const progress = getEqualArcProgress(index, count, layout)
  const arcProgress = 4 * progress * (1 - progress)
  return {
    left: `${layout.leftStart + (layout.leftEnd - layout.leftStart) * progress}%`,
    top: `${layout.edgeTop + (layout.centerTop - layout.edgeTop) * arcProgress}%`,
  }
}
