import type * as booyah from "@ghom/booyah"
import { CHAPTERS } from "@realms/adventure"
import { Container, Graphics } from "pixi.js"
import { unlockedChapters } from "../adventure/progress"
import { settings } from "../settings"
import { adventureSave } from "../storage"
import Backdrop from "./Backdrop"
import { drawFloatingIsland } from "./islands"
import { COLORS } from "./theme"
import { panel, text } from "./ui"
import ViewChip from "./ViewChip"

interface WorldMapEvents extends booyah.BaseCompositeEvents {
  /** The Ghom sends the hero to a Fragment (chapter id). */
  travel: [id: string, current: boolean]
  back: []
}

export interface MapIsland {
  id: string
  name: string
  /** Open: the hero can be sent there. */
  enabled: boolean
  /** The chapter in progress (travelling there resumes it). */
  current: boolean
}

/** Where the Fragments float on the map (fractions of the screen). */
const SPOTS = [
  [0.14, 0.62],
  [0.3, 0.38],
  [0.46, 0.64],
  [0.6, 0.36],
  [0.74, 0.62],
  [0.86, 0.36],
  [0.5, 0.15],
]

/**
 * The map of the Fragments: the floating islands of the Clair, one per
 * chapter. The Ghom (the player) picks an open one and the hero is carried
 * there, without being told who does it.
 */
export default class WorldMap extends ViewChip<WorldMapEvents> {
  private _islands: { data: MapIsland; node: Container }[] = []
  private _label!: Container
  private _size = { width: 0, height: 0 }

  /** The Fragments and which are open. */
  get islands(): MapIsland[] {
    const save = adventureSave()
    const open = unlockedChapters(save)
    const run = save.run
    return CHAPTERS.map((c) => ({
      id: c.id,
      name: c.place,
      enabled: open.includes(c.id),
      current:
        run && !run.done
          ? run.chapter === c.id
          : !save.completed.includes(c.id),
    }))
  }

  protected _onActivate() {
    this._activateChildChip(new Backdrop())
    this._label = new Container()
    const title = text("Les Fragments", 26, COLORS.text, { fontWeight: "700" })
    title.position.set(24, 20)
    this._container.addChild(title, this._label)
    this.islands.forEach((data, i) => {
      const node = new Container()
      const g = new Graphics()
      drawFloatingIsland(g, 4, 11 + i * 7)
      g.scale.set(0.7)
      node.addChild(g)
      node.alpha = data.enabled ? 1 : 0.3
      if (data.enabled) {
        node.eventMode = "static"
        node.cursor = "pointer"
        node.on("pointertap", () => this.travel(data.id))
        node.on("pointerover", () => this._show(data))
      }
      node.label = `island:${data.id}`
      const name = text(data.name, 14, data.current ? 0xffe066 : COLORS.muted, {
        wordWrap: true,
        wordWrapWidth: 170,
        align: "center",
      })
      name.anchor.set(0.5, 0)
      name.position.set(0, 70)
      node.addChild(name)
      this._container.addChild(node)
      this._islands.push({ data, node })
    })
    this._subscribe(window, "keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "m" || e.key === "M")
        this.emit("back")
    })
    this._place()
  }

  protected _onResize(width: number, height: number) {
    this._size = { width, height }
    this._place()
  }

  /** Sends the hero to a Fragment, if open. */
  travel(id: string) {
    const found = this._islands.find((i) => i.data.id === id)
    if (!found?.data.enabled) return false
    this.emit("travel", id, found.data.current)
    return true
  }

  private _show(data: MapIsland) {
    for (const old of this._label.removeChildren()) old.destroy()
    const c = CHAPTERS.find((x) => x.id === data.id)
    const line = text(
      `${c?.number === 0 ? "Prologue" : `Chapitre ${c?.number}`} · ${c?.title} — ${data.current ? "reprendre" : "revenir"}`,
      15,
      COLORS.text,
    )
    this._label.addChild(panel(line.width + 24, 36), line)
    line.position.set(12, 8)
  }

  private _place() {
    if (!this._label) return
    const { width, height } = this._size
    this._label.scale.set(settings().uiSize)
    this._label.position.set(24, height - 60 * settings().uiSize)
    this._islands.forEach((it, i) => {
      const [fx, fy] = SPOTS[i % SPOTS.length]
      it.node.position.set(width * fx, height * fy)
    })
  }
}
