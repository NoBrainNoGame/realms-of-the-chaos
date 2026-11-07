import { chapterOfRun, holds, markSeen, type Run, withEffects } from "./runner"
import type {
  Encounter,
  ExamineLine,
  Exploration,
  FightSpec,
  Influence,
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
    // An optional meeting, but a real fight: if the party falls, it is lost
    // (back on the island, the wanderer is still there).
    rules: { fixOnDeath: [1] },
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

// ─── The Ghom's Élan and Influences, on the island ──────────────────────────

export const ELAN_MAX = 6
/** Steps walked for the bar to gain one point (it also flows in fights). */
export const STEPS_PER_ELAN = 5
/** What an Influence costs when it is used on the island. */
export const INFLUENCE_COST: Record<Influence, number> = {
  timeWarp: 2,
  earthquake: 3,
  blessing: 3,
}
export const INFLUENCE_NAME: Record<Influence, string> = {
  timeWarp: "Distorsion",
  earthquake: "Séisme",
  blessing: "Réparation",
}

export const elanOf = (run: Run) => Math.min(ELAN_MAX, run.elan ?? 0)

/** The Élan after `steps` more steps on the island (capped). */
export function gainElan(run: Run, steps: number): Run {
  const sum = elanOf(run) + steps / STEPS_PER_ELAN
  return { ...run, elan: Math.min(ELAN_MAX, Math.round(sum * 1000) / 1000) }
}

/** Influences the chapter lets the Ghom use. */
export const influencesOf = (run: Run): Influence[] =>
  explorationOf(run)?.influences ?? []

export type InfluenceResult =
  | { ok: true; run: Run; lines: ExamineLine[] }
  | { ok: false; reason: "unknown" | "nothing" | "short"; cost?: number }

/**
 * The Ghom applies an Influence on the obstacle of `id` that is waiting for it.
 * Pays the Élan, counts the effects once.
 */
export function influence(
  run: Run,
  id: string,
  which: Influence,
): InfluenceResult {
  if (!influencesOf(run).includes(which))
    return { ok: false, reason: "unknown" }
  const e = explorationOf(run)?.encounters.find((x) => x.id === id)
  if (!e?.obstacle || e.obstacle.influence !== which || seenBy(run, id))
    return { ok: false, reason: "nothing" }
  const cost = INFLUENCE_COST[which]
  if (elanOf(run) < cost) return { ok: false, reason: "short", cost }
  const paid = { ...run, elan: elanOf(run) - cost }
  return {
    ok: true,
    run: withEffects(markSeen(paid, id), e.obstacle.effects ?? []),
    lines: e.obstacle.after,
  }
}

/** Lines read when an obstacle is looked at (before or after it moved). */
export function lookAtObstacle(run: Run, id: string): ExamineLine[] {
  const o = explorationOf(run)?.encounters.find((x) => x.id === id)?.obstacle
  if (!o) throw new Error(`No obstacle "${id}"`)
  return seenBy(run, id) ? o.after : o.before
}
