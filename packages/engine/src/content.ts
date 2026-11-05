/**
 * Game content: statuses, actions, characters and divine actions.
 * Everything here is plain data so it can be modded or tested easily.
 */
import type {
  ActionDefinition,
  Affinity,
  CharacterPreset,
  DivineActionDefinition,
  StatusDefinition,
  StatusId,
} from "./types"

export const STATUSES: Record<StatusId, StatusDefinition> = {
  poisoned: {
    id: "poisoned",
    name: "Empoisonné",
    description: "Perd des PV au début de chacun de ses tours.",
    damageOverTime: true,
  },
  slowed: {
    id: "slowed",
    name: "Ralenti",
    description: "Ses actions et déplacements prennent 50 % de temps en plus.",
    delayMultiplier: 1.5,
  },
  hasted: {
    id: "hasted",
    name: "Surexcité",
    description: "Ses actions et déplacements prennent 30 % de temps en moins.",
    delayMultiplier: 0.7,
  },
  shielded: {
    id: "shielded",
    name: "Protégé",
    description: "Un bouclier absorbe les prochains dégâts.",
    absorbsDamage: true,
  },
  enraged: {
    id: "enraged",
    name: "Enragé",
    description: "Inflige 50 % de dégâts en plus, mais en subit 20 % de plus.",
    damageDealtMultiplier: 1.5,
    damageTakenMultiplier: 1.2,
  },
}

