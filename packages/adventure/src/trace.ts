import type { TraceReport } from "@realms/engine/adventure"
import type { FightReport, FightSpec, ObjectiveSpec } from "./types"

/**
 * Objective conditions that read WHERE and BY WHOM things happened in a
 * fight (the report's `trace`). They are data, so `validateChapter` can check
 * that the regions, teams and fighters they name exist in the fight.
 */

/** A fighter id, a preset id ("@hero" is the player's character), or a team. */
export type Who = string | { team: number }

export type TraceCond =
  /** The team/fighter stood in the region for `ticks` clock ticks (in a row if `consecutive`). */
  | {
      held: {
        region: string
        who: Who
        ticks: number
        consecutive?: boolean
      }
    }
  /** The team/fighter started `turns` turns in the region (all together). */
  | { turnsOn: { region: string; who: Who; turns: number } }
  /** The last blow on a fallen `target` was dealt by `by` (all of them if `all`). */
  | {
      finalBlowBy: { by: Who; target: Who; action?: string; all?: boolean }
    }
  /** The last blow on a fallen `target` was dealt by nobody in `by` (a status, the cold). */
  | { noFinalBlowBy: { by: Who; target: Who } }
  /** Nothing of this kind happened in the region. */
  | {
      nothingOn: {
        region: string
        of?: "strike" | "cast" | "stand"
        by?: Who
      }
    }
  /** At least `min` (default 1) blows landed in the region. */
  | {
      struckOn: {
        region?: string
        by?: Who
        target?: Who
        min?: number
        /** Only blows dealt from at least this many cells away (2 = not adjacent). */
        farther?: number
      }
    }
  /** At least `min` (default 1) Influences were cast on the region. */
  | {
      castOn: {
        region?: string
        divine?: string
        /** A fighter was on the cell or next to it when it was cast. */
        near?: Who
        min?: number
      }
    }
  /** `by` was the first to come next to (a fighter of another team) `of`. */
  | { firstTouch: { of: Who; by: Who } }
  /** `by` came next to `of` (any time, or by clock tick `before`). */
  | { touched: { of: Who; by: Who; before?: number } }
  /** The fighter(s) stood in the region at some moment. */
  | { visited: { region: string; who: Who } }
  | { not: TraceCond }
  | { all: TraceCond[] }
  | { any: TraceCond[] }

const HERO = "custom:@hero"

type Row = FightReport["fighters"][number]

const rowsOf = (r: FightReport, who: Who): Row[] =>
  r.fighters.filter((f) =>
    typeof who === "string"
      ? f.id === who ||
        f.preset === who ||
        (who === "@hero" && f.preset === HERO)
      : f.team === who.team,
  )

/** Does fighter `id`, or a team `team` seen at the time, match `who`? */
const is = (
  r: FightReport,
  who: Who,
  id: string | null,
  team: number | null,
) => {
  if (id === null && team === null) return false
  if (typeof who !== "string" && team !== null) return who.team === team
  return id !== null && rowsOf(r, who).some((f) => f.id === id)
}

const cellKey = (p: { x: number; y: number }) => `${p.x},${p.y}`

function regionSet(spec: FightSpec, region: string): Set<string> | undefined {
  const cells = spec.rules.regions?.[region]
  return cells && new Set(cells.map(cellKey))
}

