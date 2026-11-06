import type { PuzzleSpec } from "./puzzle"
import type { Beat, Cond, Effect, FightSpec, Scene, Topic } from "./types"

/** Flat instructions of a scene: the cursor of a run is an index into them. */
export type Op =
  | { op: "say"; who: string; text: string }
  | { op: "narr"; text: string }
  | { op: "stage"; text: string }
  | { op: "hint"; title: string; text: string }
  | { op: "fx"; effects: Effect[] }
  | { op: "jf"; cond: Cond; to: number }
  | { op: "jmp"; to: number }
  | {
      op: "choice"
      id: string
      prompt?: string
      options: { id: string; text: string; if?: Cond; to: number }[]
    }
  | {
      op: "hub"
      id: string
      topics: {
        id: string
        title: string
        if?: Cond
        last?: boolean
        to: number
      }[]
      after: number
    }
  | { op: "puzzle"; id: string; prompt?: string; puzzle: PuzzleSpec }
  /** Skips to `to` unless the puzzle `puzzle` ended on the rule `rule` ("none": on no rule). */
  | { op: "pjf"; puzzle: string; rule: string; to: number }
  | { op: "topicEnd"; hub: number; topic: string; id: string }
  | { op: "fight"; fight: FightSpec }
  | { op: "go"; node: string }

const cache = new WeakMap<Scene, Op[]>()

/** Compiles a scene (cached). */
export function compile(scene: Scene): Op[] {
  let ops = cache.get(scene)
  if (!ops) {
    ops = []
    emit(scene.beats, ops, [])
    if (scene.next) ops.push({ op: "go", node: scene.next })
    cache.set(scene, ops)
  }
  return ops
}

interface ChoiceCtx {
  starts: Map<string, number>
  fixups: { at: number; option: string }[]
}

function emit(beats: Beat[], ops: Op[], stack: ChoiceCtx[]) {
  for (const beat of beats) {
    switch (beat.t) {
      case "say":
        ops.push({ op: "say", who: beat.who, text: beat.text })
        break
      case "narr":
      case "stage":
        ops.push({ op: beat.t, text: beat.text })
        break
      case "hint":
        ops.push({ op: "hint", title: beat.title, text: beat.text })
        break
      case "fx":
        ops.push({ op: "fx", effects: beat.effects })
        break
      case "go":
        ops.push({ op: "go", node: beat.node })
        break
      case "fight":
        ops.push({ op: "fight", fight: beat.fight })
        break
      case "if": {
        const jf = { op: "jf", cond: beat.cond, to: -1 } as const
        const at = ops.push(jf) - 1
        emit(beat.then, ops, stack)
        if (beat.else) {
          const jmp = ops.push({ op: "jmp", to: -1 }) - 1
          setTo(ops[at], ops.length)
          emit(beat.else, ops, stack)
          setTo(ops[jmp], ops.length)
        } else {
          setTo(ops[at], ops.length)
        }
        break
      }
      case "redirect": {
        const ctx = stack[stack.length - 1]
        if (!ctx) throw new Error(`redirect "${beat.option}" outside a choice`)
        const at = ops.push({ op: "jmp", to: -1 }) - 1
        ctx.fixups.push({ at, option: beat.option })
        break
      }
      case "choice": {
        const ctx: ChoiceCtx = { starts: new Map(), fixups: [] }
        const choice = {
          op: "choice",
          id: beat.id,
          prompt: beat.prompt,
          options: beat.options.map((o) => ({
            id: o.id,
            text: o.text,
            if: o.if,
            to: -1,
          })),
        } as const
        ops.push(choice)
        const jumps: number[] = []
        beat.options.forEach((o, i) => {
          choice.options[i].to = ops.length
          ctx.starts.set(o.id, ops.length)
          emit(o.beats, ops, [...stack, ctx])
          jumps.push(ops.push({ op: "jmp", to: -1 }) - 1)
        })
        for (const j of jumps) setTo(ops[j], ops.length)
        for (const f of ctx.fixups) {
          const to = ctx.starts.get(f.option)
          if (to === undefined)
            throw new Error(`redirect to unknown option "${f.option}"`)
          setTo(ops[f.at], to)
        }
        break
      }
      case "puzzle": {
        ops.push({
          op: "puzzle",
          id: beat.id,
          prompt: beat.prompt,
          puzzle: beat.puzzle,
        })
        const sections: [string, Beat[]][] = [
          ...Object.entries(beat.on ?? {}),
          ...(beat.none ? ([["none", beat.none]] as [string, Beat[]][]) : []),
        ]
        for (const [rule, body] of sections) {
          const at = ops.push({ op: "pjf", puzzle: beat.id, rule, to: -1 }) - 1
          emit(body, ops, stack)
          setTo(ops[at], ops.length)
        }
        break
      }
      case "hub": {
        const at = ops.length
        const hub: Extract<Op, { op: "hub" }> = {
          op: "hub",
          id: beat.id,
          topics: beat.topics.map((t: Topic) => ({
            id: t.id,
            title: t.title,
            if: t.if,
            last: t.last,
            to: -1,
          })),
          after: -1,
        }
        ops.push(hub)
        beat.topics.forEach((t, i) => {
          hub.topics[i].to = ops.length
          emit(t.beats, ops, stack)
          ops.push({ op: "topicEnd", hub: at, topic: t.id, id: beat.id })
        })
        hub.after = ops.length
        break
      }
    }
  }
}

function setTo(op: Op, to: number) {
  if (op.op === "jf" || op.op === "jmp" || op.op === "pjf") op.to = to
  else throw new Error("not a jump")
}
