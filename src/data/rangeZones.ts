import * as pixi from "pixi.js"

export type RangeZone = (
  target: pixi.IPointData,
  range: [min: number, max: number],
) => pixi.IPointData[]

export const around: RangeZone = (target, range) => {
  const result: pixi.IPointData[] = []

  for (let x = target.x - range[1]; x <= target.x + range[1]; x++) {
    for (let y = target.y - range[1]; y <= target.y + range[1]; y++) {
      if (x >= target.x - range[0] && x <= target.x + range[0]) continue
      if (y >= target.y - range[0] && y <= target.y + range[0]) continue

      result.push({ x, y })
    }
  }

  return result
}
