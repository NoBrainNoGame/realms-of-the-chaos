import type { Combat } from "./combat"
import { manhattan } from "./geometry"

/**
 * A gauge of fixation (Entretenir): the fighter at `index` of `team` is
 * protected while it settles. Each clock tick the gauge gains 1 per living
 * fighter of `helpers` next to it and loses 1 per living fighter of `harm`
 * next to it (never below 0). When it reaches `max`, the fight is won by
 * `winner`.
 */
export interface FixationRule {
  team: number
  index: number
  helpers: number[]
  harm: number[]
  max: number
  winner: number
}

export class FixationKit {
  gauge = 0

  constructor(
    private readonly _combat: Combat,
    private readonly _rule: FixationRule,
  ) {}

  /** A clock tick went by: returns true once the gauge is full. */
  tick(): boolean {
    const r = this._rule
    const target = this._combat.fighters.filter((f) => f.team === r.team)[
      r.index
    ]
    if (!target?.alive) return false
    let delta = 0
    for (const f of this._combat.aliveFighters) {
      if (f.id === target.id || manhattan(f.position, target.position) > 1)
        continue
      if (r.helpers.includes(f.team)) delta++
      else if (r.harm.includes(f.team)) delta--
    }
    this.gauge = Math.max(0, Math.min(r.max, this.gauge + delta))
    return this.gauge >= r.max
  }
}
