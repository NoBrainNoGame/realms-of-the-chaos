import {
  CHARACTERS,
  type CharacterPreset,
  generateCharacter,
} from "@realms/engine"
import { around } from "../dsl"
import { FLAGS, type FlagSpec, registerFlags } from "../flags"
import type {
  Chapter,
  Cond,
  Encounter,
  FighterSpec,
  FightReport,
  FightSpec,
  ObjectiveSpec,
} from "../types"

// Shared pieces of era V (ch. 25 to 28): flags, presets, boards, islands.

// ─── Flags ──────────────────────────────────────────────────────────────────
// `flags.ts` is shared and is not edited here: the era registers its own flags
// when it is imported, never overwriting a flag another era already declared.

const bool: FlagSpec = { default: false }
const count = (max: number, min = 0): FlagSpec => ({ default: 0, min, max })
const text = (...values: string[]): FlagSpec => ({
  default: values[0],
  values,
})

export const ERA5_FLAGS: Record<string, FlagSpec> = {
  // inherited from the earlier eras
  double_epargne: bool,
  "doubles.epargnes": count(99),
  carnet_intact: { default: true },
  merlin_convaincu: bool,
  "trahison.brutus": bool,
  "trahison.eva": bool,
  "trahison.gorr": bool,
  squalor_rejoint: bool,
  chroniqueur_rejoint: bool,
  paix_des_lacunes: bool,
  sel_emportee: bool,
  gorr_question: bool,
  couplage_ghom_dechu: bool,
  "confiance.eva": count(5, -5),
  "confiance.gorr": count(5, -5),
  "confiance.squalor": count(5, -5),
  "ghom_dechu.issue": text("aucune", "vaincu", "suivi", "laisse", "couple"),
  "ghom_dechu.echo": bool,
  "cristaux.extraits": count(99),
  // era V
  vacuum_decay: bool,
  derniere_lacune: text("aucune", "recousue", "elargie", "habitee"),
  heros_disperse: bool,
  combat_final_libre: bool,
  derniere_reponse: text(
    "aucune",
    "ghom",
    "rien_impossible",
    "ne_sait_pas",
    "liens",
    "silence",
  ),
  bascule: bool,
  // Meta-flag: the hero has seen the Bascule in another life (set by the game).
  bascule_vue: bool,
  fin: text(
    "aucune",
    "cristal",
    "equilibre",
    "intrication",
    "decouplage",
    "dispersion",
    "bascule",
    "gratuite",
  ),
  "fin.monde": text("aucun", "cristal", "equilibre", "ouvert"),
  "q28.annotee": bool,
  // local to the chapters
  coeur_vide: bool,
  bulle_vue: bool,
  "retour.brutus": bool,
  "retour.eva": bool,
  "retour.nerea": bool,
  "retour.lyra": bool,
  "retour.squalor": bool,
  "trahison.nerea": bool,
  "trahison.lyra": bool,
  "trahison.squalor": bool,
  "rupture.respectee": bool,
  retour_respect: bool,
  "nom.propositions.lyra": bool,
  "nom.propositions.gorr": bool,
  "nom.propositions.merlin": bool,
  "nom.propositions.nerea": bool,
  "nom.propositions.eva": bool,
  "nom.propositions.squalor": bool,
  "nom.propositions.nyx": bool,
  "nom.aube": bool,
  "nom.fissure": bool,
  geste_dernier: bool,
  geste_fautes: count(9),
  gratuite_close: bool,
}

registerFlags(ERA5_FLAGS)

// `nom` also names the other lineages at the Nomination (ch. 28).
const nom = FLAGS.nom
if (nom?.values)
  for (const n of [
    "brutus",
    "eva",
    "nyx",
    "merlin",
    "gorr",
    "squalor",
    "lacunaire",
    "chroniqueur",
  ])
    if (!nom.values.includes(n)) (nom.values as string[]).push(n)

