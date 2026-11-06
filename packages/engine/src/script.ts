import type { AiCommand } from "./ai"
import type { Combat } from "./combat"
import { equals, keyOf, manhattan, type Point } from "./geometry"
import type { FightEvent, Fighter } from "./types"

// Opt-in rules of the Adventure that make a fight follow a script: fighters
// that act by a fixed plan (Gorr), earthquakes at set ticks (a shifting
// relief), fallen fighters that reform (the Recomposition) and cells that go
// tepid (the Tiédeur). Nothing here runs unless a rule asks for it.

/** A way out of the island; open on a window of ticks, or once a team is down. */
export interface ScriptExit {
  at: Point
  from?: number
  to?: number
  /** Opens only when every fighter of this team has fallen or left. */
  afterDown?: number
}

/** What a scripted fighter aims at. */
export type ScriptAim =
  | Point
  /** The fighter at `index` of `team` (the first one alive if no index). */
  | { team: number; index?: number }
  /** The closest enemy that is a valid target of the action. */
  | "nearest"

export type ScriptAct =
  | { do: "move"; to: Point }
  | { do: "use"; action: string; at: ScriptAim }
  | { do: "stand" }
  | { do: "follow"; team: number; index: number }
  /**
   * Walk to the nearest open exit and leave the island there. With `escort`,
   * the fighter only moves on a turn that starts next to a fighter of that
   * team (a group that does not move alone).
   */
  | { do: "leave"; exits: ScriptExit[]; escort?: number }

/**
 * One step of a script. It applies at a turn of the fighter when the clock is
 * in [`from`, `to`] and, with `every`, only at every `every`-th own turn
 * (the second, fourth... of its turns). The first step that applies is played;
 * when none applies the fighter falls back on its usual behavior (or does
 * nothing, in a team on hold).
 */
export interface ScriptStep {
  from?: number
  to?: number
  every?: number
  act: ScriptAct
}

/** The fighter at `index` of `team` plays this script instead of the AI. */
export interface ScriptRule {
  team: number
  index: number
  steps: ScriptStep[]
}

/** A scripted event of the environment, at a clock tick. */
export interface ScriptedEvent {
  tick: number
  kind: "earthquake"
  /** The cells hit (a Séisme: low cells rise, high ones collapse). */
  at: Point[]
}

/**
 * A fallen fighter reforms `after` ticks later (at its starting cell, or the
 * closest free one) with `hp` of its life (default one half). `times` caps how
 * often it does (default once). Without `index`, the whole team reforms.
 */
export interface RecomposeRule {
  team: number
  index?: number
  after: number
  hp?: number
  times?: number
}

/**
 * Tiédeur: cells are hot or tepid. A fighter of `teams` that starts a turn on
 * a tepid cell loses `loss` hit points. Acting from a cell, healing next to it
 * and blessing heat cells for a few ticks; the heat of the start fades.
 */
export interface WarmthRules {
  hot: Point[]
  /** Ticks the starting heat lasts when nobody keeps it up (default 4). */
  startTicks?: number
  /** Ticks a cell stays hot after a fighter acted from it (default 3). */
  heat?: number
  /** Ticks the cells next to a healed fighter stay hot (default 3). */
  healHeat?: number
  /** Ticks the cells of the blessed team stay hot (default 2). */
  blessHeat?: number
  /** Hit points lost on a tepid cell at the start of a turn (default 1). */
  loss?: number
  /** The teams it hurts (default: the first). */
  teams?: number[]
}

export interface ScriptReport {
  /** Turns played by a script. */
  acts: number
  /** Cells hit by scripted earthquakes. */
  quakes: Point[]
  /** Ids of the fighters that reformed, in order. */
  recomposed: string[]
  warmth: { warmed: number; cooled: number; lost: number }
}

export const emptyScriptReport = (): ScriptReport => ({
  acts: 0,
  quakes: [],
  recomposed: [],
  warmth: { warmed: 0, cooled: 0, lost: 0 },
})

/** The state of the script rules of one fight. */
export class ScriptKit {
  readonly report: ScriptReport = emptyScriptReport()
  private _scripts = new Map<string, { rule: ScriptRule; turns: number }>()
  private _recompose: {
    id: string
    rule: RecomposeRule
    start: Point
    used: number
    due: number | null
  }[] = []
  private _hot = new Map<string, number>()

  constructor(
    private readonly _combat: Combat,
    private readonly _rules: {
      scripts?: ScriptRule[]
      scripted?: ScriptedEvent[]
      recompose?: RecomposeRule[]
      warmth?: WarmthRules
    },
    private readonly _ticks: () => number,
    private readonly _entryCell: (fighter: Fighter) => Point,
  ) {
    const member = (team: number, index: number) => {
      const found = _combat.fighters.filter((f) => f.team === team)[index]
      if (!found) throw new Error(`No fighter ${index} in team ${team}`)
      return found
    }
    for (const rule of _rules.scripts ?? [])
      this._scripts.set(member(rule.team, rule.index).id, { rule, turns: 0 })
    for (const rule of _rules.recompose ?? []) {
      const who =
        rule.index === undefined
          ? _combat.fighters.filter((f) => f.team === rule.team)
          : [member(rule.team, rule.index)]
      for (const f of who)
        this._recompose.push({
          id: f.id,
          rule,
          start: { ...f.position },
          used: 0,
          due: null,
        })
    }
    for (const p of _rules.warmth?.hot ?? [])
      this._hot.set(keyOf(p), _rules.warmth?.startTicks ?? 4)
  }

