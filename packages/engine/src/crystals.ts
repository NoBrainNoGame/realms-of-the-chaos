import type { Combat } from "./combat"
import { equals, keyOf, manhattan, type Point } from "./geometry"
import type { Fighter } from "./types"

/**
 * Crystals, glass, bridges and ice of the Adventure (era III, "Age du Verre").
 * Entirely opt-in: a fight without `rules.crystals`, `rules.glass` or
 * `rules.gel` never builds any of it.
 *
 * Lore (docs/aventure/03-age-du-verre): an entanglement crystal is condensed
 * Tissu that keeps the correlations of a strong link, always by pairs. Breaking
 * one releases what it held and kills the correlation of its twin (dead
 * glass). The Gel is plain cooling: cold calms the exchanges, so it freezes
 * water, and it also freezes whoever is slowed down enough.
 */

/** What a fighter can do to the crystals, the glass and the cold. */
export type CrystalOp =
  | "extract"
  | "detach"
  | "carry"
  | "deposit"
  | "bridge"
  | "gel"
  | "thaw"

export const CRYSTAL_OPS: readonly CrystalOp[] = [
  "extract",
  "detach",
  "carry",
  "deposit",
  "bridge",
  "gel",
  "thaw",
]

/** What breaking a crystal gives: Élan to the Ghom, or healing nearby. */
export type CrystalGain = "elan" | "heal"

export type CrystalKind = "vein" | "geode"

/** One crystal of the map; two crystals sharing `twin` are a pair. */
export interface CrystalSpec {
  id: string
  at: Point
  /** Id of the other crystal of the pair. */
  twin?: string
  /**
   * A `vein` is taken in the wall: it can only be broken. A `geode` is free:
   * it can also be detached, carried and put down (default `vein`).
   */
  kind?: CrystalKind
  /** The crystal starts carried by this fighter of the line-up. */
  carriedBy?: { team: number; index: number }
}

export interface CrystalRules {
  crystals: CrystalSpec[]
  /** Cells where a carried crystal counts as deposited. */
  deposits?: Point[]
  /** Timeline cost of every crystal action (default 0.6). */
  cost?: number
  /** Élan given by breaking a crystal (default 2). */
  elan?: number
  /** Healing given to the allies near a broken crystal (default 6). */
  heal?: number
  /**
   * Time units after which the Lacune of a broken crystal grows by a ring
   * (default 30, 0 for never).
   */
  ringAfter?: number
  /** Teams whose AI breaks the crystals it stands next to. */
  raiders?: number[]
  /** A carried crystal can be laid as a bridge over `span` cells (default 2). */
  bridge?: { span?: number }
}

export interface GelRules {
  /** Reach of the freeze, in cells in sight (default 2). */
  range?: number
  /** Time units a fighter stays frozen (default 30). */
  duration?: number
  /** Timeline cost of freezing or thawing (default 0.6). */
  cost?: number
  /** Teams that can freeze (default: all). */
  teams?: number[]
  /** Fighters frozen from the start, until this time. */
  frozen?: { team: number; index: number; until: number }[]
  /** Water cells frozen from the start. */
  cells?: Point[]
}

export type CrystalState =
  | "set"
  | "loose"
  | "carried"
  | "deposited"
  | "broken"
  | "dead"
  | "bridge"

export interface CrystalReport {
  extracted: {
    id: string
    by: string
    team: number
    gain: CrystalGain
    at: Point
  }[]
  detached: { id: string; by: string }[]
  /** Every pick-up, in order. */
  carried: { id: string; by: string }[]
  /** Crystals let fall when their carrier fell or left. */
  dropped: { id: string; by: string; at: Point }[]
  deposited: { id: string; by: string; at: Point }[]
  /** Crystals whose pair was broken (dead glass). */
  dead: string[]
  /** Pairs carried at the same time by two fighters. */
  linked: [string, string][]
  /** Crystal id -> id of the fighter holding it now (null: nobody). */
  held: Record<string, string | null>
  /** Crystal id -> how it ended. */
  state: Record<string, CrystalState>
}

export interface GelReport {
  frozen: { fighterId: string; by: string | null; until: number }[]
  iced: Point[]
  thawed: string[]
}

