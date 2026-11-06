import type { Combat } from "./combat"
import type { Point } from "./geometry"
import { equals, keyOf } from "./geometry"

/**
 * A Front de Marée: a column of the board that moves one step every `every`
 * clock ticks (from tick `start`), along `axis` in direction `dir`, starting
 * on `from`. Each cell it covers becomes uncertain (as in `superposition`).
 */
export interface TideRule {
  axis: "x" | "y"
  from: number
  dir: 1 | -1
  every: number
  start?: number
}

/** A second way to win: `count` living fighters of `team` stand on `cells`. */
export interface ReachRule {
  team: number
  cells: Point[]
  count?: number
}

export class TideKit {
  private _col: number

  constructor(
    private readonly _combat: Combat,
    private readonly _rule: TideRule,
  ) {
    this._col = _rule.from
  }

  /** The column the front is on now. */
  get column(): number {
    return this._col
  }

  /** A clock tick went by: the cells the front newly covers (maybe none). */
  tick(n: number): Point[] {
    const r = this._rule
    const start = r.start ?? 1
    if (n < start || (n - start) % r.every !== 0) return []
    const col = this._col
    this._col += r.dir
    const voids = this._combat.board.voids
    return this._combat.board.cells
      .filter((c) => (r.axis === "x" ? c.x : c.y) === col)
      .filter((c) => !voids.has(keyOf(c)))
      .map((c) => ({ x: c.x, y: c.y }))
  }
}

/** Whether the reach rule is met right now. */
export function reached(combat: Combat, rule: ReachRule): boolean {
  const on = combat.fighters.filter(
    (f) =>
      f.alive &&
      f.team === rule.team &&
      rule.cells.some((c) => equals(c, f.position)),
  )
  return on.length >= (rule.count ?? 1)
}
