import { CHARACTERS, type CharacterPreset } from "@realms/engine"
import { around } from "../dsl"
import { FLAGS, type FlagSpec } from "../flags"
import type { Effect, Encounter, ExamineLine, Influence, Spot } from "../types"

// Shared by the chapters of era II ("Le Temps des Marées"): flags, presets and
// small helpers. Nothing here touches the shared engine files.

// ─── Flags ──────────────────────────────────────────────────────────────────

const bool: FlagSpec = { default: false }
const count = (max: number, min = 0): FlagSpec => ({ default: 0, min, max })
const text = (...values: string[]): FlagSpec => ({
  default: values[0],
  values,
})

/**
 * The flags era II adds to the registry. They are registered when this file is
 * imported (every chapter of the era imports it), because the registry is
 * closed: `validateChapter` rejects a key that is not in it.
 */
export const ERA2_FLAGS: Record<string, FlagSpec> = {
  // trust of the new lineages (the shared table only knows era I's)
  "confiance.eva": count(5, -5),
  "confiance.squalor": count(5, -5),
  "confiance.lacunaire": count(5, -5),
  // the island the Grande Marée spares, and what the hero becomes
  ile_sauvee: text("aucune", "sauge", "lusse", "strates"),
  "transformation.II": text("aucune", "A", "B"),
  journal_nerea: text("aucun", "garde", "porte"),
  squalor_rejoint: bool,
  "lacunaire.forme": text(
    "aucune",
    "ondine",
    "aiguille",
    "squale",
    "miroir",
    "recif",
    "brume",
  ),
  peut_etre: text("aucune", "recousue", "elargie", "habitee"),
  // names offered at the vigil (arc F): one flag per lineage
  "nom.propositions.nerea": bool,
  "nom.propositions.eva": bool,
  "nom.propositions.squalor": bool,
  "nom.propositions.lacunaire": bool,
  // ch. 7
  ch7_etoile: bool,
  objet_nyx_confie: bool,
  ce_matin: bool,
  conteste_chant: bool,
  // ch. 8
  ch8_carte: bool,
  squalor_laisse_manger: bool,
  squalor_frappe: bool,
  eva_rejointe: bool,
  // ch. 9
  ch9_evite: bool,
  ch9_interrompu: bool,
  squalor_nourri: bool,
  squalor_vaincu: bool,
  squalor_serment: bool,
  squales_epargnes: bool,
  // ch. 10
  eclat_jumelle: bool,
  lacunaire_perdu: bool,
  lacunaire_sans_influence: bool,
  // ch. 11
  ch11_etoile: bool,
  reconstitution_forcee: bool,
  archive_aube: bool,
  nuit_froide: bool,
  ch11_fidele1: bool,
  ch11_fidele2: bool,
  ch11_obligee: bool,
  ch11_archive: bool,
  // ch. 12
  ch12_ile_entiere: bool,
  ch12_personne_derriere: bool,
  eclat_donne_neree: bool,
}
Object.assign(FLAGS, ERA2_FLAGS)

// ─── Presets ────────────────────────────────────────────────────────────────

/** A copy of an existing character's kit under a new name. */
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

const lacunaire = (
  id: string,
  name: string,
  stats: Partial<CharacterPreset["stats"]>,
  actions: string[],
): CharacterPreset => ({
  id,
  name,
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
    ...stats,
  },
  actions,
})

export const UNSTABLE = lacunaire(
  "lacunaire_instable",
  "Lacunaire instable",
  {},
  ["kick"],
)
/** SIMPLIFIED: the two candidate positions of a "dédoublé" do not exist; it is a plain, slightly tougher one. */
export const DEDOUBLE = lacunaire(
  "lacunaire_dedouble",
  "Lacunaire dédoublé",
  { health: 2, speed: 6 },
  ["kick"],
)
export const EFFILOCHEUR = lacunaire(
  "lacunaire_effilocheur",
  "Lacunaire effilocheur",
  { health: 2.2, speed: 6, magicalAttack: 5 },
  ["frost", "kick"],
)
export const GIANT = lacunaire(
  "lacunaire_geant",
  "Lacunaire géant",
  {
    health: 4.3,
    speed: 2,
    physicalAttack: 1,
    physicalDefense: 5,
    magicalAttack: 7,
    magicalDefense: 5,
  },
  ["frost", "kick"],
)

