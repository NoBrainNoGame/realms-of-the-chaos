import {
  type AdventureRules,
  AdventureTracker,
  type AutonomyOrder,
  type CrystalGain,
  type CrystalOp,
} from "./adventure"
import { type AiCommand, decide, decideDivine } from "./ai"
import {
  Board,
  type Locomotion,
  MAX_ELEVATION,
  MAX_STEP,
  MIN_ELEVATION,
  type PathNode,
} from "./board"
import {
  ACTIONS,
  BLESSING_HEAL,
  CHARACTERS,
  COMMON_ACTIONS,
  comboAction,
  DIVINE_ACTIONS,
  MAX_ENERGY,
  MAX_FIGHTERS_PER_CELL,
  resolveAction,
  STATUSES,
  TIME_WARP_AMOUNT,
} from "./content"
import { HALT_MESSAGE } from "./energy"
import {
  add,
  dominantDirection,
  equals,
  keyOf,
  manhattan,
  type Point,
} from "./geometry"
import { createRng, type Rng } from "./random"
import type {
  ActionDefinition,
  AffectFilter,
  CharacterPreset,
  CommandResult,
  Controller,
  Effect,
  FightEvent,
  Fighter,
  Stats,
  StatusId,
  Team,
} from "./types"
import { inZone, POINT, zoneCells } from "./zones"

export interface TeamSetup {
  name?: string
  controller: Controller
  /** Character preset ids (or full presets, e.g. generated characters). */
  fighters: (string | CharacterPreset)[]
  /**
   * Scales the fighters' stats (difficulty, arcade waves). Health, attack
   * and defense are multiplied, speed by the square root.
   */
  statMultiplier?: number
  /** Starting hit points per fighter (defaults to full health). */
  hp?: (number | undefined)[]
}

/** A serialized player command (online play, replays). */
export type Command =
  | {
      type: "moveTo"
      fighterId: string
      destination: Point
      /** Adds a stop after the planned walk instead of replacing it. */
      append?: boolean
    }
  | { type: "useAction"; fighterId: string; actionId: string; target: Point }
  | { type: "pass"; fighterId: string }
  /** Adventure autonomy: the active ally plays its turn by itself (AI). */
  | { type: "letAct"; fighterId: string }
  /** Adventure autonomy: forces the order the active ally just refused. */
  | { type: "insist"; fighterId: string }
  /** Adventure autonomy: the Ghom withdraws, the fight stops. */
  | { type: "withdraw"; fighterId: string }
  /** Adventure debate: the hero plays an argument against the speaker. */
  | { type: "argue"; fighterId: string; argumentId: string }
  /** Adventure crystals and cold: extract, detach, carry, deposit, bridge, gel. */
  | {
      type: "crystal"
      fighterId: string
      op: CrystalOp
      target: Point
      gain?: CrystalGain
    }
  | {
      type: "useDivine"
      fighterId: string
      divineId: string
      target: Point | null
    }

const WAITING_FOR_GHOM = "Cet Écho a refusé : le laisser agir, ou insister"

const isVacuumDecay = (action: ActionDefinition) =>
  action.effects.some((e) => e.type === "vacuumDecay")

export interface CombatOptions {
  teams: TeamSetup[]
  board?: Board
  seed?: number
  /** Explicit start positions per team (otherwise random placement). */
  positions?: Point[][]
  /**
   * Opt-in rules of the Adventure. A fight with this option is an Adventure
   * fight: only there can a vacuum decay be cast (the game wipes the save
   * unless the fight is the final scene, `finale`).
   */
  adventure?: AdventureRules
}

/**
 * Stats scaled by a difficulty multiplier: health, attacks and defenses are
 * multiplied, speed only by the square root (so turns don't become absurdly
 * frequent), luck is unchanged.
 */
export function scaleStats(stats: Stats, multiplier: number): Stats {
  if (multiplier === 1) return { ...stats }
  return {
    health: stats.health * multiplier,
    speed: stats.speed * Math.sqrt(multiplier),
    physicalAttack: stats.physicalAttack * multiplier,
    physicalDefense: stats.physicalDefense * multiplier,
    magicalAttack: stats.magicalAttack * multiplier,
    magicalDefense: stats.magicalDefense * multiplier,
    luck: stats.luck,
  }
}

export type CombatState = "running" | "awaitingInput" | "ended"

/** Fraction of the base delay spent per step on normal ground. */
export const STEP_DELAY_RATIO = 0.4
/** Minimal distance between enemies at placement (from the design doc). */
export const MIN_ENEMY_SPAWN_DISTANCE = 4
/** Max extra range given by height. */
export const MAX_HEIGHT_BONUS = 2
/** Damage per remaining push distance when hitting something. */
export const COLLISION_DAMAGE = 3
/** Damage per level fallen beyond a normal step. */
export const FALL_DAMAGE = 5
/** Levels raised or lowered by the earthquake divine power. */
export const EARTHQUAKE_DELTA = 2
/** Share of the damage taken that lowers max hit points for good. */
export const EROSION = 0.15
/** Hit points per point of the health stat. */
export const HP_PER_HEALTH = 7
/** Speed at which walking and acting have the same base time. */
export const REFERENCE_SPEED = 5
/** Timeline time for each team to gain 1 divine energy. */
export const ENERGY_PERIOD = 25
/** Energy rate bonus per fallen ally (+50 % each). */
export const ENERGY_CATCH_UP = 0.5
/** Energy a team gains instantly when one of its fighters falls. */
export const DEATH_ENERGY = 1
/** Delay multiplier while a swimmer treads deep water. */
export const SWIM_FATIGUE = 1.5

/**
 * Pure, renderer-agnostic fight engine.
 *
 * Time flows on a timeline: every fighter has its next *action turn* and,
 * while it has a planned path, its next *step*. Moving never ends a turn,
 * steps are played one cell at a time as the timeline advances
 * ("déplacement à chaque fois que c'est possible").
 */
export class Combat {
  readonly board: Board
  readonly fighters: Fighter[] = []
  readonly teams: Team[]
  readonly rng: Rng
  /**
   * AI teams on hold: their fighters only pass (a tutorial's foes, until
   * the lesson is over). Delete a team to let it fight.
   */
  readonly holding = new Set<number>()
  /**
   * Fighters not on the island yet (a tutorial's foes, until a lesson
   * needs them): no turn, no cell, out of reach. `bringIn` lets one in.
   */
  readonly offstage = new Set<string>()
  /** Fighters that left the island alive (fled, spared): off the board for good. */
  readonly departed = new Set<string>()
  /** Rule state of an Adventure fight; null in every other fight. */
  adventure: AdventureTracker | null = null

  private _time = 0
  private _state: CombatState = "running"
  private _activeFighter: Fighter | null = null
  private _winnerTeam: number | null = null
  private _collapsed = false
  private _events: FightEvent[] = []
  private _log: Command[] = []
  private _presets = new Map<string, CharacterPreset>()
  private _regions = new Map<Locomotion, Set<string>>()
  /** Placement draws, apart from the fight's: a line-up never changes it. */
  private _spawnRng: Rng
  /** Each team's starting cells: what `arrange` chooses from. */
  private _slots: Point[][] = []
  private _begun = false

