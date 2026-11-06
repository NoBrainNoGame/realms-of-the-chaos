import type * as booyah from "@ghom/booyah"
import { CHAPTERS, ERAS } from "@realms/adventure"
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

/** Rows of a column: the most chapters one era has (the prologue counts with era I). */
const ROWS = 7

/**
 * The map of the Fragments: the floating islands of the Clair, one per
 * chapter. The Ghom (the player) picks an open one and the hero is carried
 * there, without being told who does it.
 */
export default class WorldMap extends ViewChip<WorldMapEvents> {
  private _islands: { data: MapIsland; node: Container }[] = []
  private _heads: Container[] = []
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
      g.label = "art"
      node.addChild(g)
      node.alpha = data.enabled ? 1 : 0.3
      if (data.enabled) {
        node.eventMode = "static"
        node.cursor = "pointer"
        node.on("pointertap", () => this.travel(data.id))
        node.on("pointerover", () => this._show(data))
      }
      node.label = `island:${data.id}`
      const name = text(data.name, 11, data.current ? 0xffe066 : COLORS.muted, {
        wordWrap: true,
        wordWrapWidth: 120,
        align: "center",
      })
      name.label = "name"
      // the places still shut keep their secret (their names are long and
      // would pile up over their neighbours)
      name.visible = data.enabled
      name.anchor.set(0.5, 0)
      node.addChild(name)
      this._container.addChild(node)
      this._islands.push({ data, node })
    })
    for (const era of ERAS) {
      const head = text(`Ère ${romanOf(era.id)}`, 14, COLORS.muted, {
        fontWeight: "700",
      })
      head.anchor.set(0.5, 0)
      this._heads.push(head)
      this._container.addChild(head)
    }
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
    // One column per era, the chapters stacked in it (a zigzag keeps the
    // islands apart); everything shrinks to fit the screen.
    const cols = ERAS.length
    const cellW = width / cols
    const top = 120
    const cellH = Math.max(40, (height - top - 90 * settings().uiSize) / ROWS)
    const k = Math.max(0.2, Math.min(0.7, cellW / 200, cellH / 130))
    this._heads.forEach((h, c) => {
      h.position.set(cellW * (c + 0.5), 62)
    })
    this._islands.forEach((it) => {
      const chapter = CHAPTERS.find((c) => c.id === it.data.id)
      const col = Math.max(
        0,
        ERAS.findIndex((e) => e.id === chapter?.era),
      )
      const row = Math.max(0, ERAS[col].chapters.indexOf(it.data.id))
      const zig = row % 2 ? 0.18 : -0.18
      it.node.position.set(
        cellW * (col + 0.5 + zig),
        top + cellH * (row + 0.35),
      )
      it.node.getChildByLabel("art")?.scale.set(k)
      const name = it.node.getChildByLabel("name")
      name?.position.set(0, 88 * k)
    })
  }
}

const romanOf = (n: number) => ["", "I", "II", "III", "IV", "V"][n] ?? String(n)
