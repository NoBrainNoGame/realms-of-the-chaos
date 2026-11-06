import type { Combat } from "./combat"
import { keyOf, manhattan, type Point } from "./geometry"
import type { FightEvent } from "./types"

/**
 * Where and by whom things happened in an Adventure fight: the last blow
 * dealt to each fallen fighter, the cells blows landed on, how long each
 * team and fighter stood on the named regions, where Influences were cast.
 * Read-only bookkeeping: it never changes a fight (always built for an
 * Adventure fight; skirmish, duel and arcade have no tracker at all).
 */
export interface FinalBlow {
  /** Who struck last (null: a status, the cold, the terrain). */
  by: string | null
  /** Team of the striker when it struck (null with no striker). */
  byTeam: number | null
  /** The action the striker was playing (null: none known). */
  actionId: string | null
  /** The cell the fallen stood on. */
  at: Point
  tick: number
}

export interface Strike {
  target: string
  targetTeam: number
  by: string | null
  byTeam: number | null
  actionId: string | null
  cell: Point
  /** Cells between the striker and the one struck (none for a status). */
  distance?: number
  amount: number
  tick: number
}

export interface TraceReport {
  /** Last blow dealt to each fighter that fell (dispersed or transi). */
  finalBlows: Record<string, FinalBlow>
  /** Every blow that landed, with the cell of the one struck. */
  strikes: Strike[]
  /** Turns each fighter started on each cell (`"x,y"`). */
  turns: Record<string, Record<string, number>>
  /** Cells each fighter stood on at a turn start or a move, in order. */
  visited: Record<string, string[]>
  /** Influences with the cell they were cast on. */
  casts: {
    divineId: string
    team: number
    cell: Point
    /** Living fighters on the cell or next to it when it was cast. */
    near: string[]
    tick: number
  }[]
  /** Per region (`rules.regions`): clock ticks each team / fighter stood in it. */
  regions: Record<
    string,
    {
      /** Ticks with at least one living fighter of the team inside. */
      teams: Record<number, number>
      /** Longest run of consecutive ticks, per team. */
      streak: Record<number, number>
      /** Ticks each fighter spent inside. */
      fighters: Record<string, number>
      /** Turns each fighter started inside. */
      turns: Record<string, number>
      /** Fighters that ever stood inside. */
      visitors: string[]
    }
  >
}

export const emptyTrace = (): TraceReport => ({
  finalBlows: {},
  strikes: [],
  turns: {},
  visited: {},
  casts: [],
  regions: {},
})

export class TraceKit {
  readonly report: TraceReport = emptyTrace()
  private _cells = new Map<string, Set<string>>()
  private _run = new Map<string, number>()
  private _action = new Map<string, string>()
  private _last = new Map<string, Strike>()

  constructor(
    private readonly _combat: Combat,
    regions: Record<string, Point[]> | undefined,
    private readonly _ticks: () => number,
  ) {
    for (const [id, cells] of Object.entries(regions ?? {})) {
      this._cells.set(id, new Set(cells.map(keyOf)))
      this.report.regions[id] = {
        teams: {},
        streak: {},
        fighters: {},
        turns: {},
        visitors: [],
      }
    }
  }

  private _regionsAt(p: Point): string[] {
    const k = keyOf(p)
    const out: string[] = []
    for (const [id, cells] of this._cells) if (cells.has(k)) out.push(id)
    return out
  }

  private _visit(id: string, p: Point) {
    const k = keyOf(p)
    const list = this.report.visited[id] ?? []
    this.report.visited[id] = list
    if (list[list.length - 1] !== k) list.push(k)
    for (const r of this._regionsAt(p)) {
      const reg = this.report.regions[r]
      if (!reg.visitors.includes(id)) reg.visitors.push(id)
    }
  }

  observe(event: FightEvent) {
    const combat = this._combat
    switch (event.type) {
      case "turnStarted": {
        const f = combat.getFighter(event.fighterId)
        if (!f) break
        const k = keyOf(f.position)
        const t = this.report.turns[f.id] ?? {}
        this.report.turns[f.id] = t
        t[k] = (t[k] ?? 0) + 1
        this._visit(f.id, f.position)
        for (const r of this._regionsAt(f.position)) {
          const reg = this.report.regions[r]
          reg.turns[f.id] = (reg.turns[f.id] ?? 0) + 1
        }
        break
      }
      case "moved": {
        this._visit(event.fighterId, event.to)
        break
      }
      case "actionUsed":
        this._action.set(event.fighterId, event.baseActionId)
        break
      case "damaged": {
        const target = combat.getFighter(event.fighterId)
        if (!target || event.amount <= 0) break
        const by = event.sourceId
        const striker = by ? combat.getFighter(by) : undefined
        const strike: Strike = {
          target: target.id,
          targetTeam: target.team,
          by,
          byTeam: striker ? striker.team : null,
          actionId: by ? (this._action.get(by) ?? null) : null,
          cell: { ...target.position },
          ...(striker
            ? { distance: manhattan(striker.position, target.position) }
            : {}),
          amount: event.amount,
          tick: this._ticks(),
        }
        this.report.strikes.push(strike)
        this._last.set(target.id, strike)
        break
      }
      case "died": {
        const f = combat.getFighter(event.fighterId)
        const last = this._last.get(event.fighterId)
        this.report.finalBlows[event.fighterId] = {
          by: last?.by ?? null,
          byTeam: last?.byTeam ?? null,
          actionId: last?.actionId ?? null,
          at: f ? { ...f.position } : (last?.cell ?? { x: 0, y: 0 }),
          tick: this._ticks(),
        }
        break
      }
      case "divineUsed":
        if (event.target)
          this.report.casts.push({
            divineId: event.divineId,
            team: event.team,
            cell: { ...event.target },
            near: combat.aliveFighters
              .filter((f) => manhattan(f.position, event.target as Point) <= 1)
              .map((f) => f.id),
            tick: this._ticks(),
          })
        break
      case "clockTick": {
        for (const [id, cells] of this._cells) {
          const reg = this.report.regions[id]
          const present = new Set<number>()
          for (const f of combat.aliveFighters) {
            if (combat.offstage.has(f.id) || !cells.has(keyOf(f.position)))
              continue
            present.add(f.team)
            reg.fighters[f.id] = (reg.fighters[f.id] ?? 0) + 1
          }
          const teams = new Set([
            ...present,
            ...Object.keys(reg.teams).map(Number),
          ])
          for (const team of teams) {
            const key = `${id}:${team}`
            if (present.has(team)) {
              reg.teams[team] = (reg.teams[team] ?? 0) + 1
              const run = (this._run.get(key) ?? 0) + 1
              this._run.set(key, run)
              reg.streak[team] = Math.max(reg.streak[team] ?? 0, run)
            } else this._run.set(key, 0)
          }
        }
        break
      }
    }
  }
}