interface Crystal {
  spec: CrystalSpec
  state: CrystalState
  at: Point | null
  holder: string | null
}

const DEFAULT_COST = 0.6

/** The state of the crystals, the bridges and the cold of one fight. */
export class CrystalKit {
  readonly report: {
    crystals: CrystalReport
    gel: GelReport
    bridged: Point[]
  } = {
    crystals: {
      extracted: [],
      detached: [],
      carried: [],
      dropped: [],
      deposited: [],
      dead: [],
      linked: [],
      held: {},
      state: {},
    },
    gel: { frozen: [], iced: [], thawed: [] },
    bridged: [],
  }
  private readonly _crystals = new Map<string, Crystal>()
  private readonly _frozen = new Map<string, number>()
  private readonly _ice = new Set<string>()
  private _rings: { at: number; cell: Point }[] = []
  private _sharing = false

  constructor(
    private readonly _combat: Combat,
    private readonly _crystalRules: CrystalRules | undefined,
    private readonly _gelRules: GelRules | undefined,
    glass: Point[] | undefined,
    onVoids: () => void,
  ) {
    this._onVoids = onVoids
    const board = _combat.board
    for (const p of glass ?? []) board.glass.add(keyOf(p))
    const member = (team: number, index: number) => {
      const found = _combat.fighters.filter((f) => f.team === team)[index]
      if (!found) throw new Error(`No fighter ${index} in team ${team}`)
      return found.id
    }
    for (const spec of _crystalRules?.crystals ?? []) {
      const crystal: Crystal = {
        spec,
        state: "set",
        at: { ...spec.at },
        holder: null,
      }
      if (spec.carriedBy) {
        crystal.state = "carried"
        crystal.at = null
        crystal.holder = member(spec.carriedBy.team, spec.carriedBy.index)
      }
      this._crystals.set(spec.id, crystal)
    }
    for (const c of this._crystals.values()) {
      if (c.spec.twin && !this._crystals.has(c.spec.twin))
        throw new Error(`Crystal ${c.spec.id}: no twin ${c.spec.twin}`)
      this._place(c)
      this._note(c)
    }
    for (const f of _gelRules?.frozen ?? [])
      this._frozen.set(member(f.team, f.index), f.until)
    for (const p of _gelRules?.cells ?? []) this._freezeCell(p)
    for (const [id, until] of this._frozen)
      this.report.gel.frozen.push({ fighterId: id, by: null, until })
  }

  private readonly _onVoids: () => void

  // ─── Reading ──────────────────────────────────────────────────────────────

  get enabled() {
    return !!this._crystalRules || !!this._gelRules
  }

  /** Crystals (in their cell, lying, or deposited) with their state. */
  get crystals(): { id: string; at: Point; state: CrystalState }[] {
    const out: { id: string; at: Point; state: CrystalState }[] = []
    for (const c of this._crystals.values()) {
      if (c.at) out.push({ id: c.spec.id, at: { ...c.at }, state: c.state })
    }
    return out
  }

  /** Cells under a carried crystal: where its bearer stands. */
  get carriers(): Point[] {
    const out: Point[] = []
    for (const c of this._crystals.values()) {
      if (c.state !== "carried" || !c.holder) continue
      const f = this._combat.getFighter(c.holder)
      if (f?.alive && !this._combat.departed.has(f.id))
        out.push({ ...f.position })
    }
    return out
  }

  /** The crystal a fighter carries, if any. */
  carriedBy(fighterId: string): string | null {
    for (const c of this._crystals.values()) {
      if (c.state === "carried" && c.holder === fighterId) return c.spec.id
    }
    return null
  }

  isFrozen(fighterId: string) {
    return this._frozen.has(fighterId)
  }

  get frozenFighters(): string[] {
    return [...this._frozen.keys()]
  }

  get iceCells(): Point[] {
    return [...this._ice].map(pointOf)
  }

  get glassCells(): Point[] {
    return [...this._combat.board.glass].map(pointOf)
  }

  get bridgeCells(): Point[] {
    return this.report.bridged.filter((p) =>
      this._combat.board.bridges.has(keyOf(p)),
    )
  }