  constructor(options: CombatOptions) {
    if (options.teams.length < 2 || options.teams.length > 4) {
      throw new Error("A fight needs between 2 and 4 teams")
    }

    this.rng = createRng(options.seed)
    this.board = options.board ?? Board.generate(this.rng)
    this.teams = options.teams.map((setup, index) => ({
      index,
      name: setup.name ?? `Équipe ${index + 1}`,
      controller: setup.controller,
      energy: 1,
      energyProgress: 0,
    }))

    this._spawnRng = createRng(
      (options.seed ?? this.rng.int(0, 2 ** 31 - 1)) + 7919,
    )
    const lineUp = this._lineUp(options)
    this._slots = lineUp ?? []

    options.teams.forEach((setup, team) => {
      setup.fighters.forEach((entry, i) => {
        const preset = typeof entry === "string" ? CHARACTERS[entry] : entry
        if (!preset) throw new Error(`Unknown character "${entry}"`)
        const presetId = preset.id
        this._presets.set(presetId, preset)

        const duplicates = this.fighters.filter(
          (f) => f.presetId === presetId,
        ).length

        const position =
          options.positions?.[team]?.[i] ??
          lineUp?.[team][i] ??
          this._randomSpawn(team)

        this.fighters.push({
          id: `${presetId}-${team}-${i}`,
          presetId,
          name: duplicates ? `${preset.name} ${duplicates + 1}` : preset.name,
          team,
          stats: scaleStats(preset.stats, setup.statMultiplier ?? 1),
          actions: [
            ...preset.actions,
            ...COMMON_ACTIONS.filter((id) => !preset.actions.includes(id)),
          ].map((id) => resolveAction(preset, id)),
          controller: setup.controller,
          locomotion: preset.locomotion ?? "walker",
          hp: 0,
          erosion: 0,
          position,
          alive: true,
          nextActionAt: 0,
          nextMoveAt: 0,
          waypoints: [],
          path: [],
          statuses: [],
          cooldowns: {},
        })
      })
    })

    // starting hit points (full, or carried over between arcade waves)
    let index = 0
    for (const setup of options.teams) {
      for (let i = 0; i < setup.fighters.length; i++) {
        const fighter = this.fighters[index++]
        const max = this.maxHp(fighter)
        const start = setup.hp?.[i]
        fighter.hp =
          start === undefined
            ? max
            : Math.max(1, Math.min(max, Math.round(start)))
      }
    }

    for (const fighter of this.fighters) {
      fighter.nextActionAt =
        this.baseDelay(fighter) * (0.3 + 0.7 * this.rng.next())
    }

    if (options.adventure) {
      this.adventure = new AdventureTracker(this, options.adventure)
    }
  }

  // ─── Read-only state ──────────────────────────────────────────────────────

  /** Cells belonging to the main walkable area (cached until terrain changes). */
  get walkableRegion(): Set<string> {
    return this.regionFor("walker")
  }

  /** Main region for a locomotion (cached until the terrain changes). */
  regionFor(locomotion: Locomotion): Set<string> {
    let region = this._regions.get(locomotion)
    if (!region) {
      region = this.board.mainRegion(locomotion)
      this._regions.set(locomotion, region)
    }
    return region
  }

  /** Swimming in deep water (not aquatic): every turn there is tiring. */
  isSwimming(fighter: Fighter) {
    return (
      fighter.locomotion === "swimmer" &&
      this.board.isDeepWater(fighter.position)
    )
  }

  get time() {
    return this._time
  }

  get state() {
    return this._state
  }

  get activeFighter() {
    return this._activeFighter
  }

  /** Whether the fight ended by a vacuum decay (no winner, no survivor). */
  get collapsed() {
    return this._collapsed
  }

  get winnerTeam() {
    return this._winnerTeam
  }

  getFighter(id: string) {
    return this.fighters.find((f) => f.id === id)
  }

  get aliveFighters() {
    return this.fighters.filter(
      (f) => f.alive && !this.offstage.has(f.id) && !this.departed.has(f.id),
    )
  }

  fightersAt(p: Point) {
    return this.aliveFighters.filter((f) => equals(f.position, p))
  }

  /**
   * An offstage fighter enters the island at `position`; it plays `delay`
   * from now.
   */
  bringIn(fighterId: string, position: Point, delay: number) {
    const fighter = this.getFighter(fighterId)
    if (!fighter || !this.offstage.delete(fighterId)) return
    fighter.position = { ...position }
    fighter.path = []
    fighter.waypoints = []
    fighter.nextActionAt = this._time + delay
  }

  /**
   * Adventure rules: the fighter changes sides (and takes that side's
   * controller). Returns whether it did.
   */
  switchTeam(fighter: Fighter, toTeam: number) {
    const team = this.teams[toTeam]
    if (!team || fighter.team === toTeam) return false
    const from = fighter.team
    fighter.team = toTeam
    fighter.controller = team.controller
    this._clearWalk(fighter)
    this._emit({ type: "switched", fighterId: fighter.id, from, to: toTeam })
    this._checkVictory()
    return true
  }

  /** Character sheet a fighter was created from. */
  presetOf(fighter: Fighter): CharacterPreset {
    return this._presets.get(fighter.presetId) ?? CHARACTERS[fighter.presetId]
  }

  /** Max hit points, reduced by erosion. */
  maxHp(fighter: Fighter) {
    return Math.max(1, this.baseMaxHp(fighter) - Math.floor(fighter.erosion))
  }

  /** Max hit points before erosion. */
  baseMaxHp(fighter: Fighter) {
    return Math.round(fighter.stats.health * HP_PER_HEALTH)
  }

  /** Base time unit of a fighter: faster fighters play more often. */
  baseDelay(fighter: Fighter) {
    return 100 / fighter.stats.speed
  }

  delayMultiplier(fighter: Fighter) {
    const statuses = fighter.statuses.reduce(
      (m, s) => m * (STATUSES[s.id].delayMultiplier ?? 1),
      1,
    )
    return statuses * (this.isSwimming(fighter) ? SWIM_FATIGUE : 1)
  }

  /**
   * Base time of a step. Walking depends less on speed than acting does
   * (square root): slow fighters are not stuck far from the fight.
   */
  baseStepDelay(fighter: Fighter) {
    return 100 / Math.sqrt(fighter.stats.speed * REFERENCE_SPEED)
  }

  /** Time a step takes: slower in water and when climbing. */
  stepDelay(fighter: Fighter, from: Point, to: Point) {
    return (
      this.baseStepDelay(fighter) *
      STEP_DELAY_RATIO *
      this.board.stepCost(from, to, fighter.locomotion) *
      this.delayMultiplier(fighter)
    )
  }

  critChance(fighter: Fighter) {
    return Math.min(0.5, fighter.stats.luck * 0.03)
  }

  hasStatus(fighter: Fighter, id: StatusId) {
    return fighter.statuses.some((s) => s.id === id)
  }

  /** Alive fighters ordered by their next action turn (HUD timeline). */
  timelineOrder(): Fighter[] {
    return this.aliveFighters.sort(
      (a, b) =>
        a.nextActionAt - b.nextActionAt ||
        this.fighters.indexOf(a) - this.fighters.indexOf(b),
    )
  }

  isEnemy(a: Fighter, b: Fighter) {
    if (this.adventure) return this.adventure.isEnemy(a, b)
    return a.team !== b.team
  }

  /** Whether `fighter` may stand on / walk through `p`. */
  canEnter(fighter: Fighter, p: Point) {
    const occupants = this.fightersAt(p).filter((o) => o !== fighter)
    if (occupants.some((o) => this.isEnemy(fighter, o))) return false
    if (this.adventure && occupants.length > 0) {
      if (this.adventure.isSolitary(fighter)) return false
      if (occupants.some((o) => this.adventure!.isSolitary(o))) return false
    }
    return occupants.length < MAX_FIGHTERS_PER_CELL
  }

  /** Every cell the fighter can reach, with path costs. */
  explore(
    fighter: Fighter,
    from: Point = fighter.position,
  ): Map<string, PathNode> {
    return this.board.explore(
      from,
      (p) => this.canEnter(fighter, p),
      Infinity,
      fighter.locomotion,
    )
  }

  getReachableCells(fighter: Fighter): Point[] {
    return [...this.explore(fighter).values()]
      .map((n) => n.point)
      .filter((p) => !equals(p, fighter.position))
  }

  // ─── Action queries ───────────────────────────────────────────────────────

  /**
   * Extra range of a ranged action thanks to height: +1 per level the
   * launcher stands above the target cell, up to +2.
   */
  heightBonus(action: ActionDefinition, origin: Point, target: Point) {
    if (action.launch.max <= 1) return 0
    const diff = this.board.standHeight(origin) - this.board.standHeight(target)
    return Math.max(0, Math.min(MAX_HEIGHT_BONUS, diff))
  }

  /** Whether `p` is in the action's launch zone from `origin` (with height). */
  inLaunchZone(action: ActionDefinition, origin: Point, p: Point, extra = 0) {
    if (!this.board.inBounds(p)) return false
    const bonus = this.heightBonus(action, origin, p) + extra
    return inZone(origin, p, {
      ...action.launch,
      max: action.launch.max + bonus,
    })
  }

  /**
   * Paths of a movement action: every cell whose cheapest walk costs at
   * most `reach` (the pathfinder's costs: water and climbing cost more),
   * through allies, never through enemies, with that walk.
   */
  movementPaths(
    fighter: Fighter,
    reach: number,
    origin: Point = fighter.position,
  ): Map<string, Point[]> {
    const nodes = this.board.explore(
      origin,
      (p) => this.canEnter(fighter, p),
      reach,
      fighter.locomotion,
    )
    const paths = new Map<string, Point[]>()
    for (const [key, node] of nodes) {
      if (node.previous === null) continue
      paths.set(key, Board.pathTo(nodes, node.point)!)
    }
    return paths
  }

