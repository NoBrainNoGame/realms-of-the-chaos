import * as pixi from "pixi.js"

export type RangeZone = (
  target: pixi.IPointData,
  range: number,
) => pixi.IPointData[]

export const target: RangeZone = (target) => [target]

/**
 * Square range zone.
 * @param target
 * @param range
 */
export const square: RangeZone = (target, range) => {
  const result: pixi.IPointData[] = []

  for (let x = target.x - range; x <= target.x + range; x++) {
    for (let y = target.y - range; y <= target.y + range; y++) {
      result.push({ x, y })
    }
  }

  return result
}

/**
 * Circle range zone.
 * @param target
 * @param range
 */
export const normal: RangeZone = (target, range) => {
  const result: pixi.IPointData[] = []

  for (let x = target.x - range; x <= target.x + range; x++) {
    for (let y = target.y - range; y <= target.y + range; y++) {
      if (Math.abs(target.x - x) + Math.abs(target.y - y) <= range) {
        result.push({ x, y })
      }
    }
  }

  return result
}

/**
 * Horizontal and vertical cross range zone.
 * @param target
 * @param range
 */
export const line: RangeZone = (target, range) => {
  const result: pixi.IPointData[] = []

  for (let x = target.x - range; x <= target.x + range; x++) {
    result.push({ x, y: target.y })
  }

  for (let y = target.y - range; y <= target.y + range; y++) {
    result.push({ x: target.x, y })
  }

  return result
}

/**
 * Diagonal cross range zone.
 * @param target
 * @param range
 */
export const cross: RangeZone = (target, range) => {
  const result: pixi.IPointData[] = []

  for (let i = 0; i <= range; i++) {
    result.push({ x: target.x + i, y: target.y + i })
    result.push({ x: target.x + i, y: target.y - i })
    result.push({ x: target.x - i, y: target.y + i })
    result.push({ x: target.x - i, y: target.y - i })
  }

  return result
}