const actionList: ActionDefinition[] = [
  // ── common ──
  {
    id: "sprint",
    name: "Dash",
    description:
      "Avance tout de suite par le chemin le plus rapide, jusqu'à 3 cases de terrain plat (l'eau et les montées comptent plus). Coûte le temps du trajet et termine le tour.",
    launch: { shape: "diamond", min: 1, max: 3 },
    lineOfSight: false,
    target: "any",
    timeCost: 0,
    movement: { reach: 3 },
    effects: [],
  },
  {
    id: "kick",
    name: "Coup de pied",
    description: "Attaque physique au corps à corps.",
    launch: { shape: "line", min: 1, max: 1 },
    lineOfSight: false,
    target: "enemy",
    timeCost: 0.8,
    effects: [{ type: "damage", kind: "physical", power: 4 }],
  },

  // ── Merlin, mage ──
  {
    id: "fireball",
    name: "Boule de feu",
    description: "Explose sur une zone : touche aussi les alliés !",
    launch: { shape: "diamond", min: 2, max: 5 },
    lineOfSight: true,
    area: { shape: "diamond", max: 1 },
    target: "any",
    affects: "all",
    timeCost: 1.2,
    effects: [{ type: "damage", kind: "magical", power: 10 }],
  },
  {
    id: "frost",
    name: "Givre",
    description:
      "Un froid intense : dégâts énergétiques légers, et la cible ralentit.",
    launch: { shape: "diamond", min: 1, max: 4 },
    lineOfSight: true,
    target: "enemy",
    timeCost: 1,
    cooldown: 1,
    effects: [
      { type: "damage", kind: "magical", power: 5 },
      { type: "status", status: "slowed", turns: 2 },
    ],
  },

  // ── Eva, archère ──
  {
    id: "arrow",
    name: "Tir à l'arc",
    description: "Tir à distance, nécessite une ligne de vue.",
    launch: { shape: "diamond", min: 2, max: 6 },
    lineOfSight: true,
    target: "enemy",
    timeCost: 1,
    effects: [{ type: "damage", kind: "physical", power: 8 }],
  },
  {
    id: "poisonArrow",
    name: "Flèche empoisonnée",
    description: "Empoisonne la cible pendant 3 tours.",
    launch: { shape: "line", min: 2, max: 5 },
    lineOfSight: true,
    target: "enemy",
    timeCost: 1,
    cooldown: 2,
    effects: [
      { type: "damage", kind: "physical", power: 3 },
      { type: "status", status: "poisoned", turns: 3, value: 4 },
    ],
  },

  // ── Brutus, guerrier ──
  {
    id: "shieldBash",
    name: "Coup de bouclier",
    description: "Frappe et repousse la cible de 2 cases.",
    launch: { shape: "line", min: 1, max: 1 },
    lineOfSight: false,
    target: "enemy",
    timeCost: 1,
    effects: [
      { type: "damage", kind: "physical", power: 7 },
      { type: "push", distance: 2 },
    ],
  },
  {
    id: "warCry",
    name: "Cri de guerre",
    description: "S'enrage pendant 2 tours.",
    launch: { shape: "point", max: 0 },
    lineOfSight: false,
    target: "self",
    timeCost: 0.6,
    cooldown: 3,
    effects: [{ type: "status", status: "enraged", turns: 2 }],
  },

  // ── Lyra, soigneuse ──
  {
    id: "heal",
    name: "Soin",
    description: "Rend des PV à un allié (ou à soi-même).",
    launch: { shape: "diamond", min: 0, max: 4 },
    lineOfSight: true,
    target: "ally",
    timeCost: 1,
    effects: [{ type: "heal", power: 8 }],
  },
  {
    id: "aegis",
    name: "Champ",
    description:
      "Un champ de force cristallin absorbe 15 points de dégâts sur un allié, pendant 2 tours.",
    launch: { shape: "diamond", min: 0, max: 3 },
    lineOfSight: true,
    target: "ally",
    timeCost: 0.8,
    cooldown: 2,
    effects: [{ type: "status", status: "shielded", turns: 2, value: 15 }],
  },
  {
    id: "quicken",
    name: "Accélération",
    description: "Rend un allié surexcité pendant 2 tours.",
    launch: { shape: "diamond", min: 1, max: 3 },
    lineOfSight: true,
    target: "ally",
    timeCost: 0.8,
    cooldown: 3,
    effects: [{ type: "status", status: "hasted", turns: 2 }],
  },

  // ── Nyx, ombre ──
  {
    id: "blade",
    name: "Lame furtive",
    description: "Attaque rapide au corps à corps.",
    launch: { shape: "line", min: 1, max: 1 },
    lineOfSight: false,
    target: "enemy",
    timeCost: 0.7,
    effects: [{ type: "damage", kind: "physical", power: 7 }],
  },
  {
    id: "leap",
    name: "Bond",
    description: "Saute sur une case libre en ligne de vue.",
    launch: { shape: "diamond", min: 2, max: 3 },
    lineOfSight: true,
    target: "emptyCell",
    timeCost: 0.4,
    cooldown: 2,
    effects: [{ type: "dash" }],
  },

  // ── Gorr, golem ──
  {
    id: "smash",
    name: "Écrasement",
    description: "Frappe le sol : touche les ennemis autour de la cible.",
    launch: { shape: "line", min: 1, max: 1 },
    lineOfSight: false,
    area: { shape: "diamond", max: 1 },
    target: "enemy",
    affects: "enemies",
    timeCost: 1.1,
    effects: [{ type: "damage", kind: "physical", power: 9 }],
  },
  {
    id: "tremor",
    name: "Secousse",
    description: "Retarde le prochain tour des ennemis adjacents.",
    launch: { shape: "point", max: 0 },
    lineOfSight: false,
    area: { shape: "diamond", min: 1, max: 1 },
    target: "self",
    affects: "enemies",
    timeCost: 1,
    cooldown: 3,
    effects: [
      { type: "damage", kind: "physical", power: 3 },
      { type: "delay", amount: 15 },
    ],
  },

  // ── Néréa, ondine ──
  {
    id: "trident",
    name: "Trident",
    description: "Coup d'estoc qui porte à 2 cases.",
    launch: { shape: "line", min: 1, max: 2 },
    lineOfSight: true,
    target: "enemy",
    timeCost: 0.9,
    effects: [{ type: "damage", kind: "physical", power: 6 }],
  },
  {
    id: "tidalWave",
    name: "Raz-de-marée",
    description: "Une vague qui repousse et ralentit les ennemis.",
    launch: { shape: "diamond", min: 1, max: 3 },
    lineOfSight: true,
    area: { shape: "diamond", max: 1 },
    target: "enemy",
    affects: "enemies",
    timeCost: 1.1,
    cooldown: 2,
    effects: [
      { type: "damage", kind: "magical", power: 4 },
      { type: "push", distance: 1 },
      { type: "status", status: "slowed", turns: 1 },
    ],
  },
  {
    id: "bubble",
    name: "Bulle protectrice",
    description:
      "Enveloppe un allié d'une bulle : bouclier de 12 et petit soin.",
    launch: { shape: "diamond", min: 0, max: 3 },
    lineOfSight: true,
    target: "ally",
    timeCost: 0.8,
    cooldown: 2,
    effects: [
      { type: "status", status: "shielded", turns: 2, value: 12 },
      { type: "heal", power: 4 },
    ],
  },

  // ── Squalor, homme-requin ──
  {
    id: "bite",
    name: "Morsure",
    description: "Morsure profonde qui fait saigner (dégâts sur 2 tours).",
    launch: { shape: "line", min: 1, max: 1 },
    lineOfSight: false,
    target: "enemy",
    timeCost: 1,
    effects: [
      { type: "damage", kind: "physical", power: 8 },
      { type: "status", status: "poisoned", turns: 2, value: 3 },
    ],
  },
  {
    id: "dive",
    name: "Plongeon",
    description: "Plonge dans une case d'eau et éclabousse les ennemis autour.",
    launch: { shape: "diamond", min: 1, max: 4 },
    lineOfSight: false,
    area: { shape: "diamond", min: 1, max: 1 },
    target: "emptyCell",
    targetTerrain: "water",
    affects: "enemies",
    timeCost: 0.8,
    cooldown: 2,
    effects: [{ type: "dash" }, { type: "damage", kind: "physical", power: 5 }],
  },
]

