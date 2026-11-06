/** Adventure fights: a chapter's FightSpec to scene options, and back to a report. */
import type { Carry, FightReport, FightSpec } from "@realms/adventure"
import {
  CHARACTERS,
  type CharacterPreset,
  type Combat,
  DIVINE_ACTIONS,
  type Fighter,
} from "@realms/engine"
import { adventureSave } from "../storage"
import type { SceneOptions } from "../view/FightScene"
import { registerLook, resolveFighters } from "../view/looks"
import { HERO_ID, heroLook, heroPreset } from "./hero"

/** The reference art an Adventure-only preset is drawn with. */
const KIT_OF_AFFINITY: Record<string, string> = {
  strength: "brutus",
  magic: "merlin",
  faith: "lyra",
  shadow: "squalor",
}

function artOf(preset: CharacterPreset): string {
  const old = /^ancien_(.+)$/.exec(preset.id)?.[1]
  if (old && old in CHARACTERS) return old
  if (preset.id === "ombre_derive") return "nyx"
  if (preset.id === "lacunaire_geant") return "gorr"
  return KIT_OF_AFFINITY[preset.affinity] ?? "squalor"
}

function fighterOf(
  preset: string | CharacterPreset,
  hero: Pick<Carry, "items" | "unlocks">,
): string | CharacterPreset {
  if (typeof preset !== "string") {
    registerLook(preset.id, artOf(preset))
    return preset
  }
  if (preset === "@hero") {
    registerLook(HERO_ID, "brutus", heroLook(adventureSave().body, hero))
    return heroPreset(hero)
  }
  return resolveFighters([preset])[0] ?? preset
}

/** The scene of a fight: allies are played, the others by the AI. */
export function fightOptions(
  spec: FightSpec,
  seed: number,
  speed: number,
  hero: Pick<Carry, "items" | "unlocks">,
  endActions: SceneOptions["endActions"],
): SceneOptions {
  const known = new Set(spec.influences)
  const locked = Object.keys(DIVINE_ACTIONS).filter((id) => !known.has(id))
  return {
    seed: spec.seed ?? seed,
    speed,
    quittable: true,
    board: spec.board,
    positions: spec.teams.map((t) => t.fighters.map((f) => f.at)),
    teams: spec.teams.map((t) => ({
      name: t.name,
      controller: t.side === "allies" ? "local" : "ai",
      fighters: t.fighters.map((f) => fighterOf(f.preset, hero)),
      hp: t.fighters.map((f) => f.hp),
    })),
    hold: spec.teams.flatMap((t, i) => (t.side === "neutral" ? [i] : [])),
    adventure: {
      ...spec.rules,
      lockedDivine: spec.rules.lockedDivine ?? locked,
    },
    endActions,
  }
}

/** Index of the player's team in a spec. */
export const allyTeam = (spec: FightSpec) =>
  Math.max(
    0,
    spec.teams.findIndex((t) => t.side === "allies"),
  )

/** Gives the Ghom its starting Élan (call once the scene exists). */
export function startEnergy(spec: FightSpec, combat: Combat) {
  combat.teams[allyTeam(spec)].energy = spec.startEnergy
}

/** What the story learns of a finished fight. */
export function reportOf(spec: FightSpec, combat: Combat): FightReport {
  const mine = allyTeam(spec)
  const tracker = combat.adventure?.report
  const winner = combat.winnerTeam
  const result =
    winner === mine
      ? "victory"
      : winner === null && tracker?.timeUp
        ? "held"
        : "defeat"
  const presetOf = (f: Fighter) => f.presetId
  return {
    result,
    ticks: tracker?.ticks ?? 0,
    divineUsed: { ...(tracker?.divineUsed ?? {}) },
    divineNearAlly: [...(tracker?.divineNearAlly ?? [])],
    intrications: tracker?.intrications ?? 0,
    fled: [...(tracker?.fled ?? [])],
    timeUp: tracker?.timeUp ?? false,
    zonesLost: [...(tracker?.zonesLost ?? [])],
    zoneStates: { ...(tracker?.zoneStates ?? {}) },
    fixed: [...(tracker?.fixed ?? [])],
    fighters: combat.fighters.map((f) => ({
      id: f.id,
      preset: presetOf(f),
      team: f.team,
      hp: f.alive ? f.hp : 0,
      fled: combat.departed.has(f.id),
    })),
  }
}