/** A young reef shark: about 60 % of Squalor's health, a bite. */
export const SQUALE: CharacterPreset = {
  ...kitOf("squalor", "squale", "Squale", "Animal"),
  stats: { ...CHARACTERS.squalor.stats, health: 4.4, physicalAttack: 6 },
  actions: ["bite", "kick"],
}

/**
 * The stabilised Lacunaire. SIMPLIFIED: the six forms (ondine, aiguille,
 * squale, miroir, récif, brume) and the Hésitation trait do not exist as
 * presets, so one kit stands for all of them.
 */
export const STABILISE: CharacterPreset = {
  id: "lacunaire_stabilise",
  name: "Le Lacunaire",
  title: "Lacunaire stabilisé",
  affinity: "shadow",
  locomotion: "swimmer",
  stats: {
    health: 6,
    speed: 5,
    physicalAttack: 5,
    physicalDefense: 4,
    magicalAttack: 5,
    magicalDefense: 5,
    luck: 5,
  },
  actions: ["bubble", "kick"],
}

/** The unfixed drifting Lacunaire of ch. 10 (neutral, never fights). */
export const REMOUS: CharacterPreset = {
  id: "lacunaire_remous",
  name: "Le remous",
  title: "Lacunaire sans forme",
  affinity: "shadow",
  locomotion: "swimmer",
  stats: {
    health: 6,
    speed: 2,
    physicalAttack: 1,
    physicalDefense: 3,
    magicalAttack: 1,
    magicalDefense: 3,
    luck: 1,
  },
  actions: ["kick"],
}

/** The three silhouettes of the reconstitutions (grains of silt, no faces). */
export const PORTEUSE = kitOf(
  "brutus",
  "echo_porteuse",
  "La Porteuse",
  "Écho de vase",
)
export const THERMISTE = kitOf(
  "merlin",
  "echo_thermiste",
  "Le Thermiste",
  "Écho de vase",
)
export const GUETTEUSE = kitOf(
  "eva",
  "echo_guetteuse",
  "La Guetteuse",
  "Écho de vase",
)

/** A neutral bystander (villager, child) that only has to be kept alive. */
export const VILLAGEOIS: CharacterPreset = {
  id: "villageois",
  name: "Villageois",
  title: "Habitant",
  affinity: "strength",
  stats: {
    health: 3,
    speed: 4,
    physicalAttack: 1,
    physicalDefense: 2,
    magicalAttack: 1,
    magicalDefense: 2,
    luck: 3,
  },
  actions: ["kick"],
}

/** The heart of the chosen island of ch. 12 (neutral, high hit points). */
export const COEUR: CharacterPreset = {
  id: "coeur_ile",
  name: "Le Cœur",
  title: "Cœur de l'île",
  affinity: "strength",
  stats: {
    health: 16,
    speed: 1,
    physicalAttack: 1,
    physicalDefense: 6,
    magicalAttack: 1,
    magicalDefense: 6,
    luck: 1,
  },
  actions: ["kick"],
}

export const ILSE: CharacterPreset = {
  ...VILLAGEOIS,
  id: "ilse",
  name: "Ilse",
  title: "Apprentie",
}

// ─── Island helpers ─────────────────────────────────────────────────────────

/** The cells that trigger a place on an island (the cell and its neighbours). */
export const zoneOf = (island: string[]) => (x: number, y: number) =>
  around(island, x, y)

/** An optional thing to look at: the lines, and one more point of Écoute. */
export function look(
  id: string,
  label: string,
  at: Spot,
  lines: (string | ExamineLine)[],
  effects: Effect[] = [{ add: "ecoute", by: 1 }],
): Encounter {
  return {
    id,
    label,
    at,
    examine: {
      lines: lines.map((l) =>
        typeof l === "string" ? { style: "stage" as const, text: l } : l,
      ),
      effects,
    },
  }
}

/** Something only an Influence of the Ghom can move. */
export function movable(
  id: string,
  label: string,
  at: Spot,
  influence: Influence,
  before: string,
  after: string,
): Encounter {
  return {
    id,
    label,
    at,
    obstacle: {
      influence,
      before: [{ style: "stage", text: before }],
      after: [{ style: "stage", text: after }],
      effects: [{ add: "ecoute", by: 1 }],
    },
  }
}
