import * as pixi from "pixi.js"
import * as constants from "./constants"

export function clone<Obj>(obj: Obj): Obj {
  return JSON.parse(JSON.stringify(obj))
}

export function times<Value>(
  count: number,
  generator: (index: number) => Value,
): Value[] {
  return new Array(count).fill(0).map((_, index) => generator(index))
}

export enum Direction {
  N = 0,
  E = 1,
  S = 2,
  W = 3,
}

export const directionCoordinates: Record<Direction, pixi.IPointData> = {
  [Direction.N]: { x: 0, y: -1 },
  [Direction.E]: { x: 1, y: 0 },
  [Direction.S]: { x: 0, y: 1 },
  [Direction.W]: { x: -1, y: 0 },
}

export function isometricToScreen(position: pixi.IPointData): pixi.IPointData {
  return {
    x: (position.x - position.y) * (constants.cellWidth / 2),
    y: (position.x + position.y) * (constants.cellHeight / 2),
  }
}

export function screenToIsometric(position: pixi.IPointData): pixi.IPointData {
  return {
    x:
      (position.x / (constants.cellWidth / 2) +
        position.y / (constants.cellHeight / 2)) /
      2,
    y:
      (position.y / (constants.cellHeight / 2) -
        position.x / (constants.cellWidth / 2)) /
      2,
  }
}

export function equals(a: pixi.IPointData, b: pixi.IPointData): boolean {
  return a.x === b.x && a.y === b.y
}

export enum Floor {
  Character = 0,
}

export enum CharacterStat {
  Speed = "Speed",
  Health = "Health",
}
