import type { Combat } from "./combat"
import { equals, keyOf, manhattan, type Point } from "./geometry"
import type { FightEvent, Fighter } from "./types"

/**
 * Opt-in combat rules of the Adventure ("Chroniques"). Every field is off by
 * default: skirmish, duel, arcade and the balance tests never set them, so
 * their fights are exactly what they were.
 */
export interface AdventureRules {
  /** Teams whose fighters can never drop below 1 HP (tutorial fights). */
  noDefeat?: number[]
  /**
   * Teams that watch the fight without taking part: they don't count for the
   * victory, and only the AI sees them as enemies (the villagers sitting on
   * the square).
   */
  neutral?: number[]
  /** A bodiless timeline entity ("la Frange") that ticks every `period`. */
  clock?: {
    period: number
    /** The fight ends after this many ticks. */
    limit?: number
    /** Team declared the winner when the clock runs out (none by default). */
    winner?: number | null
  }
  /**
   * Zones that must stay worked: a zone nobody acted in during one tick
   * becomes silent, after two idle ticks it is lost. Silent and lost zones
   * hurt whoever starts a turn on them.
   */
  zones?: { id: string; cells: Point[] }[]
  /** Teams whose actions keep the zones alive (default: team 0). */
  zoneTeams?: number[]
  /** Cells that are silent for the whole fight (a seam, a joint). */
  silent?: Point[]
  /** Energy damage taken when a turn starts on a silent cell (default 2). */
  silentDamage?: number
  /**
   * A fighter of `team` under `below` of its hit points breaks off and walks
   * to the nearest exit; reaching it, it leaves and is spared.
   */
  flee?: { team: number; below: number; exits: Point[] }
  /** A fighter of these teams "fixes" into a rock (+1 height) instead of dying. */
  fixOnDeath?: number[]
  /** Influences the Ghom has not unlocked yet (see `Combat.unlockDivine`). */
  lockedDivine?: string[]
  /** Time limit of a held position, in ticks, shown by the interface. */
  announce?: boolean
}

export type ZoneState = "active" | "silent" | "lost"

/** What a fight did, for the Adventure to score its objectives. */
export interface AdventureReport {
  ticks: number
  divineUsed: Record<string, number>
  /** Influences cast on a cell next to (or on) an allied fighter. */
  divineNearAlly: { divineId: string; fighterId: string }[]
  intrications: number
  fled: string[]
  fixed: string[]
  zonesLost: string[]
  zoneStates: Record<string, ZoneState>
  timeUp: boolean
}

/** Rule state of one fight; owned by a `Combat`. */
export class AdventureTracker {
  readonly rules: AdventureRules
  readonly silent = new Set<string>()
  readonly fleeing = new Set<string>()
  readonly locked: Set<string>
  readonly report: AdventureReport = {
    ticks: 0,
    divineUsed: {},
    divineNearAlly: [],
    intrications: 0,
    fled: [],
    fixed: [],
    zonesLost: [],
    zoneStates: {},
    timeUp: false,
  }
  private _idle = new Map<string, number>()
  private _worked = new Set<string>()
  private _nextTick: number

  constructor(
    private readonly _combat: Combat,
    rules: AdventureRules,
  ) {
    this.rules = rules
    this.locked = new Set(rules.lockedDivine)
    this._nextTick = rules.clock?.period ?? Infinity
    for (const p of rules.silent ?? []) this.silent.add(keyOf(p))
    for (const zone of rules.zones ?? []) {
      this._idle.set(zone.id, 0)
      this.report.zoneStates[zone.id] = "active"
    }
  }

  isNeutral(team: number) {
    return this.rules.neutral?.includes(team) ?? false
  }

  /** Neutral teams are only enemies of the AI. */
  isEnemy(a: Fighter, b: Fighter) {
    const na = this.isNeutral(a.team)
    const nb = this.isNeutral(b.team)
    if (!na && !nb) return a.team !== b.team
    if (na && nb) return false
    const other = na ? b : a
    return other.controller === "ai"
  }

  zoneState(id: string): ZoneState {
    return this.report.zoneStates[id] ?? "active"
  }

