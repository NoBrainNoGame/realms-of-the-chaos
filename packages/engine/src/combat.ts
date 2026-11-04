import { decide, decideDivine } from "./ai"
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
  STATUSES,
  TIME_WARP_AMOUNT,
} from "./content"
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
  | {
      type: "useDivine"
      fighterId: string
      divineId: string
      target: Point | null
    }

export interface CombatOptions {
  teams: TeamSetup[]
  board?: Board
  seed?: number
  /** Explicit start positions per team (otherwise random placement). */
  positions?: Point[][]
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

  private _time = 0
  private _state: CombatState = "running"
  private _activeFighter: Fighter | null = null
  private _winnerTeam: number | null = null
  private _events: FightEvent[] = []
  private _log: Command[] = []
  private _presets = new Map<string, CharacterPreset>()
  private _regions = new Map<Locomotion, Set<string>>()

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
          options.positions?.[team]?.[i] ?? this._randomSpawn(team)

        this.fighters.push({
          id: `${presetId}-${team}-${i}`,
          presetId,
          name: duplicates ? `${preset.name} ${duplicates + 1}` : preset.name,
          team,
          stats: scaleStats(preset.stats, setup.statMultiplier ?? 1),
          actions: [
            ...preset.actions,
            ...COMMON_ACTIONS.filter((id) => !preset.actions.includes(id)),
          ].map((id) => {
            const action = ACTIONS[id]
            if (!action) throw new Error(`Unknown action "${id}"`)
            return action
          }),
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

  get winnerTeam() {
    return this._winnerTeam
  }

  getFighter(id: string) {
    return this.fighters.find((f) => f.id === id)
  }

  get aliveFighters() {
    return this.fighters.filter((f) => f.alive)
  }

  fightersAt(p: Point) {
    return this.fighters.filter((f) => f.alive && equals(f.position, p))
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
    return a.team !== b.team
  }

  /** Whether `fighter` may stand on / walk through `p`. */
  canEnter(fighter: Fighter, p: Point) {
    const occupants = this.fightersAt(p).filter((o) => o !== fighter)
    if (occupants.some((o) => this.isEnemy(fighter, o))) return false
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
  inLaunchZone(action: ActionDefinition, origin: Point, p: Point) {
    if (!this.board.inBounds(p)) return false
    const bonus = this.heightBonus(action, origin, p)
    return inZone(origin, p, {
      ...action.launch,
      max: action.launch.max + bonus,
    })
  }

  /**
   * Paths of a movement action: every cell reachable in at most `maxSteps`
   * steps (through allies, never through enemies), with its shortest path.
   */
  movementPaths(
    fighter: Fighter,
    maxSteps: number,
    origin: Point = fighter.position,
  ): Map<string, Point[]> {
    const paths = new Map<string, Point[]>()
    const seen = new Set([keyOf(origin)])
    let frontier: { point: Point; path: Point[] }[] = [
      { point: origin, path: [] },
    ]
    for (let step = 0; step < maxSteps; step++) {
      const next: typeof frontier = []
      for (const { point, path } of frontier) {
        for (const neighbor of this.board.neighbors(point)) {
          const key = keyOf(neighbor)
          if (seen.has(key)) continue
          if (!this.board.canStep(point, neighbor, fighter.locomotion)) continue
          if (!this.canEnter(fighter, neighbor)) continue
          seen.add(key)
          const route = [...path, neighbor]
          paths.set(key, route)
          next.push({ point: neighbor, path: route })
        }
      }
      frontier = next
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
      return [...this.movementPaths(fighter, action.movement.maxSteps, origin)]
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
      return this.movementPaths(fighter, action.movement.maxSteps, origin).has(
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
        this.inLaunchZone(action, origin, p) &&
        this.targetMatches(fighter, action, p, origin) &&
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
    const combos = partners.map((partner) =>
      comboAction(this.presetOf(fighter), this.presetOf(partner)),
    )
    // two identical partners give the same combo once
    const unique = combos.filter(
      (c, i) => combos.findIndex((o) => o.id === c.id) === i,
    )
    return [...fighter.actions, ...unique]
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

    const next = this._nextEvent()
    if (!next) {
      this._end(null)
      return this._flush()
    }

    this._advanceTime(next.at)

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

    for (const fighter of this.fighters) {
      if (!fighter.alive) continue
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

    for (const status of [...fighter.statuses]) {
      status.turns--
      if (status.turns <= 0) this._removeStatus(fighter, status.id)
    }

    for (const id of Object.keys(fighter.cooldowns)) {
      fighter.cooldowns[id] = Math.max(0, fighter.cooldowns[id] - 1)
    }

    if (fighter.controller === "ai") {
      this._playAi(fighter)
    } else {
      this._state = "awaitingInput"
    }
  }

  private _playAi(fighter: Fighter) {
    const divine = decideDivine(this, fighter)
    if (divine) this._useDivine(fighter.team, divine.divineId, divine.target)
    if (this._state === "ended") return

    for (const command of decide(this, fighter)) {
      if (this._activeFighter !== fighter) break
      switch (command.type) {
        case "move":
          this._moveTo(fighter, command.destination)
          break
        case "action":
          this._useAction(fighter, command.actionId, command.target)
          break
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
    return this._logged(command, this._moveTo(fighter, destination, append))
  }

  /** Use an action. Ends the turn and adds its cost to the timeline. */
  useAction(actionId: string, target: Point): CommandResult {
    const fighter = this._checkInput()
    if (typeof fighter === "string") return this._result(fighter)
    return this._logged(
      {
        type: "useAction",
        fighterId: fighter.id,
        actionId,
        target: { ...target },
      },
      this._useAction(fighter, actionId, target),
    )
  }

  /** End the turn: plays again just after the next fighter. */
  pass(): CommandResult {
    const fighter = this._checkInput()
    if (typeof fighter === "string") return this._result(fighter)
    this._pass(fighter)
    return this._logged({ type: "pass", fighterId: fighter.id }, null)
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
    const path = this.movementPaths(fighter, action.movement!.maxSteps).get(
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
    for (const team of this.teams) {
      const members = this.fighters.filter((f) => f.team === team.index)
      const fallen = members.filter((f) => !f.alive).length
      if (fallen === members.length) continue
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
      const paths = this.movementPaths(fighter, action.movement.maxSteps)
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
    }
  }

  private _useDivine(
    team: number,
    divineId: string,
    target: Point | null,
  ): string | null {
    const divine = DIVINE_ACTIONS[divineId]
    if (!divine) return "Action divine inconnue"
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
        const cell = this.board.get(target)
        if (!cell) return "Case invalide"
        if (this.fightersAt(target).length > 0) return "La case est occupée"
        const previous = { ...cell }
        // raise low cells, collapse high ones
        const delta = cell.elevation < 1 ? EARTHQUAKE_DELTA : -EARTHQUAKE_DELTA
        cell.elevation = Math.max(
          MIN_ELEVATION,
          Math.min(MAX_ELEVATION, cell.elevation + delta),
        )
        cell.terrain =
          cell.elevation < 0 && previous.terrain === "water"
            ? "water"
            : "ground"
        this._regions.clear()
        if (!this._fightersCanMeet()) {
          Object.assign(cell, previous)
          this._regions.clear()
          return "Le terrain serait coupé en deux"
        }
        this._emit({ type: "terrainChanged", cell: target })
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
    let absorbed = 0
    const shield = target.statuses.find((s) => STATUSES[s.id].absorbsDamage)
    if (shield) {
      absorbed = Math.min(shield.value, amount)
      shield.value -= absorbed
      if (shield.value <= 0) this._removeStatus(target, shield.id)
    }

    target.hp = Math.max(0, target.hp - (amount - absorbed))
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

    if (target.hp <= 0) {
      target.alive = false
      this._clearWalk(target)
      target.statuses = []
      this._emit({ type: "died", fighterId: target.id })
      // catch-up: the team that loses a fighter gets energy right away
      if (this.aliveFighters.some((f) => f.team === target.team)) {
        this._gainEnergy(target.team, DEATH_ENERGY)
      }
      this._checkVictory()
    }
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
    const state = this.teams[team]
    const energy = Math.min(MAX_ENERGY, state.energy + amount)
    if (energy !== state.energy) {
      state.energy = energy
      this._emit({ type: "energyChanged", team, energy })
    }
  }

  private _checkVictory() {
    const teams = new Set(this.aliveFighters.map((f) => f.team))
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
    const cell = this.rng.pick(candidates)
    return { x: cell.x, y: cell.y }
  }

  // ─── Events ───────────────────────────────────────────────────────────────

  private _emit(event: FightEvent) {
    this._events.push(event)
  }

  private _flush() {
    const events = this._events
    this._events = []
    return events
  }
}
