/**
 * Arcade mode: a chain of procedural fights of increasing difficulty.
 * Everything derives from the run seed and the player's choices, so a run
 * can be replayed and its score verified (see verifyArcadeRun).
 */
import { Combat, type CombatOptions, type Command } from "./combat"
import { CHARACTERS } from "./content"
import { createRng } from "./random"

export type ArcadeBonus = "heal" | "power" | "recruit"

export const ARCADE_BONUSES: Record<
  ArcadeBonus,
  { name: string; description: string }
> = {
  heal: {
    name: "Respiration",
    description: "Les survivants retrouvent tous leurs PV.",
  },
  power: {
    name: "Résonance",
    description: "Votre équipe gagne 10 % de puissance.",
  },
  recruit: {
    name: "Nouvel Écho",
    description: "Un Écho rejoint votre équipe (3 au maximum).",
  },
}

export const ARCADE_MAX_TEAM = 3
/** Enemy strength on the first wave (they start weaker than you). */
export const ARCADE_FIRST_WAVE = 0.8
/** Enemy stats grow by this much each wave. */
export const ARCADE_WAVE_GROWTH = 0.08
/** Survivors recover this share of the hit points they lost. */
export const ARCADE_RECOVERY = 0.5
/** Hard cap on the number of waves (keeps verification bounded). */
export const ARCADE_MAX_WAVES = 50

export interface ArcadeState {
  /** Character presets of the player's team (survivors only). */
  team: string[]
  /** Hit points of each team member (undefined = full). */
  hp: (number | undefined)[]
  /** Player's stat multiplier (power bonuses). */
  multiplier: number
  /** Next wave to fight (1-based). */
  wave: number
  score: number
  alive: boolean
}

export function startArcade(team: string[]): ArcadeState {
  if (team.length < 1 || team.length > ARCADE_MAX_TEAM) {
    throw new Error(`An arcade team has 1 to ${ARCADE_MAX_TEAM} fighters`)
  }
  for (const id of team) {
    if (!CHARACTERS[id]) throw new Error(`Unknown character "${id}"`)
  }
  return {
    team: [...team],
    hp: team.map(() => undefined),
    multiplier: 1,
    wave: 1,
    score: 0,
    alive: true,
  }
}

/** Deterministic seed of a wave, derived from the run seed. */
export function waveSeed(runSeed: number, wave: number) {
  return (Math.imul(runSeed ^ 0x9e3779b9, 2654435761) + wave * 40503) >>> 0
}

/** Enemies of a wave: 2 at first, one more every 2 waves, 4 at most. */
export function arcadeEnemies(runSeed: number, wave: number): string[] {
  const rng = createRng(waveSeed(runSeed, wave) ^ 0x5bd1e995)
  const count = Math.min(4, 2 + Math.floor((wave - 1) / 2))
  const ids = Object.keys(CHARACTERS)
  return Array.from({ length: count }, () => rng.pick(ids))
}

export function arcadeWaveOptions(
  runSeed: number,
  state: ArcadeState,
): CombatOptions {
  return {
    seed: waveSeed(runSeed, state.wave),
    teams: [
      {
        name: "Vous",
        controller: "human",
        fighters: state.team,
        statMultiplier: state.multiplier,
        hp: state.hp,
      },
      {
        name: `Vague ${state.wave}`,
        controller: "ai",
        fighters: arcadeEnemies(runSeed, state.wave),
        statMultiplier:
          ARCADE_FIRST_WAVE + ARCADE_WAVE_GROWTH * (state.wave - 1),
      },
    ],
  }
}

/**
 * State after a wave: survivors recover part of their lost hit points, the
 * fallen leave the team, and the score grows; a lost wave ends the run.
 */
export function arcadeAfterWave(
  state: ArcadeState,
  combat: Combat,
): ArcadeState {
  if (combat.state !== "ended") throw new Error("The wave is not over")
  if (combat.winnerTeam !== 0) return { ...state, alive: false }

  const mine = combat.fighters.filter((f) => f.team === 0)
  const survivors = mine.filter((f) => f.alive)
  const team = survivors.map((f) => f.presetId)
  const hp = survivors.map((f) => {
    const max = combat.maxHp(f)
    return Math.round(f.hp + (max - f.hp) * ARCADE_RECOVERY)
  })
  const remaining = survivors.reduce((sum, f) => sum + f.hp, 0)
  return {
    ...state,
    team,
    hp,
    wave: state.wave + 1,
    score: state.score + 100 * state.wave + Math.round(remaining / 10),
  }
}

/** Bonuses offered between waves (recruiting needs room in the team). */
export function arcadeBonusChoices(state: ArcadeState): ArcadeBonus[] {
  return (Object.keys(ARCADE_BONUSES) as ArcadeBonus[]).filter(
    (b) => b !== "recruit" || state.team.length < ARCADE_MAX_TEAM,
  )
}

/** The Echo who joins with a recruit bonus (deterministic). */
export function arcadeRecruit(runSeed: number, state: ArcadeState) {
  const rng = createRng(waveSeed(runSeed, state.wave) ^ 0x27d4eb2f)
  return rng.pick(Object.keys(CHARACTERS))
}

export function applyArcadeBonus(
  runSeed: number,
  state: ArcadeState,
  bonus: ArcadeBonus,
): ArcadeState {
  if (!arcadeBonusChoices(state).includes(bonus))
    throw new Error(`Bonus "${bonus}" not available`)
  switch (bonus) {
    case "heal":
      return { ...state, hp: state.team.map(() => undefined) }
    case "power":
      return {
        ...state,
        multiplier: Math.round((state.multiplier + 0.1) * 100) / 100,
      }
    case "recruit":
      return {
        ...state,
        team: [...state.team, arcadeRecruit(runSeed, state)],
        hp: [...state.hp, undefined],
      }
  }
}

/** Everything needed to replay and verify a run. */
export interface ArcadeRecord {
  seed: number
  team: string[]
  waves: { log: Command[]; bonus: ArcadeBonus | null }[]
}

/**
 * Replay a whole run with the engine and return its real outcome. Throws if
 * the record is impossible (invalid commands, unfinished waves, fake bonus).
 */
export function verifyArcadeRun(record: ArcadeRecord): {
  score: number
  waves: number
} {
  if (record.waves.length > ARCADE_MAX_WAVES) throw new Error("Too many waves")
  let state = startArcade(record.team)
  for (const [index, wave] of record.waves.entries()) {
    if (!state.alive)
      throw new Error(`Wave ${index + 1} played after the run ended`)
    const combat = Combat.replay(
      arcadeWaveOptions(record.seed, state),
      wave.log,
    )
    if (combat.state !== "ended")
      throw new Error(`Wave ${index + 1} is not finished`)
    state = arcadeAfterWave(state, combat)
    if (state.alive && wave.bonus)
      state = applyArcadeBonus(record.seed, state, wave.bonus)
    if (!state.alive && wave.bonus)
      throw new Error("No bonus after a lost wave")
  }
  return { score: state.score, waves: state.wave - 1 }
}