export const ACTIONS: Record<string, ActionDefinition> = Object.fromEntries(
  actionList.map((action) => [action.id, action]),
)

const characterList: CharacterPreset[] = [
  {
    id: "merlin",
    name: "Merlin",
    title: "Thermiste",
    affinity: "magic",
    stats: {
      health: 9.5,
      speed: 4,
      physicalAttack: 2,
      physicalDefense: 3,
      magicalAttack: 8,
      magicalDefense: 6,
      luck: 3,
    },
    actions: ["fireball", "frost", "kick"],
  },
  {
    id: "eva",
    name: "Eva",
    title: "Archère",
    affinity: "precision",
    locomotion: "swimmer",
    stats: {
      health: 6,
      speed: 6,
      physicalAttack: 7,
      physicalDefense: 3,
      magicalAttack: 2,
      magicalDefense: 3,
      luck: 7,
    },
    actions: ["arrow", "poisonArrow", "kick"],
  },
  {
    id: "brutus",
    name: "Brutus",
    title: "Guerrier",
    affinity: "strength",
    stats: {
      health: 13,
      speed: 4,
      physicalAttack: 8,
      physicalDefense: 7,
      magicalAttack: 1,
      magicalDefense: 3,
      luck: 3,
    },
    actions: ["shieldBash", "warCry", "kick"],
  },
  {
    id: "lyra",
    name: "Lyra",
    title: "Soigneuse",
    affinity: "faith",
    stats: {
      health: 8.75,
      speed: 6,
      physicalAttack: 2,
      physicalDefense: 4,
      magicalAttack: 6,
      magicalDefense: 7,
      luck: 4,
    },
    actions: ["heal", "aegis", "quicken", "kick"],
  },
  {
    id: "nyx",
    name: "Nyx",
    title: "Ombre",
    affinity: "shadow",
    locomotion: "swimmer",
    stats: {
      health: 6.75,
      speed: 8,
      physicalAttack: 7,
      physicalDefense: 3,
      magicalAttack: 3,
      magicalDefense: 3,
      luck: 8,
    },
    actions: ["blade", "leap", "kick"],
  },
  {
    id: "gorr",
    name: "Gorr",
    title: "Golem minéral",
    affinity: "strength",
    stats: {
      health: 17,
      speed: 4,
      physicalAttack: 7,
      physicalDefense: 9,
      magicalAttack: 1,
      magicalDefense: 2,
      luck: 1,
    },
    actions: ["smash", "tremor", "kick"],
  },
  {
    id: "nerea",
    name: "Néréa",
    title: "Ondine",
    affinity: "magic",
    locomotion: "aquatic",
    stats: {
      health: 6,
      speed: 6,
      physicalAttack: 5,
      physicalDefense: 4,
      magicalAttack: 6,
      magicalDefense: 6,
      luck: 5,
    },
    actions: ["trident", "tidalWave", "bubble", "kick"],
  },
  {
    id: "squalor",
    name: "Squalor",
    title: "Homme-requin",
    affinity: "strength",
    locomotion: "aquatic",
    stats: {
      health: 7.25,
      speed: 6,
      physicalAttack: 8,
      physicalDefense: 5,
      magicalAttack: 1,
      magicalDefense: 3,
      luck: 5,
    },
    actions: ["bite", "dive", "kick"],
  },
]

export const CHARACTERS: Record<string, CharacterPreset> = Object.fromEntries(
  characterList.map((character) => [character.id, character]),
)

