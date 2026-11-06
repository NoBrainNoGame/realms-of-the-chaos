import type { PuzzleSpec } from "./puzzle"
import type {
  Beat,
  Cond,
  Effect,
  FlagValue,
  Option,
  Spot,
  Topic,
} from "./types"

// Small constructors so that chapters read like the documents they come from.

export const say = (who: string, text: string): Beat => ({
  t: "say",
  who,
  text,
})
export const narr = (text: string): Beat => ({ t: "narr", text })
export const stage = (text: string): Beat => ({ t: "stage", text })
export const hint = (title: string, text: string): Beat => ({
  t: "hint",
  title,
  text,
})
export const fx = (...effects: Effect[]): Beat => ({ t: "fx", effects })
export const go = (node: string): Beat => ({ t: "go", node })
export const redirect = (option: string): Beat => ({ t: "redirect", option })
export const when = (cond: Cond, then: Beat[], otherwise?: Beat[]): Beat => ({
  t: "if",
  cond,
  then,
  else: otherwise,
})
export const choice = (
  id: string,
  options: Option[],
  prompt?: string,
): Beat => ({ t: "choice", id, prompt, options })
export const opt = (
  id: string,
  text: string,
  beats: Beat[] = [],
  cond?: Cond,
): Option => ({ id, text, beats, if: cond })
export const hub = (id: string, topics: Topic[]): Beat => ({
  t: "hub",
  id,
  topics,
})
export const topic = (
  id: string,
  title: string,
  beats: Beat[],
  extra: { if?: Cond; last?: boolean } = {},
): Topic => ({ id, title, beats, ...extra })

// effects
export const set = (key: string, value: FlagValue = true): Effect => ({
  set: key,
  value,
})
export const add = (key: string, by = 1): Effect => ({ add: key, by })
export const give = (item: string): Effect => ({ give: item })
export const join = (who: string): Effect => ({ join: who })
export const unlock = (what: string): Effect => ({ unlock: what })

// conditions
export const is = (key: string, value: FlagValue = true): Cond => ({
  key,
  value,
})
export const isnt = (key: string, value: FlagValue = true): Cond => ({
  key,
  op: "!=",
  value,
})
export const gte = (key: string, value: number): Cond => ({
  key,
  op: ">=",
  value,
})
export const lt = (key: string, value: number): Cond => ({
  key,
  op: "<",
  value,
})
export const all = (...conds: Cond[]): Cond => ({ all: conds })
export const any = (...conds: Cond[]): Cond => ({ any: conds })
export const not = (cond: Cond): Cond => ({ not: cond })

/**
 * The cells that trigger a place on an island: the cell itself and its four
 * neighbours, minus what falls off the island or into deep water.
 */
export const around = (island: string[], x: number, y: number): Spot[] =>
  [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]
    .map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
    .filter((p) => {
      const c = island[p.y]?.[p.x]
      return c !== undefined && c !== "w" && c !== "W"
    })

export const puzzle = (
  id: string,
  spec: PuzzleSpec,
  on: Record<string, Beat[]> = {},
  options: { prompt?: string; none?: Beat[] } = {},
): Beat => ({
  t: "puzzle",
  id,
  prompt: options.prompt,
  puzzle: spec,
  on,
  none: options.none,
})