  get active() {
    const r = this._rules
    return !!(r.scripts || r.scripted || r.recompose || r.warmth)
  }

  hasScript(fighter: Fighter) {
    return this._scripts.has(fighter.id)
  }

  // ─── Scripted fighters ────────────────────────────────────────────────────

  /**
   * The commands of a scripted fighter's turn, or null when it has no script
   * or no step applies (the usual behavior then).
   */
  command(fighter: Fighter): AiCommand[] | null {
    const entry = this._scripts.get(fighter.id)
    if (!entry) return null
    entry.turns++
    const tick = this._ticks()
    const step = entry.rule.steps.find(
      (s) =>
        (s.from === undefined || tick >= s.from) &&
        (s.to === undefined || tick <= s.to) &&
        (s.every === undefined || entry.turns % s.every === 0),
    )
    if (!step) return null
    const plan = this._play(fighter, step.act)
    if (plan) this.report.acts++
    return plan
  }

  private _play(fighter: Fighter, act: ScriptAct): AiCommand[] | null {
    const combat = this._combat
    switch (act.do) {
      case "stand":
        return [{ type: "pass" }]
      case "move":
        return equals(act.to, fighter.position)
          ? [{ type: "pass" }]
          : [{ type: "move", destination: act.to }, { type: "pass" }]
      case "follow": {
        const target = combat.fighters.filter((f) => f.team === act.team)[
          act.index
        ]
        if (!target?.alive) return null
        let best: Point | null = null
        let bestDistance = manhattan(fighter.position, target.position)
        let bestCost = 0
        for (const node of combat.explore(fighter).values()) {
          const d = manhattan(node.point, target.position)
          if (d < 1) continue
          if (
            d < bestDistance ||
            (d === bestDistance && node.cost < bestCost)
          ) {
            best = node.point
            bestDistance = d
            bestCost = node.cost
          }
        }
        return best
          ? [{ type: "move", destination: best }, { type: "pass" }]
          : [{ type: "pass" }]
      }
      case "leave":
        return this._leave(fighter, act.exits, act.escort)
      case "use": {
        const action = fighter.actions.find((a) => a.id === act.action)
        if (!action || combat.isOnCooldown(fighter, action)) return null
        const aim = this._aim(act.at)
        const pick = (origin: Point): Point | null => {
          const valid = combat.getValidTargets(fighter, action, origin)
          if (aim === "nearest") {
            let best: Point | null = null
            for (const p of valid) {
              const occupants = combat
                .fightersAt(p)
                .filter((o) => combat.isEnemy(fighter, o))
              if (action.target === "enemy" && occupants.length === 0) continue
              if (!best || manhattan(p, origin) < manhattan(best, origin))
                best = p
            }
            return best
          }
          return aim ? (valid.find((p) => equals(p, aim)) ?? null) : null
        }
        const here = pick(fighter.position)
        if (here) return [{ type: "action", actionId: action.id, target: here }]
        let spot: Point | null = null
        let cost = Infinity
        for (const node of combat.explore(fighter).values()) {
          if (node.cost >= cost || !pick(node.point)) continue
          spot = node.point
          cost = node.cost
        }
        return spot
          ? [{ type: "move", destination: spot }, { type: "pass" }]
          : null
      }
    }
  }

  private _leave(
    fighter: Fighter,
    exits: ScriptExit[],
    escort: number | undefined,
  ): AiCommand[] | null {
    const combat = this._combat
    const tick = this._ticks()
    const open = exits
      .filter(
        (e) =>
          (e.from === undefined || tick >= e.from) &&
          (e.to === undefined || tick <= e.to) &&
          (e.afterDown === undefined ||
            combat.fighters
              .filter((f) => f.team === e.afterDown)
              .every((f) => !f.alive || combat.departed.has(f.id))),
      )
      .map((e) => e.at)
    if (!open.length) return [{ type: "pass" }]
    if (open.some((e) => equals(e, fighter.position))) {
      combat.depart(fighter)
      return []
    }
    if (
      escort !== undefined &&
      !combat.fighters.some(
        (f) =>
          f.team === escort &&
          f.alive &&
          !combat.departed.has(f.id) &&
          manhattan(f.position, fighter.position) <= 1,
      )
    )
      return [{ type: "pass" }]
    const score = (p: Point) => Math.min(...open.map((e) => manhattan(p, e)))
    let best: Point | null = null
    let bestScore = score(fighter.position)
    for (const node of combat.explore(fighter).values()) {
      const sc = score(node.point)
      if (sc < bestScore) {
        best = node.point
        bestScore = sc
      }
    }
    return best
      ? [{ type: "move", destination: best }, { type: "pass" }]
      : [{ type: "pass" }]
  }

