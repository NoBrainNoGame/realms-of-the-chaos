import { compile, type Op } from "./compile"
import { autonomyEffects } from "./entries"
import { clampFlag, defaultFlag, flagSpec } from "./flags"
import type {
  Chapter,
  Cond,
  Effect,
  FightReport,
  FightSpec,
  FlagValue,
} from "./types"

/** What a run carries from chapter to chapter. */
export interface Carry {
  /** Only the flags that differ from their default. */
  flags: Record<string, FlagValue>
  items: string[]
  team: string[]
  unlocks: string[]
}

/** A chapter in progress. Plain data: save it, load it, replay it. */
export interface Run extends Carry {
  chapter: string
  node: string
  pc: number
  /** Topics heard per hub, `"<node>:<hub>"`. */
  heard: Record<string, string[]>
  seed: number
  /** Defeats suffered in the fight being played. */
  retries: number
  done: boolean
  /** The scene the hero walked into (exploration): the story waits otherwise. */
  entry?: string
  /** Optional things already examined or overcome (encounter ids). */
  seen?: string[]
  /** The Ghom's Élan, carried between the island and the fights. */
  elan?: number
}

export type Frame =
  | {
      kind: "line"
      style: "say" | "narr" | "stage"
      who?: string
      text: string
    }
  | { kind: "hint"; title: string; text: string }
  | {
      kind: "choice"
      id: string
      prompt?: string
      options: { id: string; text: string }[]
    }
  | {
      kind: "hub"
      id: string
      topics: { id: string; title: string }[]
    }
  | { kind: "fight"; fight: FightSpec }
  | { kind: "done" }

export interface ObjectiveResult {
  id: string
  mark: "★" | "◆"
  label: string
  ok: boolean
  text?: string
}

export const START_CARRY: Carry = {
  flags: {},
  items: [],
  team: ["heros", "lyra"],
  unlocks: [],
}

// ─── Flags ──────────────────────────────────────────────────────────────────

export function getFlag(run: Carry, key: string): FlagValue {
  return Object.hasOwn(run.flags, key) ? run.flags[key] : defaultFlag(key)
}

export function holds(run: Carry, cond: Cond): boolean {
  if ("all" in cond) return cond.all.every((c) => holds(run, c))
  if ("any" in cond) return cond.any.some((c) => holds(run, c))
  if ("not" in cond) return !holds(run, cond.not)
  const actual = getFlag(run, cond.key)
  const expected = cond.value ?? true
  switch (cond.op ?? "==") {
    case "==":
      return actual === expected
    case "!=":
      return actual !== expected
    case ">=":
      return (actual as number) >= (expected as number)
    case "<=":
      return (actual as number) <= (expected as number)
    case ">":
      return (actual as number) > (expected as number)
    case "<":
      return (actual as number) < (expected as number)
  }
}

function setFlag(run: Carry, key: string, value: FlagValue) {
  if (!flagSpec(key)) throw new Error(`Unknown flag "${key}"`)
  const v = clampFlag(key, value)
  if (v === defaultFlag(key)) delete run.flags[key]
  else run.flags[key] = v
}

export function applyEffects(run: Carry, effects: Effect[], unit = 1) {
  for (const e of effects) {
    if ("set" in e) setFlag(run, e.set, e.value)
    else if ("add" in e) {
      const now = getFlag(run, e.add) as number
      setFlag(run, e.add, now + e.by * (e.perUnit ? unit : 1))
    } else if ("give" in e) {
      if (!run.items.includes(e.give)) run.items.push(e.give)
    } else if ("join" in e) {
      if (!run.team.includes(e.join)) run.team.push(e.join)
    } else if (!run.unlocks.includes(e.unlock)) run.unlocks.push(e.unlock)
  }
}

// ─── Running a chapter ──────────────────────────────────────────────────────

export type ChapterLookup = (id: string) => Chapter

let lookup: ChapterLookup = () => {
  throw new Error("No chapter lookup installed")
}

/** Installs the chapter registry (done by the catalog on import). */
export function useChapters(fn: ChapterLookup) {
  lookup = fn
}

const copy = <T>(x: T): T => structuredClone(x)

/** Starts a chapter from the carried state. */
export function startChapter(
  chapterId: string,
  carry: Carry = START_CARRY,
  seed = 1,
): Run {
  const chapter = lookup(chapterId)
  const run: Run = {
    ...copy(carry),
    chapter: chapterId,
    node: chapter.start,
    pc: 0,
    heard: {},
    seed,
    retries: 0,
    done: false,
  }
  return settle(run)
}

function opsOf(run: Run): Op[] {
  const scene = lookup(run.chapter).scenes[run.node]
  if (!scene) throw new Error(`Unknown scene "${run.node}"`)
  return compile(scene)
}

function availableTopics(run: Run, op: Extract<Op, { op: "hub" }>) {
  const heard = run.heard[`${run.node}:${op.id}`] ?? []
  const open = op.topics.filter(
    (t) => !heard.includes(t.id) && (!t.if || holds(run, t.if)),
  )
  const regular = open.filter((t) => !t.last)
  return regular.length > 0 ? regular : open
}

function visibleOptions(run: Run, op: Extract<Op, { op: "choice" }>) {
  return op.options.filter((o) => !o.if || holds(run, o.if))
}