  /** Cells where the action can be aimed (launch zone, height, LOS). */
  getLaunchCells(
    fighter: Fighter,
    action: ActionDefinition,
    origin: Point = fighter.position,
  ): Point[] {
    if (action.movement) {
      return [...this.movementPaths(fighter, action.movement.reach, origin)]
        .map(([, path]) => path[path.length - 1])
        .sort((a, b) => a.y - b.y || a.x - b.x)
    }
    const widest = zoneCells(origin, {
      ...action.launch,
      max: action.launch.max + MAX_HEIGHT_BONUS,
    })
    return widest.filter(
      (p) =>
        this.inLaunchZone(action, origin, p) &&
        !this.board.glassBetween(origin, p) &&
        (!action.lineOfSight || this.board.hasLineOfSight(origin, p)),
    )
  }

  targetMatches(
    fighter: Fighter,
    action: ActionDefinition,
    target: Point,
    origin: Point = fighter.position,
  ) {
    if (action.movement) {
      return this.movementPaths(fighter, action.movement.reach, origin).has(
        keyOf(target),
      )
    }
    const occupants = this.fightersAt(target)
    if (
      action.targetTerrain &&
      this.board.get(target)?.terrain !== action.targetTerrain
    ) {
      return false
    }
    switch (action.target) {
      case "self":
        return equals(target, origin)
      case "enemy":
        return occupants.some((o) => this.isEnemy(fighter, o))
      case "ally":
        return (
          equals(target, origin) ||
          occupants.some((o) => !this.isEnemy(fighter, o))
        )
      case "any":
        return occupants.length > 0
      case "emptyCell":
        return (
          occupants.length === 0 &&
          this.board.canStand(target, fighter.locomotion) &&
          this.regionFor(fighter.locomotion).has(keyOf(target))
        )
    }
  }

  /** Cells where the action can be aimed *and* that contain a valid target. */
  getValidTargets(
    fighter: Fighter,
    action: ActionDefinition,
    origin: Point = fighter.position,
  ): Point[] {
    // movement: every reachable cell is a valid target by construction
    if (action.movement) return this.getLaunchCells(fighter, action, origin)
    if (action.target === "emptyCell") {
      return this.getLaunchCells(fighter, action, origin).filter((p) =>
        this.targetMatches(fighter, action, p, origin),
      )
    }
    // the target must hold a fighter (or be the origin): only test those
    // cells, in the same row-major order as the launch zone
    const seen = new Set<string>()
    const candidates: Point[] = []
    for (const p of [origin, ...this.aliveFighters.map((f) => f.position)]) {
      const key = keyOf(p)
      if (seen.has(key)) continue
      seen.add(key)
      candidates.push(p)
    }
    candidates.sort((a, b) => a.y - b.y || a.x - b.x)
    return candidates.filter(
      (p) =>
        this.inLaunchZone(
          action,
          origin,
          p,
          this.adventure?.debate?.rangeBonus(fighter, p) ?? 0,
        ) &&
        this.targetMatches(fighter, action, p, origin) &&
        !this.board.glassBetween(origin, p) &&
        (!action.lineOfSight || this.board.hasLineOfSight(origin, p)),
    )
  }

  getAreaCells(action: ActionDefinition, target: Point): Point[] {
    return zoneCells(target, action.area ?? POINT).filter((p) =>
      this.board.inBounds(p),
    )
  }

  affectFilter(action: ActionDefinition): AffectFilter {
    if (action.affects) return action.affects
    switch (action.target) {
      case "ally":
      case "self":
        return "allies"
      case "any":
        return "all"
      default:
        return "enemies"
    }
  }

  getAffectedFighters(
    fighter: Fighter,
    action: ActionDefinition,
    target: Point,
  ): Fighter[] {
    const filter = this.affectFilter(action)
    const area = action.area ?? POINT
    return this.aliveFighters.filter((o) => {
      if (!inZone(target, o.position, area)) return false
      if (filter === "all") return true
      return filter === "enemies"
        ? this.isEnemy(fighter, o)
        : !this.isEnemy(fighter, o)
    })
  }

  /**
   * Actions available to a fighter standing on `origin`: its own actions,
   * plus one combined action per ally sharing that cell.
   */
  actionsOf(
    fighter: Fighter,
    origin: Point = fighter.position,
  ): ActionDefinition[] {
    const partners = this.fightersAt(origin).filter(
      (o) => o !== fighter && !this.isEnemy(fighter, o),
    )
    // only the catalogue's signature actions have combined versions
    const owner = this.presetOf(fighter)
    const combos = ACTIONS[owner.actions[0]]
      ? partners.map((partner) => comboAction(owner, this.presetOf(partner)))
      : []
    // two identical partners give the same combo once
    const unique = combos.filter(
      (c, i) => combos.findIndex((o) => o.id === c.id) === i,
    )
    // the forbidden spell exists only in the Adventure
    const own = this.adventure
      ? fighter.actions
      : fighter.actions.filter((a) => !isVacuumDecay(a))
    return [...own, ...unique]
  }

  isOnCooldown(fighter: Fighter, action: ActionDefinition) {
    return (fighter.cooldowns[action.id] ?? 0) > 0
  }

  /** Damage before critical hits and randomness. */
  estimateDamage(
    source: Fighter | null,
    target: Fighter,
    kind: "physical" | "magical",
    power: number,
  ) {
    const attack = source
      ? source.stats[kind === "physical" ? "physicalAttack" : "magicalAttack"]
      : 0
    const defense =
      target.stats[kind === "physical" ? "physicalDefense" : "magicalDefense"]
    const dealt = source
      ? source.statuses.reduce(
          (m, s) => m * (STATUSES[s.id].damageDealtMultiplier ?? 1),
          1,
        )
      : 1
    const taken = target.statuses.reduce(
      (m, s) => m * (STATUSES[s.id].damageTakenMultiplier ?? 1),
      1,
    )
    const raw = power * (1 + attack / 10) * (10 / (10 + defense))
    return Math.max(1, Math.round(raw * dealt * taken))
  }

  estimateHeal(source: Fighter, power: number) {
    return Math.round(power * (1 + source.stats.magicalAttack / 10))
  }

  // ─── Simulation ───────────────────────────────────────────────────────────

  /**
   * Process the next timeline event (a step or an action turn).
   * AI turns are resolved immediately. Returns the produced events.
   */
  advance(): FightEvent[] {
    if (this._state !== "running") return []
    this._begun = true

    const next = this._nextEvent()
    if (!next) {
      this._end(null)
      return this._flush()
    }

    this._advanceTime(next.at)
    // the clock itself may have ended the fight (time up, swallowed)
    if ((this._state as CombatState) === "ended") return this._flush()

    if (next.kind === "move") this._step(next.fighter)
    else this._startTurn(next.fighter)

    return this._flush()
  }

  /** Advance until a human must play or the fight ends. */
  run(maxIterations = 10_000): FightEvent[] {
    const events: FightEvent[] = []
    for (let i = 0; i < maxIterations && this._state === "running"; i++) {
      events.push(...this.advance())
    }
    return events
  }

  private _nextEvent() {
    let best: { kind: "move" | "turn"; fighter: Fighter; at: number } | null =
      null

    const consider = (kind: "move" | "turn", fighter: Fighter, at: number) => {
      if (
        !best ||
        at < best.at ||
        (at === best.at && kind === "move" && best.kind === "turn")
      ) {
        best = { kind, fighter, at }
      }
    }

    for (const fighter of this.aliveFighters) {
      if (fighter.path.length > 0) consider("move", fighter, fighter.nextMoveAt)
      consider("turn", fighter, fighter.nextActionAt)
    }

    return best as {
      kind: "move" | "turn"
      fighter: Fighter
      at: number
    } | null
  }

