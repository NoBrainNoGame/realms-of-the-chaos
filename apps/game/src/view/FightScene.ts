import * as booyah from "@ghom/booyah"
import {
  ACTIONS,
  type ActionDefinition,
  Board,
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
  usefulActions,
} from "@realms/engine"
import { Container, Graphics } from "pixi.js"
import { settings } from "../settings"
import {
  ACTION_POSE,
  arrivalFx,
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
import { describeHp, describeStatus } from "./describe"
import { FX, floatingText, particles, projectile } from "./effects"
import FighterView, { STATUS_COLORS, type WaterState } from "./FighterView"
import Hud from "./Hud"
import { Lens } from "./lens"
import { facingBetween } from "./Puppet"
import SettingsScreen from "./SettingsScreen"
import {
  type Camera,
  COLORS,
  camera,
  ELEVATION_HEIGHT,
  ISO,
  ISO_PITCH,
  levelHeight,
  MAX_PITCH,
  MAX_YAW,
  MEANING,
  resetCamera,
  TEAM_COLORS,
  TILE_HEIGHT,
  TILE_WIDTH,
  toScreen,
  unproject,
} from "./theme"
import { type Segment, tag } from "./ui"
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
  /** A handmade map (`Board.fromAscii` rows) instead of a generated one. */
  board?: string[]
  /** Start cells per team (random spawns otherwise). */
  positions?: Point[][]
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
        name: options.spectate ? "Ordre" : "Vous",
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
    board: options.board && Board.fromAscii(options.board),
    positions: options.positions,
    teams: options.teams.map((team) => ({
      name: team.name,
      controller: team.controller === "local" ? "human" : "ai",
      fighters: team.fighters,
      statMultiplier: team.statMultiplier,
      hp: team.hp,
    })),
  }
}

/** Zoom bounds, relative to the board fitted to the screen. */
export const MIN_ZOOM = 0.6
export const MAX_ZOOM = 3
/** From this zoom, a quarter turn keeps the cell looked at in the middle. */
export const FOLLOW_ZOOM = 1.25
/** Length of a quarter turn of the camera (ms). */
export const TURN_DURATION = 420

export const DEFAULT_END_ACTIONS: EndAction[] = [
  { id: "restart", label: "Rejouer" },
]

type Mode =
  | { type: "move" }
  | { type: "action"; action: ActionDefinition }
  | { type: "divine"; id: string }

/**
 * What the player tries on the fight (a click or a key), checked by
 * `FightScene.guard` (the tutorial lets through only what its lesson asks).
 * Menu, Réglages and the speed are always allowed.
 */
