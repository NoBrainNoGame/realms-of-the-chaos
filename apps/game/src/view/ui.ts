/**
 * Reusable UI pieces (pixel font texts, panels, buttons, keyboard menus),
 * shared by the HUD and the menu screens.
 */
import {
  Container,
  Graphics,
  Sprite,
  Text,
  type TextStyleOptions,
} from "pixi.js"

import { iconTexture } from "./textures"
import { COLORS, FONT } from "./theme"

export const style = (
  size: number,
  color = COLORS.text,
  extra: TextStyleOptions = {},
): TextStyleOptions => ({
  fontFamily: FONT,
  fontSize: size,
  fill: color,
  ...extra,
})

export const text = (
  value: string,
  size: number,
  color = COLORS.text,
  extra: TextStyleOptions = {},
) => new Text({ text: value, style: style(size, color, extra) })

export function panel(
  width: number,
  height: number,
  border = COLORS.panelBorder,
) {
  return new Graphics()
    .roundRect(0, 0, width, height, 6)
    .fill({ color: COLORS.panel, alpha: 0.92 })
    .stroke({ width: 2, color: border })
}

export interface Button {
  view: Container
  setState(state: { enabled?: boolean; selected?: boolean }): void
  /** Changes the text of a labelled button. */
  setLabel(label: string): void
}

export function button(options: {
  width: number
  height: number
  label?: string
  icon?: string
  hotkey?: string
  /** Icon on the left, label next to it (wide buttons). */
  inline?: boolean
  /** Border color when not selected (combined actions). */
  accent?: number
  onTap: () => void
  onOver?: () => void
  onOut?: () => void
}): Button {
  const view = new Container()
  const bg = new Graphics()
  view.addChild(bg)
  view.eventMode = "static"
  view.cursor = "pointer"

  if (options.icon) {
    const icon = new Sprite(iconTexture(options.icon))
    icon.anchor.set(0.5)
    if (options.inline) {
      icon.scale.set(2)
      icon.position.set(18, options.height / 2)
    } else {
      icon.scale.set(4)
      icon.position.set(
        options.width / 2,
        options.height / 2 - (options.label ? 6 : 0),
      )
    }
    view.addChild(icon)
  }
  let labelText: Text | null = null
  if (options.label) {
    const label = text(
      options.label,
      options.inline ? 12 : options.icon ? 11 : 14,
    )
    if (options.inline) {
      label.anchor.set(0, 0.5)
      label.position.set(34, options.height / 2)
    } else {
      label.anchor.set(0.5)
      label.position.set(
        options.width / 2,
        options.icon ? options.height - 10 : options.height / 2,
      )
    }
    view.addChild(label)
    labelText = label
  }
  if (options.hotkey) {
    const key = text(options.hotkey, 11, COLORS.muted)
    key.position.set(4, 2)
    view.addChild(key)
  }

  let enabled = true
  let selected = false
  let hovered = false
  const draw = () => {
    bg.clear()
      .roundRect(0, 0, options.width, options.height, 6)
      .fill({
        color: selected ? 0x4c3f6b : hovered && enabled ? 0x352b4d : 0x2a2240,
      })
      .stroke({
        width: 2,
        color: selected ? 0xffe066 : (options.accent ?? COLORS.panelBorder),
      })
    view.alpha = enabled ? 1 : 0.4
  }

  view.on("pointertap", () => enabled && options.onTap())
  view.on("pointerover", () => {
    hovered = true
    draw()
    options.onOver?.()
  })
  view.on("pointerout", () => {
    hovered = false
    draw()
    options.onOut?.()
  })
  draw()

  return {
    view,
    setLabel(label) {
      if (labelText) labelText.text = label
    },
    setState(state) {
      enabled = state.enabled ?? enabled
      selected = state.selected ?? selected
      draw()
    },
  }
}

export interface MenuItem {
  id: string
  label: string
  /** Shown next to the label (e.g. "bientôt"). */
  hint?: string
  enabled?: boolean
}

/**
 * A list of buttons driven by the mouse or the keyboard (arrows to move the
 * focus, Enter or Space to choose). The focused button is highlighted.
 */
export class Menu extends Container {
  private _buttons: Button[] = []
  private _focus = 0

  constructor(
    readonly items: MenuItem[],
    private readonly _options: {
      width: number
      height?: number
      gap?: number
      horizontal?: boolean
      onSelect: (id: string) => void
      onFocus?: (item: MenuItem) => void
    },
  ) {
    super()
    const height = _options.height ?? 44
    const gap = _options.gap ?? 10
    items.forEach((item, i) => {
      const b = button({
        width: _options.width,
        height,
        label: item.hint ? `${item.label}  · ${item.hint}` : item.label,
        onTap: () => this.select(i),
        onOver: () => this.setFocus(i),
      })
      b.view.label = `menu:${item.id}`
      if (_options.horizontal) b.view.x = i * (_options.width + gap)
      else b.view.y = i * (height + gap)
      this.addChild(b.view)
      this._buttons.push(b)
    })
    this._focus = Math.max(0, this._next(-1, 1))
    this._refresh()
  }

  get focused(): MenuItem {
    return this.items[this._focus]
  }

  isEnabled(index: number) {
    return this.items[index].enabled !== false
  }

  setEnabled(id: string, enabled: boolean) {
    const item = this.items.find((i) => i.id === id)
    if (item) item.enabled = enabled
    this._refresh()
  }

  setFocus(index: number) {
    if (index === this._focus || !this.isEnabled(index)) return
    this._focus = index
    this._refresh()
    this._options.onFocus?.(this.items[index])
  }

  select(index = this._focus) {
    if (!this.isEnabled(index)) return
    this.setFocus(index)
    this._options.onSelect(this.items[index].id)
  }

  /** Handles a key; returns true when the key was used. */
  handleKey(key: string): boolean {
    const back = this._options.horizontal ? "ArrowLeft" : "ArrowUp"
    const forward = this._options.horizontal ? "ArrowRight" : "ArrowDown"
    if (key === back || key === forward) {
      const next = this._next(this._focus, key === back ? -1 : 1)
      if (next >= 0) this.setFocus(next)
      return true
    }
    if (key === "Enter" || key === " ") {
      this.select()
      return true
    }
    return false
  }

  /** Next enabled item from `from` in `direction`, wrapping (-1 if none). */
  private _next(from: number, direction: number) {
    const n = this.items.length
    for (let step = 1; step <= n; step++) {
      const i = (((from + direction * step) % n) + n) % n
      if (this.isEnabled(i)) return i
    }
    return -1
  }

  private _refresh() {
    for (const [i, b] of this._buttons.entries()) {
      b.setState({ enabled: this.isEnabled(i), selected: i === this._focus })
    }
  }
}

/** Remove and destroy every child of a container. */
export function clearChildren(container: Container) {
  for (const child of container.removeChildren()) {
    child.destroy({ children: true })
  }
}