  cost(op: CrystalOp): number {
    return op === "gel" || op === "thaw"
      ? (this._gelRules?.cost ?? DEFAULT_COST)
      : (this._crystalRules?.cost ?? DEFAULT_COST)
  }

  /** Operations with at least one target for this fighter now. */
  available(fighter: Fighter): CrystalOp[] {
    if (!fighter.alive || this._frozen.has(fighter.id)) return []
    return CRYSTAL_OPS.filter((op) => this.targets(fighter, op).length > 0)
  }

  /** Whether the rules have this operation at all (for the buttons). */
  has(op: CrystalOp) {
    if (op === "gel" || op === "thaw") return !!this._gelRules
    if (op === "bridge") return !!this._crystalRules?.bridge
    return !!this._crystalRules
  }

  /** Cells the fighter can aim this operation at. */
  targets(fighter: Fighter, op: CrystalOp): Point[] {
    if (!this.has(op)) return []
    const board = this._combat.board
    const here = fighter.position
    const out: Point[] = []
    const add = (p: Point) => {
      if (!out.some((o) => equals(o, p))) out.push({ ...p })
    }
    const free = (p: Point) =>
      this._combat.fightersAt(p).filter((f) => f.alive).length === 0
    const carrying = this.carriedBy(fighter.id)
    switch (op) {
      case "extract":
        for (const c of this._crystals.values()) {
          if (!c.at || (c.state !== "set" && c.state !== "loose")) continue
          if (manhattan(here, c.at) <= 1 && free(c.at)) add(c.at)
        }
        break
      case "detach":
        for (const c of this._crystals.values()) {
          if (!c.at || c.state !== "set" || c.spec.kind !== "geode") continue
          if (manhattan(here, c.at) <= 1) add(c.at)
        }
        break
      case "carry":
        if (carrying) break
        for (const c of this._crystals.values()) {
          if (c.at && c.state === "loose" && manhattan(here, c.at) <= 1)
            add(c.at)
        }
        break
      case "deposit":
        if (!carrying) break
        for (const p of board.neighbors(here).concat([here])) {
          if (board.canStand(p, fighter.locomotion)) add(p)
        }
        break
      case "bridge":
        if (!carrying) break
        for (const p of board.neighbors(here)) {
          if (this._bridgeable(p)) add(p)
        }
        break
      case "gel": {
        const range = this._gelRules?.range ?? 2
        if (
          this._gelRules?.teams &&
          !this._gelRules.teams.includes(fighter.team)
        )
          break
        for (const cell of board.cells) {
          const p = { x: cell.x, y: cell.y }
          const d = manhattan(here, p)
          if (d < 1 || d > range) continue
          if (!board.hasLineOfSight(here, p)) continue
          const occupants = this._combat
            .fightersAt(p)
            .filter((f) => f.alive && !this._combat.departed.has(f.id))
          if (occupants.length > 0) {
            if (
              occupants.some(
                (f) =>
                  this._combat.isEnemy(fighter, f) && !this._frozen.has(f.id),
              )
            )
              add(p)
          } else if (this._freezable(p)) add(p)
        }
        break
      }
      case "thaw":
        for (const cell of board.cells) {
          const p = { x: cell.x, y: cell.y }
          if (manhattan(here, p) > 1) continue
          const occupants = this._combat.fightersAt(p).filter((f) => f.alive)
          if (occupants.some((f) => this._frozen.has(f.id))) add(p)
          else if (occupants.length === 0 && this._ice.has(keyOf(p))) add(p)
        }
        break
    }
    return out
  }

  // ─── Doing ────────────────────────────────────────────────────────────────

  /** Does it. Returns an error text, or null when it was done. */
  operate(
    fighter: Fighter,
    op: CrystalOp,
    target: Point,
    gain: CrystalGain = "elan",
  ): string | null {
    if (!this.has(op)) return "Action inconnue"
    if (this._frozen.has(fighter.id)) return "Ce personnage est gelé"
    if (!this.targets(fighter, op).some((p) => equals(p, target)))
      return "Cible invalide"
    switch (op) {
      case "extract":
        this._extract(fighter, target, gain)
        break
      case "detach":
        this._detach(fighter, target)
        break
      case "carry":
        this._carry(fighter, target)
        break
      case "deposit":
        this._deposit(fighter, target)
        break
      case "bridge":
        this._bridge(fighter, target)
        break
      case "gel":
        this._gel(fighter, target)
        break
      case "thaw":
        this._thaw(fighter, target)
        break
    }
    return null
  }

