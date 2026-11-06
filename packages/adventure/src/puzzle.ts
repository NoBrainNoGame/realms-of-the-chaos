/**
 * Small interactive puzzles played on the island with clicks (never typed
 * text): tokens moved on a little grid, or items put back in order. The logic
 * is pure; the game draws the board and feeds the clicks to a session. The
 * story reads the result: the ids of the rules that hold at the end.
 */
import type { Cond } from "./types"

export interface PuzzleCell {
  x: number
  y: number
}

export interface GridToken {
  id: string
  label: string
  at: PuzzleCell
}

/**
 * What a rule asks of the final position:
 * - `occupy`: a token stands on `cells[0]`;
 * - `visit`: a token stood on `cells[0]` at some moment;
 * - `stacked`: `n` tokens share one of `cells`;
 * - `spread`: tokens stand on `n` different cells of `cells`;
 * - `together`: the two `tokens` share a cell.
 */
export type GridRule = {
  id: string
  /** The rule exists only while this holds (a moment the flags opened). */
  if?: Cond
} & (
  | { kind: "occupy" | "visit"; cells: [PuzzleCell] }
  | { kind: "stacked" | "spread"; n: number; cells: PuzzleCell[] }
  | { kind: "together"; tokens: [string, string] }
)

export interface GridPuzzle {
  kind: "grid"
  w: number
  h: number
  /** Cells nobody can step on (a Lacune). */
  holes?: PuzzleCell[]
  /** Named zones drawn on the board (a border, a vein, a pillar). */
  marks?: { label: string; cells: PuzzleCell[] }[]
  tokens: GridToken[]
  /** Moves allowed; the puzzle ends by itself when they are spent. */
  moves?: number
  rules: GridRule[]
  /** Only the first rule that holds counts (exclusive ways to solve). */
  first?: boolean
  /** A rule that held at some moment still counts at the end. */
  sticky?: boolean
  /** The puzzle is over as soon as every rule holds. */
  endsWhenAll?: boolean
}

export interface OrderItem {
  id: string
  text: string
  /** Said when this item is missing at its place. */
  correction?: string
}

export interface OrderPuzzle {
  kind: "order"
  /** The items, in the (shuffled) order they are shown. */
  items: OrderItem[]
  /** The right order. */
  solution: string[]
}

export type PuzzleSpec = GridPuzzle | OrderPuzzle

const same = (a: PuzzleCell, b: PuzzleCell) => a.x === b.x && a.y === b.y
const key = (c: PuzzleCell) => `${c.x},${c.y}`

// ─── Grid ───────────────────────────────────────────────────────────────────

export class GridSession {
  readonly spec: GridPuzzle
  readonly pos = new Map<string, PuzzleCell>()
  readonly visited = new Set<string>()
  readonly ever = new Set<string>()
  selected: string | null = null
  movesLeft: number

  constructor(spec: GridPuzzle) {
    this.spec = spec
    this.movesLeft = spec.moves ?? Number.POSITIVE_INFINITY
    for (const t of spec.tokens) {
      this.pos.set(t.id, { ...t.at })
      this.visited.add(key(t.at))
    }
    this.remember()
  }

  private remember() {
    for (const id of this.holding()) this.ever.add(id)
  }

  isHole(c: PuzzleCell) {
    return (this.spec.holes ?? []).some((h) => same(h, c))
  }

  inside(c: PuzzleCell) {
    return c.x >= 0 && c.y >= 0 && c.x < this.spec.w && c.y < this.spec.h
  }

  tokensAt(c: PuzzleCell) {
    return this.spec.tokens.filter((t) =>
      same(this.pos.get(t.id) as PuzzleCell, c),
    )
  }

  /** Picks a token up (or lets it go). */
  select(id: string | null) {
    if (id !== null && !this.pos.has(id)) throw new Error(`No token "${id}"`)
    this.selected = id
  }

  /** Moves the selected token. Returns whether something moved. */
  moveTo(c: PuzzleCell): boolean {
    const id = this.selected
    if (!id || this.over || !this.inside(c) || this.isHole(c)) return false
    const from = this.pos.get(id) as PuzzleCell
    if (same(from, c)) return false
    this.pos.set(id, { ...c })
    this.visited.add(key(c))
    this.movesLeft--
    this.selected = null
    this.remember()
    return true
  }

