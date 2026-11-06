/**
 * The Adventure hero: a body chosen at the start, then everything the story
 * gives. Growth is read from what the run carries (items and unlocks), so it
 * is part of the run's state and never leaves the Adventure: the Atelier
 * does not see any of it. Stats rise outside the balance budget.
 */
import {
  type Carry,
  ERA2_GROWTH,
  ERA3_GROWTH,
  ERA4_GROWTH,
  ERA5_GROWTH,
} from "@realms/adventure"
import {
  ACTIONS,
  type CharacterPreset,
  type CustomLook,
  FORBIDDEN_ACTIONS,
  type LookPart,
  randomLook,
  type StatName,
  type Stats,
} from "@realms/engine"
import { adventureSave } from "../storage"

/** Looks like a custom id, so the puppet draws its modular look. */
export const HERO_ID = "custom:@hero"

/** The parts the player chooses at the start. */
export const HERO_PARTS: LookPart[] = ["body", "skin", "head", "face"]

/** The hero's plain starting clothes; only the body is chosen. */
export const STARTING_LOOK: CustomLook = {
  ...randomLook("heros-des-chroniques"),
  hair: 1,
  top: 0,
  legs: 0,
  cape: 0,
  accessory: 0,
  mark: 0,
}

export const BASE_STATS: Stats = {
  health: 8,
  speed: 5,
  physicalAttack: 5,
  physicalDefense: 4,
  magicalAttack: 3,
  magicalDefense: 4,
  luck: 5,
}

export interface Growth {
  /** Puppet pieces and clothes (a body or skin change transforms the hero). */
  look?: Partial<CustomLook>
  stats?: Partial<Stats>
  /** Spells learned (no limit on how many). */
  spells?: string[]
  /** A passive trait, shown in the hero's sheet. */
  trait?: string
}

/** What each item or unlock of the story does to the hero. */
const ERA1_GROWTH: Record<string, Growth> = {
  linge_d_aube: { look: { top: 1 } },
  sandales_de_jonc: { look: { legs: 2 }, stats: { speed: 1 } },
  cape_du_premier_matin: { look: { cape: 1 } },
  echarpe_de_poussiere_noire: { look: { accessory: 2 } },
  "habit:brassard-de-demeure": {
    look: { mark: 2 },
    stats: { physicalDefense: 1 },
  },
  "habit:mitaines-de-lin": { stats: { physicalAttack: 1 } },
  lame_a_une_encoche: { spells: ["blade"] },
  lame_sans_encoche: { spells: ["blade"], stats: { physicalAttack: 1 } },
  page_de_merlin: { spells: ["frost"], stats: { magicalAttack: 1 } },
  piquet_de_lyra: { spells: ["aegis"] },
  fil_couture: { spells: ["heal"] },
  galet_tiede: { stats: { magicalDefense: 1 } },
  yeux_aube: { look: { face: 1 }, stats: { luck: 1 } },
  peau_cristal: { look: { skin: 7 }, stats: { magicalDefense: 1 } },
  "trait:bouts-gris": { trait: "Les bouts gris" },
  "action:sprint": { spells: ["sprint"] },
  carnet: { trait: "Le Carnet" },
  // Keepsakes: they change what the hero carries and knows, not his body.
  "objet:carnet-recousu": { trait: "Le carnet recousu" },
  eclat_de_poussiere_noire: { stats: { magicalAttack: 1 } },
  carotte_lac_sourd: { trait: "La carotte du lac sourd", stats: { luck: 1 } },
  fil_dechirure: { trait: "Le fil déchiré" },
}

/** Eras II to V give looks and stats as plain records (the story package cannot see `Growth`). */
export const GROWTH: Record<string, Growth> = {
  ...ERA1_GROWTH,
  // Items of era II without an entry of their own.
  cire_des_pilotis: { stats: { physicalDefense: 1 } },
  carte_des_lacunes: { trait: "Carte des Lacunes" },
  mains_gercees: { trait: "Les mains gercées" },
  ...(ERA2_GROWTH as Record<string, Growth>),
  ...(ERA3_GROWTH as Record<string, Growth>),
  ...(ERA4_GROWTH as Record<string, Growth>),
  ...(ERA5_GROWTH as Record<string, Growth>),
}

const BASE_SPELLS = ["sprint", "kick"]

const known = (id: string) =>
  ACTIONS[id] !== undefined || id in FORBIDDEN_ACTIONS

function growths(carry: Pick<Carry, "items" | "unlocks">): Growth[] {
  return [...carry.items, ...carry.unlocks]
    .map((key) => GROWTH[key])
    .filter((g): g is Growth => g !== undefined)
}

/** The hero's look: the chosen body, then the pieces gained (in story order). */
export function heroLook(
  body: CustomLook | null,
  carry: Pick<Carry, "items" | "unlocks">,
): CustomLook {
  let look: CustomLook = { ...STARTING_LOOK, ...(body ?? {}) }
  for (const g of growths(carry)) look = { ...look, ...g.look }
  return look
}

/** Every spell the hero knows: no limit. `granted` is the dev's gift. */
export function heroSpells(
  carry: Pick<Carry, "items" | "unlocks">,
  granted: string[] = [],
): string[] {
  const out = [...BASE_SPELLS]
  for (const id of [
    ...growths(carry).flatMap((g) => g.spells ?? []),
    ...granted,
  ])
    if (known(id) && !out.includes(id)) out.push(id)
  return out
}

export function heroStats(carry: Pick<Carry, "items" | "unlocks">): Stats {
  const stats = { ...BASE_STATS }
  for (const g of growths(carry))
    for (const [k, v] of Object.entries(g.stats ?? {}))
      stats[k as StatName] += v ?? 0
  return stats
}

export function heroTraits(carry: Pick<Carry, "items" | "unlocks">): string[] {
  return growths(carry).flatMap((g) => (g.trait ? [g.trait] : []))
}

/** The preset the hero fights with, from the save's body and the run's state. */
export function heroPreset(
  carry: Pick<Carry, "items" | "unlocks">,
): CharacterPreset {
  const save = adventureSave()
  const spells = heroSpells(carry, save.granted)
  const defs = Object.fromEntries(
    spells
      .filter((id) => id in FORBIDDEN_ACTIONS)
      .map((id) => [id, FORBIDDEN_ACTIONS[id]]),
  )
  return {
    id: HERO_ID,
    name: HERO_NAME,
    title: "Écho",
    affinity: "strength",
    stats: heroStats(carry),
    actions: spells,
    kit: "brutus",
    actionDefs: defs,
  }
}

export const HERO_NAME = "Le héros"
