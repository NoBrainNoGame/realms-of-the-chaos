import type * as booyah from "@ghom/booyah"
import {
  activeEncounters,
  choose,
  companionsOf,
  type Encounter,
  type ExamineLine,
  enter,
  examine,
  explorationOf,
  exploring,
  type FightReport,
  type FightSpec,
  type Frame,
  finishFight,
  frame,
  next,
  type ObjectiveResult,
  overcome,
  pending,
  type Run,
  wanderFight,
} from "@realms/adventure"
import { Board, type CharacterPreset, type Point } from "@realms/engine"
import { Container, Graphics, Sprite } from "pixi.js"
import { puppetId, reportOf } from "../adventure/fight"
import { saveRun } from "../adventure/progress"
import { settings } from "../settings"
import Backdrop from "./Backdrop"
import BoardView, { COLUMN_BOTTOM, DEPTH, depthOf } from "./BoardView"
import type FightScene from "./FightScene"
import { facingBetween, Puppet } from "./Puppet"
import { speakerName, VOICE } from "./StoryScene"
import { characterTexture } from "./textures"
import {
  COLORS,
  ISO,
  PUPPET_SCALE,
  resetCamera,
  screenFacing,
  TILE_HEIGHT,
  TILE_WIDTH,
  toScreen,
} from "./theme"
import { clearChildren, Menu, type MenuItem, panel, text } from "./ui"
import ViewChip from "./ViewChip"

interface ExplorationEvents extends booyah.BaseCompositeEvents {
  /** The chapter is over: the end screen follows. */
  done: [run: Run]
  back: []
  /** The player opens the map of the Fragments. */
  map: []
  /** A vacuum decay in a fight of the island: the save is wiped. */
  vacuumDecay: []
  /** The hero moved or the story did (a hook for the world map, the Carnet…). */
  changed: [run: Run]
}

export interface ExplorationOptions {
  run: Run
  /** A replay of a past chapter: nothing is saved. */
  sandbox?: boolean
  /** The fight scene for a spec (its end actions are the Adventure's). */
  makeFight: (spec: FightSpec, run: Run) => FightScene
  /** What the hero says on arriving by the map (the Ghom's teleport). */
  arrival?: string[]
}

/** Time to cross one cell (ms). */
const STEP_MS = 210
/** Pause between two strolls of a wanderer (ms). */
const STROLL = [1200, 3000] as const
const BOX_WIDTH = 760

interface Actor {
  id: string
  node: Container
  puppet: Puppet
  cell: Point
  from: Point
  to: Point | null
  t: number
  path: Point[]
}

type Mode = "walk" | "story" | "look" | "debrief" | "fight"

const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y
const near = (a: Point, b: Point) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1

/** How an encounter is reached: walked onto, or walked up to. */
const reachedOn = (e: Encounter) => !e.actor && !e.wander && !e.examine

/**
 * The island of a chapter, walked: click to move (no cost, no timeline), the
 * companions follow, characters are walked up to, zones trigger the scenes,
 * objects are examined, wanderers can be fought. The story plays on the island
 * (a text box with the speaker's portrait and gesture buttons) and the fights
 * happen on site, on a board cut out of the island.
 */
export default class ExplorationScene extends ViewChip<ExplorationEvents> {
  private _run: Run
  private _mode: Mode = "walk"
  private _board!: Board
  private _view!: BoardView
  private _backdrop!: Backdrop
  private _stage = new Container()
  private _world = new Container()
  private _entities = new Container()
  private _marks = new Container()
  private _hits = new Container()
  private _box = new Container()
  private _menu: Menu | null = null
  private _size = { width: 0, height: 0 }
  private _fit = { scale: 1, x: 0, y: 0 }

  private _hero!: Actor
  private _companions: Actor[] = []
  private _npcs = new Map<string, Actor>()
  private _wanderers = new Map<
    string,
    { actor: Actor; home: Point; wait: number }
  >()
  private _trail: Point[] = []
  private _target: Encounter | null = null
  private _marked: { g: Graphics; base: number; id: string }[] = []
  private _time = 0
  private _autoIn = 0
  private _fight: FightScene | null = null
  private _wanderFight: Encounter | null = null
  private _looks: ExamineLine[] = []
  private _debrief: ObjectiveResult[] = []
  private _speaker: Graphics | null = null
  private _speaking: Actor | null = null
  private _finished = false

