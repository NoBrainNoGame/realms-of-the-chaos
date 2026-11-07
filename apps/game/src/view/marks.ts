import { chapterOfRun, type Encounter, type Run } from "@realms/adventure"

/** What an encounter asks of the hero, in a few words (a pixel chip). */
export type MarkKind = "talk" | "examine" | "exit" | "fight" | "puzzle" | "move"

export interface MarkInfo {
  kind: MarkKind
  /** The short French label of the chip. */
  label: string
}

/** Whether a beat tree holds a beat of this type (fights and puzzles hide in scenes). */
function holds(node: unknown, type: string): boolean {
  if (Array.isArray(node)) return node.some((n) => holds(n, type))
  if (node && typeof node === "object") {
    const o = node as Record<string, unknown>
    if (o.t === type) return true
    return Object.values(o).some((v) => holds(v, type))
  }
  return false
}

const short = (s: string, n = 32) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s
/** "Parler à ..." with the right article ("au feu", "à la Borne", "aux pêcheurs"). */
const to = (label: string) => {
  const l = lower(label)
  if (l.startsWith("le ")) return `au ${l.slice(3)}`
  if (l.startsWith("la ")) return `à la ${l.slice(3)}`
  if (l.startsWith("les ")) return `aux ${l.slice(4)}`
  if (l.startsWith("l'")) return `à l'${l.slice(2)}`
  return `à ${label}`
}
const lower = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s)

/** The kind and label of the marker of an encounter. */
export function markInfo(run: Run, e: Encounter): MarkInfo {
  if (e.wander) return { kind: "fight", label: "Combat" }
  if (e.obstacle) return { kind: "move", label: "Obstacle" }
  if (e.scene !== undefined) {
    const scene = chapterOfRun(run).scenes[e.scene]
    if (holds(scene?.beats, "fight") || scene?.kind === "combat")
      return { kind: "fight", label: "Combat" }
    if (holds(scene?.beats, "puzzle"))
      return { kind: "puzzle", label: "Énigme" }
    if (scene?.kind === "fin")
      return { kind: "exit", label: short(`Sortie vers ${lower(e.label)}`) }
    if (e.actor) return { kind: "talk", label: short(`Parler ${to(e.label)}`) }
    return { kind: "exit", label: short(`Aller vers ${lower(e.label)}`) }
  }
  if (e.actor) return { kind: "talk", label: short(`Parler ${to(e.label)}`) }
  return { kind: "examine", label: "Examiner" }
}

/**
 * Where the marker floats: right above the target, at the top of its sprite
 * (`headTop`, negative, from its feet) or of its cell, plus a small gap.
 */
export function markAnchor(
  feet: { x: number; y: number },
  headTop: number,
  gap = 3,
) {
  return { x: feet.x, y: feet.y + Math.min(0, headTop) - gap }
}