  private _step(fighter: Fighter) {
    let next = fighter.path[0]

    if (
      manhattan(fighter.position, next) !== 1 ||
      !this.board.canStep(fighter.position, next, fighter.locomotion) ||
      !this.canEnter(fighter, next)
    ) {
      const path = this._route(fighter, fighter.position, fighter.waypoints)

      if (!path || path.length === 0) {
        this._clearWalk(fighter)
        this._emit({ type: "pathBlocked", fighterId: fighter.id })
        return
      }

      fighter.path = path
      next = path[0]
    }

    const from = fighter.position
    fighter.position = next
    fighter.path.shift()
    if (fighter.waypoints.length && equals(next, fighter.waypoints[0]))
      fighter.waypoints.shift()
    if (fighter.path.length === 0) fighter.waypoints = []
    fighter.nextMoveAt = this._time + this.stepDelay(fighter, from, next)
    this._emit({ type: "moved", fighterId: fighter.id, from, to: next })
  }

  private _startTurn(fighter: Fighter) {
    this._activeFighter = fighter
    this._emit({ type: "turnStarted", fighterId: fighter.id, time: this._time })

    // statuses
    for (const status of [...fighter.statuses]) {
      if (STATUSES[status.id].damageOverTime) {
        this._applyDamage(fighter, status.value, null, false)
        if (!fighter.alive) break
      }
    }

    if (!fighter.alive) {
      this._activeFighter = null
      return
    }

    const silence = this.adventure?.turnStart(fighter) ?? 0
    if (silence > 0) this._applyDamage(fighter, silence, null, false)

    if (!fighter.alive || this.departed.has(fighter.id)) {
      this._activeFighter = null
      return
    }

    for (const status of [...fighter.statuses]) {
      status.turns--
      if (status.turns <= 0) this._removeStatus(fighter, status.id)
    }

    for (const id of Object.keys(fighter.cooldowns)) {
      fighter.cooldowns[id] = Math.max(0, fighter.cooldowns[id] - 1)
    }

    if (this.adventure?.frozenTurn(fighter)) {
      // frozen: the turn goes by
      this._emit({ type: "frozenTurn", fighterId: fighter.id })
      this._endTurn(fighter, this.baseDelay(fighter))
      return
    }

    if (fighter.controller === "ai") {
      this._playAi(fighter)
    } else if (this.adventure?.playsAlone(fighter)) {
      // an ally with a will of its own: it plays this turn without the Ghom
      this._emit({ type: "autonomous", fighterId: fighter.id, why: "tier" })
      this._playAi(fighter, false)
    } else {
      this._state = "awaitingInput"
    }
  }

  /** `divine: false`: the fighter acts alone, the Ghom's Élan is not spent. */
  private _playAi(fighter: Fighter, divine = true) {
    if (this.adventure?.isSettled(fighter)) return this._pass(fighter)
    if (this.adventure?.isMute(fighter.team)) divine = false
    const scripted = this.adventure?.script.hasScript(fighter) ?? false
    if (this.holding.has(fighter.team) && !scripted) {
      // a neutral team only breaks the crystals it was set to break
      const raid = this.adventure?.crystals
      if (raid?.raid(fighter)) {
        this._finishCrystal(fighter, raid.cost("extract"))
        return
      }
      return this._pass(fighter)
    }
    if (this.adventure?.sink(fighter)) return
    this.adventure?.breakOff(fighter)
    if (this.adventure?.fleeing.has(fighter.id)) {
      this.adventure.playFlee(fighter)
      if (!this.adventure.fleeBlocked) {
        if (this._activeFighter === fighter && this._state === "running") {
          this._pass(fighter)
        }
        return
      }
    }
    const plan = scripted ? this.adventure?.script.command(fighter) : null
    const raid = this.adventure?.crystals
    if (!plan && raid?.raid(fighter)) {
      this._finishCrystal(fighter, raid.cost("extract"))
      return
    }
    const spell = divine && !plan ? decideDivine(this, fighter) : null
    if (spell) this._useDivine(fighter.team, spell.divineId, spell.target)
    if (this._state === "ended") return

    const commands: AiCommand[] =
      plan ??
      (this.holding.has(fighter.team)
        ? [{ type: "pass" }]
        : decide(this, fighter))
    for (const command of commands) {
      if (this._activeFighter !== fighter) break
      switch (command.type) {
        case "move":
          this._moveTo(fighter, command.destination)
          break
        case "action":
          this._useAction(fighter, command.actionId, command.target)
          break
        case "survey": {
          const debate = this.adventure?.debate
          if (debate && !debate.survey(fighter, command.target))
            this._finishCrystal(fighter, debate.surveyTime)
          break
        }
        case "pass":
          this._pass(fighter)
          break
      }
    }
    if (this._activeFighter === fighter && this._state === "running") {
      this._pass(fighter)
    }
  }

  private _endTurn(fighter: Fighter, delay: number) {
    fighter.nextActionAt = this._time + delay
    this._activeFighter = null
    if (this._state === "awaitingInput") this._state = "running"
  }

  // ─── Commands (human input) ───────────────────────────────────────────────

  private _checkInput(): Fighter | string {
    if (this._state === "ended") return "Le combat est terminé"
    if (this._state !== "awaitingInput" || !this._activeFighter)
      return "Aucun personnage n'attend d'ordre"
    return this._activeFighter
  }

  private _result(error?: string): CommandResult {
    if (error) {
      this._events = []
      return { ok: false, reason: error }
    }
    return { ok: true, events: this._flush() }
  }

  /**
   * Plan a walk for the active fighter. Free: does not end the turn. With
   * `append`, the destination becomes one more stop after the planned walk
   * (to make it go one way rather than another).
   */
  moveTo(destination: Point, append = false): CommandResult {
    const fighter = this._checkInput()
    if (typeof fighter === "string") return this._result(fighter)
    const command: Command = {
      type: "moveTo",
      fighterId: fighter.id,
      destination: { ...destination },
    }
    if (append) command.append = true
    const blocked = this._autonomyGate(fighter, command, {
      type: "move",
      destination,
      append,
    })
    if (blocked) return blocked
    return this._logged(command, this._moveTo(fighter, destination, append))
  }

  /**
   * Adventure: extract / detach / carry / deposit a crystal, lay it as a bridge,
   * freeze or thaw. Ends the turn like an action.
   */
  crystal(op: CrystalOp, target: Point, gain: CrystalGain = "elan") {
    const fighter = this._checkInput()
    if (typeof fighter === "string") return this._result(fighter)
    const command: Command = {
      type: "crystal",
      fighterId: fighter.id,
      op,
      target: { ...target },
    }
    if (gain !== "elan") command.gain = gain
    if (this.adventure?.pending) return this._result(WAITING_FOR_GHOM)
    const kit = this.adventure?.crystals
    if (!kit) return this._result("Pas de cristaux ici")
    const error = kit.operate(fighter, op, target, gain)
    if (error) return this._result(error)
    this._finishCrystal(fighter, kit.cost(op))
    return this._logged(command, null)
  }

  private _finishCrystal(fighter: Fighter, cost: number) {
    if (this._state === "ended") {
      this._activeFighter = null
      return
    }
    this._endTurn(
      fighter,
      this.baseDelay(fighter) * cost * this.delayMultiplier(fighter),
    )
  }

  /** Use an action. Ends the turn and adds its cost to the timeline. */
  useAction(actionId: string, target: Point): CommandResult {
    const fighter = this._checkInput()
    if (typeof fighter === "string") return this._result(fighter)
    const command: Command = {
      type: "useAction",
      fighterId: fighter.id,
      actionId,
      target: { ...target },
    }
    const blocked = this._autonomyGate(fighter, command, {
      type: "action",
      actionId,
      target: { ...target },
    })
    if (blocked) return blocked
    return this._logged(command, this._useAction(fighter, actionId, target))
  }

  /** End the turn: plays again just after the next fighter. */
  pass(): CommandResult {
    const fighter = this._checkInput()
    if (typeof fighter === "string") return this._result(fighter)
    if (this.adventure?.pending) return this._result(WAITING_FOR_GHOM)
    this.adventure?.ordered(fighter)
    this._pass(fighter)
    return this._logged({ type: "pass", fighterId: fighter.id }, null)
  }

  /**
   * Autonomy: an ally may refuse an order. A refused order is cancelled with
   * no time spent (and logged, so a replay refuses it again); the Ghom must
   * then let the ally act (`letAct`) or force it (`insist`). Returns the
   * result to hand back when the order does not go through.
   */
  private _autonomyGate(
    fighter: Fighter,
    command: Command,
    order: AutonomyOrder,
  ): CommandResult | null {
    const adventure = this.adventure
    if (!adventure) return null
    if (adventure.pending) return this._result(WAITING_FOR_GHOM)
    const reason = adventure.refuse(fighter, order)
    if (reason) {
      this._emit({ type: "refused", fighterId: fighter.id, reason })
      return this._logged(command, null)
    }
    adventure.ordered(fighter)
    return null
  }

