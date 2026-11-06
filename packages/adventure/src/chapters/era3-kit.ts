import { CHARACTERS, type CharacterPreset, type Stats } from "@realms/engine"
import { all, any, around, is, lt, not, stage, when } from "../dsl"
import type { Beat, Cond, Encounter, FighterSpec, Spot } from "../types"
import "./era3-flags"

// Shared pieces of era III: the Garde de verre, the voices of the era (the
// "III" Echos), a few small helpers. The stats are written on the scale of
// content.ts (health = HP / 7).

const HP = 7

export function kitOf(
  base: string,
  id: string,
  name: string,
  title: string,
  stats: Partial<Stats> = {},
  actions?: string[],
): CharacterPreset {
  const preset = CHARACTERS[base]
  if (!preset) throw new Error(`Unknown preset "${base}"`)
  return {
    ...preset,
    id,
    name,
    title,
    kit: base,
    stats: { ...preset.stats, ...stats },
    actions: actions ?? preset.actions,
  }
}

// ─── La Garde de verre ──────────────────────────────────────────────────────

/** HP 10, speed 4. Coup de hampe (shieldBash: pushes), Course. */
export const HALLEBARDIER = kitOf(
  "brutus",
  "hallebardier",
  "Hallebardier de verre",
  "Garde",
  {
    health: 10 / HP,
    speed: 4,
    physicalAttack: 6,
    physicalDefense: 5,
    magicalAttack: 1,
    magicalDefense: 2,
    luck: 2,
  },
  ["shieldBash", "kick"],
)

/** HP 6, speed 5. Carreau (arrow, range 2 to 6). */
export const ARBALETRIER = kitOf(
  "eva",
  "arbaletrier",
  "Arbalétrier de verre",
  "Garde",
  {
    health: 6 / HP,
    speed: 5,
    physicalAttack: 7,
    physicalDefense: 2,
    magicalAttack: 1,
    magicalDefense: 2,
    luck: 3,
  },
  ["arrow", "kick"],
)

/** HP 7, speed 5. Diapason (frost: damage and slow). */
export const SONNEUR = kitOf(
  "merlin",
  "sonneur",
  "Sonneur",
  "Garde",
  {
    health: 7 / HP,
    speed: 5,
    physicalAttack: 2,
    physicalDefense: 2,
    magicalAttack: 5,
    magicalDefense: 4,
    luck: 2,
  },
  ["frost", "kick"],
)

/** HP 7, speed 6. Pic (blade); "Extraire" does not exist in the engine. */
export const EXTRACTEUR = kitOf(
  "nyx",
  "extracteur",
  "Extracteur",
  "Garde",
  {
    health: 7 / HP,
    speed: 6,
    physicalAttack: 5,
    physicalDefense: 3,
    magicalAttack: 1,
    magicalDefense: 2,
    luck: 2,
  },
  ["blade", "kick"],
)

/** Brutus x1.3 HP; he surrenders under 30 % (flee rule) and is never dispersed. */
export const BRUTUS3 = kitOf("brutus", "brutus3", "Brutus III", "Capitaine", {
  health: CHARACTERS.brutus.stats.health * 1.3,
})

/** Merlin x1.5 HP. Givre, Gel (frost, hits an area is CUT), Boule de feu. */
export const MERLIN3 = kitOf(
  "merlin",
  "merlin3",
  "Merlin III",
  "Maître du Verre",
  {
    health: CHARACTERS.merlin.stats.health * 1.5,
  },
)

// ─── Les Échos de l'ère ─────────────────────────────────────────────────────

export const LYRA3 = kitOf("lyra", "lyra3", "Lyra III", "Soigneuse")
export const EVA3 = kitOf("eva", "eva3", "Eva III", "Archère")
export const SQUALOR3 = kitOf(
  "squalor",
  "squalor3",
  "Squalor III",
  "Homme-requin",
)