export const DIVINE_ACTIONS: Record<string, DivineActionDefinition> = {
  timeWarp: {
    id: "timeWarp",
    name: "Distorsion",
    description:
      "Courbe le temps propre d'un Écho : avance le prochain tour d'un allié, ou retarde celui d'un ennemi.",
    cost: 3,
    target: "fighter",
  },
  earthquake: {
    id: "earthquake",
    name: "Séisme",
    description:
      "Pousse la roche du Fragment : une case libre se soulève ou s'effondre.",
    cost: 4,
    target: "cell",
  },
  blessing: {
    id: "blessing",
    name: "Réparation",
    description:
      "Répare toute votre équipe. L'ordre créé se paie : la chaleur rejetée s'échappe en vapeur.",
    cost: 5,
    target: "none",
  },
}

/** Actions every fighter has, after its own ones. */
export const COMMON_ACTIONS = ["sprint"]

export const MAX_ENERGY = 6
export const MAX_FIGHTERS_PER_CELL = 3
export const TIME_WARP_AMOUNT = 25
export const BLESSING_HEAL = 8

// ─── Combined actions ("actions combinées" of the design doc) ──────────────

export const AFFINITIES: Record<
  Affinity,
  { name: string; adjective: string; description: string }
> = {
  magic: {
    name: "Énergie",
    adjective: "énergisé",
    description: "ajoute des dégâts énergétiques ou renforce les soins",
  },
  strength: {
    name: "Force",
    adjective: "puissant",
    description: "frappe 30 % plus fort et repousse plus loin, au même coût",
  },
  precision: {
    name: "Précision",
    adjective: "précis",
    description: "porte 2 cases plus loin (1 pour le corps à corps)",
  },
  faith: {
    name: "Cohésion",
    adjective: "lié",
    description: "soigne aussi le lanceur",
  },
  shadow: {
    name: "Ombre",
    adjective: "furtif",
    description: "coûte 40 % de temps en moins",
  },
}

/** Pairs with a hand-made combined action (owner:partner). */
const NAMED_COMBOS: Record<
  string,
  (base: ActionDefinition) => Partial<ActionDefinition>
> = {
  // from the doc: a mage on the archer's cell enchants her arrows (fire mage: explosive)
  "eva:merlin": (base) => ({
    name: "Flèche incendiaire",
    description: "Une flèche de feu qui explose autour de la cible.",
    area: { shape: "diamond", max: 1 },
    affects: "enemies",
    effects: [...base.effects, { type: "damage", kind: "magical", power: 6 }],
  }),
  "merlin:eva": () => ({
    name: "Boule de feu guidée",
    description: "Eva guide le tir : plus de portée, aucun allié touché.",
    affects: "enemies",
  }),
}

export const COMBO_COOLDOWN_BONUS = 1

/**
 * Combined version of `owner`'s signature action (its first one) when
 * `partner` stands on the same cell.
 */
export function comboAction(
  owner: CharacterPreset,
  partner: CharacterPreset,
): ActionDefinition {
  const base = ACTIONS[owner.actions[0]]
  const affinity = AFFINITIES[partner.affinity]
  const combo: ActionDefinition = {
    ...base,
    id: `combo:${base.id}:${partner.id}`,
    name: `${base.name} (${affinity.adjective})`,
    description: `Avec ${partner.name} : ${affinity.description}.`,
    launch: { ...base.launch },
    effects: base.effects.map((e) => ({ ...e })),
    cooldown: (base.cooldown ?? 0) + COMBO_COOLDOWN_BONUS,
    combo: { baseId: base.id, partnerPresetId: partner.id },
  }

  const damages = combo.effects.some((e) => e.type === "damage")
  switch (partner.affinity) {
    case "magic":
      if (damages)
        combo.effects.push({ type: "damage", kind: "magical", power: 5 })
      combo.effects = combo.effects.map((e) =>
        e.type === "heal" ? { ...e, power: e.power + 3 } : e,
      )
      if (!damages && !combo.effects.some((e) => e.type === "heal")) {
        combo.effects.push({ type: "damage", kind: "magical", power: 4 })
      }
      break
    case "strength":
      combo.effects = combo.effects.map((e) => {
        if (e.type === "damage")
          return { ...e, power: Math.ceil(e.power * 1.3) }
        if (e.type === "push") return { ...e, distance: e.distance + 1 }
        return e
      })
      break
    case "precision":
      combo.launch.max += combo.launch.max > 1 ? 2 : 1
      break
    case "faith":
      combo.effects.push({ type: "selfHeal", power: 5 })
      break
    case "shadow":
      combo.timeCost = Math.round(base.timeCost * 0.6 * 100) / 100
      break
  }

  const named =
    NAMED_COMBOS[`${owner.kit ?? owner.id}:${partner.kit ?? partner.id}`]
  if (named) Object.assign(combo, named(base))
  return combo
}