  /** The order the active ally refused, if the Ghom has not answered yet. */
  get refusal() {
    return this.adventure?.pending ?? null
  }

  /**
   * "Laisser agir" (or "Respecter" after a refusal): the active ally plays
   * its turn by itself, with the AI of the skirmishes. Always possible.
   */
  letAct(): CommandResult {
    const fighter = this._checkInput()
    if (typeof fighter === "string") return this._result(fighter)
    const adventure = this.adventure
    if (!adventure?.rules.autonomy) return this._result("Pas d'Autonomie ici")
    adventure.letAct(fighter)
    this._emit({ type: "autonomous", fighterId: fighter.id, why: "letAct" })
    this._state = "running"
    this._playAi(fighter, false)
    return this._logged({ type: "letAct", fighterId: fighter.id }, null)
  }

  /**
   * "Insister": forces the order the ally refused. Costs Élan; the ally
   * obeys (the story pays the trust).
   */
  insist(): CommandResult {
    const fighter = this._checkInput()
    if (typeof fighter === "string") return this._result(fighter)
    const adventure = this.adventure
    const pending = adventure?.pending
    if (!adventure || !pending || pending.fighterId !== fighter.id)
      return this._result("Aucun refus auquel insister")
    const team = this.teams[fighter.team]
    const cost = adventure.insistCost
    if (team.energy < cost) return this._result("Pas assez d'énergie divine")
    const { order } = pending
    const error =
      order.type === "move"
        ? this._moveTo(fighter, order.destination, order.append)
        : this._useAction(fighter, order.actionId, order.target)
    if (error) return this._result(error)
    team.energy -= cost
    adventure.insisted(fighter)
    this._emit({ type: "energyChanged", team: team.index, energy: team.energy })
    this._emit({ type: "insisted", fighterId: fighter.id, cost })
    return this._logged({ type: "insist", fighterId: fighter.id }, null)
  }

  /**
   * "Argumenter": the hero answers the speaker. A good argument lowers the
   * Certitude; at 0 nobody wins. Ends the turn quickly (time 0.5).
   */
  argue(argumentId: string): CommandResult {
    const fighter = this._checkInput()
    if (typeof fighter === "string") return this._result(fighter)
    const debate = this.adventure?.debate
    if (!debate) return this._result("Pas de discussion ici")
    if (this.adventure?.pending) return this._result(WAITING_FOR_GHOM)
    const error = debate.argue(fighter, argumentId)
    if (error) return this._result(error)
    if (debate.report.convinced) this._end(null)
    else this._finishCrystal(fighter, debate.argumentTime)
    return this._logged(
      { type: "argue", fighterId: fighter.id, argumentId },
      null,
    )
  }

  /** "Se retirer": the Ghom lets go, the fight stops with no winner. */
  withdraw(): CommandResult {
    const fighter = this._checkInput()
    if (typeof fighter === "string") return this._result(fighter)
    const adventure = this.adventure
    if (!adventure?.rules.withdraw)
      return this._result("Impossible de se retirer")
    adventure.report.autonomy.withdrawn = true
    this._emit({ type: "withdrew" })
    this._end(null)
    return this._logged({ type: "withdraw", fighterId: fighter.id }, null)
  }

  /** Divine (player) action of the active fighter's team. Free. */
  useDivine(divineId: string, target: Point | null = null): CommandResult {
    const fighter = this._checkInput()
    if (typeof fighter === "string") return this._result(fighter)
    return this._logged(
      {
        type: "useDivine",
        fighterId: fighter.id,
        divineId,
        target: target && { ...target },
      },
      this._useDivine(fighter.team, divineId, target),
    )
  }

  /**
   * Run a serialized command (network, replays). It must come from the
   * fighter whose turn it is.
   */
  execute(command: Command): CommandResult {
    const active = this._activeFighter
    if (
      this._state === "awaitingInput" &&
      active &&
      active.id !== command.fighterId
    ) {
      return this._result("Ce n'est pas le tour de ce personnage")
    }
    switch (command.type) {
      case "moveTo":
        return this.moveTo(command.destination, command.append)
      case "useAction":
        return this.useAction(command.actionId, command.target)
      case "pass":
        return this.pass()
      case "letAct":
        return this.letAct()
      case "insist":
        return this.insist()
      case "withdraw":
        return this.withdraw()
      case "argue":
        return this.argue(command.argumentId)
      case "crystal":
        return this.crystal(command.op, command.target, command.gain)
      case "useDivine":
        return this.useDivine(command.divineId, command.target)
    }
  }

  /** Every accepted command, in order: enough to replay the fight. */
  get log(): readonly Command[] {
    return this._log
  }

  /**
   * Rebuild a fight from its options and its command log. The engine is
   * deterministic, so the result is identical to the original fight.
   */
  static replay(options: CombatOptions, commands: readonly Command[]): Combat {
    const combat = new Combat(options)
    for (const [index, command] of commands.entries()) {
      combat.run()
      const result = combat.execute(command)
      if (!result.ok) {
        throw new Error(`Replay failed at command ${index}: ${result.reason}`)
      }
    }
    combat.run()
    return combat
  }

  private _logged(command: Command, error: string | null): CommandResult {
    if (error) return this._result(error)
    this._log.push(command)
    return this._result()
  }

  /** Movement action: walk the path right away, pay its time, end the turn. */
  private _sprint(
    fighter: Fighter,
    action: ActionDefinition,
    target: Point,
  ): string | null {
    const path = this.movementPaths(fighter, action.movement!.reach).get(
      keyOf(target),
    )
    if (!path) return "Cible hors de portée"
    this._emit({
      type: "actionUsed",
      fighterId: fighter.id,
      actionId: action.id,
      baseActionId: action.id,
      partnerId: null,
      target,
      cells: [...path],
    })
    // a planned walk is replaced by the sprint
    this._clearWalk(fighter)
    let time = 0
    for (const next of path) {
      const from = fighter.position
      time += this.stepDelay(fighter, from, next)
      fighter.position = next
      this._emit({ type: "moved", fighterId: fighter.id, from, to: next })
    }
    fighter.nextMoveAt = this._time
    if (action.cooldown) fighter.cooldowns[action.id] = action.cooldown + 1
    this._endTurn(fighter, time)
    return null
  }

  /**
   * Own turns a duration amounts to for a fighter: how many of its turns
   * (one turn = its base delay, with its current statuses) pass meanwhile.
   */
  turnsFor(fighter: Fighter, time: number) {
    const turn = this.baseDelay(fighter) * this.delayMultiplier(fighter)
    return Math.max(1, Math.ceil(time / turn - 1e-9))
  }

  /** The same duration in actions of the fighter (1 = a basic action). */
  actionsFor(fighter: Fighter, time: number) {
    return time / (this.baseDelay(fighter) * this.delayMultiplier(fighter))
  }

  /**
   * When each step of a fighter's planned walk happens: the first at its
   * next move, then each after the time the previous one cost. `path`:
   * another walk to time instead (a preview).
   */
  stepTimes(fighter: Fighter, path: readonly Point[] = fighter.path): number[] {
    const times: number[] = []
    let at = Math.max(fighter.nextMoveAt, this._time)
    let from = fighter.position
    for (const to of path) {
      times.push(at)
      at += this.stepDelay(fighter, from, to)
      from = to
    }
    return times
  }

  /** Time a movement action would take along a path (HUD previews). */
  movementTime(fighter: Fighter, path: readonly Point[]) {
    let time = 0
    let from = fighter.position
    for (const next of path) {
      time += this.stepDelay(fighter, from, next)
      from = next
    }
    return time
  }

  /**
   * Walk planned through `waypoints` from `from`: the shortest path to each
   * stop in turn (null when one of them cannot be reached).
   */
  private _route(fighter: Fighter, from: Point, waypoints: readonly Point[]) {
    const route: Point[] = []
    let start = from
    for (const stop of waypoints) {
      if (equals(stop, start)) continue
      const leg = this.board.findPath(
        start,
        stop,
        (p) => this.canEnter(fighter, p),
        fighter.locomotion,
      )
      if (!leg) return null
      route.push(...leg)
      start = stop
    }
    return route
  }