  /** Called for every event the combat emits. */
  observe(event: FightEvent) {
    const combat = this._combat
    switch (event.type) {
      case "moved": {
        const f = combat.getFighter(event.fighterId)
        if (f) this._work(f, event.to)
        break
      }
      case "actionUsed": {
        const f = combat.getFighter(event.fighterId)
        if (f) this._work(f, f.position)
        if (event.partnerId) this.report.intrications++
        break
      }
      case "divineUsed": {
        const r = this.report
        r.divineUsed[event.divineId] = (r.divineUsed[event.divineId] ?? 0) + 1
        if (event.target) {
          for (const f of combat.aliveFighters) {
            if (
              f.team === 0 &&
              manhattan(f.position, event.target) <= 1 &&
              event.divineId === "earthquake"
            ) {
              r.divineNearAlly.push({
                divineId: event.divineId,
                fighterId: f.id,
              })
            }
            if (
              event.divineId === "timeWarp" &&
              equals(f.position, event.target) &&
              f.team === 0
            ) {
              r.divineNearAlly.push({
                divineId: event.divineId,
                fighterId: f.id,
              })
            }
          }
        }
        break
      }
    }
  }

  private _work(fighter: Fighter, at: Point) {
    const teams = this.rules.zoneTeams ?? [0]
    if (!teams.includes(fighter.team)) return
    for (const zone of this.rules.zones ?? []) {
      if (zone.cells.some((c) => equals(c, at))) this._worked.add(zone.id)
    }
  }

  /** The timeline moved on to `time`: the clock ticks. */
  advance(time: number) {
    const clock = this.rules.clock
    if (!clock) return
    while (time >= this._nextTick && this._combat.state !== "ended") {
      this._nextTick += clock.period
      this.report.ticks++
      this._tick()
      this._combat.emitEvent({ type: "clockTick", tick: this.report.ticks })
      if (clock.limit !== undefined && this.report.ticks >= clock.limit) {
        this.report.timeUp = true
        this._combat.emitEvent({ type: "timeUp" })
        this._combat.finish(clock.winner ?? null)
      }
    }
  }

  private _tick() {
    for (const zone of this.rules.zones ?? []) {
      const before = this.zoneState(zone.id)
      if (before === "lost") continue
      const idle = this._worked.has(zone.id)
        ? 0
        : (this._idle.get(zone.id) ?? 0) + 1
      this._idle.set(zone.id, idle)
      const next: ZoneState =
        idle === 0 ? "active" : idle === 1 ? "silent" : "lost"
      if (next === before) continue
      this.report.zoneStates[zone.id] = next
      for (const c of zone.cells) {
        if (next === "active") this.silent.delete(keyOf(c))
        else this.silent.add(keyOf(c))
      }
      if (next === "lost") this.report.zonesLost.push(zone.id)
      this._combat.emitEvent({
        type: "zoneChanged",
        zoneId: zone.id,
        state: next,
      })
    }
    this._worked.clear()
  }

  /** A turn begins: a silent cell drains energy. */
  turnStart(fighter: Fighter): number {
    if (!this.silent.has(keyOf(fighter.position))) return 0
    return this.rules.silentDamage ?? 2
  }

  /** A fighter was hurt: it may break off. */
  wounded(fighter: Fighter) {
    const flee = this.rules.flee
    if (!flee || fighter.team !== flee.team || !fighter.alive) return
    if (this.fleeing.has(fighter.id)) return
    if (fighter.hp / this._combat.maxHp(fighter) >= flee.below) return
    this.fleeing.add(fighter.id)
    this._combat.emitEvent({ type: "fleeing", fighterId: fighter.id })
  }

  /** The fleeing fighter's turn: walk to the nearest exit, or leave. */
  playFlee(fighter: Fighter): boolean {
    if (!this.fleeing.has(fighter.id)) return false
    const flee = this.rules.flee
    if (!flee) return false
    const combat = this._combat
    if (flee.exits.some((e) => equals(e, fighter.position))) {
      this.fleeing.delete(fighter.id)
      this.report.fled.push(fighter.id)
      combat.depart(fighter)
      return true
    }
    const reachable = combat.getReachableCells(fighter)
    let best: Point | null = null
    let bestScore = Infinity
    for (const cell of reachable) {
      const score = Math.min(...flee.exits.map((e) => manhattan(cell, e)))
      if (score < bestScore) {
        bestScore = score
        best = cell
      }
    }
    const here = Math.min(
      ...flee.exits.map((e) => manhattan(fighter.position, e)),
    )
    if (best && bestScore < here) combat.walk(fighter, best)
    return false
  }

  /** A fighter fell: it may turn into a rock instead (a fixed Lacunaire). */
  fixes(fighter: Fighter): boolean {
    return this.rules.fixOnDeath?.includes(fighter.team) ?? false
  }

  fixed(fighter: Fighter) {
    this.report.fixed.push(fighter.id)
  }
}
