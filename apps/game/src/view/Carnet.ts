import type * as booyah from "@ghom/booyah"
import {
  type CarnetEntry,
  carnetEntries,
  type QuestionState,
  START_CARRY,
} from "@realms/adventure"
import { Container } from "pixi.js"
import { settings } from "../settings"
import { adventureSave } from "../storage"
import Backdrop from "./Backdrop"
import { COLORS } from "./theme"
import { Menu, type MenuItem, panel, text } from "./ui"
import ViewChip from "./ViewChip"

interface CarnetEvents extends booyah.BaseCompositeEvents {
  back: []
}

const GLYPH: Record<QuestionState, string> = {
  hidden: "",
  open: "○",
  closed: "●",
  false: "✕",
  noted: "✎",
}

const STATE_TEXT: Record<QuestionState, string> = {
  hidden: "",
  open: "Ouverte",
  closed: "Refermée : une réponse est venue",
  false: "Une réponse tentante, mais fausse, a été retenue",
  noted: "Annotée, non résolue",
}

/** What the hero can read about a question, according to its state. */
export function detailOf(e: CarnetEntry): string {
  const lines = [`${e.id} · ${e.text}`, "", STATE_TEXT[e.state]]
  if (e.state === "closed" && e.answer) lines.push("", e.answer)
  else if (e.state === "false")
    lines.push(
      "",
      "Ce qui a été accepté n'est pas une réponse. La question reste ouverte, et le restera.",
    )
  else if (e.kind === "open")
    lines.push(
      "",
      "Cette question n'a pas de réponse : ni la science ni personne ne sait. Le Carnet la garde ouverte.",
    )
  else if (e.kind === "late")
    lines.push(
      "",
      "Pas encore de réponse. Elle viendra bien plus tard, quand le monde en saura davantage.",
    )
  else lines.push("", "Une réponse se trouve dans cette ère, pour qui cherche.")
  return lines.join("\n")
}

/**
 * Le Carnet des Questions: the questions the hero wrote, open or closed, with
 * what he learnt (read only: nothing here is typed).
 */
export default class Carnet extends ViewChip<CarnetEvents> {
  private _box!: Container
  private _menu: Menu | null = null
  private _detail!: Container
  private _entries: CarnetEntry[] = []
  private _size = { width: 0, height: 0 }

  /** The questions the hero has asked so far. */
  get entries() {
    return this._entries
  }

  get menu() {
    return this._menu
  }

  /** The text of the question read now. */
  get reading(): string {
    const f = this._menu?.focused
    const e = this._entries.find((x) => x.id === f?.id)
    return e ? detailOf(e) : ""
  }

  protected _onActivate() {
    this._activateChildChip(new Backdrop())
    this._box = new Container()
    this._detail = new Container()
    this._container.addChild(this._box)
    const run = adventureSave().run
    this._entries = carnetEntries(run ?? { flags: START_CARRY.flags }).filter(
      (e) => e.state !== "hidden",
    )
    this._render()
    this._subscribe(window, "keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") this.emit("back")
      else if (this._menu?.handleKey(e.key)) e.preventDefault()
    })
  }

  protected _onResize(width: number, height: number) {
    this._size = { width, height }
    this._place()
  }

  private _place() {
    if (!this._box) return
    this._box.scale.set(settings().uiSize)
    this._box.position.set(
      Math.round(this._size.width / 2 - this._box.width / 2),
      Math.max(16, Math.round(this._size.height / 2 - this._box.height / 2)),
    )
  }

  private _render() {
    const body = new Container()
    const title = text("Le Carnet", 32, COLORS.text, { fontWeight: "700" })
    body.addChild(title)
    const items: MenuItem[] = this._entries.map((e) => ({
      id: e.id,
      label: `${GLYPH[e.state]}  ${e.text}`,
    }))
    if (!items.length) {
      const none = text(
        "Le Carnet est vide. Il se remplit des questions que le héros se pose.",
        15,
        COLORS.muted,
        { wordWrap: true, wordWrapWidth: 420 },
      )
      none.y = 56
      body.addChild(none)
    } else {
      this._menu = new Menu(items, {
        width: 440,
        height: 36,
        gap: 6,
        onSelect: () => {},
        onFocus: () => this._read(),
      })
      this._menu.y = 56
      body.addChild(this._menu)
    }
    this._detail.x = 470
    this._detail.y = 56
    body.addChild(this._detail)
    this._read()
    const rest = 29 - this._entries.length
    const foot = text(
      `${rest} question${rest > 1 ? "s" : ""} encore à poser · Échap pour fermer`,
      13,
      COLORS.muted,
    )
    foot.y = body.height + 12
    body.addChild(foot)
    body.position.set(24, 24)
    this._box.addChild(
      panel(body.width + 48, Math.max(body.height + 48, 380)),
      body,
    )
    this._place()
  }

  private _read() {
    for (const c of this._detail.removeChildren()) c.destroy({ children: true })
    const reading = this.reading
    if (!reading) return
    this._detail.addChild(
      text(reading, 15, COLORS.text, { wordWrap: true, wordWrapWidth: 420 }),
    )
  }
}