  /**
   * The walk a `moveTo` would plan, without planning it (HUD previews):
   * the whole path, through the planned stops when appending.
   */
  planWalk(fighter: Fighter, destination: Point, append = false) {
    const stops = append ? [...fighter.waypoints, destination] : [destination]
    return this._route(fighter, fighter.position, stops)
  }

  private _clearWalk(fighter: Fighter) {
    fighter.waypoints = []
    fighter.path = []
  }

  private _moveTo(
    fighter: Fighter,
    destination: Point,
    append = false,
  ): string | null {
    if (!append && equals(destination, fighter.position)) {
      this._clearWalk(fighter)
      this._emit({ type: "destinationSet", fighterId: fighter.id, path: [] })
      return null
    }

    const waypoints = append
      ? [...fighter.waypoints, destination]
      : [destination]
    const path = this._route(fighter, fighter.position, waypoints)
    if (!path) return "Destination inaccessible"
    if (path.length === 0) return null

    fighter.waypoints = waypoints.map((p) => ({ ...p }))
    fighter.path = path
    fighter.nextMoveAt = Math.max(fighter.nextMoveAt, this._time)
    this._emit({
      type: "destinationSet",
      fighterId: fighter.id,
      path: [...path],
    })
    return null
  }

  /**
   * Move the clock forward. Divine energy flows with time (it cannot be
   * farmed by multiplying short turns): every team still in the fight gains
   * 1 every ENERGY_PERIOD, faster for each fallen ally (catch-up).
   */
  private _advanceTime(to: number) {
    const elapsed = Math.max(0, to - this._time)
    this._time += elapsed
    if (elapsed === 0) return
    this.adventure?.advance(this._time)
    for (const team of this.teams) {
      const members = this.fighters.filter((f) => f.team === team.index)
      const fallen = members.filter((f) => !f.alive).length
      if (fallen === members.length) continue
      if (this.adventure?.energy && !this.adventure.energy.flows(team.index))
        continue
      if (team.energy >= MAX_ENERGY) {
        team.energyProgress = 0
        continue
      }
      team.energyProgress += elapsed * this.energyRate(team.index)
      const gained = Math.floor(team.energyProgress)
      if (gained > 0) {
        team.energyProgress -= gained
        this._gainEnergy(team.index, gained)
      }
    }
  }

  /** Energy points a team gains per unit of timeline time. */
  energyRate(team: number) {
    const fallen = this.fighters.filter((f) => f.team === team && !f.alive)
    return (1 + ENERGY_CATCH_UP * fallen.length) / ENERGY_PERIOD
  }

  /**
   * Passing ends the turn just after the next *opponent* (never after an
   * ally: allies could otherwise hand the turn to each other forever).
   */
  private _pass(fighter: Fighter) {
    const delay = this.passDelay(fighter)
    this._emit({ type: "turnPassed", fighterId: fighter.id })
    this._endTurn(fighter, delay)
  }

  /** Time until the fighter's next turn if it passed now. */
  passDelay(fighter: Fighter) {
    const enemies = this.aliveFighters.filter((f) => this.isEnemy(fighter, f))
    const others = enemies.length
      ? enemies
      : this.aliveFighters.filter((f) => f !== fighter)
    const nextOther = others.length
      ? Math.min(...others.map((f) => f.nextActionAt))
      : this._time
    const max = this.baseDelay(fighter) * this.delayMultiplier(fighter)
    return Math.min(max, Math.max(1, nextOther + 1 - this._time))
  }

  /**
   * Time until the fighter's next turn if it did this now (HUD previews of
   * where it lands on the timeline). For a movement action without a
   * target: its longest reachable sprint. null: not possible.
   */
  turnDelayOf(
    fighter: Fighter,
    choice:
      | { type: "pass" }
      | { type: "action"; actionId: string; target?: Point | null },
  ): number | null {
    if (choice.type === "pass") return this.passDelay(fighter)
    const action = this.actionsOf(fighter).find((a) => a.id === choice.actionId)
    if (!action) return null
    if (action.movement) {
      const paths = this.movementPaths(fighter, action.movement.reach)
      if (choice.target) {
        const path = paths.get(keyOf(choice.target))
        return path ? this.movementTime(fighter, path) : null
      }
      let longest: number | null = null
      for (const path of paths.values()) {
        const time = this.movementTime(fighter, path)
        if (longest === null || time > longest) longest = time
      }
      return longest
    }
    return (
      this.baseDelay(fighter) * action.timeCost * this.delayMultiplier(fighter)
    )
  }

  private _useAction(
    fighter: Fighter,
    actionId: string,
    target: Point,
  ): string | null {
    const action = this.actionsOf(fighter).find((a) => a.id === actionId)
    if (!action) return "Action inconnue"
    if (isVacuumDecay(action) && !this.adventure)
      return "Sort interdit hors de l'Aventure"
    if (this.isOnCooldown(fighter, action)) return "Action en recharge"
    if (!this.getLaunchCells(fighter, action).some((p) => equals(p, target)))
      return "Cible hors de portée"
    if (!this.targetMatches(fighter, action, target)) return "Cible invalide"

    if (action.movement) return this._sprint(fighter, action, target)

    const affected = this.getAffectedFighters(fighter, action, target)

    this._emit({
      type: "actionUsed",
      fighterId: fighter.id,
      actionId,
      baseActionId: action.combo?.baseId ?? action.id,
      partnerId: action.combo
        ? (this.fightersAt(fighter.position).find(
            (o) =>
              o !== fighter && o.presetId === action.combo!.partnerPresetId,
          )?.id ?? null)
        : null,
      target,
      cells: this.getAreaCells(action, target),
    })

    for (const effect of action.effects) {
      this._applyEffect(fighter, effect, affected, target)
      if (this._state === "ended") break
    }

    if (action.cooldown) fighter.cooldowns[action.id] = action.cooldown + 1

    if (this._state !== "ended") {
      this._endTurn(
        fighter,
        this.baseDelay(fighter) *
          action.timeCost *
          this.delayMultiplier(fighter),
      )
    } else {
      this._activeFighter = null
    }
    return null
  }

  private _applyEffect(
    fighter: Fighter,
    effect: Effect,
    affected: Fighter[],
    target: Point,
  ) {
    const alive = () => affected.filter((f) => f.alive)

    switch (effect.type) {
      case "damage":
        for (const o of alive()) {
          const critical = this.rng.chance(this.critChance(fighter))
          const base = this.estimateDamage(
            fighter,
            o,
            effect.kind,
            effect.power,
          )
          this._applyDamage(
            o,
            critical ? Math.round(base * 1.5) : base,
            fighter.id,
            critical,
          )
        }
        break

      case "heal":
        for (const o of alive())
          this._heal(o, this.estimateHeal(fighter, effect.power))
        break

      case "push":
        for (const o of alive())
          if (o !== fighter) this._push(fighter, o, effect.distance)
        break

      case "status":
        for (const o of alive())
          this._addStatus(o, effect.status, effect.turns, effect.value ?? 0)
        break

      case "raise": {
        const cell = this.board.get(target)
        if (!cell || this.fightersAt(target).length > 0) break
        cell.elevation = Math.min(MAX_ELEVATION, cell.elevation + effect.height)
        this._regions.clear()
        this._emit({ type: "terrainChanged", cell: { ...target } })
        break
      }

      case "dash": {
        const from = fighter.position
        fighter.position = target
        this._clearWalk(fighter)
        this._emit({ type: "dashed", fighterId: fighter.id, from, to: target })
        break
      }

      case "delay":
        for (const o of alive()) {
          o.nextActionAt += effect.amount
          this._emit({
            type: "delayed",
            fighterId: o.id,
            amount: effect.amount,
          })
        }
        break

      case "selfHeal":
        if (fighter.alive)
          this._heal(fighter, this.estimateHeal(fighter, effect.power))
        break
      case "vacuumDecay":
        this._collapsed = true
        this._emit({ type: "vacuumDecay", fighterId: fighter.id })
        this._end(null)
        break
    }
  }

