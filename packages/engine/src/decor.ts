import type { Combat } from "./combat"
import { equals, manhattan, type Point } from "./geometry"

/**
 * Decor crystals of the Adventure (ch. 6, "Le Premier Cristal"): crystals on
 * the edge of a Lacune, non blocking, that flash by pairs. They take no part
 * in the rules; the fight only tells where they are and what they do:
 * - an allied Intrication within `near` cells of one makes it shine more
 *   (`glow`); the first one makes the nearest crystal take one step toward
 *   `toward` (`step`);
 * - the Intrication of the `dark` member makes every crystal beat once
 *   (`pulse`, the light is darker);
 * - at the end of the fight they all slide to `merge` and fuse in one.
 */
export interface DecorRules {
  crystals: Point[]
  /** Where the first Intrication draws the nearest crystal (the heart). */
  toward: Point
  /** Where they all gather when the fight ends (default `toward`). */
  merge?: Point
  /** Reach of an Intrication on a crystal, in cells (default 3). */
  near?: number
  /** The team whose Intrications count (default 0). */
  team?: number
  /** The member whose Intrication makes the crystals beat once. */
  dark?: { team: number; index: number }
}

export interface DecorReport {
  /** Current cell of every crystal. */
  cells: Point[]
  /** How brightly every crystal shines (Intrications near it). */
  glow: number[]
  /** The crystals beat together once (the dark Intrication). */
  pulsed: boolean
  /** The crystals fused into one. */
  merged: boolean
  /** Where, once fused. */
  mergedAt: Point | null
}

export class DecorKit {
  readonly report: DecorReport
  private _drawn = false

  constructor(
    private readonly _combat: Combat,
    private readonly _rules: DecorRules,
  ) {
    this.report = {
      cells: _rules.crystals.map((p) => ({ ...p })),
      glow: _rules.crystals.map(() => 0),
      pulsed: false,
      merged: false,
      mergedAt: null,
    }
  }

  /** An Intrication was made on `at` between `a` and `b`. */
  intrication(at: Point, a: { team: number; id: string }, b: string | null) {
    const rules = this._rules
    const partner = b ? this._combat.getFighter(b) : undefined
    const dark = rules.dark
    if (
      dark &&
      !this.report.pulsed &&
      partner &&
      this._memberIs(partner.id, dark)
    ) {
      this.report.pulsed = true
      this._combat.emitEvent({ type: "decor", kind: "pulse", index: -1 })
    }
    if (a.team !== (rules.team ?? 0) || this.report.merged) return
    const reach = rules.near ?? 3
    let nearest = -1
    this.report.cells.forEach((c, i) => {
      const d = manhattan(c, at)
      if (nearest < 0 || d < manhattan(this.report.cells[nearest], at))
        nearest = i
      if (d > reach) return
      this.report.glow[i]++
      this._combat.emitEvent({
        type: "decor",
        kind: "glow",
        index: i,
        level: this.report.glow[i],
      })
    })
    if (this._drawn || nearest < 0) return
    this._drawn = true
    const from = this.report.cells[nearest]
    const to = this._stepToward(from, rules.toward)
    if (equals(from, to)) return
    this.report.cells[nearest] = to
    this._combat.emitEvent({
      type: "decor",
      kind: "step",
      index: nearest,
      from,
      to,
    })
  }

  /** The fight is over: every crystal slides to one place and fuses. */
  end() {
    if (this.report.merged) return
    const at = this._rules.merge ?? this._rules.toward
    this.report.merged = true
    this.report.mergedAt = { ...at }
    this.report.cells = this.report.cells.map(() => ({ ...at }))
    this._combat.emitEvent({ type: "decor", kind: "merge", index: -1, to: at })
  }

  private _memberIs(id: string, m: { team: number; index: number }) {
    const members = this._combat.fighters.filter((f) => f.team === m.team)
    return members[m.index]?.id === id
  }

  private _stepToward(from: Point, to: Point): Point {
    const dx = to.x - from.x
    const dy = to.y - from.y
    if (dx === 0 && dy === 0) return { ...from }
    return Math.abs(dx) >= Math.abs(dy)
      ? { x: from.x + Math.sign(dx), y: from.y }
      : { x: from.x, y: from.y + Math.sign(dy) }
  }
}