  constructor(private readonly _options: ExplorationOptions) {
    super()
    this._run = _options.run
  }

  // ─── What tests and the world map can read ────────────────────────────────

  get run() {
    return this._run
  }

  get mode() {
    return this._mode
  }

  get frame(): Frame {
    return frame(this._run)
  }

  get menu() {
    return this._menu
  }

  get heroCell(): Point {
    return this._hero.cell
  }

  get fight() {
    return this._fight
  }

  get board() {
    return this._board
  }

  get companionCells() {
    return this._companions.map((a) => a.cell)
  }

  /** Cells of what is on the island now: encounters (and wanderers). */
  get placed(): { id: string; at: Point }[] {
    return activeEncounters(this._run).map((e) => ({
      id: e.id,
      at: this._wanderers.get(e.id)?.actor.cell ?? e.at,
    }))
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  protected _onActivate() {
    resetCamera()
    const ex = explorationOf(this._run)
    if (!ex) throw new Error(`Chapter ${this._run.chapter} has no island`)
    this._board = Board.fromAscii(ex.island)
    this._backdrop = new Backdrop()
    this._activateChildChip(this._backdrop)
    this._entities.sortableChildren = true
    this._marks.sortableChildren = true
    this._world.addChild(this._entities, this._marks, this._hits)
    this._stage.addChild(this._world, this._backdrop.front)
    this._container.addChild(this._stage, this._box)

    this._view = new BoardView(
      this._board,
      this._entities,
      this._hits,
      seedOf(this._run),
    )
    this._activateChildChip(this._view, { context: { container: this._world } })
    this._subscribe(this._view, "cellDown", (p: Point, button: number) => {
      if (button === 0) this.clickCell(p)
    })

    this._hero = this._makeActor("heros", this._run, ex.start)
    this._seedTrail(ex.start)
    this._sync()
    this._afterRun()
    const arrival = this._options.arrival ?? []
    if (arrival.length && this._mode === "walk") {
      this._looks = arrival.map((text) => ({
        who: "heros",
        style: "say" as const,
        text,
      }))
      this._mode = "look"
      this._renderBox()
    }
    this._subscribe(window, "keydown", (e: KeyboardEvent) => this._key(e))
  }

  protected _onTick() {
    const dt = this._lastTickInfo.timeSinceLastTick
    this._time += dt
    if (this._fight) return
    for (const a of this._everyone()) this._move(a, dt)
    this._follow()
    this._stroll(dt)
    this._bob()
    if (this._autoIn > 0) {
      this._autoIn -= dt
      if (this._autoIn <= 0) {
        const e = pending(this._run)
        if (e?.auto && this._mode === "walk") this._interact(e)
      }
    }
  }

  protected _onResize(width: number, height: number) {
    this._size = { width, height }
    this._layout()
  }

  // ─── Actors ───────────────────────────────────────────────────────────────

  private _makeActor(
    who: string,
    run: Run,
    cell: Point,
    art: string | CharacterPreset = who,
  ): Actor {
    const puppet = new Puppet(puppetId(art, run))
    puppet.scale.set(PUPPET_SCALE)
    const node = new Container()
    node.addChild(puppet)
    this._entities.addChild(node)
    const actor: Actor = {
      id: who,
      node,
      puppet,
      cell,
      from: cell,
      to: null,
      t: 0,
      path: [],
    }
    this._place(actor)
    return actor
  }

  private _everyone(): Actor[] {
    return [
      this._hero,
      ...this._companions,
      ...this._npcs.values(),
      ...[...this._wanderers.values()].map((w) => w.actor),
    ]
  }

  private _place(a: Actor) {
    const k = a.to ? Math.min(1, a.t / STEP_MS) : 0
    const from = toScreen(a.from, this._board.standHeight(a.from))
    const at = a.to ? a.to : a.from
    const to = toScreen(at, this._board.standHeight(at))
    a.node.position.set(
      from.x + (to.x - from.x) * k,
      from.y + (to.y - from.y) * k,
    )
    a.node.zIndex = depthOf(
      {
        x: a.from.x + (at.x - a.from.x) * k,
        y: a.from.y + (at.y - a.from.y) * k,
      },
      DEPTH.fighter,
    )
  }

  private _face(a: Actor, towards: Point) {
    a.puppet.setFacing(screenFacing(facingBetween(a.cell, towards)))
  }

  /** Walks an actor along its path, one cell at a time. */
  private _move(a: Actor, dt: number) {
    a.puppet.update(dt)
    if (!a.to) {
      const step = a.path.shift()
      if (!step) return
      a.from = a.cell
      a.to = step
      a.t = 0
      this._face(a, step)
    }
    a.t += dt
    a.puppet.walk(90)
    if (a.t >= STEP_MS) {
      a.cell = a.to
      a.from = a.cell
      a.to = null
      a.t = 0
      this._place(a)
      if (a === this._hero) this._arrived()
      return
    }
    this._place(a)
  }

  /** Where the companions stand at first: the cells right behind the hero. */
  private _seedTrail(start: Point) {
    const free = (p: Point, not: Point[]) =>
      this._board.canStand(p) && !not.some((q) => same(p, q))
    const first = this._board.neighbors(start).find((p) => free(p, [start]))
    const second =
      first && this._board.neighbors(first).find((p) => free(p, [start, first]))
    this._trail = [second ?? first ?? start, first ?? start, start]
  }

  /** Each companion walks to the cell the hero left a few steps ago. */
  private _follow() {
    this._companions.forEach((a, i) => {
      if (a.to || a.path.length) return
      const want = this._trail[this._trail.length - 2 - i] ?? this._trail[0]
      if (same(want, a.cell)) return
      if (near(want, a.cell)) a.path = [want]
      else {
        a.cell = a.from = want
        this._place(a)
      }
    })
  }

  /** Wanderers move about their home, one cell now and then. */
  private _stroll(dt: number) {
    for (const w of this._wanderers.values()) {
      w.wait -= dt
      if (w.wait > 0 || w.actor.to || w.actor.path.length) continue
      const e = activeEncounters(this._run).find((x) => x.id === w.actor.id)
      const range = e?.wander?.range ?? 1
      const options = this._board
        .neighbors(w.actor.cell)
        .filter(
          (p) =>
            this._board.canStand(p) &&
            Math.abs(p.x - w.home.x) + Math.abs(p.y - w.home.y) <= range &&
            !same(p, this._hero.cell),
        )
      if (options.length)
        w.actor.path = [options[Math.floor(Math.random() * options.length)]]
      w.wait = STROLL[0] + Math.random() * (STROLL[1] - STROLL[0])
    }
  }

  // ─── What is on the island ────────────────────────────────────────────────

  /** Puts the actors and the markers of the story's present state. */
  private _sync() {
    const run = this._run
    const here = activeEncounters(run)
    // companions
    const want = companionsOf(run)
    for (const a of this._companions.filter((c) => !want.includes(c.id))) {
      a.node.destroy({ children: true })
    }
    this._companions = this._companions.filter((c) => want.includes(c.id))
    for (const id of want) {
      if (this._companions.some((c) => c.id === id)) continue
      const at = this._trail[this._trail.length - 2 - this._companions.length]
      this._companions.push(this._makeActor(id, run, at ?? this._hero.cell))
    }
    // characters and wanderers
    const keep = new Set(here.map((e) => e.id))
    for (const [id, a] of this._npcs)
      if (!keep.has(id)) {
        a.node.destroy({ children: true })
        this._npcs.delete(id)
      }
    for (const [id, w] of this._wanderers)
      if (!keep.has(id)) {
        w.actor.node.destroy({ children: true })
        this._wanderers.delete(id)
      }
    for (const e of here) {
      if (e.actor && !this._npcs.has(e.id)) {
        const a = this._makeActor(e.actor, run, e.at)
        this._npcs.set(e.id, a)
        this._face(a, this._hero.cell)
      }
      if (e.wander && !this._wanderers.has(e.id)) {
        const preset = e.wander.preset
        const a = this._makeActor(e.id, run, e.at, preset)
        this._wanderers.set(e.id, { actor: a, home: e.at, wait: 1500 })
      }
    }
    this._drawMarks(here)
  }

  /** What can be walked to: a gold diamond for the story, a pale one for the rest. */
  private _drawMarks(here: Encounter[]) {
    clearChildren(this._marks)
    this._marked = []
    this._speaker = null
    const story = pending(this._run)
    const zone: Point[] = []
    for (const e of here) {
      const isStory = e === story
      if (isStory) zone.push(...(e.zone ?? []), e.at)
      if (!exploring(this._run)) continue
      const g = new Graphics()
        .poly([0, -9, 6, 0, 0, 9, -6, 0])
        .fill({ color: isStory ? 0xffe066 : 0xced4da, alpha: 0.95 })
        .stroke({ width: 1.5, color: 0x1b1424 })
      const wanderer = this._wanderers.get(e.id)
      g.label = `mark:${e.id}`
      const top = toScreen(e.at, this._board.standHeight(e.at))
      g.position.set(top.x, top.y - (wanderer || e.actor ? 92 : 40))
      g.zIndex = 9999
      this._marks.addChild(g)
      this._marked.push({ g, base: g.y, id: e.id })
    }
    this._view.setHighlights(
      exploring(this._run) && zone.length
        ? [{ cells: zone, color: 0xffe066, alpha: 0.16, outline: true }]
        : [],
    )
  }

  private _bob() {
    for (const m of this._marked) {
      const w = this._wanderers.get(m.id)
      if (w) {
        m.g.x = w.actor.node.x
        m.base = w.actor.node.y - 92
      }
      m.g.y = m.base + Math.sin(this._time / 260) * 3
    }
    if (this._speaker && this._speaking) {
      this._speaker.position.set(
        this._speaking.node.x,
        this._speaking.node.y - 100 + Math.sin(this._time / 200) * 3,
      )
    }
  }

  // ─── Walking ──────────────────────────────────────────────────────────────

  /** A click on a cell of the island. */
  clickCell(p: Point) {
    if (this._mode !== "walk") return
    const here = activeEncounters(this._run)
    const e = here.find((x) => {
      const at = this._wanderers.get(x.id)?.actor.cell ?? x.at
      return same(at, p)
    })
    if (e) this.goTo(e)
    else this.walkTo(p)
  }

  private _blocked = (p: Point) =>
    [...this._npcs.values()].some((a) => same(a.cell, p)) ||
    [...this._wanderers.values()].some((w) => same(w.actor.cell, p))

  /** Walks towards a cell (nothing to pay, nothing to wait for). */
  walkTo(p: Point): boolean {
    if (this._mode !== "walk") return false
    this._target = null
    return this._route(p, false)
  }

  private _route(p: Point, stopBefore: boolean): boolean {
    const hero = this._hero
    // finish the step in progress, then go
    const from = hero.to ?? hero.cell
    const path = this._board.findPath(
      from,
      p,
      (c) => same(c, p) || !this._blocked(c),
    )
    if (!path) return false
    if (stopBefore) path.pop()
    hero.path = path
    return true
  }

  /** Walks up to an encounter, or onto it, and triggers it there. */
  goTo(e: Encounter): boolean {
    if (this._mode !== "walk") return false
    const at = this._wanderers.get(e.id)?.actor.cell ?? e.at
    this._target = e
    if (!reachedOn(e) && near(this._hero.cell, at) && !this._hero.to) {
      this._hero.path = []
      this._interact(e)
      return true
    }
    if (!this._route(at, !reachedOn(e))) {
      this._target = null
      return false
    }
    return true
  }

  /** The hero reached a cell: the zones and the people there answer. */
  private _arrived() {
    const cell = this._hero.cell
    this._trail.push(cell)
    if (this._trail.length > 12) this._trail.shift()
    if (this._mode !== "walk") return
    const here = activeEncounters(this._run)
    const story = pending(this._run)
    if (
      story &&
      (same(story.at, cell) || (story.zone ?? []).some((z) => same(z, cell)))
    ) {
      this._hero.path = []
      this._interact(story)
      return
    }
    for (const w of this._wanderers.values()) {
      const e = here.find((x) => x.id === w.actor.id)
      if (e && near(w.actor.cell, cell)) {
        this._hero.path = []
        this._interact(e)
        return
      }
    }
    const t = this._target
    if (t && !this._hero.path.length) {
      this._target = null
      const at = this._wanderers.get(t.id)?.actor.cell ?? t.at
      if (here.includes(t) && (same(at, cell) || near(at, cell)))
        this._interact(t)
    }
  }

  // ─── Encounters ───────────────────────────────────────────────────────────

  /** What the hero does at an encounter: enter its scene, look, or fight. */
  interact(id: string) {
    const e = activeEncounters(this._run).find((x) => x.id === id)
    if (e && this._mode === "walk") this._interact(e)
  }

  /** Enters the scene the story waits on (as walking into its zone does). */
  enterPending() {
    const e = pending(this._run)
    if (e && this._mode === "walk") this._interact(e)
  }

  private _interact(e: Encounter) {
    this._target = null
    this._hero.path = []
    if (e.scene !== undefined) {
      const npc = this._npcs.get(e.id)
      if (npc) this._face(this._hero, npc.cell)
      this._run = enter(this._run)
      this._save()
      this._mode = "story"
      this._renderBox()
    } else if (e.examine) {
      const out = examine(this._run, e.id)
      this._run = out.run
      this._save()
      this._looks = [...out.lines]
      this._mode = "look"
      this._renderBox()
    } else if (e.wander) {
      this._fightWanderer(e)
    }
  }

  private _fightWanderer(e: Encounter) {
    const w = this._wanderers.get(e.id)
    if (!w) return
    const party = [
      { preset: "@hero", at: this._hero.cell },
      ...this._companions.map((c) => ({ preset: c.id, at: c.cell })),
    ]
    const spec = wanderFight(
      explorationOf(this._run)!.island,
      e,
      w.actor.cell,
      party,
    )
    this._wanderFight = e
    this._startFight(spec)
  }

  // ─── Fights, on site ──────────────────────────────────────────────────────

  private _startFight(spec: FightSpec) {
    const scene = this._options.makeFight(spec, this._run)
    this._fight = scene
    this._mode = "fight"
    this._stage.visible = false
    this._box.visible = false
    this._activateChildChip(scene)
    this._subscribeOnce(scene, "vacuumDecay", () => this.emit("vacuumDecay"))
    this._subscribeOnce(scene, "quit", () => this._leaveFight(null, spec))
    this._subscribeOnce(scene, "endAction", () =>
      this._leaveFight(reportOf(spec, scene.combat), spec),
    )
  }

  private _leaveFight(report: FightReport | null, spec: FightSpec) {
    const scene = this._fight
    if (!scene) return
    this._terminateChildChip(scene)
    this._fight = null
    this._stage.visible = true
    this._box.visible = true
    const wander = this._wanderFight
    this._wanderFight = null
    if (!report) {
      this._mode = wander ? "walk" : "story"
      this._renderBox()
      return
    }
    if (wander) {
      if (report.result === "victory")
        this._run = overcome(this._run, wander.id)
      this._save()
      this._sync()
      this._mode = "walk"
      this._renderBox()
      this.emit("changed", this._run)
      return
    }
    const out = finishFight(this._run, report)
    this._run = out.run
    this._debrief = out.debrief
    this._save()
    this._mode = "debrief"
    this._renderBox()
    void spec
  }

  /** Starts the fight of the card the story shows (a scripted one). */
  startFight() {
    const f = frame(this._run)
    if (f.kind === "fight" && this._mode === "story") this._startFight(f.fight)
  }

  // ─── The story, on the island ─────────────────────────────────────────────

  private _save() {
    if (!this._options.sandbox) saveRun(this._run)
  }

  /** Reads a line, skips a hint, a look or a debrief. */
  advance() {
    if (this._mode === "debrief") {
      this._debrief = []
      this._afterRun()
      return
    }
    if (this._mode === "look") {
      this._looks.shift()
      if (!this._looks.length) {
        this._mode = "walk"
        this._autoIn = pending(this._run)?.auto ? 450 : 0
        this._sync()
        this.emit("changed", this._run)
      }
      this._renderBox()
      return
    }
    if (this._mode !== "story") return
    const f = frame(this._run)
    if (f.kind !== "line" && f.kind !== "hint") return
    this._run = next(this._run)
    this._save()
    this._afterRun()
  }

  /** A gesture: an option or a topic. */
  pick(id: string) {
    if (this._mode !== "story") return
    this._run = choose(this._run, id)
    this._save()
    this._afterRun()
  }

  /** After the story moved: back to the island, or on with the scene. */
  private _afterRun() {
    this._speaking = null
    this._sync()
    if (this._run.done) {
      this._mode = "story"
      this._renderBox()
      return
    }
    if (exploring(this._run)) {
      this._mode = "walk"
      const e = pending(this._run)
      this._autoIn = e?.auto ? 450 : 0
    } else this._mode = "story"
    this._renderBox()
    this.emit("changed", this._run)
  }

  private _key(e: KeyboardEvent) {
    if (this._mode === "walk" && (e.key === "m" || e.key === "M")) {
      this.emit("map")
      return
    }
    if (this._menu) {
      if (this._menu.handleKey(e.key)) e.preventDefault()
      return
    }
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
      e.preventDefault()
      this.advance()
    }
  }

