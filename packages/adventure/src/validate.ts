import { compile } from "./compile"
import { flagSpec } from "./flags"
import { type Chapter, type Cond, type Effect, END } from "./types"

/** Static checks of a chapter. Returns the list of problems (empty: valid). */
export function validateChapter(chapter: Chapter): string[] {
  const errors: string[] = []
  const err = (m: string) => errors.push(`${chapter.id}: ${m}`)
  const flag = (k: string, where: string) => {
    if (!flagSpec(k)) err(`unknown flag "${k}" (${where})`)
  }
  const cond = (c: Cond, where: string) => {
    if ("all" in c) for (const x of c.all) cond(x, where)
    else if ("any" in c) for (const x of c.any) cond(x, where)
    else if ("not" in c) cond(c.not, where)
    else flag(c.key, where)
  }
  const effects = (list: Effect[], where: string) => {
    for (const e of list) {
      if ("set" in e) flag(e.set, where)
      else if ("add" in e) flag(e.add, where)
    }
  }

  if (!chapter.scenes[chapter.start]) err(`start "${chapter.start}" missing`)
  const edges = new Map<string, Set<string>>()

  for (const [id, scene] of Object.entries(chapter.scenes)) {
    const out = new Set<string>()
    edges.set(id, out)
    const ops = compile(scene)
    if (ops.length === 0) err(`scene "${id}" is empty`)
    const where = `scene ${id}`
    ops.forEach((op, i) => {
      const jumps: number[] = []
      switch (op.op) {
        case "fx":
          effects(op.effects, where)
          break
        case "jf":
          cond(op.cond, where)
          jumps.push(op.to)
          if (i + 1 >= ops.length) err(`${where} ends after a condition`)
          break
        case "jmp":
          jumps.push(op.to)
          break
        case "go":
          if (op.node === END) out.add(END)
          else if (!chapter.scenes[op.node])
            err(`${where}: go to unknown scene "${op.node}"`)
          else out.add(op.node)
          break
        case "choice":
          for (const o of op.options) {
            if (o.if) cond(o.if, where)
            jumps.push(o.to)
          }
          break
        case "hub":
          for (const t of op.topics) if (t.if) cond(t.if, where)
          jumps.push(op.after)
          break
        case "fight":
          for (const o of op.fight.objectives) {
            effects(o.onSuccess ?? [], `${where} fight ${op.fight.id}`)
            effects(o.onFailure ?? [], `${where} fight ${op.fight.id}`)
          }
          break
      }
      for (const j of jumps)
        if (j < 0 || j >= ops.length)
          err(`${where}: runs off its end (op ${i})`)
      const last = i === ops.length - 1
      if (last && !["go", "jmp", "topicEnd"].includes(op.op))
        err(`${where}: last instruction "${op.op}" does not leave the scene`)
    })
  }

  const ex = chapter.exploration
  if (ex) {
    const w = ex.island[0].length
    const inside = (p: { x: number; y: number }) =>
      p.x >= 0 && p.y >= 0 && p.x < w && p.y < ex.island.length
    if (ex.island.some((r) => r.length !== w))
      err("island rows differ in length")
    if (!inside(ex.start)) err("island start is outside")
    const ids = new Set<string>()
    for (const e of ex.encounters) {
      if (ids.has(e.id)) err(`encounter "${e.id}" is twice`)
      ids.add(e.id)
      if (!inside(e.at)) err(`encounter "${e.id}" is outside the island`)
      for (const z of e.zone ?? [])
        if (!inside(z)) err(`encounter "${e.id}": zone cell outside`)
      if (e.scene !== undefined && !chapter.scenes[e.scene])
        err(`encounter "${e.id}": unknown scene "${e.scene}"`)
      if (e.if) cond(e.if, `encounter ${e.id}`)
      effects(e.examine?.effects ?? [], `encounter ${e.id}`)
      effects(e.wander?.effects ?? [], `encounter ${e.id}`)
    }
    // the story must never wait for something the hero cannot find
    for (const id of Object.keys(chapter.scenes))
      if (!ex.encounters.some((e) => e.scene === id))
        err(`scene "${id}" has no place on the island`)
  }

  // reachability from the start, and a way to the end from everywhere
  const seen = new Set<string>()
  const stack = [chapter.start]
  while (stack.length) {
    const id = stack.pop() as string
    if (id === END || seen.has(id)) continue
    seen.add(id)
    for (const n of edges.get(id) ?? []) stack.push(n)
  }
  for (const id of Object.keys(chapter.scenes))
    if (!seen.has(id)) err(`scene "${id}" is unreachable`)
  const ends = new Set<string>()
  let changed = true
  while (changed) {
    changed = false
    for (const [id, out] of edges) {
      if (ends.has(id)) continue
      if (out.has(END) || [...out].some((n) => ends.has(n))) {
        ends.add(id)
        changed = true
      }
    }
  }
  for (const id of seen)
    if (!ends.has(id)) err(`scene "${id}" cannot reach the end`)
  return errors
}
