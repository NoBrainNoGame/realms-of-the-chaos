import type * as booyah from "@ghom/booyah"
import { Container, Graphics } from "pixi.js"
import {
  type Choice,
  type Settings,
  settings,
  stepChoice,
  TEXT_SIZES,
  UI_SIZES,
  updateSettings,
} from "../settings"
import Backdrop from "./Backdrop"
import { COLORS, MEANING } from "./theme"
import { button, clearChildren, panel, richText, text } from "./ui"
import ViewChip from "./ViewChip"

export interface SettingRow {
  id: keyof Settings
  label: string
  choices: Choice[]
  description: string
}

/** The settings, in order (the volumes and the language will join them). */
export const SETTING_ROWS: SettingRow[] = [
  {
    id: "textSize",
    label: "Taille du texte",
    choices: TEXT_SIZES,
    description: "Tous les textes du jeu : menus, infobulles, journal.",
  },
  {
    id: "uiSize",
    label: "Taille de l'interface",
    choices: UI_SIZES,
    description:
      "Le HUD, les menus et les bulles du tutoriel. Le plateau garde sa taille.",
  },
]

interface SettingsEvents extends booyah.BaseCompositeEvents {
  back: []
  /** A setting changed (the screens behind can relayout). */
  changed: []
}

const WIDTH = 560
const ROW = 52

/**
 * The settings screen: one row per setting, its value chosen with ‹ ›
 * (mouse) or the arrows (keyboard). Every change is saved and shown at once.
 */
export default class SettingsScreen extends ViewChip<SettingsEvents> {
  private _box!: Container
  /** The focused row (the last one is "Retour"). */
  private _focus = 0
  private _size = { width: 0, height: 0 }
  /** Rebuilt on the next tick (never under the pointer's own event). */
  private _dirty = false

  /** `backdrop: false` over a fight (the pause menu). */
  constructor(private readonly _options: { backdrop?: boolean } = {}) {
    super()
  }

  get focus() {
    return this._focus
  }

  protected _onActivate() {
    if (this._options.backdrop !== false)
      this._activateChildChip(new Backdrop())
    this._box = new Container()
    this._container.addChild(this._box)
    this._build()
    this._subscribe(window, "keydown", (e: KeyboardEvent) => {
      if (this.handleKey(e.key)) e.preventDefault()
    })
  }

  protected _onTick() {
    if (this._dirty) this._build()
  }

  protected _onResize(width: number, height: number) {
    this._size = { width, height }
    this._place()
  }

  /** Keyboard: ↑ ↓ choose a row, ← → change it, Enter / Échap go back. */
  handleKey(key: string): boolean {
    const rows = SETTING_ROWS.length
    switch (key) {
      case "ArrowUp":
      case "ArrowDown":
        this._focus =
          (this._focus + (key === "ArrowUp" ? -1 : 1) + rows + 1) % (rows + 1)
        this._dirty = true
        return true
      case "ArrowLeft":
      case "ArrowRight":
        if (this._focus < rows)
          this.change(
            SETTING_ROWS[this._focus].id,
            key === "ArrowLeft" ? -1 : 1,
          )
        return true
      case "Enter":
      case " ":
        if (this._focus === rows) this.emit("back")
        return true
      case "Escape":
        this.emit("back")
        return true
    }
    return false
  }

  /** Moves a setting to its previous (-1) or next (1) value. */
  change(id: keyof Settings, step: number) {
    const row = SETTING_ROWS.find((r) => r.id === id)
    if (!row) return
    const value = stepChoice(row.choices, settings()[id], step)
    if (value === settings()[id]) return
    updateSettings({ [id]: value })
    this.emit("changed")
    // rebuilt: the texts and the box take the new sizes
    this._dirty = true
  }

  private _build() {
    this._dirty = false
    clearChildren(this._box)
    const current = settings()
    const pad = 24
    const heading = text("Réglages", 30, COLORS.text, {
      fontWeight: "700",
      stroke: { color: 0x000000, width: 6 },
    })
    heading.anchor.set(0.5, 0)
    heading.position.set(WIDTH / 2, 20)
    const children: Container[] = [heading]

    let y = heading.y + heading.height + 22
    for (const [i, row] of SETTING_ROWS.entries()) {
      const focused = i === this._focus
      const line = new Container()
      line.label = `setting:${row.id}`
      line.position.set(pad, y)
      line.eventMode = "static"
      line.on("pointerover", () => {
        if (this._focus === i) return
        this._focus = i
        this._dirty = true
      })
      const bg = new Graphics()
        .roundRect(0, 0, WIDTH - pad * 2, ROW, 6)
        .fill({ color: focused ? 0x4c3f6b : 0x2a2240 })
        .stroke({ width: 2, color: focused ? 0xffe066 : COLORS.panelBorder })
      const label = text(row.label, 15)
      label.anchor.set(0, 0.5)
      label.position.set(14, ROW / 2)
      const value = row.choices.find((c) => c.value === current[row.id])
      const shown = text(value?.label ?? "", 15, MEANING.path)
      shown.anchor.set(0.5)
      const right = WIDTH - pad * 2
      shown.position.set(right - 100, ROW / 2)
      const arrow = (step: number, x: number) => {
        const at = row.choices.findIndex((c) => c.value === current[row.id])
        const b = button({
          width: 30,
          height: 30,
          label: step < 0 ? "‹" : "›",
          onTap: () => {
            this._focus = i
            this.change(row.id, step)
          },
        })
        b.view.label = `setting:${row.id}:${step < 0 ? "less" : "more"}`
        b.view.position.set(x, (ROW - 30) / 2)
        b.setState({
          enabled: step < 0 ? at > 0 : at < row.choices.length - 1,
        })
        return b.view
      }
      line.addChild(
        bg,
        label,
        shown,
        arrow(-1, right - 190),
        arrow(1, right - 40),
      )
      children.push(line)
      y += ROW + 10
    }

    // what the focused setting does, then a sample in the game's colors
    const about = SETTING_ROWS[this._focus]?.description ?? ""
    const description = text(about, 13, COLORS.muted, {
      wordWrap: true,
      wordWrapWidth: WIDTH - pad * 2,
    })
    description.position.set(pad, y + 2)
    y = description.y + Math.max(description.height, 18) + 14
    const sample = richText(
      "Aperçu : Eva frappe pour {damage:12} dégâts, Merlin soigne {heal:8} PV, et le prochain tour vient dans {time:40} temps.",
      13,
      { wrap: WIDTH - pad * 2 },
    )
    sample.position.set(pad, y)
    y += sample.height + 22

    const back = button({
      width: 200,
      height: 40,
      label: "Retour",
      onTap: () => this.emit("back"),
      onOver: () => {
        if (this._focus === SETTING_ROWS.length) return
        this._focus = SETTING_ROWS.length
        this._dirty = true
      },
    })
    back.view.label = "settings:back"
    back.view.position.set((WIDTH - 200) / 2, y)
    back.setState({ selected: this._focus === SETTING_ROWS.length })
    y += 40 + pad

    this._box.addChild(
      panel(WIDTH, y),
      ...children,
      description,
      sample,
      back.view,
    )
    this._place()
  }

  private _place() {
    if (!this._box) return
    const { width, height } = this._size
    this._box.scale.set(settings().uiSize)
    this._box.position.set(
      Math.round(width / 2 - this._box.width / 2),
      Math.max(20, Math.round(height / 2 - this._box.height / 2)),
    )
  }
}