  /** An AI fighter of a raiding team breaks the crystal next to it. */
  raid(fighter: Fighter): boolean {
    if (!this._crystalRules?.raiders?.includes(fighter.team)) return false
    if (fighter.controller !== "ai") return false
    const target = this.targets(fighter, "extract")[0]
    if (!target) return false
    this._extract(fighter, target, "heal")
    return true
  }

  private _at(p: Point, states: CrystalState[]) {
    return [...this._crystals.values()].find(
      (c) => c.at && equals(c.at, p) && states.includes(c.state),
    )
  }

  private _extract(fighter: Fighter, target: Point, gain: CrystalGain) {
    const combat = this._combat
    const c = this._at(target, ["set", "loose"])
    if (!c || !c.at) return
    const at = { ...c.at }
    this._unplace(c)
    c.state = "broken"
    c.at = null
    this._note(c)
    this.report.crystals.extracted.push({
      id: c.spec.id,
      by: fighter.id,
      team: fighter.team,
      gain,
      at,
    })
    const rules = this._crystalRules
    if (gain === "elan") combat.grantEnergy(fighter.team, rules?.elan ?? 2)
    else {
      for (const ally of combat.aliveFighters) {
        if (ally.team === fighter.team && manhattan(ally.position, at) <= 2)
          combat.healFighter(ally, rules?.heal ?? 6)
      }
    }
    // the correlation is spent: the twin goes dead
    const twin = c.spec.twin ? this._crystals.get(c.spec.twin) : undefined
    let twinId: string | null = null
    if (
      twin &&
      twin.state !== "broken" &&
      twin.state !== "dead" &&
      twin.state !== "bridge"
    ) {
      twinId = twin.spec.id
      this._kill(twin)
    }
    combat.emitEvent({
      type: "crystalExtracted",
      crystalId: c.spec.id,
      fighterId: fighter.id,
      at,
      gain,
      twinId,
    })
    // a Lacune opens where the crystal was, and grows a ring later
    const board = combat.board
    board.voids.add(keyOf(at))
    this._onVoids()
    combat.emitEvent({ type: "lacuneGrew", cells: [at] })
    const ring = rules?.ringAfter ?? 30
    if (ring > 0) this._rings.push({ at: combat.time + ring, cell: at })
  }

  private _kill(c: Crystal) {
    const combat = this._combat
    if (c.state === "carried") {
      c.holder = null
      c.at = null
    } else if (c.at) {
      // dead glass: an obstacle without light
      this._unplace(c)
    }
    c.state = "dead"
    this.report.crystals.dead.push(c.spec.id)
    this._note(c)
    this._place(c)
    combat.emitEvent({
      type: "crystalDead",
      crystalId: c.spec.id,
      at: c.at ? { ...c.at } : null,
    })
  }

  private _detach(fighter: Fighter, target: Point) {
    const c = this._at(target, ["set"])
    if (!c || !c.at) return
    this._unplace(c)
    c.state = "loose"
    this._note(c)
    this.report.crystals.detached.push({ id: c.spec.id, by: fighter.id })
    this._combat.refreshTerrain()
    this._combat.emitEvent({
      type: "crystalDetached",
      crystalId: c.spec.id,
      fighterId: fighter.id,
      at: { ...c.at },
    })
  }

  private _carry(fighter: Fighter, target: Point) {
    const c = this._at(target, ["loose"])
    if (!c) return
    c.state = "carried"
    c.holder = fighter.id
    c.at = null
    this._note(c)
    this.report.crystals.carried.push({ id: c.spec.id, by: fighter.id })
    this._combat.emitEvent({
      type: "crystalCarried",
      crystalId: c.spec.id,
      fighterId: fighter.id,
    })
    this._link(c)
  }

