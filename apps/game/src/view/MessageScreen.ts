import type * as booyah from "@ghom/booyah"
import { Container } from "pixi.js"
import Backdrop from "./Backdrop"
import { COLORS } from "./theme"
import { Menu, type MenuItem, panel, text } from "./ui"
import ViewChip from "./ViewChip"

export interface MessageOptions {
  title: string
  color?: number
  /** Lines of text under the title. */
  lines: string[]
  /** Choices, with an optional description shown under the menu. */
  choices: (MenuItem & { description?: string })[]
}

interface MessageEvents extends booyah.BaseCompositeEvents {
  choose: [id: string]
}

const WIDTH = 520

/**
 * A full screen message over the starry backdrop: a title, a few lines and
 * a choice (arcade summaries, game over…). Keyboard: arrows and Enter.
 */
export default class MessageScreen extends ViewChip<MessageEvents> {
  private _box!: Container
  private _menu!: Menu
  private _description!: ReturnType<typeof text>

  constructor(readonly options: MessageOptions) {
    super()
  }

  get menu() {
    return this._menu
  }

  protected _onActivate() {
    this._activateChildChip(new Backdrop())
    this._box = new Container()
    this._container.addChild(this._box)

    const { title, color = COLORS.text, lines, choices } = this.options
    const heading = text(title, 34, color, {
      fontWeight: "700",
      stroke: { color: 0x000000, width: 6 },
    })
    heading.anchor.set(0.5, 0)
    heading.position.set(WIDTH / 2, 22)

    const body = text(lines.join("\n"), 16, COLORS.text, {
      lineHeight: 24,
      align: "center",
      wordWrap: true,
      wordWrapWidth: WIDTH - 48,
    })
    body.anchor.set(0.5, 0)
    body.position.set(WIDTH / 2, 82)

    const menuTop = body.y + body.height + 26
    this._menu = new Menu(choices, {
      width: 360,
      onSelect: (id) => this.emit("choose", id),
      onFocus: (item) => this._describe(item.id),
    })
    this._menu.position.set((WIDTH - 360) / 2, menuTop)

    this._description = text("", 13, COLORS.muted, {
      align: "center",
      wordWrap: true,
      wordWrapWidth: WIDTH - 48,
    })
    this._description.anchor.set(0.5, 0)
    this._description.position.set(WIDTH / 2, menuTop + this._menu.height + 14)
    this._describe(this._menu.focused.id)

    const height = this._description.y + 44
    this._box.addChild(
      panel(WIDTH, height),
      heading,
      body,
      this._menu,
      this._description,
    )

    this._subscribe(window, "keydown", (e: KeyboardEvent) => {
      if (this._menu.handleKey(e.key)) e.preventDefault()
    })
  }

  protected _onResize(width: number, height: number) {
    this._box.position.set(
      Math.round(width / 2 - WIDTH / 2),
      Math.max(20, Math.round(height / 2 - this._box.height / 2)),
    )
  }

  private _describe(id: string) {
    const choice = this.options.choices.find((c) => c.id === id)
    this._description.text = choice?.description ?? ""
  }
}
