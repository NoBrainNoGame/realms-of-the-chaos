import * as booyah from "@ghom/booyah"
import {
  ACTIONS,
  type ActionDefinition,
  type Board,
  type CharacterPreset,
  Combat,
  type CombatOptions,
  type Command,
  DIVINE_ACTIONS,
  equals,
  type FightEvent,
  type Fighter,
  keyOf,
  MAX_ELEVATION,
  manhattan,
  type Point,
  STATUSES,
} from "@realms/engine"
import { Container } from "pixi.js"
import {
  ACTION_POSE,
  comboFx,
  deathFx,
  divineFx,
  type FxContext,
  hitFx,
  impactFx,
  isMelee,
  landingFx,
  leapTakeoffFx,
  PROJECTILES,
  stepFx,
} from "./actionFx"
import Backdrop from "./Backdrop"
import BoardView, {
  COLUMN_BOTTOM,
  DEPTH,
  depthOf,
  type Highlight,
} from "./BoardView"
import { FX, floatingText, particles, projectile } from "./effects"
import FighterView, { STATUS_COLORS, type WaterState } from "./FighterView"
import Hud from "./Hud"
import { facingBetween } from "./Puppet"
import {
  COLORS,
  ELEVATION_HEIGHT,
  TEAM_COLORS,
  TILE_HEIGHT,
  TILE_WIDTH,
  toScreen,
} from "./theme"
import ViewChip from "./ViewChip"

/** A team of the fight, and who plays it. */
export interface SceneTeam {
  name: string
  /** Played on this device, or by the AI. */
  controller: "local" | "ai"
  fighters: (string | CharacterPreset)[]
  /** Difficulty: scales the fighters' stats. */
  statMultiplier?: number
  /** Starting hit points (arcade waves). */
  hp?: (number | undefined)[]
}

/** A button of the end screen. */
export interface EndAction {
  id: string
  label: string
}

export interface SceneOptions {
  seed: number
  /** Animation speed multiplier (1, 2 or 4). */
  speed: number
  teams: SceneTeam[]
  /** Buttons of the end screen (default: replay). */
  endActions?: EndAction[]
  /** Shows a "Menu" button to leave the fight. */
  quittable?: boolean
}

/** A classic fight: your team (or the AI's if spectating) against the AI. */
export function classicFight(options: {
  seed: number
  speed: number
  spectate: boolean
  playerTeam: (string | CharacterPreset)[]
  enemyTeam: (string | CharacterPreset)[]
}): SceneOptions {
  return {
    seed: options.seed,
    speed: options.speed,
    teams: [
      {
        name: options.spectate ? "Lumière" : "Vous",
        controller: options.spectate ? "ai" : "local",
        fighters: options.playerTeam,
      },
      { name: "Chaos", controller: "ai", fighters: options.enemyTeam },
    ],
  }
}

/** Engine options of a scene (local teams are the engine's humans). */
export function combatOptions(options: SceneOptions): CombatOptions {
  return {
    seed: options.seed,
    teams: options.teams.map((team) => ({
      name: team.name,
      controller: team.controller === "local" ? "human" : "ai",
      fighters: team.fighters,
      statMultiplier: team.statMultiplier,
      hp: team.hp,
    })),
  }
}

export const DEFAULT_END_ACTIONS: EndAction[] = [
  { id: "restart", label: "Rejouer" },
]

type Mode =
  | { type: "move" }
  | { type: "action"; action: ActionDefinition }
  | { type: "divine"; id: string }

interface SceneEvents extends booyah.BaseCompositeEvents {
  /** A button of the end screen was pressed. */
  endAction: [id: string]
  /** The player left the fight (Menu button). */
  quit: []
}

/**
 * Offset of a fighter inside its cell when several share it: alone in the
 * center, two side by side, three in a triangle (one behind, two in front).
 */
export function stackOffset(
  index: number,
  count: number,
): { x: number; y: number } {
  if (count <= 1) return { x: 0, y: 0 }
  if (count === 2) return index === 0 ? { x: -9, y: -1 } : { x: 9, y: 1 }
  return [
    { x: -2, y: -9 },
    { x: -14, y: 3 },
    { x: 12, y: 5 },
  ][index % 3]
}

/** Water state of a fighter standing on a cell. */
export function waterState(board: Board, cell: Point): WaterState {
  if (board.get(cell)?.terrain !== "water") return "dry"
  return board.isDeepWater(cell) ? "swimming" : "wading"
}

export default class FightScene extends ViewChip<SceneEvents> {
  readonly combat: Combat

