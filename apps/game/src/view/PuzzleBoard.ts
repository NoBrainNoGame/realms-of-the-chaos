import {
  GridSession,
  OrderSession,
  PairsSession,
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
  readonly session: GridSession | OrderSession | PairsSession
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
    if (s instanceof PairsSession) {
      if (!s.done) {
        this._note = `Encore ${s.spec.strokes - s.strokes.length} coup(s) à frapper.`
        this._draw()
        return
      }
      s.simulate()
    }
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
    else if (s instanceof PairsSession) y = this._drawPairs(s)
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
      // pairs: the button reads the slates once the strokes are struck
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
    spec.tokens.forEach((t, i) => {
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
      // the number ties the dot to its name in the legend below
      const n = text(String(i + 1), 13, 0x1b1424, { fontWeight: "700" })
      n.anchor.set(0.5)
      n.position.copyFrom(dot.position)
      n.eventMode = "none"
      this._body.addChild(n)
    })
    let y = spec.h * CELL + 6
    const names = spec.tokens.map((t, i) => `${i + 1} ${t.label}`).join("  ·  ")
    const legend = text(
      `${names}${spec.moves ? ` — déplacements : ${s.movesLeft}` : ""}`,
      13,
      COLORS.muted,
      { wordWrap: true, wordWrapWidth: Math.max(this.need, 400) },
    )
    legend.position.set(0, y)
    this._body.addChild(legend)
    y += legend.height + 8
    return y
  }

  /** A tap on a wand: Eva strikes her crystal. */
  strike(wand: "bone" | "wood") {
    if (this._finished || !(this.session instanceof PairsSession)) return
    this.session.strike(wand)
    this._note = ""
    this._draw()
  }

  private _drawPairs(s: PairsSession) {
    let y = 0
    const shine = (c: string) => (c === "blue" ? "bleu" : "vert")
    const wand = (w: string) => (w === "bone" ? "os" : "bois")
    const head = text(
      s.done
        ? "Les ardoises sont pleines."
        : `Coup ${s.strokes.length + 1} sur ${s.spec.strokes} : quelle baguette ?`,
      14,
      COLORS.text,
    )
    head.position.set(0, y)
    this._body.addChild(head)
    y += 26
    if (!s.done)
      (["bone", "wood"] as const).forEach((w, i) => {
        const b = button({
          width: 150,
          height: 32,
          label: w === "bone" ? "Baguette d'os" : "Baguette de bois",
          onTap: () => this.strike(w),
        })
        b.view.position.set(i * 160, y)
        this._body.addChild(b.view)
      })
    if (!s.done) y += 40
    for (const k of s.strokes) {
      const row = text(
        `Eva ${wand(k.eva)} : ${shine(k.evaShine)}   Néréa ${wand(k.nerea)} : ${shine(k.nereaShine)}   ${k.won ? "gagné" : "perdu"}`,
        13,
        k.won ? 0x8ce99a : COLORS.muted,
      )
      row.position.set(0, y)
      this._body.addChild(row)
      y += 20
    }
    if (s.simulated) {
      const pct = (n: number) => Math.round(n * 100)
      const sum = text(
        `Cent coups simulés. Seule, Eva voit du bleu ${pct(s.blueShare("eva"))} fois sur 100, Néréa ${pct(s.blueShare("nerea"))}. Comparées, les paires gagnent ${pct(s.rate)} fois sur 100.`,
        14,
        0xffe066,
        { wordWrap: true, wordWrapWidth: this.need },
      )
      sum.position.set(0, y + 6)
      this._body.addChild(sum)
      y += sum.height + 14
    }
    return y + 4
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
