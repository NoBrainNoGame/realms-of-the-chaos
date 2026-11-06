import { CHARACTERS, type CharacterPreset } from "@realms/engine"
import { type FlagSpec, registerFlags } from "../flags"

// Shared pieces of era IV (ch. 19 to 24): flags, presets, Lacune boards.

// ─── Flags ──────────────────────────────────────────────────────────────────
// `flags.ts` is shared and is not edited here: the era registers its own flags
// when it is imported (never overwriting a flag another era already declared).

const bool: FlagSpec = { default: false }
const count = (max: number, min = 0): FlagSpec => ({ default: 0, min, max })
const text = (...values: string[]): FlagSpec => ({
  default: values[0],
  values,
})

const ERA4_FLAGS: Record<string, FlagSpec> = {
  gorr_question: bool,
  merlin_convaincu: bool,
  chroniqueur_rejoint: bool,
  squalor_rejoint: bool,
  nerea_retrouvee: bool,
  premier_cristal: text("aucun", "sauve", "perdu", "donne"),
  "cristaux.extraits": count(99),
  "lacunaire.forme": text("aucune", "brume", "pierre", "reflet"),
  "confiance.gorr": count(5, -5),
  "confiance.eva": count(5, -5),
  "confiance.squalor": count(5, -5),
  "confiance.lacunaire": count(5, -5),
  "autonomie.insistances": count(99),
  "transformation.2": text("aucune", "A", "B"),
  "transformation.3": text("aucune", "A", "B"),
  "transformation.4": text("aucune", "A", "B"),
  alliance_nyx: bool,
  paix_des_lacunes: bool,
  "rupture.respectee": bool,
  sel_emportee: bool,
  // chapter-local memory of the era
  ardoise_prise: bool,
  ardoises_lues: bool,
  ardoise_ignoree: bool,
  deliee_dispersee: bool,
  "delies.disperses": count(99),
  echo_libre_ok: bool,
  q19_tarn: bool,
  visite_sel: bool,
  lac_muet_lu: bool,
  carotte_muette: bool,
  nyx_main_touchee: bool,
  nom_lisiere: bool,
  "nom.propositions.nyx": bool,
  tir_hasard_compris: bool,
  eva_pretee: bool,
  eva_rejoint: bool,
  "frise.lues": count(9),
  signature_chaos_lue: bool,
  gorr_garde_question: bool,
  ghom_se_manifeste: bool,
  nasse_a: bool,
  nasse_b: bool,
  nasse_c: bool,
  gorr_fissure: bool,
  eva_forcee: bool,
  partant_disperse: bool,
  paix_a_trois: bool,
  nom_lisiere_ecarte: bool,
  "empreinte.distorsion": text("puits", "abysses"),
  "empreinte.seisme_ancrage": bool,
  "empreinte.seisme_verre": bool,
  "empreinte.seisme_gorr": bool,
  "empreinte.reparation": text("aucune", "partagee", "serree", "lache"),
  r4_eva_levee: bool,
  ancrages_intacts: bool,
}
for (const l of [
  "lyra",
  "brutus",
  "nerea",
  "eva",
  "gorr",
  "merlin",
  "squalor",
]) {
  ERA4_FLAGS[`depart.${l}`] = text("aucun", "paix", "rupture", "retenu")
  ERA4_FLAGS[`retour.${l}`] = bool
  ERA4_FLAGS[`tente.${l}`] = bool
  ERA4_FLAGS[`statut.${l}`] = text("absent", "reste", "hesite", "part")
}

registerFlags(ERA4_FLAGS)

// ─── Presets ────────────────────────────────────────────────────────────────

/** A copy of the preset `base` under another name (same kit of actions). */
export function kitOf(
  base: string,
  id: string,
  name: string,
  title: string,
  stats: Partial<CharacterPreset["stats"]> = {},
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
    ...(actions ? { actions } : {}),
  }
}

/** Délié scouts: Nyx's kit (Lame furtive, Bond), fast, few hit points. */
export const GUETTEUR = kitOf("nyx", "guetteur", "Guetteur", "Délié", {
  health: 2,
})
/** Délié slinger: Eva's kit without the poisoned arrow. */
export const FRONDEUR = kitOf(
  "eva",
  "frondeur",
  "Frondeur",
  "Délié",
  { health: 2.5 },
  ["arrow", "kick"],
)
/** Tarn, old Thermiste of the Déliés: Frost only, few hit points. */
export const TARN = kitOf("merlin", "tarn", "Tarn", "Délié", { health: 1.8 }, [
  "frost",
])
export const NYX4 = kitOf("nyx", "nyx4", "Nyx IV", "Meneuse des Déliés", {
  health: 5,
})
export const BRUTUS4 = kitOf("brutus", "brutus4", "Brutus IV", "Gardien")
export const LYRA4 = kitOf("lyra", "lyra4", "Lyra IV", "Soigneuse")
export const EVA4 = kitOf("eva", "eva4", "Eva IV", "Archère des Déliés")
export const NEREA4 = kitOf("nerea", "nerea4", "Néréa IV", "Lectrice du lac")
export const SQUALOR4 = kitOf("squalor", "squalor4", "Squalor IV", "Chasseur")
export const MERLIN4 = kitOf("merlin", "merlin4", "Merlin IV", "Savant")
export const SEL = kitOf("lyra", "sel", "Sel", "Enfant", { health: 1.2 }, [
  "kick",
])

/** Lacunaires (era I giant, effilocheur and unstable ones). */
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
export const EFFILOCHEUR: CharacterPreset = {
  ...UNSTABLE,
  id: "lacunaire_effilocheur",
  name: "Lacunaire effilocheur",
  stats: { ...UNSTABLE.stats, health: 2.4, speed: 4, magicalAttack: 5 },
  actions: ["frost", "kick"],
}

// ─── Boards ─────────────────────────────────────────────────────────────────

/**
 * An ASCII board where `x` is a Lacune cell: the engine has no such tile, so
 * the cell is plain ground, and the fight lists it as silent (it wears down
 * whoever starts a turn alone on it).
 */
export function lacuneBoard(rows: string[]): {
  board: string[]
  silent: { x: number; y: number }[]
} {
  const silent: { x: number; y: number }[] = []
  const board = rows.map((row, y) =>
    [...row]
      .map((c, x) => {
        if (c !== "x") return c
        silent.push({ x, y })
        return "."
      })
      .join(""),
  )
  return { board, silent }
}