  private _useDivine(
    team: number,
    divineId: string,
    target: Point | null,
  ): string | null {
    const divine = DIVINE_ACTIONS[divineId]
    if (!divine) return "Action divine inconnue"
    if (this.adventure?.locked.has(divineId))
      return "Influence pas encore connue"
    if (this.adventure?.energy?.halted(team)) return HALT_MESSAGE
    const teamState = this.teams[team]
    if (teamState.energy < divine.cost) return "Pas assez d'énergie divine"

    switch (divine.id) {
      case "timeWarp": {
        if (!target) return "Cible requise"
        const fighter = this.fightersAt(target)[0]
        if (!fighter) return "Aucun personnage ici"
        const amount =
          fighter.team === team
            ? -Math.min(TIME_WARP_AMOUNT, fighter.nextActionAt - this._time)
            : TIME_WARP_AMOUNT
        fighter.nextActionAt += amount
        this._emit({ type: "delayed", fighterId: fighter.id, amount })
        break
      }

      case "earthquake": {
        if (!target) return "Cible requise"
        const error = this.quake(target)
        if (error) return error
        break
      }

      case "blessing":
        for (const f of this.aliveFighters.filter((f) => f.team === team)) {
          this._heal(f, BLESSING_HEAL)
        }
        break
    }

    teamState.energy -= divine.cost
    this._emit({ type: "energyChanged", team, energy: teamState.energy })
    this._emit({ type: "divineUsed", team, divineId, target })
    return null
  }

  // ─── Effects ──────────────────────────────────────────────────────────────

  private _applyDamage(
    target: Fighter,
    amount: number,
    sourceId: string | null,
    critical: boolean,
  ) {
    if (this.adventure?.isImmune(target)) amount = 0
    let absorbed = 0
    const shield = target.statuses.find((s) => STATUSES[s.id].absorbsDamage)
    if (shield) {
      absorbed = Math.min(shield.value, amount)
      shield.value -= absorbed
      if (shield.value <= 0) this._removeStatus(target, shield.id)
    }

    target.hp = Math.max(0, target.hp - (amount - absorbed))
    if (this.adventure?.rules.noDefeat?.includes(target.team)) {
      target.hp = Math.max(1, target.hp)
    }
    if (this.adventure?.isSpared(target)) target.hp = Math.max(1, target.hp)
    // erosion: part of every wound can never be healed (fights always end)
    target.erosion += (amount - absorbed) * EROSION
    target.hp = Math.min(target.hp, this.maxHp(target))
    this._emit({
      type: "damaged",
      fighterId: target.id,
      amount: amount - absorbed,
      absorbed,
      critical,
      sourceId,
    })

    if (target.hp > 0) this.adventure?.wounded(target)

    if (target.hp <= 0) {
      target.alive = false
      this._clearWalk(target)
      target.statuses = []
      this._emit({ type: "died", fighterId: target.id })
      if (this.adventure?.fixes(target)) this._fix(target)
      // catch-up: the team that loses a fighter gets energy right away
      if (this.aliveFighters.some((f) => f.team === target.team)) {
        this._gainEnergy(target.team, DEATH_ENERGY)
      }
      this._checkVictory()
    }
  }

  /** A fallen Lacunaire hardens into a rock where it stood. */
  private _fix(target: Fighter) {
    const cell = this.board.get(target.position)
    if (!cell || cell.elevation >= MAX_ELEVATION) return
    if (this.fightersAt(target.position).length > 0) return
    cell.elevation += 1
    this._regions.clear()
    this.adventure?.fixed(target)
    this._emit({ type: "terrainChanged", cell: { ...target.position } })
  }

  private _heal(target: Fighter, amount: number) {
    const healed = Math.min(amount, this.maxHp(target) - target.hp)
    if (healed <= 0) return
    target.hp += healed
    this._emit({ type: "healed", fighterId: target.id, amount: healed })
  }

  private _push(source: Fighter, target: Fighter, distance: number) {
    const direction = dominantDirection(source.position, target.position)
    if (!direction) return

    const from = target.position
    let position = from
    let remaining = distance
    let fall = 0

    while (remaining > 0) {
      const next = add(position, direction)
      const blocked =
        !this.board.inBounds(next) ||
        this.fightersAt(next).length > 0 ||
        // a cliff face stops the push
        this.board.standHeight(next) - this.board.standHeight(position) >
          MAX_STEP ||
        // walkers cling to the shore of deep water
        !this.board.canStand(next, target.locomotion) ||
        // never push someone where they could never get out
        !this.regionFor(target.locomotion).has(keyOf(next))
      if (blocked) break
      // falling down a ledge hurts, unless landing in water
      const drop =
        this.board.standHeight(position) - this.board.standHeight(next)
      if (drop > MAX_STEP && this.board.get(next)!.terrain !== "water") {
        fall += FALL_DAMAGE * (drop - MAX_STEP)
      }
      position = next
      remaining--
    }

    if (!equals(position, from)) {
      target.position = position
      this._clearWalk(target)
      this._emit({ type: "pushed", fighterId: target.id, from, to: position })
    }

    if (fall > 0) this._applyDamage(target, fall, source.id, false)
    // hitting an obstacle hurts
    if (remaining > 0 && target.alive)
      this._applyDamage(target, COLLISION_DAMAGE * remaining, source.id, false)
  }

  /**
   * Every alive fighter can still reach the main land, the area all
   * walkers share (aquatic fighters may stay in their own waters).
   */
  /**
   * A Séisme on one cell: a low cell rises, a high one collapses. Returns the
   * reason it did not happen, or null (also used by scripted earthquakes).
   */
  quake(target: Point): string | null {
    const cell = this.board.get(target)
    if (!cell) return "Case invalide"
    if (this.fightersAt(target).length > 0) return "La case est occupée"
    if (this.adventure && cell.terrain === "water" && cell.elevation <= -2)
      return "Trop profond."
    const previous = { ...cell }
    // raise low cells, collapse high ones
    const delta = cell.elevation < 1 ? EARTHQUAKE_DELTA : -EARTHQUAKE_DELTA
    cell.elevation = Math.max(
      MIN_ELEVATION,
      Math.min(MAX_ELEVATION, cell.elevation + delta),
    )
    cell.terrain =
      cell.elevation < 0 && previous.terrain === "water" ? "water" : "ground"
    this._regions.clear()
    if (!this._fightersCanMeet()) {
      Object.assign(cell, previous)
      this._regions.clear()
      return "Le terrain serait coupé en deux"
    }
    this._emit({ type: "terrainChanged", cell: { ...target } })
    return null
  }

  /**
   * Adventure recomposition: a fallen fighter stands again at `position`
   * with `hp` hit points, and plays soon.
   */
  reform(fighter: Fighter, position: Point, hp: number) {
    if (fighter.alive || this._state === "ended") return
    fighter.alive = true
    fighter.hp = Math.max(1, Math.min(hp, this.maxHp(fighter)))
    fighter.position = { ...position }
    fighter.statuses = []
    fighter.cooldowns = {}
    this._clearWalk(fighter)
    fighter.nextActionAt = this._time + this.baseDelay(fighter) * 0.65
    this._emit({
      type: "recomposed",
      fighterId: fighter.id,
      position: { ...position },
    })
  }

  private _fightersCanMeet() {
    const land = this.board.mainRegion("walker")
    return this.aliveFighters.every((f) => {
      if (land.has(keyOf(f.position))) return true
      for (const key of this.board.regionOf(f.position, f.locomotion)) {
        if (land.has(key)) return true
      }
      return false
    })
  }

  private _addStatus(
    target: Fighter,
    id: StatusId,
    turns: number,
    value: number,
  ) {
    const existing = target.statuses.find((s) => s.id === id)
    if (existing) {
      existing.turns = Math.max(existing.turns, turns)
      existing.value = Math.max(existing.value, value)
    } else {
      target.statuses.push({ id, turns, value })
    }
    this._emit({
      type: "statusApplied",
      fighterId: target.id,
      status: id,
      turns,
    })
  }

  private _removeStatus(target: Fighter, id: StatusId) {
    target.statuses = target.statuses.filter((s) => s.id !== id)
    this._emit({ type: "statusExpired", fighterId: target.id, status: id })
  }

  private _gainEnergy(team: number, amount: number) {
    if (this.adventure?.energy?.halted(team)) return
    const state = this.teams[team]
    const energy = Math.min(MAX_ENERGY, state.energy + amount)
    if (energy !== state.energy) {
      state.energy = energy
      this._emit({ type: "energyChanged", team, energy })
    }
  }

  private _checkVictory() {
    // a team still to come is not beaten
    const waiting = this.fighters.filter(
      (f) =>
        (f.alive && this.offstage.has(f.id)) ||
        (!f.alive && this.adventure?.script.pending(f)),
    )
    const teams = new Set(
      [...this.aliveFighters, ...waiting]
        .filter((f) => !this.adventure?.isNeutral(f.team))
        .map((f) => f.team),
    )
    if (teams.size <= 1) this._end(teams.size === 1 ? [...teams][0] : null)
  }

