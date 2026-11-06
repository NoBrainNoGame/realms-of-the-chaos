import type * as booyah from "@ghom/booyah"
import { CHAPTERS, ERAS } from "@realms/adventure"
import { Container } from "pixi.js"
import { continuation, unlockedChapters } from "../adventure/progress"
import { settings } from "../settings"
import { adventureSave } from "../storage"
import Backdrop from "./Backdrop"
import { COLORS } from "./theme"
import { Menu, type MenuItem, panel, text } from "./ui"
import ViewChip from "./ViewChip"

export type ChroniclesChoice =
  /** Resume the run, or start the next open chapter. */
  | { kind: "resume" }
  /** A new game (the hero is created first). */
  | { kind: "new" }
  /** A past chapter replayed in a sandbox: the run is not touched. */
  | { kind: "chapter"; id: string }
  | { kind: "back" }

interface ChroniclesEvents extends booyah.BaseCompositeEvents {
  choose: [choice: ChroniclesChoice]
}

const WIDTH = 560

/**
 * « Chroniques »: resume the chapter in progress, or pick an unlocked
 * chapter of an era again (era with the left/right arrows).
 */
export default class Chronicles extends ViewChip<ChroniclesEvents> {
  private _box!: Container
  private _menu!: Menu
  private _era = 0

  get menu() {
    return this._menu
  }

  get era() {
    return ERAS[this._era]
  }

  protected _onActivate() {
    this._activateChildChip(new Backdrop())
    this._box = new Container()
    this._container.addChild(this._box)
    this._render()
    this._subscribe(window, "keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") this.emit("choose", { kind: "back" })
      else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        this.setEra(this._era + (e.key === "ArrowRight" ? 1 : -1))
      } else if (this._menu.handleKey(e.key)) e.preventDefault()
    })
  }

  setEra(index: number) {
    const clamped = Math.max(0, Math.min(ERAS.length - 1, index))
    if (clamped === this._era) return
    this._era = clamped
    this._render()
  }

  protected _onResize(width: number, height: number) {
    this._place(width, height)
  }

  private _size = { width: 0, height: 0 }
  private _place(width = this._size.width, height = this._size.height) {
    this._size = { width, height }
    if (!this._box) return
    this._box.scale.set(settings().uiSize)
    this._box.position.set(
      Math.round(width / 2 - this._box.width / 2),
      Math.max(16, Math.round(height / 2 - this._box.height / 2)),
    )
  }

  private _render() {
    for (const old of this._box.removeChildren())
      old.destroy({ children: true })
    const save = adventureSave()
    const open = unlockedChapters(save)
    const era = ERAS[this._era]
    const body = new Container()
    let y = 0
    const heading = text("Chroniques", 32, COLORS.text, { fontWeight: "700" })
    body.addChild(heading)
    y += 50
    const sub = text(
      `Ère ${romanOf(era.id)} · ${era.title}  —  ${era.question}`,
      15,
      COLORS.muted,
      { wordWrap: true, wordWrapWidth: WIDTH - 48 },
    )
    sub.y = y
    body.addChild(sub)
    y += sub.height + 16

    const items: MenuItem[] = []
    const next = continuation(save)
    if (next) {
      const id = next.kind === "run" ? next.run.chapter : next.id
      const c = CHAPTERS.find((c) => c.id === id)
      items.push({
        id: "resume",
        label: `${next.kind === "run" ? "Reprendre" : "Continuer"} : ${c?.number === 0 ? "Prologue" : `Chapitre ${c?.number}`} · ${c?.title}`,
      })
    }
    items.push({
      id: "new",
      label: "Nouvelle partie",
      hint: save.body ? "efface la partie" : undefined,
    })
    for (const id of era.chapters) {
      const c = CHAPTERS.find((c) => c.id === id)
      if (!c) continue
      const done = save.completed.includes(id)
      items.push({
        id: `chapter:${id}`,
        label: `${c.number === 0 ? "Prologue" : `Chapitre ${c.number}`} · ${c.title}`,
        hint: done
          ? "rejouer, sans effet sur la partie"
          : open.includes(id)
            ? "en cours"
            : "verrouillé",
        enabled: done,
      })
    }
    items.push({ id: "back", label: "Retour" })

    this._menu = new Menu(items, {
      width: WIDTH - 48,
      height: 38,
      gap: 7,
      onSelect: (id) => {
        if (id === "resume") this.emit("choose", { kind: "resume" })
        else if (id.startsWith("chapter:"))
          this.emit("choose", { kind: "chapter", id: id.slice(8) })
        else if (id === "new") this.emit("choose", { kind: "new" })
        else this.emit("choose", { kind: "back" })
      },
    })
    this._menu.y = y
    body.addChild(this._menu)
    y += this._menu.height + 10
    if (ERAS.length > 1) {
      const nav = text("← → pour changer d'ère", 13, COLORS.muted)
      nav.y = y
      body.addChild(nav)
      y += 24
    }
    body.position.set(24, 24)
    this._box.addChild(panel(WIDTH, y + 48), body)
    this._place()
  }
}

const romanOf = (n: number) => ["", "I", "II", "III", "IV", "V"][n] ?? String(n)