  /** Two fighters carrying the two crystals of a pair are linked. */
  private _link(c: Crystal) {
    const twin = c.spec.twin ? this._crystals.get(c.spec.twin) : undefined
    if (!twin || twin.state !== "carried" || !twin.holder || !c.holder) return
    if (twin.holder === c.holder) return
    const pair: [string, string] = [c.holder, twin.holder]
    this.report.crystals.linked.push(pair)
    this._combat.emitEvent({ type: "crystalsLinked", fighterIds: pair })
  }

  /** The fighter linked to this one by a pair of carried crystals. */
  partnerOf(fighterId: string): Fighter | null {
    const id = this.carriedBy(fighterId)
    const c = id ? this._crystals.get(id) : undefined
    const twin = c?.spec.twin ? this._crystals.get(c.spec.twin) : undefined
    if (!twin || twin.state !== "carried" || !twin.holder) return null
    const f = this._combat.getFighter(twin.holder)
    return f?.alive && !this._combat.departed.has(f.id) ? f : null
  }

  /** Linked fighters share their healing: what one receives, both get. */
  healed(fighter: Fighter, amount: number) {
    if (this._sharing) return
    const partner = this.partnerOf(fighter.id)
    if (!partner) return
    this._sharing = true
    this._combat.healFighter(partner, amount)
    this._sharing = false
  }

  private _deposit(fighter: Fighter, target: Point) {
    const id = this.carriedBy(fighter.id)
    const c = id ? this._crystals.get(id) : undefined
    if (!c) return
    const deposit = this._crystalRules?.deposits?.some((p) => equals(p, target))
    c.holder = null
    c.at = { ...target }
    c.state = deposit ? "deposited" : "loose"
    this._note(c)
    if (deposit)
      this.report.crystals.deposited.push({
        id: c.spec.id,
        by: fighter.id,
        at: { ...target },
      })
    this._combat.emitEvent({
      type: "crystalDeposited",
      crystalId: c.spec.id,
      fighterId: fighter.id,
      at: { ...target },
      deposit: !!deposit,
    })
  }

  private _bridgeable(p: Point) {
    const board = this._combat.board
    const key = keyOf(p)
    if (!board.inBounds(p) || board.bridges.has(key)) return false
    if (board.glass.has(key) || board.blocks.has(key)) return false
    return board.isDeepWater(p) || board.voids.has(key)
  }

  private _bridge(fighter: Fighter, target: Point) {
    const id = this.carriedBy(fighter.id)
    const c = id ? this._crystals.get(id) : undefined
    if (!c) return
    const board = this._combat.board
    const dx = target.x - fighter.position.x
    const dy = target.y - fighter.position.y
    const span = this._crystalRules?.bridge?.span ?? 2
    const level = board.standHeight(fighter.position)
    const cells: Point[] = []
    let p = { ...target }
    while (cells.length < span && this._bridgeable(p)) {
      cells.push({ ...p })
      p = { x: p.x + dx, y: p.y + dy }
    }
    for (const cell of cells) {
      board.bridges.set(keyOf(cell), level)
      this.report.bridged.push(cell)
    }
    c.holder = null
    c.at = { ...target }
    c.state = "bridge"
    this._note(c)
    this._combat.refreshTerrain()
    this._combat.emitEvent({
      type: "bridged",
      crystalId: c.spec.id,
      fighterId: fighter.id,
      cells,
    })
  }

  private _freezable(p: Point) {
    const board = this._combat.board
    const cell = board.get(p)
    const key = keyOf(p)
    return (
      !!cell &&
      cell.terrain === "water" &&
      !board.bridges.has(key) &&
      !board.glass.has(key)
    )
  }

  private _freezeCell(p: Point) {
    const board = this._combat.board
    const key = keyOf(p)
    if (!this._freezable(p)) return false
    board.bridges.set(key, board.standHeight(p))
    this._ice.add(key)
    this.report.gel.iced.push({ ...p })
    this._combat.refreshTerrain()
    return true
  }

