import { CHAPTERS } from "./catalog"
import { compile } from "./compile"
import type { Effect } from "./types"

/** Every item the story can give (`give`), in order, once each. */
export function storyItems(): string[] {
  const out: string[] = []
  const take = (effects: Effect[] | undefined) => {
    for (const e of effects ?? [])
      if ("give" in e && !out.includes(e.give)) out.push(e.give)
  }
  for (const chapter of CHAPTERS)
    for (const scene of Object.values(chapter.scenes))
      for (const op of compile(scene)) {
        if (op.op === "fx") take(op.effects)
        if (op.op === "fight") {
          take(op.fight.defeat)
          for (const o of op.fight.objectives) {
            take(o.onSuccess)
            take(o.onFailure)
          }
        }
      }
  return out
}