  private _world!: Container
  private _entities!: Container
  private _effects!: Container
  private _hits!: Container
  private _board!: BoardView
  private _hud!: Hud
  private _views = new Map<string, FighterView>()
  /** Displayed cell of each fighter (lags behind the engine while animating). */
  private _cells = new Map<string, Point>()

  private _playing = false
  private _inputReady = false
  private _mode: Mode = { type: "move" }
  private _hovered: Point | null = null
  private _speed: number
  private _lastActive: Fighter | null = null
  private _endShown = false
  private _fx!: FxContext
  /** Impact of a dash action, played when the launcher lands. */
  private _dashImpact: {
    actionId: string
    origin: Point
    target: Point
    cells: Point[]
    damaging: boolean
  } | null = null
  /** Command received while an animation was playing. */
  private _pending: Command | null = null
  /** Steps left of a sprint being animated (quicker steps, dust). */
  private _sprint: { fighterId: string; steps: number } | null = null
  /** Team of the last local turn (announces turns in local duels). */
  private _lastInputTeam: number | null = null
  private _worldBase = { x: 0, y: 0 }
  private _shake = { intensity: 0, remaining: 0, duration: 1 }

  constructor(private readonly _options: SceneOptions) {
    super()
    this._speed = _options.speed
    this.combat = new Combat(combatOptions(_options))
  }

  get options(): Readonly<SceneOptions> {
    return this._options
  }

  /** Teams played on this device. */
  get localTeams(): number[] {
    return this._options.teams.flatMap((t, i) =>
      t.controller === "local" ? [i] : [],
    )
  }