  private _gel(fighter: Fighter, target: Point) {
    const combat = this._combat
    const victim = combat
      .fightersAt(target)
      .find(
        (f) =>
          f.alive &&
          !combat.departed.has(f.id) &&
          combat.isEnemy(fighter, f) &&
          !this._frozen.has(f.id),
      )
    if (victim) {
      const until = combat.time + (this._gelRules?.duration ?? 30)
      this._frozen.set(victim.id, until)
      victim.path = []
      victim.waypoints = []
      this.report.gel.frozen.push({
        fighterId: victim.id,
        by: fighter.id,
        until,
      })
      combat.emitEvent({
        type: "frozen",
        fighterId: victim.id,
        by: fighter.id,
        until,
      })
      return
    }
    if (this._freezeCell(target))
      combat.emitEvent({ type: "frozen", cell: { ...target }, by: fighter.id })
  }

  private _thaw(fighter: Fighter, target: Point) {
    const combat = this._combat
    const victim = combat
      .fightersAt(target)
      .find((f) => f.alive && this._frozen.has(f.id))
    if (victim) {
      this._frozen.delete(victim.id)
      this.report.gel.thawed.push(victim.id)
      combat.emitEvent({
        type: "thawed",
        fighterId: victim.id,
        by: fighter.id,
      })
      return
    }
    const key = keyOf(target)
    if (!this._ice.has(key)) return
    this._ice.delete(key)
    combat.board.bridges.delete(key)
    combat.refreshTerrain()
    combat.emitEvent({ type: "thawed", cell: { ...target }, by: fighter.id })
  }

  // ─── Time and loss ────────────────────────────────────────────────────────

  /** The timeline moved on to `time`: fighters thaw, Lacunes grow a ring. */
  advance(time: number) {
    for (const [id, until] of [...this._frozen]) {
      if (time < until) continue
      this._frozen.delete(id)
      this.report.gel.thawed.push(id)
      this._combat.emitEvent({ type: "thawed", fighterId: id, by: null })
    }
    if (this._rings.length === 0) return
    const due = this._rings.filter((r) => r.at <= time)
    if (due.length === 0) return
    this._rings = this._rings.filter((r) => r.at > time)
    const board = this._combat.board
    const grown: Point[] = []
    for (const ring of due) {
      for (const p of board.neighbors(ring.cell)) {
        const key = keyOf(p)
        if (
          board.voids.has(key) ||
          board.bridges.has(key) ||
          board.glass.has(key) ||
          board.blocks.has(key) ||
          this._combat.fightersAt(p).some((f) => f.alive)
        )
          continue
        board.voids.add(key)
        grown.push(p)
      }
    }
    if (grown.length === 0) return
    this._onVoids()
    this._combat.emitEvent({ type: "lacuneGrew", cells: grown })
  }

  /** A fighter fell or left: what it carried stays where it stood. */
  lost(fighterId: string) {
    const fighter = this._combat.getFighter(fighterId)
    this._frozen.delete(fighterId)
    for (const c of this._crystals.values()) {
      if (c.state !== "carried" || c.holder !== fighterId || !fighter) continue
      const at = { ...fighter.position }
      c.state = "loose"
      c.holder = null
      c.at = at
      this._note(c)
      this.report.crystals.dropped.push({ id: c.spec.id, by: fighterId, at })
      this._combat.emitEvent({
        type: "crystalDropped",
        crystalId: c.spec.id,
        fighterId,
        at,
      })
    }
  }

  // ─── Board bookkeeping ────────────────────────────────────────────────────

  /** Crystals in place and dead glass are one-cell obstacles. */
  private _place(c: Crystal) {
    if (!c.at || (c.state !== "set" && c.state !== "dead")) return
    this._combat.board.blocks.add(keyOf(c.at))
    this._combat.refreshTerrain()
  }

  private _unplace(c: Crystal) {
    if (!c.at) return
    const key = keyOf(c.at)
    const others = [...this._crystals.values()].some(
      (o) =>
        o !== c &&
        o.at &&
        keyOf(o.at) === key &&
        (o.state === "set" || o.state === "dead"),
    )
    if (!others) this._combat.board.blocks.delete(key)
    this._combat.refreshTerrain()
  }

  private _note(c: Crystal) {
    this.report.crystals.state[c.spec.id] = c.state
    this.report.crystals.held[c.spec.id] =
      c.state === "carried" ? c.holder : null
  }
}

function pointOf(key: string): Point {
  const [x, y] = key.split(",").map(Number)
  return { x, y }
}
