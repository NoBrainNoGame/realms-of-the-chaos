import type { Combat } from "./combat"
import { equals, keyOf, manhattan, type Point } from "./geometry"
import type { FightEvent, Fighter, RefusalReason } from "./types"

/**
 * Opt-in combat rules of the Adventure ("Chroniques"). Every field is off by
 * default: skirmish, duel, arcade and the balance tests never set them, so
 * their fights are exactly what they were.
 */
export interface AdventureRules {
  /** The final scene (ch. 28): a vacuum decay there is the La Bascule ending. */
  finale?: boolean
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
  /** Waves, reinforcements, allies entering mid-fight. */
  arrivals?: ArrivalRule[]
  /** Fighters changing sides mid-fight. */
  switches?: SwitchRule[]
  /** Influences the Ghom has not unlocked yet (see `Combat.unlockDivine`). */
  lockedDivine?: string[]
  /** Time limit of a held position, in ticks, shown by the interface. */
  announce?: boolean
  /** Allies with their own will: they refuse, act alone (see `AutonomyTier`). */
  autonomy?: AutonomyRules
  /** The Ghom may withdraw from the fight (Découplage): it stops at once. */
  withdraw?: boolean
}

export interface AutonomyReport {
  /** Autonomy tier of each fighter that has one. */
  tiers: Record<string, AutonomyTier>
  /** Allies that were given at least one accepted order. */
  ordered: string[]
  /** Allies the Ghom let act ("Laisser agir"). */
  letAct: string[]
  refused: string[]
  /** Refusals that were respected (the ally then acted alone). */
  respected: string[]
  /** Allies the Ghom forced after a refusal ("Insister"). */
  insisted: string[]
  /** Turns an ally played alone because of its tier. */
  autoTurns: Record<string, number>
  /** The Ghom withdrew from the fight. */
  withdrawn: boolean
}

/**
 * A fighter of the line-up that is not on the island at the start: it enters
 * at a clock tick (`tick`, needs a `clock`) or at a timeline time (`time`),
 * on its listed cell or, if that one is taken, on the closest free cell.
 * Until then it counts as "still to come": its team is not beaten.
 */
export interface ArrivalRule {
  team: number
  /** Index of the fighter in its team's line-up. */
  index: number
  tick?: number
  time?: number
}

/** A fighter changes team (and so controller) at a tick or a time. */
export interface SwitchRule {
  team: number
  index: number
  toTeam: number
  tick?: number
  time?: number
}

/**
 * How far the Ghom commands an ally (era IV "Autonomie"): bound (Lié) never
 * refuses; confident (Confiant) refuses once; reserved (Réservé) refuses every
 * contested order; wary (Méfiant) also plays every second turn alone; broken
 * (Rompu) takes no order at all.
 */
export type AutonomyTier =
  | "bound"
  | "confident"
  | "reserved"
  | "wary"
  | "broken"

/** The autonomy of one fighter of the line-up. */
export interface AutonomyEntry {
  team: number
  /** Index of the fighter in its team's line-up. */
  index: number
  tier: AutonomyTier
  /** The contested orders it refuses (default: finish, influenced). */
  refuses?: RefusalReason[]
  /** Presets it refuses to strike (their own lineage, the Déliés). */
  spares?: string[]
}

export interface AutonomyRules {
  allies: AutonomyEntry[]
  /** Élan paid to Insister (default 2). */
  insistCost?: number
}

/** A contested order, as the ally is asked to carry it out. */
export type AutonomyOrder =
  | { type: "move"; destination: Point; append?: boolean }
  | { type: "action"; actionId: string; target: Point }