  private _aim(at: ScriptAim): Point | "nearest" | null {
    if (at === "nearest") return at
    if ("x" in at) return at
    const members = this._combat.fighters.filter((f) => f.team === at.team)
    const f =
      at.index === undefined ? members.find((m) => m.alive) : members[at.index]
    return f?.alive ? { ...f.position } : null
  }

  // ─── Environment ──────────────────────────────────────────────────────────

  /** The clock ticked to `tick`. */
  tick(tick: number) {
    const combat = this._combat
    for (const event of this._rules.scripted ?? []) {
      if (event.tick !== tick || combat.state === "ended") continue
      const hit = event.at.filter((cell) => combat.quake(cell) === null)
      if (hit.length === 0) continue
      this.report.quakes.push(...hit.map((p) => ({ ...p })))
      combat.emitEvent({ type: "quaked", cells: hit.map((p) => ({ ...p })) })
    }
    for (const entry of this._recompose) {
      if (entry.due === null || tick < entry.due) continue
      entry.due = null
      if (combat.state === "ended") return
      const f = combat.getFighter(entry.id)
      if (!f || f.alive || combat.departed.has(f.id)) continue
      f.position = { ...entry.start }
      const at = this._entryCell(f)
      const hp = Math.max(
        1,
        Math.round(combat.maxHp(f) * (entry.rule.hp ?? 0.5)),
      )
      combat.reform(f, at, hp)
      this.report.recomposed.push(f.id)
    }
    const warmth = this._rules.warmth
    if (warmth) {
      const cooled: Point[] = []
      for (const [key, until] of [...this._hot]) {
        if (tick < until) continue
        this._hot.delete(key)
        cooled.push(this._point(key))
      }
      if (cooled.length) {
        this.report.warmth.cooled += cooled.length
        combat.emitEvent({ type: "cooled", cells: cooled })
      }
    }
  }

  private _point(key: string): Point {
    const [x, y] = key.split(",").map(Number)
    return { x, y }
  }

  /** A fallen fighter that is due to reform keeps its team in the fight. */
  pending(fighter: Fighter): boolean {
    return this._recompose.some((e) => e.id === fighter.id && e.due !== null)
  }

  observe(event: FightEvent) {
    const combat = this._combat
    switch (event.type) {
      case "died": {
        const tick = this._ticks()
        for (const e of this._recompose) {
          if (e.id !== event.fighterId) continue
          if (e.used >= (e.rule.times ?? 1)) continue
          e.used++
          e.due = tick + e.rule.after
        }
        break
      }
      case "actionUsed": {
        const f = combat.getFighter(event.fighterId)
        if (f && this._rules.warmth) this._heat([f.position], "heat", [f.team])
        break
      }
      case "healed": {
        const f = combat.getFighter(event.fighterId)
        if (!f || !this._rules.warmth) break
        const around = [
          f.position,
          ...[
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ].map(([dx, dy]) => ({ x: f.position.x + dx, y: f.position.y + dy })),
        ].filter((p) => combat.board.inBounds(p))
        this._heat(around, "healHeat")
        break
      }
      case "divineUsed": {
        if (event.divineId !== "blessing" || !this._rules.warmth) break
        const cells = combat.aliveFighters
          .filter((f) => f.team === event.team)
          .map((f) => f.position)
        this._heat(cells, "blessHeat")
        break
      }
    }
  }

  // ─── Tiédeur ──────────────────────────────────────────────────────────────

  isHot(p: Point) {
    return (this._hot.get(keyOf(p)) ?? 0) > this._ticks()
  }

  hotCells(): Point[] {
    return [...this._hot]
      .filter(([, until]) => until > this._ticks())
      .map(([k]) => this._point(k))
  }

  private _heat(
    cells: Point[],
    key: "heat" | "healHeat" | "blessHeat",
    teams?: number[],
  ) {
    const rule = this._rules.warmth
    if (!rule) return
    if (teams && !(rule.teams ?? [0]).includes(teams[0])) return
    const fallback = { heat: 3, healHeat: 3, blessHeat: 2 }[key]
    const until = this._ticks() + (rule[key] ?? fallback)
    const fresh: Point[] = []
    for (const p of cells) {
      const k = keyOf(p)
      if (!this.isHot(p)) fresh.push({ ...p })
      this._hot.set(k, Math.max(this._hot.get(k) ?? 0, until))
    }
    if (fresh.length) {
      this.report.warmth.warmed += fresh.length
      this._combat.emitEvent({ type: "warmed", cells: fresh })
    }
  }

  /** Hit points lost by a fighter starting a turn on a tepid cell. */
  drain(fighter: Fighter): number {
    const rule = this._rules.warmth
    if (!rule || !(rule.teams ?? [0]).includes(fighter.team)) return 0
    if (this.isHot(fighter.position)) return 0
    const loss = rule.loss ?? 1
    this.report.warmth.lost += loss
    return loss
  }
}