  /**
   * Team whose divine powers are shown: the local team playing now, else
   * the first local team (or the first team when spectating).
   */
  get playerTeam() {
    const active = this._activeHuman
    if (active) return active.team
    return this.localTeams[0] ?? 0
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  protected _onActivate() {
    this._world = new Container()
    this._entities = new Container()
    this._entities.sortableChildren = true
    this._effects = new Container()
    this._effects.sortableChildren = true
    this._activateChildChip(new Backdrop())
    this._container.addChild(this._world)

    this._hits = new Container()
    this._board = new BoardView(
      this.combat.board,
      this._entities,
      this._hits,
      this._options.seed,
    )
    this._activateChildChip(this._board, {
      context: { container: this._world },
    })
    // ground (board) < entities (depth-sorted) < effects < pointer hit areas
    this._world.addChild(this._entities, this._effects, this._hits)

    for (const fighter of this.combat.fighters) {
      const view = new FighterView(fighter, this.combat.baseMaxHp(fighter))
      this._activateChildChip(view, { context: { container: this._entities } })
      this._views.set(fighter.id, view)
      this._cells.set(fighter.id, fighter.position)
    }
    this._settleAll()

    this._fx = {
      layer: this._effects,
      board: this._board,
      ms: (d) => this._ms(d),
      spawn: (chip) => this._activateChildChip(chip),
      shake: (intensity, duration) => this._startShake(intensity, duration),
      inBounds: (p) => this.combat.board.inBounds(p),
      isWater: (p) => this.combat.board.get(p)?.terrain === "water",
    }

    // everyone starts facing the closest enemy
    for (const fighter of this.combat.fighters) {
      const enemies = this.combat.fighters.filter(
        (o) => o.team !== fighter.team,
      )
      const closest = enemies.reduce((a, b) =>
        manhattan(a.position, fighter.position) <=
        manhattan(b.position, fighter.position)
          ? a
          : b,
      )
      this._views
        .get(fighter.id)!
        .setFacing(facingBetween(fighter.position, closest.position))
    }

    this._hud = new Hud()
    this._activateChildChip(this._hud)
    this._hud.setSpeed(this._speed)
    this._hud.setTimeline(this.combat)
    this._hud.setDivine(this.combat, this.playerTeam, false, null)
    this._hud.log(`Seed ${this._options.seed} — que le chaos commence !`)

    this._subscribe(this._board, "cellOver", (p) => {
      this._hovered = p
      this._onHover()
    })
    this._subscribe(this._board, "cellOut", (p) => {
      if (this._hovered && equals(this._hovered, p)) this._hovered = null
      this._onHover()
    })
    this._subscribe(this._board, "cellDown", (p, button) =>
      this._onCellDown(p, button),
    )
    this._subscribe(this._hud, "action", (id) => this._selectAction(id))
    this._subscribe(this._hud, "divine", (id) => this._selectDivine(id))
    this._subscribe(this._hud, "pass", () => this._pass())
    this._subscribe(this._hud, "endAction", (id) => this.emit("endAction", id))
    this._subscribe(this._hud, "quit", () => this.emit("quit"))
    this._hud.setQuittable(!!this._options.quittable)
    this._subscribe(this._hud, "speed", () => this._toggleSpeed())
    this._subscribe(window, "keydown", (e: KeyboardEvent) => this._onKey(e))
  }

  protected _onResize(width: number, height: number) {
    const { width: w, height: h } = this.combat.board
    const left = toScreen({ x: 0, y: h - 1 }).x - TILE_WIDTH / 2
    const right = toScreen({ x: w - 1, y: 0 }).x + TILE_WIDTH / 2
    // highest peaks above, and the top of the island's rocky underside below
    const top = -TILE_HEIGHT - MAX_ELEVATION * ELEVATION_HEIGHT - 40
    const bottom =
      toScreen({ x: w - 1, y: h - 1 }).y + TILE_HEIGHT + COLUMN_BOTTOM + 30
    const scale = Math.max(
      0.6,
      Math.min(
        1.6,
        (width - 460) / (right - left),
        (height - 230) / (bottom - top),
      ),
    )
    this._world.scale.set(scale)
    this._worldBase = {
      x: Math.round(width / 2 - ((left + right) / 2) * scale),
      y: Math.round(height / 2 + 10 - ((top + bottom) / 2) * scale),
    }
    this._world.position.set(this._worldBase.x, this._worldBase.y)
  }

  /** Screen shake; a stronger shake overrides a weaker one. */
  private _startShake(intensity: number, duration: number) {
    if (
      intensity >=
      this._shake.intensity * (this._shake.remaining / this._shake.duration)
    ) {
      this._shake = { intensity, remaining: duration, duration }
    }
  }

  private _updateJuice() {
    // fighters follow the ground when their cell sinks
    for (const [id, view] of this._views) {
      view.setGroundOffset(this._board.cellOffset(this._cells.get(id)!))
    }

    // screen shake
    const shake = this._shake
    if (shake.remaining > 0) {
      shake.remaining = Math.max(
        0,
        shake.remaining - this._lastTickInfo.timeSinceLastTick,
      )
      const k = shake.intensity * (shake.remaining / shake.duration)
      this._world.position.set(
        this._worldBase.x + (Math.random() * 2 - 1) * k,
        this._worldBase.y + (Math.random() * 2 - 1) * k * 0.6,
      )
      if (shake.remaining === 0) {
        shake.intensity = 0
        this._world.position.set(this._worldBase.x, this._worldBase.y)
      }
    }
  }

  protected _onTick() {
    this._updateJuice()
    if (this._playing) return

    if (this._pending) {
      const pending = this._pending
      this._pending = null
      this._command(pending)
      if (this._playing) return
    }

    if (this.combat.state === "running") {
      for (let i = 0; i < 50 && this.combat.state === "running"; i++) {
        const chips = this._animate(this.combat.advance())
        if (chips.length > 0) {
          this._play(chips)
          return
        }
      }
    }

    if (this.combat.state === "awaitingInput" && !this._inputReady)
      this._enterInput()
    if (this.combat.state === "ended" && !this._endShown) this._showEnd()
  }

  // ─── Animation pipeline ───────────────────────────────────────────────────

  private _ms(duration: number) {
    return duration / this._speed
  }

  private _play(chips: booyah.ChipResolvable[]) {
    this._playing = true
    const sequence = new booyah.Sequence(chips)
    this._activateChildChip(sequence)
    this._subscribeOnce(sequence, "terminated", () => {
      this._playing = false
    })
  }

  /** Fire-and-forget visual (does not block the sequence). */
  private _spawn(chip: booyah.ChipResolvable) {
    return new booyah.Lambda(() => this._activateChildChip(chip))
  }

  private _center(fighterId: string, offsetY = -24) {
    const cell = this._cells.get(fighterId)!
    const { x, y } = this._board.cellTop(cell)
    return { x, y: y + offsetY }
  }

  /** Screen position of a fighter, spread when several share a cell. */
  private _slot(fighterId: string, cell: Point) {
    const mates = [...this._cells.entries()]
      .filter(([id, p]) => this.combat.getFighter(id)!.alive && equals(p, cell))
      .map(([id]) => id)
    if (!mates.includes(fighterId)) mates.push(fighterId)
    const offset = stackOffset(mates.indexOf(fighterId), mates.length)
    const top = this._board.cellTop(cell)
    return { x: top.x + offset.x, y: top.y + offset.y }
  }

  /** Depth inside the cell: fighters further back are drawn first. */
  private _depth(fighterId: string, cell: Point) {
    const slot = this._slot(fighterId, cell)
    const top = this._board.cellTop(cell)
    return depthOf(cell, DEPTH.fighter) + (slot.y - top.y + 10) / 100
  }

  private _settleAll() {
    for (const [id, view] of this._views) {
      const cell = this._cells.get(id)!
      const slot = this._slot(id, cell)
      view.container.position.set(slot.x, slot.y)
      view.container.zIndex = this._depth(id, cell)
      view.setWater(waterState(this.combat.board, cell))
    }
  }

  private _animate(events: FightEvent[]): booyah.ChipResolvable[] {
    const chips: booyah.ChipResolvable[] = []
    let parallel: booyah.ChipResolvable[] = []
    const flush = () => {
      if (parallel.length) chips.push(new booyah.Parallel(parallel))
      parallel = []
    }

    for (const event of events) {
      const quick = this._quickEffect(event)
      if (quick) {
        parallel.push(quick)
        continue
      }
      flush()
      chips.push(...this._sequenceEffect(event))
    }
    flush()
    return chips
  }

  /** Effects that can run together (hits, heals, statuses…). */
  private _quickEffect(event: FightEvent): booyah.ChipResolvable | null {
    switch (event.type) {
      case "damaged": {
        const view = this._views.get(event.fighterId)!
        const cell = this._cells.get(event.fighterId)!
        const at = this._center(event.fighterId, -view.headHeight - 6)
        return new booyah.Sequence([
          new booyah.Lambda(() => {
            view.wound(event.amount)
            hitFx(this._fx, cell, event.critical)
            if (this._lastActive) this._refreshCard()
          }),
          this._spawn(
            floatingText(
              this._effects,
              at,
              event.critical ? `-${event.amount} !` : `-${event.amount}`,
              event.critical ? 0xffd43b : 0xff6b6b,
              event.critical ? 22 : 17,
            ),
          ),
          ...(event.absorbed
            ? [
                this._spawn(
                  floatingText(
                    this._effects,
                    { x: at.x, y: at.y + 18 },
                    `(${event.absorbed} absorbés)`,
                    0xffe066,
                    12,
                  ),
                ),
              ]
            : []),
          view.hitChip(this._ms(300)),
        ])
      }
      case "healed": {
        const view = this._views.get(event.fighterId)!
        const at = this._center(event.fighterId, -view.headHeight - 6)
        return new booyah.Sequence([
          new booyah.Lambda(() => (view.hp += event.amount)),
          this._spawn(
            floatingText(
              this._effects,
              at,
              `+${event.amount}`,
              COLORS.heal,
              17,
            ),
          ),
          this._spawn(
            particles(this._effects, this._center(event.fighterId, -20), {
              ...FX.sparkles([0x51cf66, 0xd3f9d8], 10),
              count: 10,
            }),
          ),
        ])
      }
      case "statusApplied": {
        const view = this._views.get(event.fighterId)!
        const color = STATUS_COLORS[event.status]
        return new booyah.Sequence([
          new booyah.Lambda(() => view.addStatus(event.status)),
          this._spawn(
            floatingText(
              this._effects,
              this._center(event.fighterId, -view.headHeight - 24),
              STATUSES[event.status].name,
              color,
              13,
            ),
          ),
          this._spawn(
            particles(
              this._effects,
              this._center(event.fighterId, -24),
              event.status === "poisoned"
                ? FX.bubbles()
                : { ...FX.sparkles([color, 0xffffff], 12), count: 12 },
            ),
          ),
        ])
      }
      case "statusExpired":
        return new booyah.Lambda(() =>
          this._views.get(event.fighterId)!.removeStatus(event.status),
        )
      case "delayed":
        return this._spawn(
          floatingText(
            this._effects,
            this._center(
              event.fighterId,
              -this._views.get(event.fighterId)!.headHeight - 24,
            ),
            `${event.amount > 0 ? "+" : ""}${Math.round(event.amount)} ⌛`,
            0xb197fc,
            14,
          ),
        )
      case "energyChanged":
        return new booyah.Lambda(() => this._refreshDivine())
      case "turnPassed":
        return new booyah.Lambda(() =>
          this._views.get(event.fighterId)!.setActive(false),
        )
      default:
        return null
    }
  }

  private _sequenceEffect(event: FightEvent): booyah.ChipResolvable[] {
    const name = (id: string) => this.combat.getFighter(id)!.name

    switch (event.type) {
      case "turnStarted": {
        const fighter = this.combat.getFighter(event.fighterId)!
        const chips: booyah.ChipResolvable[] = [
          new booyah.Lambda(() => {
            this._lastActive?.alive &&
              this._views.get(this._lastActive.id)!.setActive(false)
            this._lastActive = fighter
            this._views.get(fighter.id)!.setActive(true)
            this._hud.setTimeline(this.combat)
            this._refreshCard()
            this._hud.setActions(fighter, this.combat, null)
            if (fighter.controller === "human") {
              this._hud.banner(
                `À ${fighter.name} de jouer`,
                TEAM_COLORS[fighter.team],
              )
            }
          }),
        ]
        if (fighter.controller === "ai")
          chips.push(new booyah.Wait(this._ms(350)))
        return chips
      }

      case "destinationSet":
        return [new booyah.Lambda(() => this._refreshOverlay())]

      case "moved":
      case "pushed":
      case "dashed": {
        const view = this._views.get(event.fighterId)!
        const sprinting =
          event.type === "moved" &&
          this._sprint?.fighterId === event.fighterId &&
          this._sprint.steps > 0
        if (sprinting) this._sprint!.steps--
        const duration = sprinting
          ? 130
          : event.type === "moved"
            ? 190
            : event.type === "pushed"
              ? 200
              : 320
        const hop =
          event.type === "moved" ? 4 : event.type === "pushed" ? 0 : 36
        return [
          new booyah.Lambda(() => {
            this._cells.set(event.fighterId, event.to)
            view.container.zIndex = depthOf(event.from, DEPTH.fighter)
            // a pushed fighter keeps facing its attacker
            if (event.type !== "pushed")
              view.setFacing(facingBetween(event.from, event.to))
            if (event.type === "dashed") {
              view.act("melee", this._ms(duration))
              leapTakeoffFx(this._fx, event.from)
            }
          }),
          // switch depth halfway, when the body crosses the cell border
          () =>
            new booyah.Parallel([
              view.moveChip(
                this._slot(event.fighterId, event.to),
                this._ms(duration),
                hop,
                event.type === "moved",
              ),
              new booyah.Sequence([
                new booyah.Wait(this._ms(duration) / 2),
                new booyah.Lambda(() => {
                  view.container.zIndex = depthOf(event.to, DEPTH.fighter)
                }),
              ]),
            ]),
          new booyah.Lambda(() => {
            this._settleAll()
            if (event.type === "moved") {
              stepFx(
                this._fx,
                event.to,
                this.combat.board.get(event.to)?.terrain === "water",
              )
              this._refreshOverlay()
            } else if (event.type === "pushed") {
              this._fx.spawn(
                particles(
                  this._effects,
                  this._board.cellTop(event.to),
                  FX.dust(12),
                ),
              )
              this._board.shockwave(event.to, [event.to], 4, {
                duration: this._ms(360),
              })
            } else {
              landingFx(this._fx, event.to)
              const impact = this._dashImpact
              if (impact) {
                this._dashImpact = null
                impactFx(
                  this._fx,
                  impact.actionId,
                  impact.origin,
                  impact.target,
                  impact.cells,
                  impact.damaging,
                )
              }
            }
          }),
        ]
      }

      case "pathBlocked":
        return [
          this._spawn(
            floatingText(
              this._effects,
              this._center(
                event.fighterId,
                -this._views.get(event.fighterId)!.headHeight - 24,
              ),
              "bloqué !",
              0xadb5bd,
              13,
            ),
          ),
        ]

      case "actionUsed": {
        const launcher = this.combat.getFighter(event.fighterId)!
        const base = event.baseActionId
        // combined actions only exist while the partner is there: look it up now
        const action =
          this.combat
            .actionsOf(launcher)
            .find((a) => a.id === event.actionId) ?? ACTIONS[base]
        // a sprint is just quick steps: the moves that follow animate it
        if (action.movement) {
          // set now: the steps that follow are staged right after this event
          this._sprint = {
            fighterId: event.fighterId,
            steps: event.cells.length,
          }
          return [
            new booyah.Lambda(() => {
              this._hud.log(`${launcher.name} : ${action.name}`)
              this._refreshOverlay()
            }),
          ]
        }
        const view = this._views.get(event.fighterId)!
        const origin = this._cells.get(event.fighterId)!
        const pose = ACTION_POSE[base] ?? "melee"
        const targetTop = this._board.cellTop(event.target)
        const to = { x: targetTop.x, y: targetTop.y - 24 }
        const distance = manhattan(origin, event.target)
        const damaging = action.effects.some((e) => e.type === "damage")

        const chips: booyah.ChipResolvable[] = [
          new booyah.Lambda(() => {
            this._hud.log(`${launcher.name} : ${action.name}`)
            this._refreshOverlay()
            if (distance > 0)
              view.setFacing(
                facingBetween(origin, event.target, view.puppet.facing),
              )
          }),
          ...(launcher.controller === "human"
            ? []
            : [new booyah.Wait(this._ms(150))]),
        ]

        if (event.partnerId) {
          const partnerId = event.partnerId
          chips.push(
            new booyah.Lambda(() => {
              this._views.get(partnerId)?.act("roar", this._ms(420))
              comboFx(this._fx, origin)
              this._fx.spawn(
                floatingText(
                  this._effects,
                  this._center(event.fighterId, -view.headHeight - 22),
                  "Combo !",
                  COLORS.combo,
                  16,
                ),
              )
            }),
            new booyah.Wait(this._ms(240)),
          )
        }

        if (action.effects.some((e) => e.type === "dash")) {
          // the dash event animates the jump; the impact plays on landing
          chips.push(
            new booyah.Lambda(() => {
              view.setActive(false)
              this._dashImpact = {
                actionId: base,
                origin,
                target: event.target,
                cells: event.cells,
                damaging,
              }
            }),
          )
          return chips
        }

        if (isMelee(base) && distance <= 1) {
          chips.push(
            new booyah.Lambda(() => view.act(pose, this._ms(320))),
            new booyah.Wait(this._ms(110)),
            () => view.lungeChip(to, this._ms(200)),
          )
        } else if (distance > 0) {
          const from = this._center(event.fighterId, -view.headHeight * 0.6)
          chips.push(
            new booyah.Lambda(() =>
              view.act(pose, this._ms(pose === "shoot" ? 420 : 520)),
            ),
            new booyah.Wait(this._ms(pose === "shoot" ? 220 : 260)),
            () =>
              projectile(
                this._effects,
                from,
                to,
                this._ms(300 + distance * 35),
                PROJECTILES[base] ?? { color: 0xffffff },
                (chip) => this._activateChildChip(chip),
              ),
          )
        } else {
          chips.push(
            new booyah.Lambda(() => view.act(pose, this._ms(520))),
            new booyah.Wait(this._ms(280)),
          )
        }

        chips.push(
          new booyah.Lambda(() => {
            view.setActive(false)
            impactFx(
              this._fx,
              base,
              origin,
              event.target,
              event.cells,
              damaging,
            )
          }),
          new booyah.Wait(this._ms(damaging ? 90 : 160)),
        )
        return chips
      }

      case "died":
        return [
          new booyah.Lambda(() => {
            this._hud.log(`☠ ${name(event.fighterId)} est vaincu`)
            deathFx(this._fx, this._cells.get(event.fighterId)!)
          }),
          () => this._views.get(event.fighterId)!.dieChip(this._ms(700)),
          new booyah.Lambda(() => {
            this._views.get(event.fighterId)!.clearStatuses()
            this._settleAll()
            this._hud.setTimeline(this.combat)
          }),
        ]

      case "divineUsed": {
        const divine = DIVINE_ACTIONS[event.divineId]
        const team = this.combat.teams[event.team]
        const allies = this.combat.aliveFighters
          .filter((f) => f.team === event.team)
          .map((f) => this._cells.get(f.id)!)
        return [
          new booyah.Lambda(() => {
            this._hud.banner(divine.name, COLORS.divine)
            this._hud.log(`✦ ${team.name} invoque ${divine.name}`)
            divineFx(this._fx, event.divineId, event.target, allies)
          }),
          new booyah.Wait(this._ms(450)),
          new booyah.Lambda(() => this._hud.setTimeline(this.combat)),
        ]
      }

      case "terrainChanged":
        return [
          new booyah.Lambda(() => {
            this._board.refreshCell(event.cell)
            this._fx.spawn(
              particles(
                this._effects,
                this._board.cellTop(event.cell),
                FX.debris(),
              ),
            )
            this._refreshOverlay()
          }),
        ]

      case "ended":
        return [new booyah.Lambda(() => this._showEnd())]

      default:
        return []
    }
  }

  // ─── Player input ─────────────────────────────────────────────────────────

  private get _activeHuman(): Fighter | null {
    const active = this.combat.activeFighter
    return this.combat.state === "awaitingInput" &&
      active?.controller === "human"
      ? active
      : null
  }

  private _enterInput() {
    this._inputReady = true
    this._mode = { type: "move" }
    // local duel: announce whose turn it is when the team changes
    const team = this._activeHuman?.team ?? null
    if (
      team !== null &&
      this.localTeams.length > 1 &&
      team !== this._lastInputTeam
    ) {
      this._hud.banner(
        `Au tour de ${this.combat.teams[team].name}`,
        TEAM_COLORS[team],
      )
    }
    this._lastInputTeam = team
    this._refreshAll()
  }

  private _refreshAll() {
    this._hud.setActions(
      this._activeHuman,
      this.combat,
      this._mode.type === "action" ? this._mode.action.id : null,
    )
    this._hud.setTimeline(this.combat)
    this._refreshDivine()
    this._refreshCard()
    this._refreshOverlay()
  }

  private _refreshDivine() {
    this._hud.setDivine(
      this.combat,
      this.playerTeam,
      !!this._activeHuman && this._inputReady,
      this._mode.type === "divine" ? this._mode.id : null,
    )
  }

  private _refreshCard() {
    const hovered = this._hovered ? this._fighterAt(this._hovered) : null
    this._hud.setCard(hovered ?? this._lastActive, this.combat)
  }

  private _fighterAt(p: Point): Fighter | null {
    for (const [id, cell] of this._cells) {
      const fighter = this.combat.getFighter(id)!
      if (fighter.alive && equals(cell, p)) return fighter
    }
    return null
  }

  /** Pass the turn of the active local fighter. */
  private _pass() {
    const fighter = this._activeHuman
    if (fighter) this._command({ type: "pass", fighterId: fighter.id })
  }

  /**
   * Run a player command (serialized: the engine logs it, and an online
   * duel will send it to the server instead).
   */
  private _command(command: Command) {
    if (!this._activeHuman || !this._inputReady) return
    // an animation of this turn is still playing: run the command right after
    if (this._playing) {
      this._pending = command
      return
    }
    const result = this.combat.execute(command)
    if (!result.ok) {
      this._hud.banner(result.reason, 0xff8787)
      return
    }
    this._hud.hideTooltip()
    const stillMyTurn = this.combat.state === "awaitingInput"
    if (!stillMyTurn) {
      this._inputReady = false
      this._mode = { type: "move" }
      this._hud.setActions(null, this.combat, null)
    }
    const chips = this._animate(result.events)
    if (chips.length) this._play(chips)
    this._refreshAll()
  }

  private _selectAction(id: string) {
    const fighter = this._activeHuman
    if (!fighter || !this._inputReady) return
    const action = this.combat.actionsOf(fighter).find((a) => a.id === id)
    if (!action || this.combat.isOnCooldown(fighter, action)) return
    // self actions are used straight away
    if (action.target === "self") {
      this._command({
        type: "useAction",
        fighterId: fighter.id,
        actionId: action.id,
        target: fighter.position,
      })
      return
    }
    this._mode =
      this._mode.type === "action" && this._mode.action.id === id
        ? { type: "move" }
        : { type: "action", action }
    this._refreshAll()
  }

  private _selectDivine(id: string) {
    const fighter = this._activeHuman
    if (!fighter || !this._inputReady) return
    if (DIVINE_ACTIONS[id].target === "none") {
      this._command({
        type: "useDivine",
        fighterId: fighter.id,
        divineId: id,
        target: null,
      })
      return
    }
    this._mode =
      this._mode.type === "divine" && this._mode.id === id
        ? { type: "move" }
        : { type: "divine", id }
    this._refreshAll()
  }

  private _onCellDown(p: Point, button: number) {
    if (button === 2) {
      this._mode = { type: "move" }
      this._refreshAll()
      return
    }
    const fighter = this._activeHuman
    if (!fighter) return

    switch (this._mode.type) {
      case "move":
        this._command({ type: "moveTo", fighterId: fighter.id, destination: p })
        break
      case "action": {
        const action = this._mode.action
        this._command({
          type: "useAction",
          fighterId: fighter.id,
          actionId: action.id,
          target: p,
        })
        break
      }
      case "divine": {
        const id = this._mode.id
        this._command({
          type: "useDivine",
          fighterId: fighter.id,
          divineId: id,
          target: p,
        })
        this._mode = { type: "move" }
        this._refreshAll()
        break
      }
    }
  }

  private _onKey(e: KeyboardEvent) {
    if (e.key === "f" || e.key === "F") return this._toggleSpeed()
    const fighter = this._activeHuman
    if (!fighter) return
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      this._pass()
    } else if (e.key === "Escape") {
      this._mode = { type: "move" }
      this._refreshAll()
    } else if (e.key === "c" || e.key === "C") {
      const sprint = this.combat.actionsOf(fighter).find((a) => a.movement)
      if (sprint) this._selectAction(sprint.id)
    } else if (/^[1-9]$/.test(e.key)) {
      const action = this.combat.actionsOf(fighter)[Number(e.key) - 1]
      if (action) this._selectAction(action.id)
    }
  }