/** Précision, HP 7: Rature, Lecture à voix haute, Coup de reliure. */
export const CHRONIQUEUR = kitOf(
  "eva",
  "chroniqueur",
  "Le Chroniqueur",
  "Rédacteur",
  {
    health: 1,
    speed: 4,
    physicalAttack: 4,
    physicalDefense: 2,
    magicalAttack: 6,
    magicalDefense: 4,
    luck: 5,
  },
  ["frost", "arrow", "kick"],
)

// ─── Helpers ────────────────────────────────────────────────────────────────

/** A rectangle of cells (inclusive), as a zone of the clock rules. */
export const zone = (
  id: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) => ({
  id,
  cells: Array.from({ length: (x1 - x0 + 1) * (y1 - y0 + 1) }, (_, i) => ({
    x: x0 + (i % (x1 - x0 + 1)),
    y: y0 + Math.floor(i / (x1 - x0 + 1)),
  })),
})

/** A place of the story on an island: the cell and its neighbours trigger it. */
export function place(
  island: string[],
  id: string,
  label: string,
  scene: string,
  x: number,
  y: number,
  extra: Partial<Encounter> = {},
): Encounter {
  return {
    id,
    label,
    scene,
    at: { x, y },
    zone: around(island, x, y),
    ...extra,
  }
}

/** An optional thing to look at: it gives one point of listening. */
export function look(
  id: string,
  label: string,
  at: Spot,
  text: string,
  style: "stage" | "narr" = "stage",
): Encounter {
  return {
    id,
    label,
    at,
    examine: {
      lines: [{ style, text }],
      effects: [{ add: "ecoute", by: 1 }],
    },
  }
}

/**
 * An archive extract: impeccable, or annotated by the Chroniqueur himself once
 * he has joined ("(faux)", "(vérifié aux strates)"...).
 */
export function archive(title: string, plain: string, annotated: string): Beat {
  const line = (text: string) =>
    stage(`Extrait des archives — ${title}. ${text}`)
  return when(is("chroniqueur_rejoint"), [line(annotated)], [line(plain)])
}

/** `a` has at least as much trust as `b` (both are `confiance.*` flags). */
export function atLeast(a: string, b: string): Cond {
  return any(
    ...Array.from({ length: 11 }, (_, i) => i - 5).map((v) =>
      all(is(a, v), lt(b, v + 1)),
    ),
  )
}

/** Nests `when` over a list of (condition, beat): the first match plays. */
export function firstOf(entries: { cond: Cond; beat: Beat }[]): Beat {
  let acc: Beat = entries[entries.length - 1].beat
  for (let i = entries.length - 2; i >= 0; i--)
    acc = when(entries[i].cond, [entries[i].beat], [acc])
  return acc
}

export type Ally = "eva" | "squalor" | "none"

/** Which Echo of the previous era stands with the hero (from ile_sauvee). */
export const ALLY_COND: Record<Ally, Cond> = {
  eva: any(
    is("ile_sauvee", "sauge"),
    all(
      is("ile_sauvee", "strates"),
      atLeast("confiance.eva", "confiance.squalor"),
    ),
  ),
  squalor: any(
    is("ile_sauvee", "lusse"),
    all(
      is("ile_sauvee", "strates"),
      not(atLeast("confiance.eva", "confiance.squalor")),
    ),
  ),
  none: is("ile_sauvee", "aucune"),
}

/** Plays `make(ally)` for the Echo who is with the hero. */
export function byAlly(make: (ally: Ally) => Beat): Beat {
  return firstOf(
    (["eva", "squalor", "none"] as const).map((a) => ({
      cond: ALLY_COND[a],
      beat: make(a),
    })),
  )
}

/** The Echo as a fighter spec, or nothing. */
export function allyFighter(ally: Ally, at: Spot): FighterSpec[] {
  if (ally === "eva") return [{ preset: EVA3, at }]
  if (ally === "squalor") return [{ preset: SQUALOR3, at }]
  return []
}