// ─── Presets ────────────────────────────────────────────────────────────────

export function kitOf(
  base: string,
  id: string,
  name: string,
  title: string,
): CharacterPreset {
  const preset = CHARACTERS[base]
  if (!preset) throw new Error(`Unknown preset "${base}"`)
  return { ...preset, id, name, title, kit: base }
}

/** A fair Double of a fighter, from another branch (ch. 25 and 28). */
export function doubleOf(
  seed: number,
  kit: string,
  name = "Double",
): CharacterPreset {
  const p = generateCharacter(seed, kit)
  return { ...p, name: `${name} ${CHARACTERS[kit]?.name ?? kit}` }
}

export const UNSTABLE: CharacterPreset = {
  id: "lacunaire_instable",
  name: "Lacunaire instable",
  title: "Lacunaire",
  affinity: "shadow",
  stats: {
    health: 1.6,
    speed: 5,
    physicalAttack: 3,
    physicalDefense: 2,
    magicalAttack: 4,
    magicalDefense: 2,
    luck: 1,
  },
  actions: ["kick"],
}

export const GIANT: CharacterPreset = {
  id: "lacunaire_geant",
  name: "Lacunaire géant",
  title: "Lacunaire",
  affinity: "shadow",
  stats: {
    health: 4.3,
    speed: 2,
    physicalAttack: 1,
    physicalDefense: 5,
    magicalAttack: 7,
    magicalDefense: 5,
    luck: 1,
  },
  actions: ["frost", "kick"],
}

export const TIEDEUR: CharacterPreset = {
  id: "tiedeur",
  name: "La Tiédeur",
  title: "Marée",
  affinity: "shadow",
  stats: {
    health: 2.4,
    speed: 3,
    physicalAttack: 2,
    physicalDefense: 3,
    magicalAttack: 5,
    magicalDefense: 3,
    luck: 1,
  },
  actions: ["frost"],
}

export const GHOM_DECHU = kitOf("nyx", "ghom_dechu", "Le Ghom déchu", "Écho")

// ─── Boards and islands ─────────────────────────────────────────────────────

export const flat = (w: number, h = w) =>
  Array.from({ length: h }, () => ".".repeat(w))

export const cells = (...xy: [number, number][]) =>
  xy.map(([x, y]) => ({ x, y }))

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

/** An island that is one walkable row of places, one per scene (in order). */
export function walk(
  scenes: { id: string; label: string; auto?: boolean }[],
  companions: string[],
  extra: Encounter[] = [],
  decor: (rows: string[]) => string[] = (r) => r,
): NonNullable<Chapter["exploration"]> {
  const w = 2 + scenes.length * 3
  const island = decor(flat(w, 5))
  const encounters: Encounter[] = scenes.map((s, i) => {
    const x = 2 + i * 3
    return {
      id: `e${s.id}`,
      label: s.label,
      scene: s.id,
      at: { x, y: 2 },
      ...(s.auto ? { auto: true } : { zone: around(island, x, 2) }),
    }
  })
  return {
    island,
    start: { x: 0, y: 2 },
    companions,
    influences: ["earthquake", "timeWarp", "blessing"],
    encounters: [...encounters, ...extra],
  }
}

// ─── Fights ─────────────────────────────────────────────────────────────────

export const hero = (x: number, y: number): FighterSpec => ({
  preset: "@hero",
  at: { x, y },
})
export const at = (preset: string | CharacterPreset, x: number, y: number) =>
  ({ preset, at: { x, y } }) as FighterSpec

export const fell = (r: FightReport, presetPrefix: string) =>
  r.fighters.some((f) => f.preset.startsWith(presetPrefix) && f.hp <= 0)

export const aliveCount = (r: FightReport, team: number) =>
  r.fighters.filter((f) => f.team === team && f.hp > 0 && !f.fled).length

export type { Cond, FightSpec, ObjectiveSpec }
