import type { Combat } from "./combat"
import { keyOf } from "./geometry"

/**
 * The cold that follows a stopped Ghom (Reconstitution II): from clock tick
 * `from`, every cell nobody stood on or walked over for `idle` ticks frays
 * into a Lacune (an impassable hole). The map shrinks around the fighters.
 */
export interface IdleFrayRule {
  from: number
  idle: number
}

export class IdleFrayKit {
  private _last = new Map<string, number>()
  private _seen = new Map<string, number>()

  constructor(
    private readonly _combat: Combat,
    private readonly _rule: IdleFrayRule,
  ) {
    for (const cell of _combat.board.cells) this._last.set(keyOf(cell), 0)
  }

  /** A clock tick went by: returns the cells that frayed. */
  tick(n: number): { x: number; y: number }[] {
    const combat = this._combat
    for (const f of combat.fighters) {
      if (!f.alive) continue
      this._last.set(keyOf(f.position), n)
      const path = combat.adventure?.trace.report.visited[f.id] ?? []
      for (let i = this._seen.get(f.id) ?? 0; i < path.length; i++)
        this._last.set(path[i], n)
      this._seen.set(f.id, path.length)
    }
    if (n < this._rule.from) return []
    const voids = combat.board.voids
    const frayed: { x: number; y: number }[] = []
    for (const cell of combat.board.cells) {
      const k = keyOf(cell)
      if (voids.has(k)) continue
      if (n - (this._last.get(k) ?? 0) < this._rule.idle) continue
      if (combat.fightersAt(cell).length > 0) continue
      voids.add(k)
      frayed.push({ x: cell.x, y: cell.y })
    }
    return frayed
  }
}
