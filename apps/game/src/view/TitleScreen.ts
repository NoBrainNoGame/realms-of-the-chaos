import * as booyah from "@ghom/booyah"
import { Board, createRng } from "@realms/engine"
import { BlurFilter, Container, Sprite } from "pixi.js"
import { arcadeBest } from "../storage"
import Backdrop from "./Backdrop"
import BoardView from "./BoardView"
import { softCircle } from "./effects"
import { COLORS, camera, ISO, ISO_PITCH, resetCamera, toScreen } from "./theme"
import { Menu, type MenuItem, text } from "./ui"
import ViewChip from "./ViewChip"

/** Phrases shown under the title, one per visit (lore: see docs). */
export const TAGLINES = [
  "Exister, c'est interagir.",
  "Rien n'a besoin d'un témoin pour être.",
  "Entre le cristal et la cendre, il y a la vie.",
  "Chaque île tient par les liens qui la traversent.",
  "Ce qui ne touche plus rien s'effiloche.",
  "Pourquoi quelque chose, plutôt que rien ?",
]

export type TitleChoice = "skirmish" | "local" | "arcade" | "gallery"

/** The island of the title screen turns a quarter this often (ms). */
export const TITLE_TURN_EVERY = 7000
const TITLE_TURN_DURATION = 420
/** How far the view leans towards the mouse at the screen's edges (°). */
export const TITLE_TILT = { pitch: 6, yaw: 6 }

export const TITLE_MENU: MenuItem[] = [
  { id: "skirmish", label: "Escarmouche" },
  { id: "local", label: "Duel local" },
  { id: "arcade", label: "Arcade" },
  { id: "online", label: "Duel en ligne", hint: "bientôt", enabled: false },
  { id: "codex", label: "Chroniques", hint: "bientôt", enabled: false },
  { id: "gallery", label: "Galerie" },
]

const DESCRIPTIONS: Record<string, string> = {
  skirmish: "Votre équipe contre l'IA, à la difficulté de votre choix.",
  local: "Deux joueurs, un seul écran : chacun son équipe, chacun son tour.",
  arcade:
    "Les Marées : des vagues de plus en plus fortes. Jusqu'où tiendrez-vous ?",
  gallery: "Les Échos sous toutes leurs coutures.",
}

interface TitleEvents extends booyah.BaseCompositeEvents {
  choose: [choice: TitleChoice]
}

/**
 * Title screen: a floating island over the starry void, the game's name
 * and the main menu (mouse or arrows + Enter).
 */
export default class TitleScreen extends ViewChip<TitleEvents> {
  private _island!: Container
  private _halo!: Sprite
  private _title!: Container
  private _menu!: Menu
  private _description!: ReturnType<typeof text>
  private _record!: ReturnType<typeof text>
  private _time = 0
  private _islandBase = { x: 0, y: 0 }
  /** The board inside the island, moved so its middle stays put. */
  private _stage!: Container
  private _backdrop!: Backdrop
  private _board!: BoardView
  private _boardCenter = { x: 0, y: 0 }
  /** Seed of the island shown (a new one at each quarter turn). */
  private _islandSeed = 0
  /** Pitch and yaw aimed at by the mouse (eased). */
  private _aim = { pitch: ISO_PITCH, yaw: 0 }
  /** Eased lean (before the swing of a quarter turn). */
  private _lean = { pitch: ISO_PITCH, yaw: 0 }
  private _drawn = { ...ISO }
  private _nextTurn = TITLE_TURN_EVERY
  private _turn: { to: number; elapsed: number; swapped: boolean } | null = null

  constructor(private readonly _seed = Math.floor(Math.random() * 1e6)) {
    super()
  }

  get menu() {
    return this._menu
  }