  private _end(winnerTeam: number | null) {
    if (this._state === "ended") return
    this._state = "ended"
    this._winnerTeam = winnerTeam
    this._activeFighter = null
    this._emit({ type: "ended", winnerTeam })
  }

  // ─── Placement ────────────────────────────────────────────────────────────

  /**
   * Two teams face each other: the second at the back of the island (the
   * cells nearest to the 0,0 corner, the top of the screen), on random
   * cells; the first on their mirror cells, the same terrain by the
   * island's symmetry. Every cell takes any fighter (no deep water, the
   * main walkable area). Both teams get as many cells as the larger one.
   */
  private _lineUp(options: CombatOptions): Point[][] | null {
    if (options.teams.length !== 2) return null
    const { width, height } = this.board
    const mirror = (p: Point) => ({
      x: width - 1 - p.x,
      y: height - 1 - p.y,
    })
    const region = this.walkableRegion
    const taken = new Set((options.positions ?? []).flat().map(keyOf))
    const free = (p: Point) => region.has(keyOf(p)) && !taken.has(keyOf(p))
    const depth = width + height - 2
    const back = this.board.cells.filter(
      (c) => c.x + c.y < depth / 2 && free(c) && free(mirror(c)),
    )
    const count = Math.max(...options.teams.map((t) => t.fighters.length))
    // the farthest back that leaves some choice
    const pool =
      [0.3, 0.35, 0.4, 0.45]
        .map((k) => back.filter((c) => c.x + c.y <= depth * k))
        .find((cells) => cells.length >= count * 2) ?? back
    const left = pool.map((c) => ({ x: c.x, y: c.y }))
    const enemy: Point[] = []
    while (enemy.length < count && left.length > 0)
      enemy.push(left.splice(this._spawnRng.int(0, left.length - 1), 1)[0])
    if (enemy.length < count) return null
    return [enemy.map(mirror), enemy]
  }

  /** Cells a team may start on (empty when the fight has no line-up). */
  slotsOf(team: number): readonly Point[] {
    return this._slots[team] ?? []
  }

  /** The fight has not started yet: a team may still be arranged. */
  get begun() {
    return this._begun
  }

  /** Every fighter's cell, by team: the `positions` to replay this line-up. */
  get positions(): Point[][] {
    return this.teams.map((t) =>
      this.fighters
        .filter((f) => f.team === t.index)
        .map((f) => ({ ...f.position })),
    )
  }

  /**
   * Before the fight starts, puts a team's fighters (in their order) on
   * these cells, chosen among the team's slots, one each.
   */
  arrange(team: number, cells: readonly Point[]): string | null {
    if (this._begun) return "Le combat a déjà commencé"
    const fighters = this.fighters.filter((f) => f.team === team)
    const slots = new Set(this.slotsOf(team).map(keyOf))
    const keys = cells.map(keyOf)
    if (cells.length !== fighters.length) return "Une case par personnage"
    if (new Set(keys).size !== keys.length) return "Une case chacun"
    if (keys.some((k) => !slots.has(k))) return "Hors des cases de départ"
    fighters.forEach((f, i) => {
      f.position = { x: cells[i].x, y: cells[i].y }
    })
    return null
  }

  /** Random spawn on the team's side, at least 4 cells away from enemies. */
  private _randomSpawn(team: number): Point {
    const { width, height } = this.board
    const third = Math.max(1, Math.floor(width / 3))
    const inSide = (p: Point) => {
      switch (team) {
        case 0:
          return p.x < third
        case 1:
          return p.x >= width - third
        case 2:
          return p.y < Math.max(1, Math.floor(height / 3))
        default:
          return p.y >= height - Math.max(1, Math.floor(height / 3))
      }
    }

    const region = this.walkableRegion
    const free = this.board.cells.filter(
      (c) =>
        region.has(keyOf(c)) &&
        !this.fighters.some((f) => equals(f.position, c)),
    )
    const farFromEnemies = free.filter((c) =>
      this.fighters.every(
        (f) =>
          f.team === team ||
          manhattan(f.position, c) >= MIN_ENEMY_SPAWN_DISTANCE,
      ),
    )

    const candidates = [
      farFromEnemies.filter(inSide),
      farFromEnemies,
      free,
    ].find((list) => list.length > 0)

    if (!candidates) throw new Error("No room left on the board")
    const cell = this._spawnRng.pick(candidates)
    return { x: cell.x, y: cell.y }
  }

  // ─── Events ───────────────────────────────────────────────────────────────

  private _emit(event: FightEvent) {
    this._events.push(event)
    this.adventure?.observe(event)
  }

  /** Adventure rules emit their own events through this door. */
  emitEvent(event: FightEvent) {
    this._emit(event)
  }

  /** Ends the fight from outside (a clock that ran out). */
  finish(winnerTeam: number | null) {
    this._end(winnerTeam)
  }

  /** An Adventure fighter leaves the island alive (it fled): spared. */
  depart(fighter: Fighter, winnerTeam?: number) {
    this.departed.add(fighter.id)
    this._clearWalk(fighter)
    this._emit({ type: "fled", fighterId: fighter.id })
    this._activeFighter = null
    if (winnerTeam !== undefined) this._end(winnerTeam)
    else this._checkVictory()
  }

  /**
   * One of the two positions of a double (or a fighter swallowed by its own
   * uncertainty) is not there: it leaves the island without a fight.
   */
  dissolve(fighter: Fighter) {
    if (this.departed.has(fighter.id)) return
    this.departed.add(fighter.id)
    this._clearWalk(fighter)
    this._emit({ type: "dissolved", fighterId: fighter.id })
    if (this._activeFighter === fighter) this._activeFighter = null
    this._checkVictory()
  }

  /**
   * Adventure: a cell is set to `level`. A fighter on it takes `damage` when
   * the cell moved by two levels or more. False when nothing changed.
   */
  reshape(target: Point, level: number, damage = 0): boolean {
    const cell = this.board.get(target)
    if (!cell) return false
    const next = Math.max(MIN_ELEVATION, Math.min(MAX_ELEVATION, level))
    const moved = Math.abs(next - cell.elevation)
    if (moved === 0) return false
    cell.elevation = next
    this._regions.clear()
    this._emit({ type: "terrainChanged", cell: { x: target.x, y: target.y } })
    if (damage > 0 && moved >= 2) {
      for (const f of this.fightersAt(target).filter((o) => o.alive))
        this._applyDamage(f, damage, null, false)
    }
    return true
  }

  /**
   * Adventure tide: a fighter left where it cannot stand is carried to the
   * nearest free cell where it can, and loses `delay` of time.
   */
  carry(fighter: Fighter, delay: number): Point | null {
    const at = fighter.position
    const free = this.board.cells
      .filter(
        (c) =>
          this.board.canStand(c, fighter.locomotion) &&
          this.fightersAt(c).filter((o) => o.alive).length === 0 &&
          !this.board.voids.has(`${c.x},${c.y}`),
      )
      .map((c) => ({ x: c.x, y: c.y }))
      .sort(
        (a, b) =>
          Math.abs(a.x - at.x) +
          Math.abs(a.y - at.y) -
          (Math.abs(b.x - at.x) + Math.abs(b.y - at.y)),
      )[0]
    if (!free) return null
    fighter.position = free
    this._clearWalk(fighter)
    fighter.nextActionAt += delay
    this._emit({ type: "carried", fighterId: fighter.id, from: at, to: free })
    this._emit({ type: "delayed", fighterId: fighter.id, amount: delay })
    return free
  }

  /** The terrain changed under the rules (a hole opened or closed). */
  refreshTerrain() {
    this._regions.clear()
  }

  /** Adds Élan to a team (adventure rules). */
  grantEnergy(team: number, amount: number) {
    this._gainEnergy(team, amount)
  }

  /** Heals a fighter (adventure rules). */
  healFighter(target: Fighter, amount: number) {
    this._heal(target, amount)
  }

  /** Plans a walk for an AI fighter (flight). */
  walk(fighter: Fighter, destination: Point) {
    this._moveTo(fighter, destination)
  }

  /** Lets the Ghom use an Influence that was locked. */
  unlockDivine(divineId: string) {
    this.adventure?.locked.delete(divineId)
  }

  private _flush() {
    const events = this._events
    this._events = []
    return events
  }
}