  // ─── The text box ─────────────────────────────────────────────────────────

  private _layout() {
    const { width, height } = this._size
    if (!this._stage) return
    const ui = settings().uiSize
    const w = this._board.width
    const h = this._board.height
    const left = toScreen({ x: 0, y: h - 1 }, 0, ISO).x - TILE_WIDTH / 2
    const right = toScreen({ x: w - 1, y: 0 }, 0, ISO).x + TILE_WIDTH / 2
    const top = -TILE_HEIGHT - 48 - 40
    const bottom =
      toScreen({ x: w - 1, y: h - 1 }, 0, ISO).y +
      TILE_HEIGHT +
      COLUMN_BOTTOM +
      60
    const room = height - 230 * ui
    const scale = Math.max(
      0.5,
      Math.min(1.7, (width - 40) / (right - left), room / (bottom - top)),
    )
    this._fit = {
      scale,
      x: Math.round(width / 2 - ((left + right) / 2) * scale),
      y: Math.round(room / 2 + 14 - ((top + bottom) / 2) * scale),
    }
    this._world.scale.set(scale)
    this._world.position.set(this._fit.x, this._fit.y)
    const middle = toScreen({ x: (w - 1) / 2, y: (h - 1) / 2 })
    this._backdrop.focus = {
      x: this._fit.x + middle.x * scale,
      y: this._fit.y + middle.y * scale,
    }
    this._placeBox()
  }