  protected _onActivate() {
    resetCamera()
    this._backdrop = new Backdrop()
    this._activateChildChip(this._backdrop)

    // a random floating island, slowly bobbing
    this._halo = new Sprite(softCircle())
    this._halo.anchor.set(0.5)
    this._halo.tint = 0x7048e8
    this._halo.alpha = 0.35
    this._halo.blendMode = "add"
    this._island = new Container()
    // the distant islands nearer than this one pass in front of it
    this._container.addChild(this._halo, this._island, this._backdrop.front)
    this._buildIsland(this._seed)

    // title with a soft glow
    this._title = new Container()
    const glow = text("Realms of the Chaos", 64, 0xb197fc, {
      fontWeight: "700",
    })
    glow.anchor.set(0.5)
    glow.alpha = 0.9
    glow.blendMode = "add"
    glow.filters = [new BlurFilter({ strength: 10, quality: 3 })]
    const title = text("Realms of the Chaos", 64, COLORS.text, {
      fontWeight: "700",
      stroke: { color: 0x15121f, width: 8 },
    })
    title.anchor.set(0.5)
    const tagline = text(
      TAGLINES[this._seed % TAGLINES.length],
      18,
      COLORS.muted,
      { fontStyle: "italic" },
    )
    tagline.anchor.set(0.5)
    tagline.y = 56
    this._title.addChild(glow, title, tagline)

    this._menu = new Menu(TITLE_MENU, {
      width: 280,
      height: 42,
      gap: 8,
      onSelect: (id) => this.emit("choose", id as TitleChoice),
      onFocus: (item) => this._describe(item.id),
    })
    this._description = text("", 14, COLORS.muted, {
      align: "center",
      wordWrap: true,
      wordWrapWidth: 320,
    })
    this._description.anchor.set(0.5, 0)
    this._describe(this._menu.focused.id)

    const best = arcadeBest()
    this._record = text(
      best
        ? `Record d'Arcade : ${best.score} points (${best.waves} Marée${best.waves > 1 ? "s" : ""})`
        : "",
      13,
      COLORS.muted,
    )
    this._record.anchor.set(1, 1)

    this._container.addChild(
      this._title,
      this._menu,
      this._description,
      this._record,
    )
    this._subscribe(window, "keydown", (e: KeyboardEvent) => {
      if (this._menu.handleKey(e.key)) e.preventDefault()
    })
    // the view leans slightly towards the mouse
    this._subscribe(window, "pointermove", (e: PointerEvent) => {
      const u = Math.max(
        -1,
        Math.min(1, (e.clientX / window.innerWidth) * 2 - 1),
      )
      const v = Math.max(
        -1,
        Math.min(1, (e.clientY / window.innerHeight) * 2 - 1),
      )
      this._aim = {
        pitch: ISO_PITCH + v * TITLE_TILT.pitch,
        yaw: -u * TITLE_TILT.yaw,
      }
    })
  }

  protected _onTerminate() {
    resetCamera()
  }

  /** A random island with some water, replacing the one shown. */
  private _buildIsland(seed: number) {
    if (this._board) this._terminateChildChip(this._board)
    this._stage?.destroy({ children: true })
    this._islandSeed = seed
    let board = Board.generate(createRng(seed))
    for (
      let i = 1;
      i < 30 && !board.cells.some((c) => c.terrain === "water");
      i++
    ) {
      board = Board.generate(createRng(seed + i))
    }
    const entities = new Container()
    entities.sortableChildren = true
    this._stage = new Container()
    this._island.addChild(this._stage)
    this._boardCenter = { x: (board.width - 1) / 2, y: (board.height - 1) / 2 }
    this._board = new BoardView(board, entities, new Container(), seed)
    this._activateChildChip(this._board, {
      context: { container: this._stage },
    })
    this._stage.addChild(entities)
    this._drawn = { ...camera }
    this._centerStage()
    this._focusBackdrop()
  }

  /** The distant islands are around the middle of this one. */
  private _focusBackdrop() {
    const middle = toScreen(this._boardCenter, 0, ISO)
    const scale = this._island.scale.x
    this._backdrop.focus = {
      x: this._islandBase.x + middle.x * scale,
      y: this._islandBase.y + middle.y * scale,
    }
  }

  /** Seed of the island shown, for tests. */
  get islandSeed() {
    return this._islandSeed
  }

  /** Pitch and yaw aimed at (the mouse), for tests. */
  get aim(): Readonly<{ pitch: number; yaw: number }> {
    return this._aim
  }

