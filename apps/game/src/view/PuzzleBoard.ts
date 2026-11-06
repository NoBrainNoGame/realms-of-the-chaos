import {
  GridSession,
  OrderSession,
  type PuzzleCell,
  type PuzzleSpec,
  sessionOf,
} from "@realms/adventure"
import { Container, Graphics } from "pixi.js"
import { COLORS } from "./theme"
import { button, clearChildren, text } from "./ui"

const CELL = 40
/** After this many wrong checks the story puts an order right by itself. */
const ORDER_TRIES = 3

/**
 * A little puzzle played with clicks: tokens moved on a grid, or items put in
 * order. The logic is the session's; this only draws it and forwards the taps.
 * `onDone` receives the ids of the rules that hold (see the adventure).
 */
export default class PuzzleBoard extends Container {
  readonly session: GridSession | OrderSession
  private readonly _body = new Container()
  private _note = ""
  private _finished = false

  constructor(
    readonly spec: PuzzleSpec,
    private readonly _onDone: (rules: string[]) => void,
  ) {
    super()
    this.session = sessionOf(spec)
    this.addChild(this._body)
    this._draw()
  }

  /** Width the board needs. */
  get need() {
    return this.spec.kind === "grid" ? this.spec.w * CELL : 420
  }

  /** A tap on a cell of the grid. */
  clickCell(x: number, y: number) {
    if (this._finished || !(this.session instanceof GridSession)) return
    this.session.click({ x, y })
    if (this.session.over) this._note = "Plus de déplacement."
    this._draw()
  }

  /** A tap on an item of the order. */
  clickItem(index: number) {
    if (this._finished || !(this.session instanceof OrderSession)) return
    this.session.click(index)
    this._draw()
  }

  /** The "done" button: hands the result to the story. */
  finish() {
    if (this._finished) return
    const s = this.session
    if (s instanceof OrderSession) {
      const c = s.check()
      if (!c.ok) {
        if (s.tries < ORDER_TRIES) {
          this._note = c.correction ?? "Ce n'est pas encore le bon ordre."
          this._draw()
          return
        }
        s.correct()
      }
    }
    this._finished = true
    this._onDone(s.result())
  }

  private _draw() {
    clearChildren(this._body)
    let y = 0
    const s = this.session
    if (s instanceof GridSession) y = this._drawGrid(s)
    else if (s instanceof OrderSession) y = this._drawOrder(s)
    if (this._note) {
      const n = text(this._note, 14, COLORS.muted, {
        wordWrap: true,
        wordWrapWidth: Math.max(this.need, 280),
      })
      n.position.set(0, y)
      this._body.addChild(n)
      y += n.height + 8
    }
    const done = button({
      width: 150,
      height: 32,
      label: s instanceof OrderSession ? "Vérifier" : "Terminer",
      onTap: () => this.finish(),
    })
    done.view.position.set(0, y)
    this._body.addChild(done.view)
  }

  private _drawGrid(s: GridSession) {
    const spec = s.spec
    const marked = (c: PuzzleCell) =>
      (spec.marks ?? []).some((m) =>
        m.cells.some((k) => k.x === c.x && k.y === c.y),
      )
    for (let y = 0; y < spec.h; y++)
      for (let x = 0; x < spec.w; x++) {
        const hole = s.isHole({ x, y })
        const cell = new Graphics()
          .rect(0, 0, CELL - 2, CELL - 2)
          .fill({
            color: hole ? 0x0b0713 : marked({ x, y }) ? 0x3a2f55 : 0x241c36,
          })
          .stroke({ width: 1, color: COLORS.panelBorder })
        cell.position.set(x * CELL, y * CELL)
        if (!hole) {
          cell.eventMode = "static"
          cell.cursor = "pointer"
          cell.on("pointertap", () => this.clickCell(x, y))
        }
        this._body.addChild(cell)
      }
    for (const t of spec.tokens) {
      const at = s.pos.get(t.id) as PuzzleCell
      const mates = s.tokensAt(at)
      const k = mates.findIndex((m) => m.id === t.id)
      const chosen = s.selected === t.id
      const dot = new Graphics()
        .circle(0, 0, 11)
        .fill({ color: chosen ? 0xffe066 : 0x8ce99a })
        .stroke({ width: 2, color: 0x1b1424 })
      dot.position.set(at.x * CELL + 14 + k * 9, at.y * CELL + 14 + k * 9)
      dot.eventMode = "static"
      dot.cursor = "pointer"
      dot.on("pointertap", () => this.clickCell(at.x, at.y))
      this._body.addChild(dot)
    }
    let y = spec.h * CELL + 6
    const names = spec.tokens.map((t) => t.label).join(" · ")
    const legend = text(
      `${names}${spec.moves ? ` — déplacements : ${s.movesLeft}` : ""}`,
      13,
      COLORS.muted,
      { wordWrap: true, wordWrapWidth: Math.max(this.need, 280) },
    )
    legend.position.set(0, y)
    this._body.addChild(legend)
    y += legend.height + 8
    return y
  }

  private _drawOrder(s: OrderSession) {
    let y = 0
    s.order.forEach((id, i) => {
      const item = s.spec.items.find((x) => x.id === id)
      const row = new Graphics()
        .roundRect(0, 0, this.need, 34, 4)
        .fill({ color: s.selected === i ? 0x3a2f55 : 0x241c36 })
        .stroke({ width: 1, color: COLORS.panelBorder })
      row.position.set(0, y)
      row.eventMode = "static"
      row.cursor = "pointer"
      row.on("pointertap", () => this.clickItem(i))
      const label = text(item?.text ?? id, 14, COLORS.text)
      label.position.set(10, 8)
      row.addChild(label)
      this._body.addChild(row)
      y += 38
    })
    return y + 4
  }
}