/** Reads one condition against a report (`false` when the report has no trace). */
export function readTrace(
  cond: TraceCond,
  report: FightReport,
  spec: Pick<FightSpec, "rules">,
): boolean {
  const t: TraceReport | undefined = report.trace
  const read = (c: TraceCond) => readTrace(c, report, spec)
  if ("all" in cond) return cond.all.every(read)
  if ("any" in cond) return cond.any.some(read)
  if ("not" in cond) return !read(cond.not)
  const cells = (region: string) => regionSet(spec as FightSpec, region)
  if ("nothingOn" in cond) {
    const { region, of, by } = cond.nothingOn
    if (!t) return true
    const set = cells(region)
    if (!set) return false
    if (!of || of === "strike") {
      const hit = t.strikes.some(
        (s) =>
          set.has(cellKey(s.cell)) && (!by || is(report, by, s.by, s.byTeam)),
      )
      if (hit) return false
    }
    if (!of || of === "cast") {
      const cast = t.casts.some(
        (c) =>
          set.has(cellKey(c.cell)) &&
          (!by || typeof by === "string" || by.team === c.team),
      )
      if (cast) return false
    }
    if (!of || of === "stand") {
      for (const [id, k] of Object.entries(t.turns)) {
        if (by && !rowsOf(report, by).some((f) => f.id === id)) continue
        if (Object.keys(k).some((c) => set.has(c))) return false
      }
    }
    return true
  }
  if (!t) return false
  if ("held" in cond) {
    const { region, who, ticks, consecutive } = cond.held
    const reg = t.regions[region]
    if (!reg) return false
    if (typeof who !== "string") {
      return (consecutive ? reg.streak[who.team] : reg.teams[who.team]) >= ticks
    }
    // a fighter (or a preset): its own ticks; the run is not kept per fighter
    return rowsOf(report, who).some((f) => (reg.fighters[f.id] ?? 0) >= ticks)
  }
  if ("turnsOn" in cond) {
    const { region, who, turns } = cond.turnsOn
    const reg = t.regions[region]
    if (!reg) return false
    const total = Object.entries(reg.turns).reduce(
      (n, [id, v]) =>
        n + (rowsOf(report, who).some((f) => f.id === id) ? v : 0),
      0,
    )
    return total >= turns
  }
  if ("finalBlowBy" in cond) {
    const { by, target, action, all } = cond.finalBlowBy
    const fallen = rowsOf(report, target).filter((f) => t.finalBlows[f.id])
    if (!fallen.length) return false
    const ok = (f: Row) => {
      const b = t.finalBlows[f.id]
      return (
        is(report, by, b.by, b.byTeam) && (!action || b.actionId === action)
      )
    }
    return all ? fallen.every(ok) : fallen.some(ok)
  }
  if ("firstTouch" in cond) {
    const { of, by } = cond.firstTouch
    const targets = rowsOf(report, of)
    const first = t?.touches.find((x) => targets.some((f) => f.id === x.of))
    return !!first && is(report, by, first.by, first.byTeam)
  }
  if ("touched" in cond) {
    const { of, by, before } = cond.touched
    return (t?.touches ?? []).some(
      (x) =>
        is(report, of, x.of, null) &&
        is(report, by, x.by, x.byTeam) &&
        (before === undefined || x.tick <= before),
    )
  }
  if ("noFinalBlowBy" in cond) {
    const { by, target } = cond.noFinalBlowBy
    const fallen = rowsOf(report, target).filter((f) => t.finalBlows[f.id])
    return fallen.every((f) => {
      const b = t.finalBlows[f.id]
      return !is(report, by, b.by, b.byTeam)
    })
  }
  if ("struckOn" in cond) {
    const { region, by, target, min = 1, farther } = cond.struckOn
    const set = region ? cells(region) : undefined
    if (region && !set) return false
    return (
      t.strikes.filter(
        (s) =>
          (!set || set.has(cellKey(s.cell))) &&
          (!by || is(report, by, s.by, s.byTeam)) &&
          (!target || is(report, target, s.target, s.targetTeam)) &&
          (farther === undefined || (s.distance ?? 0) >= farther),
      ).length >= min
    )
  }
  if ("castOn" in cond) {
    const { region, divine, near, min = 1 } = cond.castOn
    const set = region ? cells(region) : undefined
    if (region && !set) return false
    return (
      t.casts.filter(
        (c) =>
          (!set || set.has(cellKey(c.cell))) &&
          (!divine || c.divineId === divine) &&
          (!near || c.near.some((id) => is(report, near, id, null))),
      ).length >= min
    )
  }
  const { region, who } = cond.visited
  const reg = t.regions[region]
  return (
    !!reg &&
    reg.visitors.some((id) => rowsOf(report, who).some((f) => f.id === id))
  )
}