  protected _onTick() {
    const dt = this._lastTickInfo.timeSinceLastTick
    this._time += dt
    this._updateCamera(dt)
    this._place()
  }

  /** A quarter turn every few seconds, and the lean towards the mouse. */
  private _updateCamera(dt: number) {
    this._nextTurn -= dt
    if (!this._turn && this._nextTurn <= 0) {
      this._nextTurn += TITLE_TURN_EVERY
      this._turn = { to: (camera.quarter + 1) % 4, elapsed: 0, swapped: false }
    }
    const k = 1 - Math.exp(-dt / 250)
    for (const key of ["pitch", "yaw"] as const) {
      this._lean[key] += (this._aim[key] - this._lean[key]) * k
      if (Math.abs(this._lean[key] - this._aim[key]) < 0.05)
        this._lean[key] = this._aim[key]
    }
    let swing = 0
    if (this._turn) {
      // small turn out and fade, the quarter, small turn back and show
      const turn = this._turn
      turn.elapsed += dt
      const half = TITLE_TURN_DURATION / 2
      if (!turn.swapped && turn.elapsed >= half) {
        // invisible: the quarter turns and a new island takes its place
        turn.swapped = true
        camera.quarter = turn.to
        this._buildIsland(this._islandSeed + 7919)
      }
      if (turn.elapsed < half) {
        const u = booyah.easeInCubic(turn.elapsed / half)
        swing = 20 * u
        // gone a little before the middle: never seen while it changes
        this._island.alpha =
          1 - booyah.easeInCubic(Math.min(1, turn.elapsed / (half * 0.8)))
      } else {
        const u = booyah.easeOutCubic(Math.min(1, (turn.elapsed - half) / half))
        swing = -20 * (1 - u)
        this._island.alpha = u
      }
      this._backdrop.islandsAlpha = this._island.alpha
      if (turn.elapsed >= TITLE_TURN_DURATION) {
        swing = 0
        this._island.alpha = 1
        this._backdrop.islandsAlpha = 1
        this._turn = null
      }
    }
    camera.pitch = this._lean.pitch
    camera.yaw = this._lean.yaw + swing
    // redraw only for a visible change (a redraw costs a few milliseconds)
    const drawn = this._drawn
    if (
      drawn.quarter === camera.quarter &&
      Math.abs(drawn.pitch - camera.pitch) < 0.1 &&
      Math.abs(drawn.yaw - camera.yaw) < 0.1
    )
      return
    this._drawn = { ...camera }
    this._board.redraw()
    this._centerStage()
  }

  /** Keeps the board's middle where it is in the classic view. */
  private _centerStage() {
    const at = toScreen(this._boardCenter, 0, camera)
    const iso = toScreen(this._boardCenter, 0, ISO)
    this._stage.position.set(iso.x - at.x, iso.y - at.y)
  }

  private _place() {
    const t = this._time / 1000
    this._island.position.set(
      this._islandBase.x,
      this._islandBase.y + Math.sin(t * 0.8) * 8,
    )
    this._halo.alpha = 0.3 + Math.sin(t * 0.5) * 0.08
  }

  protected _onResize(width: number, height: number) {
    const compact = width < 900
    const scale = Math.max(0.45, Math.min(1, height / 1100))
    this._island.scale.set(scale)
    this._islandBase = {
      x: Math.round(compact ? width / 2 : width * 0.33),
      y: Math.round(height * 0.5),
    }
    this._halo.position.set(this._islandBase.x, this._islandBase.y + 40)
    this._focusBackdrop()
    this._halo.scale.set((520 * scale) / 64)

    this._title.position.set(Math.round(width / 2), Math.round(height * 0.13))
    this._title.scale.set(Math.min(1, width / 900))
    const menuX = compact ? width / 2 - 140 : width * 0.7 - 140
    this._menu.position.set(Math.round(menuX), Math.round(height * 0.3))
    this._description.position.set(
      Math.round(menuX + 140),
      Math.round(this._menu.y + this._menu.height + 16),
    )
    this._record.position.set(width - 14, height - 12)
    this._place()
  }

  private _describe(id: string) {
    this._description.text = DESCRIPTIONS[id] ?? ""
  }
}
