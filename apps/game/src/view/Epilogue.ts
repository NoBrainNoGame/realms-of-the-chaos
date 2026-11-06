import type * as booyah from "@ghom/booyah"
import { Container } from "pixi.js"
import { settings } from "../settings"
import Backdrop from "./Backdrop"
import { speakerName, VOICE } from "./StoryScene"
import { COLORS } from "./theme"
import { clearChildren, Menu, panel, text } from "./ui"
import ViewChip from "./ViewChip"

/** A page of an epilogue (same shape as `@realms/adventure`'s `EpiloguePage`). */
export interface EpilogueView {
  title: string
  lines: { who?: string; style: "say" | "narr" | "stage"; text: string }[]
}

export interface EpilogueOptions {
  /** The name of the ending, shown above every page. */
  name: string
  pages: EpilogueView[]
}

interface EpilogueEvents extends booyah.BaseCompositeEvents {
  /** The last page was read. */
  done: []
}

const WIDTH = 680

/**
 * The epilogue of an ending: its pages, one after the other, over the
 * starry backdrop (Enter or the button moves on).
 */
export default class Epilogue extends ViewChip<EpilogueEvents> {
  private _box!: Container
  private _menu: Menu | null = null
  private _index = 0
  private _size = { width: 0, height: 0 }

  constructor(readonly options: EpilogueOptions) {
    super()
  }

  get page() {
    return this._index
  }

  get menu() {
    return this._menu
  }

  /** Moves on to the next page, or ends. */
  advance() {
    if (this._index + 1 >= this.options.pages.length) {
      this.emit("done")
      return
    }
    this._index++
    this._render()
  }

  protected _onActivate() {
    this._activateChildChip(new Backdrop())
    this._box = new Container()
    this._container.addChild(this._box)
    this._render()
    this._subscribe(window, "keydown", (e: KeyboardEvent) => {
      if (this._menu?.handleKey(e.key)) e.preventDefault()
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
    clearChildren(this._box)
    const { name, pages } = this.options
    const page = pages[this._index]
    const body = new Container()
    let y = 0
    const head = text(
      `${name} · ${this._index + 1}/${pages.length}`,
      14,
      COLORS.muted,
    )
    body.addChild(head)
    y += 26
    const title = text(page.title, 22, 0xffe066, { fontWeight: "700" })
    title.position.set(0, y)
    body.addChild(title)
    y += 40
    for (const line of page.lines) {
      if (line.style === "say") {
        const who = line.who ?? ""
        const name = text(speakerName(who), 15, VOICE[who] ?? COLORS.text, {
          fontWeight: "700",
        })
        name.position.set(0, y)
        body.addChild(name)
        y += name.height + 2
      }
      const t = text(
        line.text,
        16,
        line.style === "say"
          ? COLORS.text
          : line.style === "stage"
            ? COLORS.muted
            : 0xc5d8ff,
        {
          wordWrap: true,
          wordWrapWidth: WIDTH - 48,
          lineHeight: 24,
          ...(line.style === "say" ? {} : { fontStyle: "italic" }),
        },
      )
      t.position.set(0, y)
      body.addChild(t)
      y += t.height + 12
    }
    const last = this._index + 1 >= pages.length
    this._menu = new Menu([{ id: "next", label: last ? "Fin" : "Suite" }], {
      width: 240,
      height: 40,
      gap: 8,
      onSelect: () => this.advance(),
    })
    this._menu.position.set(0, y + 6)
    body.addChild(this._menu)
    y += this._menu.height + 14
    body.position.set(24, 24)
    this._box.addChild(panel(WIDTH, y + 48), body)
    this._place()
  }
}