/** What an objective yields: its `check` and, if any, all its `when` conditions. */
export function objectiveOutcome(
  o: ObjectiveSpec,
  report: FightReport,
  spec: Pick<FightSpec, "rules">,
): boolean | { ok: boolean; n: number } {
  const when = o.when
    ? (Array.isArray(o.when) ? o.when : [o.when]).every((c) =>
        readTrace(c, report, spec),
      )
    : true
  if (!o.check) return when
  const out = o.check(report)
  if (when) return out
  return typeof out === "boolean" ? false : { ok: false, n: 0 }
}

/** What is wrong with the trace conditions of a fight (empty: nothing). */
export function traceProblems(spec: FightSpec): string[] {
  const out: string[] = []
  const regions = spec.rules.regions ?? {}
  const rows = spec.teams.flatMap((t, i) =>
    t.fighters.map((f) => ({
      team: i,
      preset: typeof f.preset === "string" ? f.preset : f.preset.id,
    })),
  )
  const w = spec.board[0]?.length ?? 0
  for (const [id, cells] of Object.entries(regions)) {
    if (!cells.length) out.push(`${spec.id}: region "${id}" is empty`)
    for (const c of cells)
      if (c.x < 0 || c.y < 0 || c.x >= w || c.y >= spec.board.length)
        out.push(`${spec.id}: region "${id}" has a cell outside the board`)
  }
  const who = (w: Who, where: string) => {
    if (typeof w === "string") {
      const known = rows.some(
        (r) =>
          r.preset === w ||
          w.startsWith(`${r.preset}-`) ||
          (w === "@hero" && r.preset === HERO),
      )
      if (!known) out.push(`${spec.id}: ${where}: no fighter "${w}"`)
    } else if (!spec.teams[w.team])
      out.push(`${spec.id}: ${where}: no team ${w.team}`)
  }
  const region = (r: string, where: string) => {
    if (!regions[r]) out.push(`${spec.id}: ${where}: unknown region "${r}"`)
  }
  const cond = (c: TraceCond, where: string) => {
    if ("all" in c) for (const x of c.all) cond(x, where)
    else if ("any" in c) for (const x of c.any) cond(x, where)
    else if ("not" in c) cond(c.not, where)
    else if ("held" in c) {
      region(c.held.region, where)
      who(c.held.who, where)
      if (!spec.rules.clock)
        out.push(`${spec.id}: ${where}: held is counted per clock tick`)
      if (c.held.ticks <= 0) out.push(`${spec.id}: ${where}: ticks must be > 0`)
      const lim = spec.rules.clock?.limit
      if (lim !== undefined && c.held.ticks > lim)
        out.push(
          `${spec.id}: ${where}: held ${c.held.ticks} ticks, clock ${lim}`,
        )
    } else if ("turnsOn" in c) {
      region(c.turnsOn.region, where)
      who(c.turnsOn.who, where)
    } else if ("finalBlowBy" in c) {
      who(c.finalBlowBy.by, where)
      who(c.finalBlowBy.target, where)
    } else if ("firstTouch" in c) {
      who(c.firstTouch.of, where)
      who(c.firstTouch.by, where)
    } else if ("touched" in c) {
      who(c.touched.of, where)
      who(c.touched.by, where)
    } else if ("noFinalBlowBy" in c) {
      who(c.noFinalBlowBy.by, where)
      who(c.noFinalBlowBy.target, where)
    } else if ("nothingOn" in c) {
      region(c.nothingOn.region, where)
      if (c.nothingOn.by) who(c.nothingOn.by, where)
    } else if ("struckOn" in c) {
      if (c.struckOn.region) region(c.struckOn.region, where)
      if (c.struckOn.by) who(c.struckOn.by, where)
      if (c.struckOn.target) who(c.struckOn.target, where)
    } else if ("castOn" in c) {
      if (c.castOn.region) region(c.castOn.region, where)
      if (c.castOn.near) who(c.castOn.near, where)
    } else if ("visited" in c) {
      region(c.visited.region, where)
      who(c.visited.who, where)
    }
  }
  for (const o of spec.objectives) {
    if (!o.check && !o.when)
      out.push(`${spec.id}: objective "${o.id}" has neither check nor when`)
    for (const c of Array.isArray(o.when) ? o.when : o.when ? [o.when] : [])
      cond(c, `objective "${o.id}"`)
  }
  return out
}