export const DEFAULT_REFUSALS: RefusalReason[] = ["finish", "influenced"]
export const INSIST_COST = 2

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
  /** Ids of the fighters that entered mid-fight, in order. */
  arrived: string[]
  /** Fighters that changed sides, in order. */
  switched: { fighterId: string; to: number }[]
  zonesLost: string[]
  zoneStates: Record<string, ZoneState>
  timeUp: boolean
  autonomy: AutonomyReport
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
    arrived: [],
    switched: [],
    zonesLost: [],
    zoneStates: {},
    timeUp: false,
    autonomy: {
      tiers: {},
      ordered: [],
      letAct: [],
      refused: [],
      respected: [],
      insisted: [],
      autoTurns: {},
      withdrawn: false,
    },
  }
  /** The order the active ally refused, waiting for Respecter / Insister. */
  pending: { fighterId: string; order: AutonomyOrder } | null = null
  private _auto = new Map<string, AutonomyEntry>()
  private _turns = new Map<string, number>()
  private _refusedOnce = new Set<string>()
  private _influenced = new Set<string>()
  private _idle = new Map<string, number>()
  private _worked = new Set<string>()
  private _nextTick: number
  private _arrivals: { rule: ArrivalRule; id: string; done: boolean }[] = []
  private _switches: { rule: SwitchRule; id: string; done: boolean }[] = []

  constructor(
    private readonly _combat: Combat,
    rules: AdventureRules,
  ) {
    this.rules = rules
    this.locked = new Set(rules.lockedDivine)
    this._nextTick = rules.clock?.period ?? Infinity
    const member = (team: number, index: number) => {
      const found = _combat.fighters.filter((f) => f.team === team)[index]
      if (!found) throw new Error(`No fighter ${index} in team ${team}`)
      return found.id
    }
    for (const rule of rules.arrivals ?? []) {
      const id = member(rule.team, rule.index)
      this._arrivals.push({ rule, id, done: false })
      _combat.offstage.add(id)
    }
    for (const rule of rules.switches ?? []) {
      this._switches.push({
        rule,
        id: member(rule.team, rule.index),
        done: false,
      })
    }
    for (const entry of rules.autonomy?.allies ?? []) {
      const id = member(entry.team, entry.index)
      this._auto.set(id, entry)
      this.report.autonomy.tiers[id] = entry.tier
    }
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
        const active = combat.activeFighter
        if (
          event.target &&
          active &&
          this._auto.has(active.id) &&
          manhattan(active.position, event.target) <= 1
        )
          this._influenced.add(active.id)
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
    this._release(time)
    const clock = this.rules.clock
    if (!clock) return
    while (time >= this._nextTick && this._combat.state !== "ended") {
      this._nextTick += clock.period
      this.report.ticks++
      this._tick()
      this._combat.emitEvent({ type: "clockTick", tick: this.report.ticks })
      this._release(time)
      if (clock.limit !== undefined && this.report.ticks >= clock.limit) {
        this.report.timeUp = true
        this._combat.emitEvent({ type: "timeUp" })
        this._combat.finish(clock.winner ?? null)
      }
    }
  }

  private _due(rule: { tick?: number; time?: number }, time: number) {
    return (
      (rule.time !== undefined && time >= rule.time) ||
      (rule.tick !== undefined && this.report.ticks >= rule.tick)
    )
  }

  /** Lets in the fighters whose turn has come, and switches the sides. */
  private _release(time: number) {
    const combat = this._combat
    for (const entry of this._arrivals) {
      if (entry.done || !this._due(entry.rule, time)) continue
      if (combat.state === "ended") return
      entry.done = true
      const fighter = combat.getFighter(entry.id)
      if (!fighter?.alive) continue
      const at = this._entryCell(fighter)
      combat.bringIn(fighter.id, at, combat.baseDelay(fighter) * 0.65)
      this.report.arrived.push(fighter.id)
      combat.emitEvent({ type: "arrived", fighterId: fighter.id, position: at })
    }
    for (const entry of this._switches) {
      if (entry.done || !this._due(entry.rule, time)) continue
      if (combat.state === "ended") return
      entry.done = true
      const fighter = combat.getFighter(entry.id)
      if (!fighter?.alive || combat.departed.has(fighter.id)) continue
      if (!combat.switchTeam(fighter, entry.rule.toTeam)) continue
      this.fleeing.delete(fighter.id)
      this.report.switched.push({
        fighterId: fighter.id,
        to: entry.rule.toTeam,
      })
    }
  }

  /** The listed cell of an arriving fighter, or the closest free one. */
  private _entryCell(fighter: Fighter): Point {
    const combat = this._combat
    const free = (p: Point) =>
      combat.board.canStand(p, fighter.locomotion) &&
      combat.fightersAt(p).length === 0
    if (free(fighter.position)) return { ...fighter.position }
    const region = combat.regionFor(fighter.locomotion)
    const cells = combat.board.cells.filter(free)
    const pool = cells.filter((c) => region.has(keyOf(c)))
    const best = (pool.length ? pool : cells).reduce<Point | null>(
      (a, b) =>
        !a || manhattan(b, fighter.position) < manhattan(a, fighter.position)
          ? b
          : a,
      null,
    )
    return { ...(best ?? fighter.position) }
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

  // ─── Autonomy ─────────────────────────────────────────────────────────────

  get insistCost() {
    return this.rules.autonomy?.insistCost ?? INSIST_COST
  }

  hasAutonomy(fighter: Fighter) {
    return this._auto.has(fighter.id)
  }

  /** The tier of a fighter, if it has a will of its own. */
  tierOf(fighter: Fighter): AutonomyTier | null {
    return this._auto.get(fighter.id)?.tier ?? null
  }

  /**
   * A turn of a fighter begins: whether its tier plays it alone (the Rompu
   * always, the Méfiant every second turn).
   */
  playsAlone(fighter: Fighter): boolean {
    const entry = this._auto.get(fighter.id)
    this._influenced.delete(fighter.id)
    this.pending = null
    if (!entry) return false
    const turn = (this._turns.get(fighter.id) ?? 0) + 1
    this._turns.set(fighter.id, turn)
    const alone =
      entry.tier === "broken" || (entry.tier === "wary" && turn % 2 === 0)
    if (alone) {
      const t = this.report.autonomy.autoTurns
      t[fighter.id] = (t[fighter.id] ?? 0) + 1
    }
    return alone
  }

  /** The ally is asked something: the reason it refuses, if it does. */
  refuse(fighter: Fighter, order: AutonomyOrder): RefusalReason | null {
    const entry = this._auto.get(fighter.id)
    if (!entry || entry.tier === "bound") return null
    if (entry.tier === "confident" && this._refusedOnce.has(fighter.id))
      return null
    const reason = this._reason(fighter, entry, order)
    if (!reason) return null
    this._refusedOnce.add(fighter.id)
    this.pending = { fighterId: fighter.id, order }
    if (!this.report.autonomy.refused.includes(fighter.id))
      this.report.autonomy.refused.push(fighter.id)
    return reason
  }

  private _reason(
    fighter: Fighter,
    entry: AutonomyEntry,
    order: AutonomyOrder,
  ): RefusalReason | null {
    const combat = this._combat
    const refuses = entry.refuses ?? DEFAULT_REFUSALS
    if (refuses.includes("influenced") && this._influenced.has(fighter.id))
      return "influenced"
    if (order.type === "action") {
      const action = combat
        .actionsOf(fighter)
        .find((a) => a.id === order.actionId)
      if (!action || !action.effects.some((e) => e.type === "damage"))
        return null
      const hit = combat
        .getAffectedFighters(fighter, action, order.target)
        .filter((t) => combat.isEnemy(fighter, t))
      if (hit.some((t) => entry.spares?.includes(t.presetId))) return "spare"
      if (
        refuses.includes("finish") &&
        hit.some(
          (t) => t.hp / combat.maxHp(t) < 0.25 && !this.fleeing.has(t.id),
        )
      )
        return "finish"
      return null
    }
    if (refuses.includes("abandon")) {
      for (const ally of combat.aliveFighters) {
        if (ally === fighter || ally.team !== fighter.team) continue
        if (manhattan(ally.position, fighter.position) > 1) continue
        if (manhattan(ally.position, order.destination) <= 1) continue
        const pressed = combat.aliveFighters.filter(
          (e) =>
            combat.isEnemy(ally, e) &&
            manhattan(e.position, ally.position) <= 1,
        )
        if (pressed.length >= 2) return "abandon"
      }
    }
    return null
  }

  /** An order was carried out: the ally was commanded. */
  ordered(fighter: Fighter) {
    const list = this.report.autonomy.ordered
    if (!list.includes(fighter.id)) list.push(fighter.id)
  }

  /** The ally plays alone on the Ghom's word (Laisser agir / Respecter). */
  letAct(fighter: Fighter) {
    const a = this.report.autonomy
    if (!a.letAct.includes(fighter.id)) a.letAct.push(fighter.id)
    if (this.pending?.fighterId === fighter.id) {
      if (!a.respected.includes(fighter.id)) a.respected.push(fighter.id)
      this.pending = null
    }
  }

  /** The Ghom forces the refused order. */
  insisted(fighter: Fighter) {
    const a = this.report.autonomy
    if (!a.insisted.includes(fighter.id)) a.insisted.push(fighter.id)
    this.ordered(fighter)
    this.pending = null
  }
}
