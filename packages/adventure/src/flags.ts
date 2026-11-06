import type { FlagValue } from "./types"

export interface FlagSpec {
  default: FlagValue
  min?: number
  max?: number
  /** Allowed values of a text flag. */
  values?: readonly string[]
}

/** Lineages whose trust the run tracks (`confiance.<lineage>`). */
export const TRUST_LINEAGES = [
  "lyra",
  "brutus",
  "nerea",
  "nyx",
  "merlin",
] as const

const bool: FlagSpec = { default: false }
const count = (max: number, min = 0): FlagSpec => ({ default: 0, min, max })
const text = (...values: string[]): FlagSpec => ({
  default: values[0],
  values,
})

/** Every flag of the Adventure, with its range (the registry of the bible). */
export const FLAGS: Record<string, FlagSpec> = {
  confiance: count(10, -10),
  usure: count(10),
  ecoute: count(99),
  "lacunes.recousues": count(99),
  "lacunes.elargies": count(99),
  "lacunes.habitees": count(99),
  "archives.lues": count(99),
  "cristaux.gardes": count(99),
  "cristaux.donnes": count(99),
  "cristaux.portes": count(99),
  nom: text("aucun", "lyra", "nerea", "faux"),
  "nom.promesse": text("aucune", "lyra", "nerea"),
  "transformation.1": text("aucune", "A", "B"),
  "ghom_dechu.verite": count(9),

  // A fight was lost: read by the scene right after the fight, then cleared.
  defaite: bool,

  // era I
  zones_prologue: count(3),
  lacunaire_approche: bool,
  zones_bords_froids: count(3),
  lyra_usure: bool,
  "lacunaires.epargnes": count(99),
  demeure_ouverte: bool,
  "demeure.graine": bool,
  pim_graine: bool,
  pim_promesse: bool,
  pim_avant_doyenne: bool,
  archive_derive: text("aucune", "disponible", "lue"),
  merlin_mesure: bool,
  vesce_dispersee: bool,
  vesce_rendue: bool,
  vesce_fuie: bool,
  intrication_nyx: bool,
  "premier_cristal.lieu": text("aucun", "cairn", "lacune"),
  "premier_cristal.paire": text("aucune", "heros+nyx", "autre"),
  nyx_epargnee: bool,
  nyx_effrayee: bool,
  objet_de_nyx: bool,
  fragments: text("aucun", "fusion", "separation"),
  lacune_geante_habitee: bool,
  derive_protegee: bool,
  lacune_issue: text("aucune", "habitee", "recousue", "elargie"),
  dispersion_ere1: bool,
  intrications: count(99),
  hero_name_asked: bool,
  nyx_lame: bool,
  ghom_a_agi: bool,
  zones_perdues: count(99),
  seisme_pres_lyra: bool,
  nom_propose: bool,
  fonds_intacts: bool,
  intrication_eau: bool,
  aucune_dispersion: bool,
  ghom_tranquille: bool,
  lyra_chaleur: bool,
  lyra_echec: bool,
  sans_reparation: bool,
  ghom_elan_5: bool,
  demeure_scellee: bool,
  borne_lue: bool,
  feu_tenu: bool,
  ecoute_bords: count(3),
}

/**
 * Adds the flags an era declares. A flag two eras both declare keeps the
 * first default and the union of the values of a text flag; a flag declared
 * with two different kinds is a bug in the story (it throws).
 */
export function registerFlags(specs: Record<string, FlagSpec>) {
  for (const [key, spec] of Object.entries(specs)) {
    const known = Object.hasOwn(FLAGS, key) ? FLAGS[key] : undefined
    if (!known) {
      FLAGS[key] = spec
      continue
    }
    if (typeof known.default !== typeof spec.default)
      throw new Error(`Flag "${key}" is declared with two different kinds`)
    if (known.values && spec.values) {
      for (const v of spec.values)
        if (!known.values.includes(v))
          FLAGS[key] = { ...known, values: [...known.values, v] }
    }
    if (
      known.max !== undefined &&
      spec.max !== undefined &&
      spec.max > known.max
    )
      FLAGS[key] = { ...FLAGS[key], max: spec.max }
    if (
      known.min !== undefined &&
      spec.min !== undefined &&
      spec.min < known.min
    )
      FLAGS[key] = { ...FLAGS[key], min: spec.min }
  }
}

const QUESTIONS = Array.from(
  { length: 29 },
  (_, i) => `Q${String(i).padStart(2, "0")}`,
)

/** The spec of a flag, or undefined if the key is not registered. */
export function flagSpec(key: string): FlagSpec | undefined {
  if (Object.hasOwn(FLAGS, key)) return FLAGS[key]
  const [head, tail] = [
    key.slice(0, key.indexOf(".")),
    key.slice(key.indexOf(".") + 1),
  ]
  if (
    head === "confiance" &&
    (TRUST_LINEAGES as readonly string[]).includes(tail)
  )
    return count(5, -5)
  if (head === "carnet" && QUESTIONS.includes(tail))
    return text("ouverte", "repondue", "fausse", "aucune")
  return undefined
}

/** Initial value of a flag. */
export function defaultFlag(key: string): FlagValue {
  const spec = flagSpec(key)
  if (!spec) throw new Error(`Unknown flag "${key}"`)
  return spec.default
}

/** A value brought back into the range of its flag. */
export function clampFlag(key: string, value: FlagValue): FlagValue {
  const spec = flagSpec(key)
  if (!spec) throw new Error(`Unknown flag "${key}"`)
  if (typeof value === "number") {
    let v = value
    if (spec.min !== undefined) v = Math.max(spec.min, v)
    if (spec.max !== undefined) v = Math.min(spec.max, v)
    return v
  }
  return value
}
