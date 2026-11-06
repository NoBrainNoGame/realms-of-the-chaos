import { chapterOfRun, holds, markSeen, type Run, withEffects } from "./runner"
import type {
  Encounter,
  ExamineLine,
  Exploration,
  FightSpec,
  Spot,
  Wanderer,
} from "./types"

/** The island of the run's chapter, if the chapter is walked. */
export function explorationOf(run: Run): Exploration | null {
  return chapterOfRun(run).exploration ?? null
}

/**
 * Whether the hero is free to walk: the chapter has an island, it is not over,
 * and the scene the story waits on was not entered yet.
 */
export function exploring(run: Run): boolean {
  return !run.done && !!explorationOf(run) && run.entry !== run.node
}

const seenBy = (run: Run, id: string) => (run.seen ?? []).includes(id)

/** The encounter the story waits on, if the hero has to find it. */
export function pending(run: Run): Encounter | null {
  const ex = explorationOf(run)
  if (!ex || run.done) return null
  return ex.encounters.find((e) => e.scene === run.node) ?? null
}

/** Everything that shows on the island now. */
export function activeEncounters(run: Run): Encounter[] {
  const ex = explorationOf(run)
  if (!ex || run.done) return []
  return ex.encounters.filter((e) => {
    if (e.if && !holds(run, e.if)) return false
    if (e.scene !== undefined) return e.scene === run.node
    if (e.wander) return !seenBy(run, e.id)
    return true
  })
}

/**
 * Who walks behind the hero: the chapter's companions of the team, once the
 * hero has met them (a character standing on the island is not one yet).
 */
export function companionsOf(run: Run): string[] {
  const ex = explorationOf(run)
  if (!ex) return []
  const waiting = new Set(
    ex.encounters.flatMap((e) =>
      e.actor && !seenBy(run, e.id) ? [e.actor] : [],
    ),
  )
  return (ex.companions ?? []).filter(
    (c) => run.team.includes(c) && !waiting.has(c),
  )
}

/** The hero walks into the scene the story waits on. */
export function enter(run: Run): Run {
  const there = pending(run)
  const out = { ...structuredClone(run), entry: run.node }
  return there ? markSeen(out, there.id) : out
}

/** Lines read when something is examined; its effects count once. */
export function examine(
  run: Run,
  id: string,
): { run: Run; lines: ExamineLine[]; first: boolean } {
  const e = explorationOf(run)?.encounters.find((x) => x.id === id)
  if (!e?.examine) throw new Error(`Nothing to examine: "${id}"`)
  const first = !seenBy(run, id)
  let out = run
  if (first) out = withEffects(markSeen(run, id), e.examine.effects ?? [])
  return { run: out, lines: e.examine.lines, first }
}

/** An optional enemy was overcome: its reward counts once. */
export function overcome(run: Run, id: string): Run {
  const w = explorationOf(run)?.encounters.find((x) => x.id === id)?.wander
  if (!w) throw new Error(`No wanderer "${id}"`)
  if (seenBy(run, id)) return run
  return withEffects(markSeen(run, id), w.effects)
}

/** Rows cut out of the island around a cell (clamped to its edges). */
export function cutOut(
  rows: string[],
  center: Spot,
  radius: number,
): { rows: string[]; origin: Spot } {
  const width = rows[0].length
  const height = rows.length
  const size = radius * 2 + 1
  const ox = Math.max(0, Math.min(width - size, center.x - radius))
  const oy = Math.max(0, Math.min(height - size, center.y - radius))
  const w = Math.min(size, width)
  const h = Math.min(size, height)
  return {
    rows: rows.slice(oy, oy + h).map((r) => r.slice(ox, ox + w)),
    origin: { x: ox, y: oy },
  }
}

/**
 * The fight with a wanderer, on a board cut out of the island around the
 * meeting: the party and the enemy keep their places on the island.
 */
export function wanderFight(
  island: string[],
  encounter: Encounter,
  at: Spot,
  party: { preset: string; at: Spot }[],
): FightSpec {
  const w = encounter.wander as Wanderer
  const { rows, origin } = cutOut(island, at, w.radius)
  const local = (p: Spot) => ({ x: p.x - origin.x, y: p.y - origin.y })
  const inside = (p: Spot) =>
    p.x >= 0 && p.y >= 0 && p.x < rows[0].length && p.y < rows.length
  return {
    id: `wander.${encounter.id}`,
    title: w.title,
    goal: w.goal,
    board: rows,
    teams: [
      {
        name: "Le héros et les siens",
        side: "allies",
        fighters: party
          .map((m) => ({ preset: m.preset, at: local(m.at) }))
          .filter((f) => inside(f.at)),
      },
      {
        name: encounter.label,
        side: "enemies",
        fighters: [{ preset: w.preset, at: local(at) }],
      },
    ],
    // An optional meeting: the party is never wiped out.
    rules: { noDefeat: [0], fixOnDeath: [1] },
    influences: [],
    startEnergy: 0,
    objectives: [
      {
        id: "ecarter",
        mark: "★",
        label: encounter.label,
        check: (r) => r.result === "victory",
        success: w.success,
      },
    ],
    lines: [],
  }
}