  private _toggleSpeed() {
    this._speed = this._speed >= 4 ? 1 : this._speed * 2
    this._hud.setSpeed(this._speed)
  }

  private _onHover() {
    this._refreshOverlay()
    this._refreshCard()
    const fighter = this._hovered ? this._fighterAt(this._hovered) : null
    if (fighter) {
      const statuses = fighter.statuses
        .map((s) => STATUSES[s.id].name)
        .join(", ")
      const pos = this._world.toGlobal(this._center(fighter.id, -60))
      this._hud.showTooltipAt(
        `${fighter.name} — ${fighter.hp}/${this.combat.maxHp(fighter)} PV${statuses ? `\n${statuses}` : ""}`,
        pos,
      )
    } else {
      this._hud.hideTooltip()
    }
  }

  private _refreshOverlay() {
    const highlights: Highlight[] = []
    const fighter = this._activeHuman
    const hovered = this._hovered

    // planned paths of the local fighters
    const local = this.localTeams
    for (const f of this.combat.aliveFighters) {
      if (local.includes(f.team) && f.path.length) {
        highlights.push({
          cells: f.path,
          color: COLORS.path,
          alpha: 0.55,
          inset: 22,
        })
      }
    }

    if (fighter && this._inputReady) {
      highlights.push({
        cells: [fighter.position],
        color: 0xffffff,
        alpha: 0.3,
        outline: true,
      })

      switch (this._mode.type) {
        case "move": {
          const reachable = this.combat.getReachableCells(fighter)
          highlights.push({
            cells: reachable,
            color: COLORS.reachable,
            alpha: 0.3,
            inset: 6,
          })
          if (hovered && reachable.some((c) => equals(c, hovered))) {
            const path = this.combat.board.findPath(
              fighter.position,
              hovered,
              (p) => this.combat.canEnter(fighter, p),
            )
            if (path)
              highlights.push({
                cells: path,
                color: COLORS.path,
                alpha: 0.7,
                inset: 18,
              })
            highlights.push({
              cells: [hovered],
              color: COLORS.path,
              alpha: 0.35,
              outline: true,
            })
          }
          break
        }
        case "action": {
          const action = this._mode.action
          const launch = this.combat.getLaunchCells(fighter, action)
          const targets = this.combat.getValidTargets(fighter, action)
          highlights.push({
            cells: launch,
            color: COLORS.launch,
            alpha: 0.25,
            inset: 6,
          })
          highlights.push({
            cells: targets,
            color: COLORS.target,
            alpha: 0.5,
            outline: true,
          })
          if (
            action.movement &&
            hovered &&
            targets.some((c) => equals(c, hovered))
          ) {
            // sprint: preview the path
            const path = this.combat
              .movementPaths(fighter, action.movement.maxSteps)
              .get(keyOf(hovered))
            if (path)
              highlights.push({
                cells: path,
                color: COLORS.path,
                alpha: 0.7,
                inset: 18,
              })
          } else if (hovered && targets.some((c) => equals(c, hovered))) {
            highlights.push({
              cells: this.combat.getAreaCells(action, hovered),
              color: COLORS.area,
              alpha: 0.6,
              outline: true,
            })
          }
          break
        }
        case "divine": {
          const divine = DIVINE_ACTIONS[this._mode.id]
          const cells =
            divine.target === "fighter"
              ? this.combat.aliveFighters.map((f) => f.position)
              : this.combat.board.cells
                  .filter((c) => this.combat.fightersAt(c).length === 0)
                  .map((c) => ({ x: c.x, y: c.y }))
          highlights.push({ cells, color: COLORS.divine, alpha: 0.25 })
          if (hovered && cells.some((c) => keyOf(c) === keyOf(hovered))) {
            highlights.push({
              cells: [hovered],
              color: COLORS.divine,
              alpha: 0.6,
            })
          }
          break
        }
      }
    } else if (hovered) {
      highlights.push({ cells: [hovered], color: 0xffffff, alpha: 0.15 })
    }

    this._board.setHighlights(highlights)
  }

  private _showEnd() {
    if (this._endShown) return
    this._endShown = true
    this._inputReady = false
    this._hud.setActions(null, this.combat, null)
    const winner = this.combat.winnerTeam
    const actions = this._options.endActions ?? DEFAULT_END_ACTIONS
    const local = this.localTeams
    if (winner === null) this._hud.showEnd("Match nul", COLORS.text, actions)
    else if (local.length !== 1)
      // spectating, or a local duel: name the winner
      this._hud.showEnd(
        `${this.combat.teams[winner].name} gagne !`,
        TEAM_COLORS[winner],
        actions,
      )
    else if (winner === local[0])
      this._hud.showEnd("Victoire !", 0xffe066, actions)
    else this._hud.showEnd("Défaite…", 0xff8787, actions)
    this._board.setHighlights([])
  }
}