  private _placeBox() {
    const ui = settings().uiSize
    const { width, height } = this._size
    this._box.scale.set(ui)
    this._box.position.set(
      Math.round(width / 2 - (this._box.width || BOX_WIDTH * ui) / 2),
      Math.round(height - this._box.height - 18 * ui),
    )
  }

  private _renderBox() {
    clearChildren(this._box)
    this._menu = null
    this._speaker?.destroy()
    this._speaker = null
    if (this._mode === "walk" || this._mode === "fight") {
      this._hint()
      return
    }
    const rows = new Container()
    let who: string | undefined
    let name: string | undefined
    let color: number = COLORS.text
    let body = ""
    let style: "say" | "narr" | "stage" = "narr"
    let items: MenuItem[] = []
    let on: (id: string) => void = () => {}
    let more = false

    if (this._mode === "look") {
      const line = this._looks[0]
      who = line.who
      style = line.style ?? (who ? "say" : "narr")
      body = line.text
      more = true
    } else if (this._mode === "debrief") {
      body = this._debrief
        .map(
          (o) =>
            `${o.ok ? o.mark : "·"} ${o.label}${o.text && o.ok ? ` — ${o.text}` : ""}`,
        )
        .join("\n")
      more = true
    } else {
      const f = frame(this._run)
      switch (f.kind) {
        case "line":
          who = f.who
          style = f.style
          body = f.text
          more = true
          break
        case "hint":
          body = `${f.title}\n${f.text}`
          more = true
          break
        case "choice":
          body = f.prompt ?? ""
          items = f.options.map((o) => ({ id: o.id, label: o.text }))
          on = (id) => this.pick(id)
          break
        case "hub":
          body = "De quoi parler ?"
          items = f.topics.map((t) => ({ id: t.id, label: t.title }))
          on = (id) => this.pick(id)
          break
        case "fight":
          body = `${f.fight.title}\n${f.fight.goal}`
          items = [{ id: "fight", label: "Lancer le combat" }]
          on = () => this.startFight()
          break
        case "done":
          if (!this._finished) {
            this._finished = true
            this.emit("done", this._run)
          }
          return
      }
    }

    if (who) {
      name = speakerName(who)
      color = VOICE[who] ?? COLORS.text
      this._speaking =
        who === "heros"
          ? this._hero
          : (this._companions.find((c) => c.id === who) ??
            [...this._npcs.values()].find((n) => n.id === who) ??
            null)
      if (this._speaking && this._speaking !== this._hero)
        this._face(this._speaking, this._hero.cell)
      this._speaker = new Graphics()
        .poly([-6, -8, 6, -8, 0, 2])
        .fill({ color, alpha: 0.95 })
        .stroke({ width: 1.5, color: 0x1b1424 })
      this._speaker.zIndex = 9999
      this._marks.addChild(this._speaker)
    } else this._speaking = null

    const textX = who ? 84 : 20
    let y = 14
    if (name) {
      const n = text(name, 17, color, { fontWeight: "700" })
      n.position.set(textX, y)
      rows.addChild(n)
      y += 26
    }
    const t = text(
      body,
      style === "narr" || style === "stage" ? 16 : 17,
      style === "say" ? COLORS.text : COLORS.muted,
      {
        wordWrap: true,
        wordWrapWidth: BOX_WIDTH - textX - 20,
        fontStyle: style === "say" ? "normal" : "italic",
        lineHeight: 22,
      },
    )
    t.position.set(textX, y)
    rows.addChild(t)
    y += t.height + 14
    if (who) {
      const portrait = new Sprite(characterTexture(puppetId(who, this._run)))
      portrait.scale.set(3)
      portrait.position.set(16, 14)
      rows.addChild(portrait)
      y = Math.max(y, 14 + portrait.height + 8)
    }
    if (items.length) {
      const menu = new Menu(items, {
        width: BOX_WIDTH - 40,
        height: 38,
        gap: 6,
        onSelect: on,
      })
      menu.position.set(20, y)
      rows.addChild(menu)
      this._menu = menu
      y += menu.height + 12
    } else if (more) {
      const hint = text("Entrée ▸", 13, COLORS.muted)
      hint.anchor.set(1, 0)
      hint.position.set(BOX_WIDTH - 20, y - 8)
      rows.addChild(hint)
      y += 14
    }
    const frameBox = panel(BOX_WIDTH, y)
    frameBox.eventMode = "static"
    frameBox.on("pointertap", () => {
      if (!this._menu) this.advance()
    })
    this._box.addChild(frameBox, rows)
    this._placeBox()
  }

  /** A line of help at the foot of the island while walking. */
  private _hint() {
    if (this._mode !== "walk") return
    const here = pending(this._run)
    const t = text(
      here
        ? `Clic : marcher · M : carte · à trouver : ${here.label}`
        : "Clic : marcher, s'approcher, regarder",
      14,
      COLORS.muted,
    )
    this._box.addChild(t)
    t.position.set(0, 0)
    this._placeBox()
  }
}

/** A stable seed for the island's looks (so it does not change at each visit). */
function seedOf(run: Run) {
  let h = 7
  for (const c of run.chapter) h = (h * 31 + c.charCodeAt(0)) % 100000
  return h
}