export type SceneInput =
  | { type: "cell"; at: Point }
  | { type: "action"; id: string }
  | { type: "divine"; id: string }
  /** Avancer / Passer (`key`: Espace or Entrée). */
  | { type: "pass"; key?: boolean }
  /** Back out of a selection or a planned walk (always harmless). */
  | { type: "cancel" }
  | { type: "camera" }
  | { type: "timeline" }

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
  /** Action (or "pass") hovered in the action bar. */
  private _hoverChoice: string | null = null
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
  /** Fit-to-screen transform of the board (before the player's zoom). */
  private _fit = { scale: 1, x: 0, y: 0, width: 1, height: 1 }
  /** Player's zoom (1 = fit), its eased target, and the screen pan. */
  private _zoom = { value: 1, target: 1, anchor: { x: 0, y: 0 } }
  private _pan = { x: 0, y: 0 }
  /** Tilt and small rotation the camera eases to. */
  private _aim = { pitch: ISO_PITCH, yaw: 0 }
  /** Camera last drawn (the board is redrawn when it changes). */
  private _drawn: Camera = { ...ISO }
  /** Quarter turn being played (see `_updateTurn`). */
  private _turn: {
    dir: 1 | -1
    /** Quarter reached at the middle of the turn. */
    to: number
    elapsed: number
    yaw: number
    swapped: boolean
    /** Zoomed in: the point of the board kept in the middle of the screen. */
    follow: { x: number; y: number; elevation: number } | null
  } | null = null
  /** Right or middle button held on the screen (camera drag). */
  /** Lets an input through (none: everything goes). */
  guard: ((input: SceneInput) => boolean) | null = null

  /** The settings open over the fight (null: closed). */
  private _settings: { screen: SettingsScreen; shade: Graphics } | null = null
  private _drag: {
    button: number
    /** On the board (zoomed in): moves the camera; elsewhere: turns it. */
    kind: "pan" | "turn"
    x: number
    y: number
    pitch: number
    yaw: number
    pan: { x: number; y: number }
    moved: boolean
  } | null = null
  /** Curved arrows under the island: quarter turns. */
  private _turnButtons: Container[] = []
  private _shake = { intensity: 0, remaining: 0, duration: 1 }
  private _backdrop!: Backdrop
  /** The decor and the board, seen through the camera's lens. */
  private _lens!: Lens

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
    resetCamera()
    this._world = new Container()
    this._entities = new Container()
    this._entities.sortableChildren = true
    this._effects = new Container()
    this._effects.sortableChildren = true
    // the decor and the board are seen through the lens (the HUD isn't)
    const lens = new Container()
    this._lens = new Lens(lens)
    this._container.addChild(lens)
    this._backdrop = new Backdrop()
    this._activateChildChip(this._backdrop, { context: { container: lens } })
    // the distant islands nearer than the board pass in front of it
    lens.addChild(this._world, this._backdrop.front)
    this._turnButtons = ([-1, 1] as const).map((dir) => {
      const view = turnButton(dir)
      view.on("pointertap", () => {
        if (this.allows({ type: "camera" })) this.turnCamera(dir)
      })
      this._container.addChild(view)
      return view
    })

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
      // not on the island yet: shown when it enters (bringIn)
      view.container.visible = !this.combat.offstage.has(fighter.id)
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
    this._hud.log(
      `Fragment n°${this._options.seed} — tout ce qui interagit existe.`,
    )

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
    this._hud.allows = (input) => this.allows(input)
    this._subscribe(this._hud, "action", (id) => {
      if (this.allows({ type: "action", id })) this._selectAction(id)
    })
    this._subscribe(this._hud, "divine", (id) => {
      if (this.allows({ type: "divine", id })) this._selectDivine(id)
    })
    this._subscribe(this._hud, "pass", () => {
      if (this.allows({ type: "pass" })) this._pass()
    })
    this._subscribe(this._hud, "cancelWalk", () => this._cancelWalk())
    this._subscribe(this._hud, "hoverChoice", (choice) => {
      this._hoverChoice = choice
      this._hud.setLanding(this.landingPreview())
    })
    this._subscribe(this._hud, "endAction", (id) => this.emit("endAction", id))
    this._subscribe(this._hud, "quit", () => this.emit("quit"))
    this._subscribe(this._hud, "settings", () => this.openSettings())
    this._hud.setQuittable(!!this._options.quittable)
    this._subscribe(this._hud, "speed", () => this._toggleSpeed())
    this._subscribe(window, "keydown", (e: KeyboardEvent) => this._onKey(e))
    window.addEventListener("wheel", this._wheel, { passive: false })
    this._subscribe(window, "pointerdown", (e: PointerEvent) =>
      this._onPointerDown(e),
    )
    this._subscribe(window, "pointermove", (e: PointerEvent) =>
      this._onPointerMove(e),
    )
    this._subscribe(window, "pointerup", (e: PointerEvent) =>
      this._onPointerUp(e),
    )
  }

  private readonly _wheel = (e: WheelEvent) => this._onWheel(e)

  protected _onTerminate() {
    window.removeEventListener("wheel", this._wheel)
    resetCamera()
  }

  // ─── Camera ───────────────────────────────────────────────────────────────

  /** Tilts (degrees, from the classic view to almost top-down) and turns. */
  aimCamera(pitch: number, yaw: number) {
    this._aim = {
      pitch: Math.min(MAX_PITCH, Math.max(ISO_PITCH, pitch)),
      yaw: Math.min(MAX_YAW, Math.max(-MAX_YAW, yaw)),
    }
  }

  /**
   * Turns the board a quarter (1: clockwise): a small turn out while the
   * board fades, the quarter, then a small turn back while it comes back.
   */
  turnCamera(dir: 1 | -1) {
    if (this._turn) return
    const to = (camera.quarter + dir + 4) % 4
    this._turn = {
      dir,
      to,
      elapsed: 0,
      yaw: camera.yaw,
      swapped: false,
      // close enough, the camera keeps facing the cell it looks at
      follow: this._zoom.target >= FOLLOW_ZOOM ? this.lookedAt() : null,
    }
  }

  // ─── Anchors (where things are on the screen, for the tutorial) ──────────

  get hud(): Hud {
    return this._hud
  }

  /** Screen position of the top of a cell (as drawn now). */
  cellOnScreen(p: Point) {
    const global = this._world.toGlobal(this._board.cellTop(p))
    return { x: global.x, y: global.y }
  }

  /** The two quarter-turn arrows, together. */
  get turnButtonsBounds() {
    const [left, right] = this._turnButtons.map((b) => b.getBounds())
    if (!left || !right) return null
    return {
      x: left.x,
      y: Math.min(left.y, right.y),
      width: right.x + right.width - left.x,
      height: Math.max(left.height, right.height),
    }
  }

  /** Redraws the HUD and the board overlay (after changing the combat). */
  refresh() {
    if (this._hud) this._refreshAll()
  }

  /** Whether the player may do this now (see `guard`). */
  allows(input: SceneInput) {
    return !this.guard || this.guard(input)
  }

  /** The settings, open over the fight (which waits meanwhile). */
  get settingsOpen() {
    return this._settings !== null
  }

  /** Opens the settings over the fight: the board waits, and takes no input. */
  openSettings() {
    if (this._settings) return
    this._drag = null
    // a shade over the board and the HUD: their clicks stop there
    const shade = new Graphics()
      .rect(0, 0, 1, 1)
      .fill({ color: 0x000000, alpha: 0.55 })
    shade.eventMode = "static"
    shade.label = "settings:shade"
    shade.scale.set(this._fit.width, this._fit.height)
    this._container.addChild(shade)
    const screen = new SettingsScreen({ backdrop: false })
    this._settings = { screen, shade }
    this._activateChildChip(screen)
    this._subscribe(screen, "changed", this._settingsChanged)
    this._subscribeOnce(screen, "back", () => this.closeSettings())
  }

  closeSettings() {
    const open = this._settings
    if (!open) return
    this._settings = null
    this._unsubscribe(open.screen, "changed", this._settingsChanged)
    if (open.screen.state === "active") this._terminateChildChip(open.screen)
    open.shade.destroy()
  }

  /** A setting changed: the HUD and the layout follow at once. */
  private readonly _settingsChanged = () => {
    this._hud.applySettings()
    this._refreshAll()
    // every screen in place (the board's room, the tutorial's bubbles…)
    window.dispatchEvent(new Event("resize"))
  }

  /**
   * An offstage fighter enters the island at `at` (a tutorial's foe, when
   * a lesson needs it): light gathers there, then it takes shape, facing
   * the closest enemy. It plays `delay` from now.
   */
  bringIn(fighterId: string, at: Point, delay: number) {
    if (!this.combat.offstage.has(fighterId)) return
    this.combat.bringIn(fighterId, at, delay)
    const fighter = this.combat.getFighter(fighterId)!
    const view = this._views.get(fighterId)!
    this._cells.set(fighterId, fighter.position)
    const enemies = this.combat.aliveFighters.filter((o) =>
      this.combat.isEnemy(fighter, o),
    )
    if (enemies.length) {
      const closest = enemies.reduce((a, b) =>
        manhattan(a.position, at) <= manhattan(b.position, at) ? a : b,
      )
      view.setFacing(facingBetween(at, closest.position))
    }
    const color = fighter.team === this.playerTeam ? MEANING.ally : MEANING.foe
    arrivalFx(this._fx, at, color)
    view.container.visible = true
    view.container.alpha = 0
    this._activateChildChip(
      new booyah.Tween({
        from: 0,
        to: 1,
        duration: this._ms(500),
        onTick: (t) => {
          view.container.alpha = t
        },
      }),
    )
    this._hud.log(`✧ ${fighter.name} entre sur le Fragment`)
    this._settleAll()
    this._refreshAll()
  }

  /** Back to the classic view (the zoom too). */
  resetView() {
    this._aim = { pitch: ISO_PITCH, yaw: 0 }
    if (camera.quarter !== 0 && !this._turn) {
      const dir = camera.quarter === 3 ? 1 : -1
      this._turn = {
        dir,
        to: 0,
        elapsed: 0,
        yaw: camera.yaw,
        swapped: false,
        follow: null,
      }
    }
    this._zoom.target = 1
    this._zoom.anchor = { x: this._fit.width / 2, y: this._fit.height / 2 }
  }

  private _onPointerDown(e: PointerEvent) {
    if (this._settings) return
    if (e.button !== 1 && e.button !== 2) return
    // a right click still cancels (on release), the drag moves the camera
    if (e.button === 1 && !this.allows({ type: "camera" })) return
    // grabbing the board moves the camera, unless zoomed out to the most
    const onBoard = this._hovered !== null
    const zoomedOut = this._zoom.target <= MIN_ZOOM + 1e-3
    this._drag = {
      button: e.button,
      kind: onBoard && !zoomedOut ? "pan" : "turn",
      x: e.clientX ?? 0,
      y: e.clientY ?? 0,
      pitch: this._aim.pitch,
      yaw: this._aim.yaw,
      pan: { ...this._pan },
      moved: false,
    }
  }

  private _onPointerMove(e: PointerEvent) {
    const drag = this._drag
    if (!drag) return
    const dx = (e.clientX ?? 0) - drag.x
    const dy = (e.clientY ?? 0) - drag.y
    if (!drag.moved && Math.hypot(dx, dy) < 5) return
    if (!this.allows({ type: "camera" })) return
    drag.moved = true
    if (drag.kind === "pan") {
      this._zoom.target = this._zoom.value
      this._pan = { x: drag.pan.x + dx, y: drag.pan.y + dy }
      this._clampPan()
      return
    }
    // dragging down looks from higher, sideways turns the board a little
    this.aimCamera(drag.pitch + dy * 0.2, drag.yaw - dx * 0.1)
  }

  private _onPointerUp(e: PointerEvent) {
    const drag = this._drag
    if (!drag || e.button !== drag.button) return
    this._drag = null
    // a right click without dragging cancels the selection
    if (!drag.moved && drag.button === 2 && this._mode.type !== "move") {
      this._mode = { type: "move" }
      this._refreshAll()
    }
  }

  private _updateCamera(dt: number) {
    if (this._turn) this._updateTurn(dt)
    else {
      const k = 1 - Math.exp(-dt / 60)
      for (const key of ["pitch", "yaw"] as const) {
        const target = this._aim[key]
        camera[key] += (target - camera[key]) * k
        if (Math.abs(camera[key] - target) < 0.05) camera[key] = target
      }
    }
    const drawn = this._drawn
    if (
      drawn.quarter === camera.quarter &&
      drawn.pitch === camera.pitch &&
      drawn.yaw === camera.yaw
    )
      return
    this._drawn = { ...camera }
    this._board.redraw()
    for (const view of this._views.values()) view.refreshFacing()
    this._settleAll()
    this._refreshOverlay()
    this._layoutFit()
  }

  /** Small turn out and fade, the quarter, small turn back and show. */
  private _updateTurn(dt: number) {
    const turn = this._turn!
    turn.elapsed += dt
    const half = TURN_DURATION / 2
    const swing = 20 * turn.dir
    if (!turn.swapped && turn.elapsed >= half) {
      turn.swapped = true
      camera.quarter = turn.to
    }
    if (turn.elapsed < half) {
      const u = booyah.easeInCubic(turn.elapsed / half)
      camera.yaw = turn.yaw + swing * u
      this._world.alpha = 1 - 0.85 * u
    } else {
      const u = booyah.easeOutCubic(Math.min(1, (turn.elapsed - half) / half))
      camera.yaw = this._aim.yaw - swing * (1 - u)
      this._world.alpha = 0.15 + 0.85 * u
    }
    if (turn.elapsed >= TURN_DURATION) {
      camera.yaw = this._aim.yaw
      this._world.alpha = 1
      this._turn = null
    }
    // the distant islands vanish while the quarter changes (they jump)
    this._backdrop.islandsAlpha = (this._world.alpha - 0.15) / 0.85
  }

  protected _onResize(width: number, height: number) {
    this._fit.width = width
    this._fit.height = height
    this._settings?.shade.scale.set(width, height)
    this._layoutFit()
  }

  /**
   * Fits the board to the screen as seen from the classic view (so the
   * scale stays put while the camera moves), its center staying still.
   */
  private _layoutFit() {
    const { width, height } = this._fit
    const { width: w, height: h } = this.combat.board
    const left = toScreen({ x: 0, y: h - 1 }, 0, ISO).x - TILE_WIDTH / 2
    const right = toScreen({ x: w - 1, y: 0 }, 0, ISO).x + TILE_WIDTH / 2
    // highest peaks above, and the top of the island's rocky underside below
    const top = -TILE_HEIGHT - MAX_ELEVATION * ELEVATION_HEIGHT - 40
    const bottom =
      toScreen({ x: w - 1, y: h - 1 }, 0, ISO).y +
      TILE_HEIGHT +
      COLUMN_BOTTOM +
      90
    const scale = Math.max(
      0.6,
      Math.min(
        1.6,
        // room for the HUD, at the player's interface size
        (width - 460 * settings().uiSize) / (right - left),
        (height - 230 * settings().uiSize) / (bottom - top),
      ),
    )
    // the center of the board stays where the classic view puts it
    const middle = { x: (w - 1) / 2, y: (h - 1) / 2 }
    const iso = toScreen(middle, 0, ISO)
    const now = toScreen(middle)
    this._fit = {
      scale,
      x: Math.round(width / 2 - ((left + right) / 2 + now.x - iso.x) * scale),
      y: Math.round(
        height / 2 + 10 - ((top + bottom) / 2 + now.y - iso.y) * scale,
      ),
      width,
      height,
    }
    this._clampPan()
    this._placeWorld(0, 0)
  }

  /** Zooms in (positive steps) or out around a screen point. */
  zoomAt(screen: { x: number; y: number }, steps: number) {
    const target = this._zoom.target * 1.15 ** steps
    this._zoom.target = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, target))
    this._zoom.anchor = { ...screen }
  }

  get zoom() {
    return this._zoom.value
  }

  /** The camera's lens: tighter focus as it zooms in. */
  get lens() {
    return this._lens
  }

  private _onWheel(e: WheelEvent) {
    e.preventDefault()
    if (this._settings || !this.allows({ type: "camera" })) return
    // a trackpad pinch comes as a wheel with ctrl, in small steps
    const steps = -e.deltaY / (e.ctrlKey ? 25 : 100)
    this.zoomAt(
      {
        x: e.clientX ?? this._fit.width / 2,
        y: e.clientY ?? this._fit.height / 2,
      },
      steps,
    )
  }

  /** Eases the zoom to its target, keeping the anchor point still. */
  private _updateZoom(dt: number) {
    const zoom = this._zoom
    if (zoom.value === zoom.target) return
    const before = this._world.scale.x
    const { x: ax, y: ay } = zoom.anchor
    const wx = (ax - this._fit.x - this._pan.x) / before
    const wy = (ay - this._fit.y - this._pan.y) / before
    const k = 1 - Math.exp(-dt / 70)
    zoom.value += (zoom.target - zoom.value) * k
    if (Math.abs(zoom.value - zoom.target) < 0.002) zoom.value = zoom.target
    const after = this._fit.scale * zoom.value
    this._pan.x = ax - wx * after - this._fit.x
    this._pan.y = ay - wy * after - this._fit.y
    this._clampPan()
  }

  /**
   * The point of the board seen in the middle of the screen: on the ground
   * of the cell there (its elevation), on the board's edge if outside.
   */
  lookedAt(): { x: number; y: number; elevation: number } {
    const scale = this._fit.scale * this._zoom.value
    const sx = (this._fit.width / 2 - this._fit.x - this._pan.x) / scale
    const sy = (this._fit.height / 2 - this._fit.y - this._pan.y) / scale
    const board = this.combat.board
    let elevation = 0
    let p = unproject(sx, sy)
    // the ground stands at its cell's height: a few steps settle it
    for (let i = 0; i < 4; i++) {
      p = unproject(sx, sy + elevation * levelHeight())
      p = {
        x: Math.min(board.width - 0.5, Math.max(-0.5, p.x)),
        y: Math.min(board.height - 0.5, Math.max(-0.5, p.y)),
      }
      const cell = board.get({ x: Math.round(p.x), y: Math.round(p.y) })
      elevation = cell ? cell.elevation : 0
    }
    return { ...p, elevation }
  }

  /** Moves the camera so a point of the board is in the middle. */
  private _keepInMiddle(p: { x: number; y: number; elevation: number }) {
    const scale = this._fit.scale * this._zoom.value
    const o = toScreen(p, p.elevation)
    this._pan.x = this._fit.width / 2 - this._fit.x - o.x * scale
    this._pan.y = this._fit.height / 2 - this._fit.y - o.y * scale
    this._clampPan()
  }

  /** The board can't leave the screen (more slack the further the zoom). */
  private _clampPan() {
    const extra = this._zoom.value - 1
    const mx = (this._fit.width / 2) * Math.abs(extra) + 80
    const my = (this._fit.height / 2) * Math.abs(extra) + 60
    // the slack grows with the zoom, centered on where the fit puts it
    const cx = (this._fit.width / 2 - this._fit.x) * extra
    const cy = (this._fit.height / 2 - this._fit.y) * extra
    this._pan.x = Math.min(-cx + mx, Math.max(-cx - mx, this._pan.x))
    this._pan.y = Math.min(-cy + my, Math.max(-cy - my, this._pan.y))
  }

  private _placeWorld(dx: number, dy: number) {
    const scale = this._fit.scale * this._zoom.value
    this._world.scale.set(scale)
    this._world.position.set(
      this._fit.x + this._pan.x + dx,
      this._fit.y + this._pan.y + dy,
    )
    this._placeTurnButtons()
    this._lens.update(
      this._fit.width,
      this._fit.height,
      this._zoom.value,
      MAX_ZOOM,
    )
    // the distant islands are around the board, seen by the same camera:
    // they follow its middle and its zoom
    const { width: w, height: h } = this.combat.board
    // where the middle of the board is drawn now (as for the arrows)
    const middle = toScreen({ x: (w - 1) / 2, y: (h - 1) / 2 })
    this._backdrop.zoom = this._zoom.value
    this._backdrop.focus = {
      x: this._world.x + middle.x * scale,
      y: this._world.y + middle.y * scale,
    }
  }

  /** The curved arrows on each side of the action bar. */
  private _placeTurnButtons() {
    if (!this._hud) return
    const k = settings().uiSize
    const bar = this._hud.actionBarBounds
    const y = bar.y + Math.max(28 * k, bar.height / 2)
    const gap = (16 + 22) * k
    for (const b of this._turnButtons) b.scale.set(k)
    this._turnButtons[0]?.position.set(bar.x - gap, y)
    this._turnButtons[1]?.position.set(bar.x + bar.width + gap, y)
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

    // screen shake (the island itself stays still: only the distant
    // islands float)
    const shake = this._shake
    let dx = 0
    let dy = 0
    if (shake.remaining > 0) {
      shake.remaining = Math.max(
        0,
        shake.remaining - this._lastTickInfo.timeSinceLastTick,
      )
      const k = shake.intensity * (shake.remaining / shake.duration)
      dx = (Math.random() * 2 - 1) * k
      dy = (Math.random() * 2 - 1) * k * 0.6
      if (shake.remaining === 0) shake.intensity = 0
    }
    this._updateCamera(this._lastTickInfo.timeSinceLastTick)
    this._updateZoom(this._lastTickInfo.timeSinceLastTick)
    if (this._turn?.follow) this._keepInMiddle(this._turn.follow)
    this._placeWorld(dx, dy)
  }

  protected _onTick() {
    this._updateJuice()
    // the settings are open: the fight waits
    if (this._playing || this._settings) return

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
              // a critical hit is luck: pink, bigger
              event.critical ? MEANING.luck : MEANING.damage,
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
                    MEANING.shield,
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
              MEANING.heal,
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
            MEANING.time,
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
            this._hud.setActions(
              fighter,
              this.combat,
              null,
              this.guide(fighter),
            )
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
              view.setFacing(facingBetween(origin, event.target, view.facing))
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
                  "Intrication !",
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
            this._hud.log(`✧ ${name(event.fighterId)} se disperse`)
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
    this._hud.setPreview(this.movePreview())
    this._hud.setLanding(this.landingPreview())
    this._hud.setActions(
      this._activeHuman,
      this.combat,
      this._mode.type === "action" ? this._mode.action.id : null,
      this._activeHuman ? this.guide(this._activeHuman) : undefined,
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

  /**
   * A click in move mode: the first one plans a walk, the next ones add
   * stops to it (to make it go one way rather than another). A click on
   * the fighter itself cancels the walk.
   */
  private _planWalk(fighter: Fighter, p: Point) {
    if (equals(p, fighter.position)) return this._cancelWalk()
    const command: Command = {
      type: "moveTo",
      fighterId: fighter.id,
      destination: p,
    }
    if (fighter.waypoints.length) command.append = true
    this._command(command)
  }

  /** Cancel the planned walk of the active local fighter. */
  private _cancelWalk() {
    const fighter = this._activeHuman
    if (!fighter?.path.length) return
    this._command({
      type: "moveTo",
      fighterId: fighter.id,
      destination: { ...fighter.position },
    })
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
    // nothing is used on the first click (self actions: then click yourself)
    this._mode =
      this._mode.type === "action" && this._mode.action.id === id
        ? { type: "move" }
        : { type: "action", action }
    this._refreshAll()
  }

  private _selectDivine(id: string) {
    const fighter = this._activeHuman
    if (!fighter || !this._inputReady) return
    // nothing is used on the first click (team powers: then click an ally)
    this._mode =
      this._mode.type === "divine" && this._mode.id === id
        ? { type: "move" }
        : { type: "divine", id }
    this._refreshAll()
  }

  /**
   * Cells a divine power can be aimed at. A power on the whole team is
   * confirmed by a click on one of its fighters (no use on a misclick).
   */
  private _divineCells(id: string): Point[] {
    const divine = DIVINE_ACTIONS[id]
    const team = this._activeHuman?.team
    switch (divine.target) {
      case "fighter":
        return this.combat.aliveFighters.map((f) => f.position)
      case "none":
        return this.combat.aliveFighters
          .filter((f) => f.team === team)
          .map((f) => f.position)
      default:
        return this.combat.board.cells
          .filter((c) => this.combat.fightersAt(c).length === 0)
          .map((c) => ({ x: c.x, y: c.y }))
    }
  }

  private _onCellDown(p: Point, button: number) {
    if (this._settings) return
    // the right button cancels on release, unless it dragged the camera
    if (button === 2) return
    if (!this.allows({ type: "cell", at: p })) return
    const fighter = this._activeHuman
    if (!fighter) return

    switch (this._mode.type) {
      case "move":
        this._planWalk(fighter, p)
        break
      case "action": {
        const action = this._mode.action
        // a click out of reach cancels the action instead of failing it
        const valid = this.combat
          .getValidTargets(fighter, action)
          .some((c) => equals(c, p))
        if (!valid) {
          this._mode = { type: "move" }
          this._refreshAll()
          break
        }
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
        const cells = this._divineCells(id)
        if (cells.some((c) => equals(c, p)))
          this._command({
            type: "useDivine",
            fighterId: fighter.id,
            divineId: id,
            target: DIVINE_ACTIONS[id].target === "none" ? null : p,
          })
        this._mode = { type: "move" }
        this._refreshAll()
        break
      }
    }
  }

  private _onKey(e: KeyboardEvent) {
    if (this._settings) return
    if (e.key === "f" || e.key === "F") return this._toggleSpeed()
    if ("qQeEvV".includes(e.key) && !this.allows({ type: "camera" })) return
    if (e.key === "q" || e.key === "Q") return this.turnCamera(-1)
    if (e.key === "e" || e.key === "E") return this.turnCamera(1)
    if (e.key === "v" || e.key === "V") return this.resetView()
    const fighter = this._activeHuman
    if (!fighter) return
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      if (this.allows({ type: "pass", key: true })) this._pass()
    } else if (e.key === "Escape") {
      this._mode = { type: "move" }
      this._refreshAll()
    } else if (e.key === "Backspace") {
      e.preventDefault()
      this._cancelWalk()
    } else if (e.key === "c" || e.key === "C") {
      const sprint = this.combat.actionsOf(fighter).find((a) => a.movement)
      if (sprint && this.allows({ type: "action", id: sprint.id }))
        this._selectAction(sprint.id)
    } else if (/^[1-9]$/.test(e.key)) {
      const action = this.combat.actionsOf(fighter)[Number(e.key) - 1]
      if (action && this.allows({ type: "action", id: action.id }))
        this._selectAction(action.id)
    }
  }

  private _toggleSpeed() {
    this._speed = this._speed >= 4 ? 1 : this._speed * 2
    this._hud.setSpeed(this._speed)
  }

  private _onHover() {
    this._refreshOverlay()
    this._refreshCard()
    // the cost of a move goes to the HUD, out of the way of the board
    this._hud.setPreview(this.movePreview())
    this._hud.setLanding(this.landingPreview())
    const fighter = this._hovered ? this._fighterAt(this._hovered) : null
    if (fighter) {
      const statuses = fighter.statuses.map((s) =>
        describeStatus(s.id, s.turns, s.value),
      )
      const pos = this._world.toGlobal(this._center(fighter.id, -60))
      const wait = Math.max(
        0,
        Math.round(fighter.nextActionAt - this.combat.time),
      )
      this._hud.showTooltipAt(
        [
          `${fighter.name} — ${describeHp(fighter, this.combat)}`,
          `Prochain tour dans ${tag("time", `${wait} temps`)}`,
          ...statuses,
        ].join("\n"),
        pos,
      )
    } else {
      this._hud.hideTooltip()
    }
  }

  /**
   * Where the active fighter lands on the timeline if it does what the
   * player is pointing at: a hovered action button (or Passer), or the
   * selected action on the hovered cell. A sprint depends on its cell: no
   * preview until a reachable cell is hovered.
   */
  landingPreview(): { fighter: Fighter; delay: number } | null {
    const fighter = this._activeHuman
    if (!fighter || !this._inputReady) return null
    const choice =
      this._hoverChoice ??
      (this._mode.type === "action" ? this._mode.action.id : null)
    if (!choice) return null
    if (choice === "pass")
      return { fighter, delay: this.combat.passDelay(fighter) }
    const action = this.combat.actionsOf(fighter).find((a) => a.id === choice)
    if (!action) return null
    if (action.movement) {
      // a sprint lands where it goes: nothing until a reachable cell is
      // hovered (not on its button, not on a cell out of reach)
      if (this._hoverChoice || !this._hovered) return null
      const delay = this.combat.turnDelayOf(fighter, {
        type: "action",
        actionId: choice,
        target: this._hovered,
      })
      return delay === null ? null : { fighter, delay }
    }
    const delay = this.combat.turnDelayOf(fighter, {
      type: "action",
      actionId: choice,
    })
    return delay === null ? null : { fighter, delay }
  }

  /**
   * Time cost of moving the active fighter to the hovered cell, in the
   * meaning colors (cells in blue, time in yellow): a planned walk (free
   * to plan, the steps take timeline time, in how many of its turns) or a
   * sprint (at once, the turn ends, worth how many actions).
   */
  movePreview(): Segment[] | null {
    const fighter = this._activeHuman
    const hovered = this._hovered
    if (!fighter || !this._inputReady || !hovered) return null
    if (equals(hovered, fighter.position)) return null
    const cells = (n: number) => ({
      text: `${n} case${n > 1 ? "s" : ""}`,
      color: MEANING.move,
    })
    const time = (t: number) => ({
      text: `${Math.round(t)} temps`,
      color: MEANING.time,
    })

    if (this._mode.type === "move") {
      const append = fighter.waypoints.length > 0
      const path = this.combat.planWalk(fighter, hovered, append)
      if (!path?.length) return null
      const t = this.combat.movementTime(fighter, path)
      const turns = this.combat.turnsFor(fighter, t)
      return [
        {
          text: append
            ? `Étape ${fighter.waypoints.length + 1} · trajet total  `
            : "Marche  ",
        },
        cells(path.length),
        { text: " · " },
        time(t),
        { text: " · arrivée en " },
        { text: `${turns} tour${turns > 1 ? "s" : ""}`, color: MEANING.time },
        { text: " (le tour continue)", color: COLORS.muted },
      ]
    }

    if (this._mode.type === "action" && this._mode.action.movement) {
      const path = this.combat
        .movementPaths(fighter, this._mode.action.movement.maxSteps)
        .get(keyOf(hovered))
      if (!path) return null
      const t = this.combat.movementTime(fighter, path)
      const actions = this.combat.actionsFor(fighter, t)
      return [
        { text: "Course  " },
        cells(path.length),
        { text: " · " },
        time(t),
        { text: " · arrivée immédiate, " },
        { text: "le tour se termine", color: MEANING.time },
        {
          text: ` (≈ ${actions.toFixed(1).replace(".", ",")} action)`,
          color: COLORS.muted,
        },
      ]
    }
    return null
  }

  /**
   * What the player is nudged towards: the actions with a worthwhile
   * target; else the move zone (no walk planned yet); else walking on.
   */
  guide(fighter: Fighter) {
    const actions = usefulActions(this.combat, fighter)
    const walking = fighter.path.length > 0
    return {
      actions,
      moveZone: actions.length === 0 && !walking,
      pass: actions.length === 0 && walking,
    }
  }

  private _refreshOverlay() {
    const highlights: Highlight[] = []
    const fighter = this._activeHuman
    const hovered = this._hovered

    // planned walks of the local fighters: a bold line from the fighter,
    // a ring on each stop, the destination filled
    const local = this.localTeams
    for (const f of this.combat.aliveFighters) {
      if (local.includes(f.team) && f.path.length) {
        const destination = f.path[f.path.length - 1]
        highlights.push({
          cells: [destination],
          color: COLORS.path,
          alpha: 0.45,
          inset: 4,
          outline: true,
        })
        highlights.push({
          cells: f.waypoints.filter((w) => !equals(w, destination)),
          color: COLORS.path,
          alpha: 0.35,
          inset: 10,
          outline: true,
        })
        highlights.push({
          cells: [f.position, ...f.path],
          color: COLORS.path,
          alpha: 0.95,
          trail: true,
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
          // the zone only when moving is what to do (the cells still work)
          if (this.guide(fighter).moveZone)
            highlights.push({
              cells: reachable,
              color: COLORS.reachable,
              alpha: 0.3,
              inset: 6,
            })
          if (hovered && reachable.some((c) => equals(c, hovered))) {
            // the leg the click would add (or the walk it would plan)
            const append = fighter.waypoints.length > 0
            const path = this.combat.planWalk(fighter, hovered, append)
            if (path)
              highlights.push({
                cells: append ? path.slice(fighter.path.length) : path,
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
          const cells = this._divineCells(this._mode.id)
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

/** A round button with a curved arrow (1: clockwise). */
function turnButton(dir: 1 | -1) {
  const view = new Container()
  view.eventMode = "static"
  view.cursor = "pointer"
  const draw = (hover: boolean) => {
    const r = 11
    // the arc ends at the arrow head, going the way the board turns
    const start = (-150 * Math.PI) / 180
    const end = (120 * Math.PI) / 180
    const flip = (x: number) => x * dir
    const at = (a: number, d = r) => ({
      x: flip(Math.cos(a) * d),
      y: Math.sin(a) * d,
    })
    const tip = at(end)
    const tangent = { x: flip(-Math.sin(end)), y: Math.cos(end) }
    const out = { x: flip(Math.cos(end)), y: Math.sin(end) }
    const color = hover ? COLORS.text : COLORS.muted
    const g = new Graphics()
      .circle(0, 0, 22)
      .fill({ color: COLORS.panel, alpha: 0.85 })
      .stroke({ width: 2, color: hover ? COLORS.text : COLORS.panelBorder })
    const from = at(start)
    g.moveTo(from.x, from.y)
    for (let i = 1; i <= 24; i++) {
      const p = at(start + ((end - start) * i) / 24)
      g.lineTo(p.x, p.y)
    }
    g.stroke({ width: 3, color, cap: "round" })
    g.poly([
      tip.x + tangent.x * 8,
      tip.y + tangent.y * 8,
      tip.x + out.x * 7 - tangent.x * 2,
      tip.y + out.y * 7 - tangent.y * 2,
      tip.x - out.x * 7 - tangent.x * 2,
      tip.y - out.y * 7 - tangent.y * 2,
    ]).fill({ color })
    for (const old of view.removeChildren()) old.destroy()
    view.addChild(g)
  }
  draw(false)
  view.on("pointerover", () => draw(true))
  view.on("pointerout", () => draw(false))
  return view
}