  /**
   * A click on a cell. Nothing picked: picks up the token that stands there.
   * A token picked: a click on its own cell lets it go (or picks the next
   * token of the stack), a click elsewhere moves it there.
   */
  click(c: PuzzleCell): boolean {
    if (!this.inside(c) || this.over) return false
    const here = this.tokensAt(c)
    if (this.selected === null) {
      if (here.length > 0) this.selected = here[0].id
      return false
    }
    const at = here.findIndex((t) => t.id === this.selected)
    if (at >= 0) {
      this.selected = here[at + 1]?.id ?? null
      return false
    }
    return this.moveTo(c)
  }

  get over() {
    if (this.movesLeft <= 0) return true
    return (
      !!this.spec.endsWhenAll &&
      this.spec.rules.length > 0 &&
      this.holding().length === this.spec.rules.length
    )
  }

  private holds(r: GridRule): boolean {
    const at = (id: string) => this.pos.get(id) as PuzzleCell
    switch (r.kind) {
      case "occupy":
        return this.spec.tokens.some((t) => same(at(t.id), r.cells[0]))
      case "visit":
        return this.visited.has(key(r.cells[0]))
      case "stacked":
        return r.cells.some((c) => this.tokensAt(c).length >= r.n)
      case "spread":
        return r.cells.filter((c) => this.tokensAt(c).length > 0).length >= r.n
      case "together":
        return same(at(r.tokens[0]), at(r.tokens[1]))
    }
  }

  /** Ids of the rules that hold now (the first one only when `first`). */
  holding(): string[] {
    const ok = this.spec.rules.filter((r) => this.holds(r)).map((r) => r.id)
    return this.spec.first ? ok.slice(0, 1) : ok
  }

  result(): string[] {
    if (!this.spec.sticky) return this.holding()
    return this.spec.rules.filter((r) => this.ever.has(r.id)).map((r) => r.id)
  }
}

// ─── Order ──────────────────────────────────────────────────────────────────

export class OrderSession {
  readonly spec: OrderPuzzle
  order: string[]
  selected: number | null = null
  tries = 0

  constructor(spec: OrderPuzzle) {
    this.spec = spec
    this.order = spec.items.map((i) => i.id)
  }

  /** Picks an item, then a second one: the two swap places. */
  click(index: number) {
    if (index < 0 || index >= this.order.length) return
    if (this.selected === null) this.selected = index
    else {
      const a = this.selected
      ;[this.order[a], this.order[index]] = [this.order[index], this.order[a]]
      this.selected = null
    }
  }

  get solved() {
    return this.order.every((id, i) => id === this.spec.solution[i])
  }

  /** The word said for the first place that is wrong, if any. */
  check(): { ok: boolean; correction?: string } {
    this.tries++
    if (this.solved) return { ok: true }
    const i = this.order.findIndex((id, k) => id !== this.spec.solution[k])
    const want = this.spec.items.find((x) => x.id === this.spec.solution[i])
    return { ok: false, correction: want?.correction }
  }

  /** The story puts the order right after enough tries. */
  correct() {
    this.order = [...this.spec.solution]
    this.selected = null
  }

  result(): string[] {
    return this.solved ? ["ok"] : []
  }
}

export type PuzzleSession = GridSession | OrderSession

export const sessionOf = (spec: PuzzleSpec): PuzzleSession =>
  spec.kind === "grid" ? new GridSession(spec) : new OrderSession(spec)

/** Problems of a puzzle spec, for the chapter validation. */
export function puzzleProblems(spec: PuzzleSpec): string[] {
  const out: string[] = []
  if (spec.kind === "order") {
    const ids = spec.items.map((i) => i.id)
    if (new Set(ids).size !== ids.length) out.push("order: duplicate items")
    if ([...spec.solution].sort().join() !== [...ids].sort().join())
      out.push("order: the solution is not the items")
    return out
  }
  const ok = (c: PuzzleCell) =>
    c.x >= 0 && c.y >= 0 && c.x < spec.w && c.y < spec.h
  const ids = new Set(spec.tokens.map((t) => t.id))
  for (const t of spec.tokens) if (!ok(t.at)) out.push(`token ${t.id} outside`)
  for (const r of spec.rules) {
    if (r.kind === "together") {
      if (!r.tokens.every((t) => ids.has(t)))
        out.push(`rule ${r.id}: bad token`)
    } else if (!r.cells.every(ok)) out.push(`rule ${r.id}: cell outside`)
  }
  return out
}
