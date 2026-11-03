import type * as booyah from "@ghom/booyah"
import { Board, createRng } from "@realms/engine"
import { BlurFilter, Container, Sprite } from "pixi.js"
import { arcadeBest } from "../storage"
import Backdrop from "./Backdrop"
import BoardView from "./BoardView"
import { softCircle } from "./effects"
import { COLORS } from "./theme"
import { Menu, type MenuItem, text } from "./ui"
import ViewChip from "./ViewChip"

/** Phrases shown under the title, one per visit (lore: see docs). */
export const TAGLINES = [
  "Ce qui n'est pas regardé n'existe pas encore.",
  "Derrière le Voile, tout est possible à la fois.",
  "Chaque île tient par le regard de son Ghom.",
  "Les Échos se demandent ce qu'ils sont quand plus personne ne les voit.",
  "Pourquoi quelque chose, plutôt que rien ?",
]

export type TitleChoice = "skirmish" | "local" | "arcade" | "gallery"

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
  arcade: "Des vagues de plus en plus fortes. Jusqu'où tiendrez-vous ?",
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

  constructor(private readonly _seed = Math.floor(Math.random() * 1e6)) {
    super()
  }

  get menu() {
    return this._menu
  }

  protected _onActivate() {
    this._activateChildChip(new Backdrop())

    // a random floating island, slowly bobbing
    this._halo = new Sprite(softCircle())
    this._halo.anchor.set(0.5)
    this._halo.tint = 0x7048e8
    this._halo.alpha = 0.35
    this._halo.blendMode = "add"
    this._island = new Container()
    const entities = new Container()
    entities.sortableChildren = true
    const top = new Container()
    const board = Board.generate(createRng(this._seed))
    this._container.addChild(this._halo, this._island)
    this._activateChildChip(new BoardView(board, entities, top, this._seed), {
      context: { container: this._island },
    })
    this._island.addChild(entities)

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
        ? `Record d'Arcade : ${best.score} points (${best.waves} vague${best.waves > 1 ? "s" : ""})`
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
  }

  protected _onTick() {
    this._time += this._lastTickInfo.timeSinceLastTick
    this._place()
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