/** Runs the silent instructions until something is to be shown. */
function settle(input: Run): Run {
  const run = input
  for (let guard = 0; guard < 100_000; guard++) {
    if (run.done) return run
    const ops = opsOf(run)
    const op = ops[run.pc]
    if (!op) throw new Error(`Scene "${run.node}" ran off its end`)
    switch (op.op) {
      case "fx":
        applyEffects(run, op.effects)
        run.pc++
        break
      case "jf":
        run.pc = holds(run, op.cond) ? run.pc + 1 : op.to
        break
      case "jmp":
        run.pc = op.to
        break
      case "go":
        if (op.node === "$end") run.done = true
        else {
          run.node = op.node
          run.pc = 0
        }
        break
      case "topicEnd": {
        const key = `${run.node}:${op.id}`
        const heard = run.heard[key] ?? []
        if (!heard.includes(op.topic)) run.heard[key] = [...heard, op.topic]
        applyEffects(run, [{ add: "ecoute", by: 1 }])
        run.pc = op.hub
        break
      }
      case "hub":
        if (availableTopics(run, op).length === 0) run.pc = op.after
        else return run
        break
      case "choice":
        if (visibleOptions(run, op).length === 0) run.pc++
        else return run
        break
      default:
        return run
    }
  }
  throw new Error("Scene did not settle (loop?)")
}

/** What the player sees now. */
export function frame(run: Run): Frame {
  if (run.done) return { kind: "done" }
  const op = opsOf(run)[run.pc]
  switch (op.op) {
    case "say":
      return { kind: "line", style: "say", who: op.who, text: op.text }
    case "narr":
    case "stage":
      return { kind: "line", style: op.op, text: op.text }
    case "hint":
      return { kind: "hint", title: op.title, text: op.text }
    case "choice":
      return {
        kind: "choice",
        id: op.id,
        prompt: op.prompt,
        options: visibleOptions(run, op).map((o) => ({
          id: o.id,
          text: o.text,
        })),
      }
    case "hub":
      return {
        kind: "hub",
        id: op.id,
        topics: availableTopics(run, op).map((t) => ({
          id: t.id,
          title: t.title,
        })),
      }
    case "fight":
      return { kind: "fight", fight: op.fight }
    default:
      throw new Error(`Unsettled instruction "${op.op}"`)
  }
}

/** The player read a line (or a hint): on to the next. */
export function next(run: Run): Run {
  const r = copy(run)
  const op = opsOf(r)[r.pc]
  if (op.op === "choice" || op.op === "hub" || op.op === "fight")
    throw new Error("A choice, a hub or a fight is not skipped")
  r.pc++
  return settle(r)
}

/** The player made a gesture: an option of a choice, or a topic of a hub. */
export function choose(run: Run, optionId: string): Run {
  const r = copy(run)
  const op = opsOf(r)[r.pc]
  if (op.op === "choice") {
    const o = visibleOptions(r, op).find((o) => o.id === optionId)
    if (!o) throw new Error(`No option "${optionId}" here`)
    r.pc = o.to
  } else if (op.op === "hub") {
    const t = availableTopics(r, op).find((t) => t.id === optionId)
    if (!t) throw new Error(`No topic "${optionId}" here`)
    r.pc = t.to
  } else throw new Error("Nothing to choose here")
  return settle(r)
}

/** The fight is over: objectives are scored, the story goes on (a defeat goes on too). */
export function finishFight(
  run: Run,
  report: FightReport,
): { run: Run; debrief: ObjectiveResult[] } {
  const r = copy(run)
  const op = opsOf(r)[r.pc]
  if (op.op !== "fight") throw new Error("No fight is waiting")
  // A defeat is not a retry: the story goes on with the consequences
  // (every objective failed, then the fight's own defeat effects).
  const lost = report.result === "defeat"
  if (lost) {
    r.retries++
    applyEffects(r, op.fight.defeat ?? [])
  }
  applyEffects(
    r,
    autonomyEffects(op.fight, report, (k) => getFlag(r, k)),
  )
  const debrief: ObjectiveResult[] = []
  for (const o of op.fight.objectives) {
    const out = lost ? { ok: false, n: 0 } : o.check(report)
    const ok = typeof out === "boolean" ? out : out.ok
    const n = typeof out === "boolean" ? 1 : out.n
    applyEffects(r, ok ? (o.onSuccess ?? []) : (o.onFailure ?? []), n)
    debrief.push({
      id: o.id,
      mark: o.mark,
      label: o.label,
      ok,
      text: ok ? o.success : o.failure,
    })
  }
  r.pc++
  return { run: settle(r), debrief }
}

/** The chapter a run is in. */
export const chapterOfRun = (run: Run): Chapter => lookup(run.chapter)

/** Applies effects for the game layer (examining, overcoming a wanderer). */
export function withEffects(run: Run, effects: Effect[]): Run {
  const r = copy(run)
  applyEffects(r, effects)
  return r
}

/** Marks an optional encounter as done. */
export function markSeen(run: Run, id: string): Run {
  const r = copy(run)
  if (!(r.seen ?? []).includes(id)) r.seen = [...(r.seen ?? []), id]
  return r
}
